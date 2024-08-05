"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Editor, { OnMount, OnChange } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import {
  codeState,
  coheeMessagesState,
  gptMessagesState,
  lectureState,
  chapterState,
  currentChapterState,
  gptThreadsState,
  coheeThreadsState,
  currentChapterNumState,
} from "@/recoil/atoms";
import { SendIcon } from "@/components/Icon";
import { MessageBubble } from "@/components/MessageBubble";
import { CoheeThread } from "@/components/CoheeThread";
import Preview from "@/components/Preview";
import { Message } from "@/types/types";
import NestedMenu from "@/components/NestedContentMenu";

export default function LectureLayout({ lectureId }: { lectureId: string }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [currentCode, setCodeState] = useRecoilState(codeState);
  // const [currentContent, setCurrentContentState] =
  //   useRecoilState(currentContentState);
  const [coheeMessages, setCoheeMessagesState] =
    useRecoilState(coheeMessagesState);
  const [gptMessages, setGptMessagesState] = useRecoilState(gptMessagesState);
  const [lecture, setLectureState] = useRecoilState(lectureState);
  const [chapters, setChapterState] = useRecoilState(chapterState);
  const [currentChapter, setCurrentChapterState] =
    useRecoilState(currentChapterState);
  const [gptThreads, setGptThreadsState] = useRecoilState(gptThreadsState);
  const [coheeThreads, setCoheeThreadsState] =
    useRecoilState(coheeThreadsState);
  const [currentChapterNum, setCurrentChapterNum] = useRecoilState(
    currentChapterNumState
  );

  const handleEditorDidMount: OnMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  const handleSave = useCallback(async () => {
    if (editorRef.current) {
      const code = editorRef.current.getValue();
      setCodeState((prev) => ({
        ...prev,
        code: code,
        language: prev?.language || "html", // Ensure language is always defined
      }));

      try {
        const response = await fetch("/api/code/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chapterId: currentChapter?.id,
            content: code,
            language: currentCode?.language || "html",
          }),
        });

        if (!response.ok) {
          console.error("Failed to save code:", await response.json());
        }
      } catch (error) {
        console.error("Error saving code:", error);
      }
    }
  }, [currentChapter?.id, currentCode?.language, setCodeState]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSave]);

  useEffect(() => {
    const initialize = async () => {
      if (!lectureId) return;
      try {
        const response = await fetch(`/api/cohee/initialize/${lectureId}`, {
          method: "POST",
        });
        const data = await response.json();

        setLectureState(data.lecture);
        setChapterState(data.chapters);
        setCurrentChapterState(data.chapters[0] || null);
        setCoheeMessagesState(data.coheeMessages);
        setGptMessagesState(data.gptMessages);
        // setCoheeThreadState(data.coheeThreads);
        // setGptThreadState(data.gptThread);

        // Set threads
        setCoheeThreadsState(data.coheeThreads);
        setGptThreadsState(data.gptThreads);

        // Set the latest code state
        if (data.latestCode) {
          setCodeState({
            language: data.latestCode.language,
            code: data.latestCode.content,
          });
        }
      } catch (error) {
        console.error("Failed to initialize data:", error);
      }
    };

    initialize();
  }, [
    lectureId,
    setLectureState,
    setChapterState,
    setCoheeMessagesState,
    setGptMessagesState,
    setCodeState,
    setCurrentChapterState,
    setCoheeThreadsState,
    setGptThreadsState,
  ]);

  useEffect(() => {
    if (editorRef.current && currentCode) {
      editorRef.current.setValue(
        currentCode ? (currentCode.code as string) : `<h1>Hello World!</h1>`
      );
    }
  }, [currentCode]);

  const handleCoheeMessageSubmit = async (text: string) => {
    setIsLoading(true);
    try {
      // Update coheeMessagesState with a new message
      setCoheeMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "temp-id",
          parsedContent: [{ type: "text", content: text }],
        } as Message,
      ]);

      const coheeResponse = await fetch(
        "/api/cohee/prompt-feedback-generator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            cohee_thread_id: coheeThreads[0]?.id,
          }),
        }
      );

      const reader = coheeResponse.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from Cohee response");
      const decoder = new TextDecoder();
      let coheeResult = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        coheeResult += decoder.decode(value);

        setCoheeMessagesState((prevMessages) => {
          return prevMessages.map((message, index) => {
            if (index === prevMessages.length - 1) {
              return {
                ...message,
                parsedContent: [{ type: "text", content: coheeResult }],
              };
            }
            return message;
          });
        });
      }
    } catch (error) {
      console.error("Failed to send Cohee message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGptMessageSubmit = async (text: string) => {
    console.log("Starting GPT message submission...");
    setIsLoading(true);
    try {
      console.log("Sending first request to /api/cohee/code-generator...");
      // First request to /api/cohee/code-generator
      setGptMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "temp-id",
          parsedContent: [{ type: "text", content: text }],
        } as Message,
      ]);

      const gptResponse = await fetch("/api/cohee/code-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          gpt_thread_id: gptThreads[0]?.id,
          chapter_id: currentChapter?.id,
        }),
      });

      const gptResult = await gptResponse.json();
      console.log("Received response from /api/cohee/code-generator.");

      // Update codeState with the returned code
      setCodeState({
        language: gptResult.language,
        code: gptResult.code,
      });

      console.log(
        "Sending second request to /api/cohee/prompt-feedback-generator..."
      );
      // Second request to /api/cohee/prompt-feedback-generator
      const coheeResponse = await fetch(
        "/api/cohee/prompt-feedback-generator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
            cohee_thread_id: coheeThreads[0]?.id,
          }),
        }
      );

      const reader = coheeResponse.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from Cohee response");
      const decoder = new TextDecoder();
      let coheeResult = "";

      // Add an initial empty message
      setCoheeMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "temp-id",
          parsedContent: [{ type: "text", content: "" }],
        } as Message,
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        coheeResult += decoder.decode(value);

        setCoheeMessagesState((prevMessages) => {
          return prevMessages.map((message, index) => {
            if (index === prevMessages.length - 1) {
              return {
                ...message,
                parsedContent: [{ type: "text", content: coheeResult }],
              };
            }
            return message;
          });
        });
      }
      console.log(
        "Received response from /api/cohee/prompt-feedback-generator."
      );

      console.log("Sending third request to /api/cohee/content-router...");
      // Third request to /api/cohee/content-router
      const contentRouterResponse = await fetch("/api/cohee/content-router", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gpt_thread_id: gptThreads[0]?.id,
          cohee_thread_id: coheeThreads[0]?.id,
          current_content: currentChapterNum,
          lecture_info_id: lecture?.lecture_info,
          lecture_id: lectureId,
        }),
      });

      const contentRouterResult = await contentRouterResponse.json();
      setCurrentChapterNum(contentRouterResult.object.content);

      // Update threads and chapters if new ones were created
      if (contentRouterResult.newGptThread) {
        setGptThreadsState((prevThreads) => [
          ...prevThreads,
          contentRouterResult.newGptThread,
        ]);
      }

      if (contentRouterResult.newCoheeThread) {
        setCoheeThreadsState((prevThreads) => [
          ...prevThreads,
          contentRouterResult.newCoheeThread,
        ]);
      }

      if (contentRouterResult.newChapter) {
        setChapterState((prevChapters) => [
          ...prevChapters,
          contentRouterResult.newChapter,
        ]);
        setCurrentChapterState(contentRouterResult.newChapter);
      }

      console.log(
        "Sending request to /api/cohee/concept-feedback-generator..."
      );
      // Fourth request to /api/cohee/concept-feedback-generator
      const conceptFeedbackResponse = await fetch(
        "/api/cohee/concept-feedback-generator",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            gpt_thread_id: gptThreads[0]?.id,
            cohee_thread_id: coheeThreads[0]?.id,
            current_content: currentChapterNum,
          }),
        }
      );

      const conceptReader = conceptFeedbackResponse.body?.getReader();
      if (!conceptReader)
        throw new Error("Failed to get reader from Concept Feedback response");
      let conceptResult = "";

      // Add an initial empty message
      setCoheeMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "temp-id",
          parsedContent: [{ type: "text", content: "" }],
        } as Message,
      ]);

      while (true) {
        const { done, value } = await conceptReader.read();
        if (done) break;
        conceptResult += decoder.decode(value);

        setCoheeMessagesState((prevMessages) => {
          return prevMessages.map((message, index) => {
            if (index === prevMessages.length - 1) {
              return {
                ...message,
                parsedContent: [{ type: "text", content: conceptResult }],
              };
            }
            return message;
          });
        });
      }
      console.log(
        "Received response from /api/cohee/concept-feedback-generator."
      );
    } catch (error) {
      console.error("Failed to send GPT message:", error);
    } finally {
      setIsLoading(false);
      console.log("Finished GPT message submission.");
    }
  };

  const handleTextareaSubmit = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
    thread: "cohee" | "gpt"
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const text = event.currentTarget.value.trim();
      if (!text) return;

      event.currentTarget.value = ""; // Clear the textarea
      if (thread === "cohee") {
        await handleCoheeMessageSubmit(text);
      } else {
        await handleGptMessageSubmit(text);
      }
    }
  };

  const chapterContent = JSON.parse(
    lecture?.lecture_info_lecture_lecture_infoTolecture_info?.chapter || "[]"
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* 왼쪽 메뉴바 */}
      <ResizablePanel
        defaultSize={10}
        minSize={10}
        maxSize={10}
        className="bg-white"
      >
        <div className="flex h-full items-start px-2 py-6 bg-transparent flex-col gap-2">
          <h3>좌측 메뉴입니다.</h3>
          <p>실습: 음악 앱을 위한 앨범 카드 만들기</p>
          <p>
            <strong>1. HTML 기본 태그 배우기</strong>
          </p>
          <p>1-1. 여는 태그와 닫는 태그 맞추기</p>
          <p>1-3. HTML 태그 속성 수정하기</p>
          <p>
            <strong>2. Div 박스 모델 이해하기</strong>
          </p>
          <p>2-1. 블럭과 인라인 블럭 차이 이해하기</p>
          <p>2-2. p 태그와 span 태그 바꿔보기</p>
          <p>
            <strong>3. 스타일 적용하기</strong>
          </p>
          <p>3-1. style 태그를 활용해 스타일 적용하기</p>
          <p>3-2. GPT가 제공한 코드의 스타일 변화하기</p>

          {/* <NestedMenu chapters={chapterContent} /> */}
          {/* <div>
            <p className="text-xs">debug panel</p>
            <p className="text-xs">lecture info id: {lecture?.lecture_info}</p>
            <br />
            <p className="text-xs">lecture id: {lecture?.id}</p>
            <br />
            <p className="text-xs">chapter id: {currentChapter?.id}</p>
            <br />
            <p className="text-xs">cohee thread id: {coheeThreads[0]?.id}</p>
            <br />
            <p className="text-xs">gpt thread id: {gptThreads[0]?.id}</p>
          </div> */}
        </div>
      </ResizablePanel>
      <ResizableHandle />
      {/* 오른쪽 패널 */}
      <ResizablePanel
        defaultSize={90}
        minSize={85}
        className="p-4 box-border h-full overflow-hidden"
      >
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* 코희 패널 */}
          <ResizablePanel
            defaultSize={30}
            minSize={30}
            maxSize={50}
            className="flex flex-col pr-4"
          >
            <div className="flex flex-col rounded-xl bg-white overflow-hidden flex-1">
              <div className="py-2 px-4 bg-[#002991]">
                <span className="font-semibold text-white text-lg">Cohee</span>
              </div>
              <div className="flex flex-col py-3 px-4 h-full justify-between">
                <CoheeThread coheeMessages={coheeMessages} />
                <Textarea
                  placeholder="코희에게 질문해보세요."
                  onKeyDown={(event) => handleTextareaSubmit(event, "cohee")}
                  disabled={isLoading}
                  rightIcon={<SendIcon />}
                  rows={1}
                />
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          {/* gpt 패널 */}
          <ResizablePanel
            defaultSize={60}
            minSize={50}
            maxSize={60}
            className="pl-4"
          >
            <ResizablePanelGroup direction="vertical">
              {/* 코드 에디터 패널 */}
              <ResizablePanel defaultSize={50} minSize={40}>
                <div className="flex h-full items-center justify-center bg-neutral-700 flex-col rounded-lg overflow-hidden">
                  <Tabs
                    defaultValue="code"
                    className="w-full h-full flex flex-col"
                  >
                    <div className="flex justify-between items-center px-4 py-1 bg-neutral-700">
                      <div className="text-white">{currentCode?.language}</div>
                      <TabsList className="">
                        <TabsTrigger value="code">Code</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                    </div>
                    <TabsContent value="code" className="flex-1 w-full">
                      <Editor
                        height="100%"
                        width="100%"
                        defaultLanguage={currentCode?.language}
                        defaultValue={currentCode?.code}
                        onMount={handleEditorDidMount}
                        theme="vs-dark"
                      />
                    </TabsContent>
                    <TabsContent value="preview" className="flex-1 w-full">
                      <Preview />
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* gpt 대화 패널 */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex flex-col h-full items-end justify-between px-1 py-3 gap-4">
                  <div className="flex flex-col flex-1 justify-start items-start gap-1 overflow-y-auto h-0">
                    {gptMessages.map((message, messageIndex) =>
                      message.parsedContent.map((contentItem, contentIndex) => (
                        <MessageBubble
                          key={`${message.id}-${contentIndex}`}
                          className="bg-[#002991] text-white"
                          type={contentItem?.type}
                        >
                          {contentItem.content}
                        </MessageBubble>
                      ))
                    )}
                  </div>
                  <Textarea
                    placeholder="GPT에게 지시를 내려보세요."
                    onKeyDown={(event) => handleTextareaSubmit(event, "gpt")}
                    disabled={isLoading}
                    rightIcon={<SendIcon />}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
