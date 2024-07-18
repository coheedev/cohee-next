// 여기는 API 라우터입니다.
// /api/cohee/code-generator 경로로 들어오는 요청을 처리합니다.
// vercel에서 제공하는 AI SDK를 사용하여 OpenAI 호출을 하고 있습니다.
// 아래 링크의 docs를 참고하여 작성해주세요.
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

// 테스팅 방법
// 1. 로컬에서 테스트하기
// 2. Postman으로 /api/route 엔드포인트로 보내기

import { openai } from "@ai-sdk/openai";
import {
  generateObject,
  CoreSystemMessage,
  CoreUserMessage,
  TextPart,
  ImagePart,
} from "ai";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// export const runtime = "edge";
// Error: PrismaClient is not configured to run in Edge Runtime (Vercel Edge Functions, Vercel Edge Middleware, Next.js (Pages Router) Edge API Routes, Next.js (App Router) Edge Route Handlers or Next.js Middleware). In order to run Prisma Client on edge runtime, either:
// - Use Prisma Accelerate: https://pris.ly/d/accelerate
// - Use Driver Adapters: https://pris.ly/d/driver-adapters

export async function POST(req: Request) {
  // user_id: 03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5
  // lecture_id: c60ca397-d4ce-41f0-bf7a-e6874399ef47
  // chapter_id: 89ebb8ef-2651-49cb-9216-5c2c9a32d4b4
  // thread_id: c6a9f739-25eb-4c7e-b39c-834bc0303cf7
  const { text, images, gpt_thread_id, chapter_id } = await req.json();

  const result = await codeGenerator(text, gpt_thread_id, chapter_id, images);
  return result.toJsonResponse();
}

async function codeGenerator(
  text: string,
  gpt_thread_id: string,
  chapter_id: string,
  images: string[] = []
) {
  const content: string | (TextPart | ImagePart)[] =
    images.length === 0
      ? text
      : [
          { type: "text", text } as TextPart,
          ...images.map((image) => ({ type: "image", image } as ImagePart)),
        ];

  // Define the messages array with the correct types
  const messages: Array<CoreUserMessage | CoreSystemMessage> = [
    {
      role: "user",
      content: content,
    } as CoreUserMessage,
  ];

  // streamObject() 을 사용하는 것도 나중에 하면 좋을 것
  const result = await generateObject({
    model: openai("gpt-4o"),
    system: "You are code generating AI. Output only code with proper schema",
    schema: z.object({
      code: z.string().describe("The code generated by you."),
      language: z
        .enum(["javascript", "html", "css"])
        .describe("The programming language of the code."),
      // explaination: z.string().optional().describe("The explaination of the code."),s
    }),
    mode: "json",
    messages: messages,
    // streaming이 아니라서 onFinish를 사용할 수 없음
    // onFinish: async (result) => {}
  });

  const { code, language } = result.object;
  const owner = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";
  const chapter = chapter_id;
  const llm_module = "e58d458a-5f5a-4ae2-aa4c-e2b600d63aee"; // code generator version 1

  // Find the latest version for the given owner and chapter
  const latestCode = await prisma.code.findFirst({
    where: { owner, chapter },
    orderBy: { version: "desc" },
  });

  const latestVersion = latestCode ? Number(latestCode.version) : 0;
  const newVersion = latestVersion + 1;

  // Create a new Code record in the database
  const newCode = await prisma.code.create({
    data: {
      owner,
      chapter,
      version: newVersion,
      language,
      content: code,
      author: "gpt",
    },
  });

  // Add user message to the message table
  await prisma.message.create({
    data: {
      owner,
      thread: gpt_thread_id,
      role: "user",
      content: JSON.stringify([{ type: "text", content: text }]),
      // test commit
      tokens: result.usage.promptTokens,
    },
  });

  // Add assistant message to the message table
  await prisma.message.create({
    data: {
      owner,
      thread: gpt_thread_id,
      role: "assistant",
      content: JSON.stringify([{ type: "code", content: code }]),
      llm_module,
      tokens: result.usage.completionTokens,
    },
  });

  return result;
}
