"use client";
import React, { useRef, useState, useEffect } from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRecoilState } from "recoil";
import {
  codeState,
  currentContentState,
  coheeThreadState,
  coheeMessagesState,
  coheeMessagesContentState,
  gptThreadState,
  gptMessagesState,
  gptMessagesContentState,
  lectureState,
  chapterState,
} from "@/recoil/atoms";
import { SendIcon } from "./common/Icon/SendIcon";
import { MessageBubble } from "./MessageBubble";
import { MessageContentItem } from "@/types/types";
import { CoheeThread } from "./CoheeThread";

export function LectureLayout({ lecture_id }: { lecture_id: string }) {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [currentCode, setCodeState] = useRecoilState(codeState);
  const [currentContent, setCurrentContentState] =
    useRecoilState(currentContentState);
  const [coheeThread, setCoheeThreadState] = useRecoilState(coheeThreadState);
  const [coheeMessages, setCoheeMessagesState] =
    useRecoilState(coheeMessagesState);
  const [coheeMessageContent, setCoheeMessageContent] = useRecoilState(
    coheeMessagesContentState
  );
  const [gptThread, setGptThreadState] = useRecoilState(gptThreadState);
  const [gptMessages, setGptMessagesState] = useRecoilState(gptMessagesState);
  const [gptMessageContent, setGptMessageContent] = useRecoilState(
    gptMessagesContentState
  );
  const [lecture, setLectureState] = useRecoilState(lectureState);
  const [chapter, setChapterState] = useRecoilState(chapterState);

  const handleEditorDidMount: OnMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    monacoInstance: typeof monaco
  ) => {
    editorRef.current = editor;
    setIsEditorReady(true);
  };

  useEffect(() => {
    const initialize = async () => {
      if (!lecture_id) return;
      try {
        const response = await fetch(`/api/cohee/initialize/${lecture_id}`, {
          method: "POST",
        });
        const data = await response.json();

        setLectureState(data.lecture);
        setChapterState(data.chapter);
        setCoheeThreadState(data.coheeThread);
        setCoheeMessagesState(data.coheeMessages);
        setGptThreadState(data.gptThread);
        setGptMessagesState(data.gptMessages);

        // Extract and flatten content and store it in gptMessageContent and coheeMessageContent
        // Extract and flatten content and store it in gptMessageContent and coheeMessageContent
        const gptContent: MessageContentItem[] = data.gptMessages.flatMap(
          (message: { content: string }) => JSON.parse(message.content)
        );
        setGptMessageContent(gptContent);
        const coheeContent: MessageContentItem[] = data.coheeMessages.flatMap(
          (message: { content: string }) => JSON.parse(message.content)
        );
        setCoheeMessageContent(coheeContent);

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
    lecture_id,
    setLectureState,
    setChapterState,
    setCoheeThreadState,
    setCoheeMessagesState,
    setGptThreadState,
    setGptMessagesState,
    setGptMessageContent,
    setCoheeMessageContent,
    setCodeState,
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
      // Update coheeMessageContent state
      setCoheeMessageContent((prevContent) => [
        ...prevContent,
        { type: "text", content: text },
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
            cohee_thread_id: coheeThread?.id,
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

        setCoheeMessageContent((prevContent) => {
          return prevContent.map((message, index) => {
            if (index === prevContent.length - 1) {
              return { type: "text", content: coheeResult };
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
    setIsLoading(true);
    try {
      // First request to /api/cohee/code-generator
      setGptMessageContent((prevContent) => [
        ...prevContent,
        { type: "text", content: text },
      ]);

      const gptResponse = await fetch("/api/cohee/code-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          gpt_thread_id: gptThread?.id,
          chapter_id: chapter?.id,
        }),
      });

      const gptResult = await gptResponse.json();

      // Update codeState with the returned code
      setCodeState({
        language: gptResult.language,
        code: gptResult.code,
      });

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
            cohee_thread_id: coheeThread?.id,
          }),
        }
      );

      const reader = coheeResponse.body?.getReader();
      if (!reader) throw new Error("Failed to get reader from Cohee response");
      const decoder = new TextDecoder();
      let coheeResult = "";

      // Add an initial empty message
      setCoheeMessageContent((prevContent) => [
        ...prevContent,
        { type: "text", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        coheeResult += decoder.decode(value);

        setCoheeMessageContent((prevContent) => {
          return prevContent.map((message, index) => {
            if (index === prevContent.length - 1) {
              return { type: "text", content: coheeResult };
            }
            return message;
          });
        });
      }
    } catch (error) {
      console.error("Failed to send GPT message:", error);
    } finally {
      setIsLoading(false);
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

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      {/* 왼쪽 메뉴바 */}
      <ResizablePanel
        defaultSize={10}
        minSize={10}
        maxSize={10}
        className="bg-white"
      >
        <div className="flex h-full items-center justify-between px-2 py-6 bg-transparent flex-col">
          <div>
            <span className="font-semibold">여기는 왼쪽 메뉴입니다.</span>
          </div>
          <div>
            <p className="text-xs">debug panel</p>
            <p className="text-xs">lecture info id: {lecture?.lecture_info}</p>
            <br />
            <p className="text-xs">lecture id: {lecture?.id}</p>
            <br />
            <p className="text-xs">chapter id: {chapter?.id}</p>
            <br />
            <p className="text-xs">cohee thread id: {coheeThread?.id}</p>
            <br />
            <p className="text-xs">gpt thread id: {gptThread?.id}</p>
          </div>
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
                <CoheeThread coheeMessageContent={coheeMessageContent} />
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
                    <TabsContent value="preview">
                      여기는 미리보기가 나옵니다.
                    </TabsContent>
                  </Tabs>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              {/* gpt 대화 패널 */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex flex-col h-full items-end justify-between px-1 py-3 gap-4">
                  <div className="flex flex-col flex-1 justify-start items-start gap-1 overflow-y-auto h-0">
                    {gptMessageContent.map((contentItem, index) => (
                      <MessageBubble
                        key={index}
                        className="bg-[#002991] text-white"
                        type={contentItem?.type}
                      >
                        {contentItem.content}
                      </MessageBubble>
                    ))}
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
