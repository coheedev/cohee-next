import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { host_llm } from "@prisma/client";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

const OWNER_ID = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";
export async function POST(req: Request) {
  const {
    gpt_thread_id,
    cohee_thread_id,
    current_content,
    lecture_info_id,
    lecture_id,
  } = await req.json();

  const lectureInfo = await prisma.lecture_info.findUnique({
    where: { id: lecture_info_id },
  });

  if (!lectureInfo) {
    return new Response(JSON.stringify({ error: "Lecture info not found" }), {
      status: 404,
    });
  }

  const lectureContent = lectureInfo.chapter ?? "";
  const lectureTitle = lectureInfo.title ?? "";

  const result = await contentRouter(
    gpt_thread_id,
    cohee_thread_id,
    current_content,
    lecture_id,
    lectureContent,
    lectureTitle
  );

  try {
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error handling POST request:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}

async function contentRouter(
  gpt_thread_id: string,
  cohee_thread_id: string,
  current_content: string = "0",
  lecture_id: string,
  lectureContent: string,
  lectureTitle: string
) {
  // Fetch messages for both threads and sort them by created_at
  const [gpt_thread, cohee_thread] = await Promise.all([
    prisma.message.findMany({
      where: { thread: gpt_thread_id },
      orderBy: { created_at: "asc" },
    }),
    prisma.message.findMany({
      where: {
        thread: cohee_thread_id,
        llm_module_message_llm_moduleTollm_module: {
          isNot: {
            name: "prompt_feedback_generator",
          },
        },
      },
      orderBy: { created_at: "asc" },
      include: {
        llm_module_message_llm_moduleTollm_module: true,
      },
    }),
  ]);

  // Combine both threads and sort them by created_at
  const combinedThreads = [...gpt_thread, ...cohee_thread].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime()
  );

  // Create the stringified script from the sorted messages
  const stringifiedScript = combinedThreads
    .map((message) => {
      const parsedContent = JSON.parse(message.content ?? "[]");
      const textContents = parsedContent
        .filter(
          (item: { type: string; content: string }) => item.type !== "image"
        )
        .map((item: { type: string; content: string }) => item.content)
        .join("\n");
      return `${message.role === "user" ? "S:" : "T:"} ${textContents}`;
    })
    .join("\n");

  console.log(stringifiedScript);
  console.log(lectureContent);
  const system_prompt = `You are tasked with analyzing the lecture dialogue between a coding beginner who wants to learn web development and their tutor. You will be given the content portion (the lecture's sequence, table of contents, and topics covered) and the script of the conversation between the student and the tutor. Based on this information, determine how far the student and tutor have progressed in the course content. only consider the content as progressed if it is actually explained by T. The lessons start with practical exercises first, and then explain the necessary concepts one by one.\n\n[Content]\n${lectureContent}\n\n[Script] \n${stringifiedScript}\n\n[Content so far is ${current_content} stage]\n\n[Example Output should be only number]\n- 1.1\n- 3.1`;

  const result = await generateObject({
    model: openai("gpt-4o"),
    system: system_prompt,
    messages: [
      {
        role: "user",
        content: "What is NEXT Content number we should explain?",
      },
    ],
    schema: z.object({
      content: z.string().describe("Next content number to be covered."),
    }),
  });

  const newContent = result.object.content;

  // Previous and new content comparison
  let newGptThread = null;
  let newCoheeThread = null;
  let newChapter = null;

  if (current_content !== newContent) {
    // Create a new chapter
    newChapter = await prisma.chapter.create({
      data: {
        owner: OWNER_ID,
        title: `${lectureTitle} | Chapter ${newContent}`,
        lecture: lecture_id,
        created_at: new Date(),
      },
    });

    // Create a new GPT thread
    newGptThread = await prisma.thread.create({
      data: {
        owner: OWNER_ID,
        chapter: newChapter.id,
        host_llm: host_llm.gpt,
      },
    });

    // Create a new Cohee thread
    newCoheeThread = await prisma.thread.create({
      data: {
        owner: OWNER_ID,
        chapter: newChapter.id,
        host_llm: host_llm.cohee,
      },
    });
  }

  const llm_module = "5ae2b9e6-b20d-4e35-aaab-b86770dfa6d9";
  await prisma.message.create({
    data: {
      owner: OWNER_ID,
      llm_module,
      role: "user",
      content: system_prompt + "\n\nNEXT Content number is:",
      tokens: result.usage.promptTokens,
    },
  });

  // Add assistant message to the message table
  await prisma.message.create({
    data: {
      owner: OWNER_ID,
      llm_module,
      role: "assistant",
      content: result.object.content,
      tokens: result.usage.completionTokens,
    },
  });

  return {
    ...result,
    newGptThread: { ...newGptThread, messages: [] },
    newCoheeThread: { ...newCoheeThread, messages: [] },
    newChapter: { ...newChapter, codes: [] },
  };
}
