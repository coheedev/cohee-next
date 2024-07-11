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
import { useRecoilState, useSetRecoilState } from "recoil";
import {
  codeState,
  currentContentState,
  coheeThreadState,
  coheeMessagesState,
  gptThreadState,
  gptMessagesState,
  lectureState,
  chapterState,
} from "@/recoil/atoms";

export function MainLayout() {
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [currentCode, setCodeState] = useRecoilState(codeState);
  const [currentContent, setCurrentContentState] =
    useRecoilState(currentContentState);
  const [coheeThread, setCoheeThreadState] = useRecoilState(coheeThreadState);
  const [coheeMessages, setCoheeMessagesState] =
    useRecoilState(coheeMessagesState);
  const [gptThread, setGptThreadState] = useRecoilState(gptThreadState);
  const [gptMessages, setGptMessagesState] = useRecoilState(gptMessagesState);
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
      try {
        const response = await fetch("/api/initialize", {
          method: "POST",
        });
        const data = await response.json();

        setLectureState(data.lecture);
        setChapterState(data.chapter);
        setCoheeThreadState(data.coheeThread);
        setCoheeMessagesState(data.coheeMessages);
        setGptThreadState(data.gptThread);
        setGptMessagesState(data.gptMessages);
      } catch (error) {
        console.error("Failed to initialize data:", error);
      }
    };

    initialize();
  }, [
    setLectureState,
    setChapterState,
    setCoheeThreadState,
    setCoheeMessagesState,
    setGptThreadState,
    setGptMessagesState,
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
  };

  const handleGptMessageSubmit = async (text: string) => {
    setIsLoading(true);
    try {
      // First request to /api/cohee/code-generator
      setGptMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "", // Set appropriate id
          created_at: new Date(),
          owner: "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5",
          thread: gptThread?.id ?? null,
          role: "user",
          llm_module: null,
          content: text,
          tokens: null,
        },
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
      setCoheeMessagesState((prevMessages) => [
        ...prevMessages,
        {
          id: "",
          created_at: new Date(),
          owner: "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5",
          thread: coheeThread?.id ?? null,
          role: "assistant",
          llm_module: "036f3402-5ef0-4d4a-b6d6-200097e979bb", // prompt feedback generator version 1
          content: "",
          tokens: null,
        },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        coheeResult += decoder.decode(value);

        setCoheeMessagesState((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessageIndex = newMessages.length - 1;
          // Create a new object to avoid mutating the existing one
          newMessages[lastMessageIndex] = {
            ...newMessages[lastMessageIndex],
            content: coheeResult,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Failed to send message:", error);
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
    <ResizablePanelGroup
      direction="horizontal"
      className="w-screen h-screen rounded-lg border"
    >
      {/* 왼쪽 메뉴바 */}
      <ResizablePanel defaultSize={10} minSize={10}>
        <div className="flex h-screen items-center justify-between p-6 bg-transparent flex-col">
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
      <ResizablePanel defaultSize={90} minSize={85}>
        <ResizablePanelGroup direction="horizontal">
          {/* 코희 패널 */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <div className="flex flex-col h-full items-center justify-between p-6 gap-4">
              <div className="h-full w-full">
                <span className="font-semibold">여기는 코희 패널입니다.</span>
                {coheeMessages.map((message, index) => (
                  <div key={index}>{message.content}</div>
                ))}
              </div>
              <Textarea placeholder="Type your message here." />
            </div>
          </ResizablePanel>
          <ResizableHandle />
          {/* gpt 패널 */}
          <ResizablePanel defaultSize={50} minSize={40}>
            <ResizablePanelGroup direction="vertical">
              {/* 코드 에디터 패널 */}
              <ResizablePanel defaultSize={50} minSize={40}>
                <div className="flex h-full items-center justify-center p-6 bg-slate-500 flex-col">
                  <Tabs
                    defaultValue="code"
                    className="w-full h-full flex flex-col"
                  >
                    <TabsList className="w-1/4">
                      <TabsTrigger value="code">Code</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
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
                y
              </ResizablePanel>
              <ResizableHandle />
              {/* gpt 대화 패널 */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="flex flex-col h-full items-center justify-between p-6 gap-4">
                  <div className="h-full w-full">
                    <span className="font-semibold">
                      여기는 GPT 대화 패널입니다.
                    </span>
                    {gptMessages
                      .filter((message) => message.role !== "assistant")
                      .map((message, index) => (
                        <div key={index}>{message.content}</div>
                      ))}
                  </div>
                  <Textarea
                    placeholder="Type your message here."
                    onKeyDown={(event) => handleTextareaSubmit(event, "gpt")}
                    disabled={isLoading}
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
