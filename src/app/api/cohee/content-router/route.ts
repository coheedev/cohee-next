// 여기는 API 라우터입니다.
// /api/cohee/content-router 경로로 들어오는 요청을 처리합니다.
// vercel에서 제공하는 AI SDK를 사용하여 OpenAI 호출을 하고 있습니다.
// 아래 링크의 docs를 참고하여 작성해주세요.
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
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
  const { gpt_thread_id, cohee_thread_id, current_content } = await req.json();

  const result = await contentRouter(
    gpt_thread_id,
    cohee_thread_id,
    current_content
  );
  try {
    return result.toJsonResponse();
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
  current_content: string = "0"
) {
  // TODO: 현재 lecture id를 path parameter로 받아서 해당 lecture의 content를 가져오기 (굳이 path parameter로 받을 필요가 없다면 제거하기)
  const lectureContent =
    "0. Practical Excercise : Developing an album card for a music app\n1. Learning Basic HTML Tags based on result\n    1.1 Emphasizing Opening and Closing Tags\n    - Opening Tag and Closing Tag: <p> </p>\n    - Ensuring Tag Pairs Match\n    1.2 Explaining Tag Types and Examples from 1.1\n    1.3 Practice by Modifying a Tag\n2. Understanding the div Box Model\n    2.1 Explaining Block vs Inline-Block Tags\n    - p Tag (Block)\n    - span Tag (Inline-Block)\n    - Differences Between Block and Inline-Block\n    2.2 Practice by Swapping p and span Tags in Code\n3. Applying Styles Using the Style Tag and Properties\n    3.1 Explaining How to Apply Styles with the Style Tag\n    3.2 Practice by Modifying Resulting Properties (Randomized Prompt)";

  // 코희 thread, gpt thread를 시간순으로 정리 (형식은 db Message)
  // TODO: 토큰 적당히 자르기
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
        llm_module_message_llm_moduleTollm_module: true, // Include the related llm_module to apply the filter
      },
    }),
  ]);
  // Combine both threads and sort them by created_at
  const combinedThreads = [...gpt_thread, ...cohee_thread].sort(
    (a, b) => a.created_at.getTime() - b.created_at.getTime()
  );

  // Create the stringified script from the sorted messages
  const stringifiedScript = combinedThreads
    .map(
      (message) => `${message.role === "user" ? "S:" : "T:"} ${message.content}`
    )
    .join("\n");
  console.log(stringifiedScript);

  // gpt thread와 cohee thread를 함께 동봉하여 보내기 -> front에서 받기
  // 이전 step 또한 함께 보내기
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

  const owner = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";
  const chapter = "89ebb8ef-2651-49cb-9216-5c2c9a32d4b4";
  const llm_module = "5ae2b9e6-b20d-4e35-aaab-b86770dfa6d9";
  await prisma.message.create({
    data: {
      owner,
      llm_module,
      role: "user",
      content: system_prompt + "\n\nNEXT Content number is:",
      tokens: result.usage.promptTokens,
    },
  });

  // Add assistant message to the message table
  await prisma.message.create({
    data: {
      owner,
      llm_module,
      role: "assistant",
      content: result.object.content,
      tokens: result.usage.completionTokens,
    },
  });

  return result;
}
