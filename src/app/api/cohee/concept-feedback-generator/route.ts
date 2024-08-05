// 여기는 API 라우터입니다.
// /api/cohee/concept-feedback-generator 경로로 들어오는 요청을 처리합니다.
// vercel에서 제공하는 AI SDK를 사용하여 OpenAI 호출을 하고 있습니다.
// 아래 링크의 docs를 참고하여 작성해주세요.
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { prisma } from "@/utils/prisma";
import { createClient } from "@/utils/supabase/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API,
});
// export const runtime = "edge";
// Error: PrismaClient is not configured to run in Edge Runtime (Vercel Edge Functions, Vercel Edge Middleware, Next.js (Pages Router) Edge API Routes, Next.js (App Router) Edge Route Handlers or Next.js Middleware). In order to run Prisma Client on edge runtime, either:
// - Use Prisma Accelerate: https://pris.ly/d/accelerate
// - Use Driver Adapters: https://pris.ly/d/driver-adapters

export async function POST(req: Request) {
  // user_id: 03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5
  // lecture_id: c60ca397-d4ce-41f0-bf7a-e6874399ef47
  // chapter_id: 89ebb8ef-2651-49cb-9216-5c2c9a32d4b4
  // thread_id: c6a9f739-25eb-4c7e-b39c-834bc0303cf7
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "User not authenticated" }), {
      status: 401,
    });
  }

  const OWNER_ID = user.id;
  const { gpt_thread_id, cohee_thread_id, current_content } = await req.json();
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

  // streaming 끝나면 메시지 데이터 같이 리턴. 그래야 front에서 thread에 추가하거나 message에 업데이트할 수 있음. 근데 이거 어떻게 하지? data object 봤던거 같은데..
  if (
    current_content === "0" ||
    current_content === "1" ||
    current_content === "1.1"
  ) {
    const result = await content1_1ConceptGenerator(
      OWNER_ID,
      stringifiedScript,
      cohee_thread_id
    );
    return result.toTextStreamResponse();
  } else if (current_content === "1.2") {
    const result = await content1_2ConceptGenerator(
      OWNER_ID,
      stringifiedScript,
      cohee_thread_id
    );
    return result.toTextStreamResponse();
  } else if (current_content === "1.3") {
    const result = await content1_3ConceptGenerator(
      OWNER_ID,
      stringifiedScript,
      cohee_thread_id
    );
    return result.toTextStreamResponse();
  } else {
    return new Response(JSON.stringify({ error: "Invalid current step" }), {
      status: 400,
    });
  }
}

async function content1_1ConceptGenerator(
  owner: string,
  stringifiedScript: string,
  cohee_thread_id: string
) {
  const system_prompt = `[Role]You are responsible for analyzing a teacher's lesson for beginners in web development and assisting the teacher in real-time with what content to provide according to the lesson's structure and content. This time, the lesson is about the basic tags of HTML. You explain the concepts of opening and closing tags, provide examples, and give practice problems.\n\n[Instruction]\nSince this is not the first meeting between the teacher, student, and you as the assistant chatbot, you can skip the greetings. Your feedback should be in a tone that a teacher uses when explaining to a student. I will provide the script of the lesson between the teacher and the student, based on which you should identify the part the student is learning and kindly explain the concepts of the basic HTML tags needed for that part, and provide practice problems to help them understand.\n\nDo not directly mention the table of contents to the student. Do not give answer code of examples. First, explain the concepts of the basic HTML tags needed for the student's learning stage and provide application problems. Each problem should require modifying a different tag.\n\nLearning Basic HTML Tags\n\nEmphasize opening and closing tags\nOpening tag: <p>\nClosing tag: </p>\nThese two must be paired correctly\nExplain the types and examples of the tags used here\nProvide application practice to modify one of the tags.\n\n[Script] \n${stringifiedScript}`;

  const result = await streamText({
    model: openai("gpt-4o"),
    system: system_prompt,
    messages: [],
    onFinish: async (result) => {
      const llm_module = "36562c2c-c61b-4f21-b9cf-0a5f3f8d5015"; // L1C1_1 concept feedback generator version 1

      if (result.finishReason === "stop") {
        // 이 경우에는 코희에게 직접적으로 메시지를 보낸 것이 아니기 때문에 코희 쓰레드에 추가하지 않는다.
        await prisma.message.create({
          data: {
            owner,
            llm_module,
            role: "user",
            content: JSON.stringify([
              {
                type: "text",
                content: system_prompt,
              },
            ]),
            tokens: result.usage.promptTokens,
          },
        });

        // 결과만 저장
        await prisma.message.create({
          data: {
            owner,
            thread: cohee_thread_id,
            role: "assistant",
            content: JSON.stringify([
              {
                type: "text",
                content: result.text,
              },
            ]),
            llm_module,
            tokens: result.usage.completionTokens,
          },
        });
      }
    },
  });

  return result;
}

async function content1_2ConceptGenerator(
  owner: string,
  stringifiedScript: string,
  cohee_thread_id: string
) {
  const system_prompt = `[Role]You are responsible for analyzing a teacher's lesson for beginners in web development and assisting the teacher in real-time with what content to provide according to the lesson's structure and content. This time, the lesson is about the concept of the div box model, provide examples, and offer practice exercises.\n\n[Instruction]\nSince this is not the first meeting between the teacher, student, and you as the assistant chatbot, you can skip the greetings. Your feedback should be in a tone that a teacher uses when explaining to a student. I will provide the script of the lesson between the teacher and the student, based on which you should identify the part the student is learning and kindly explain the concepts of the div box model needed for that part, and provide practice problems to help them understand.\n\nDo not directly mention the table of contents to the student. Do not give answer code of examples. First, explain the concepts of the div box model needed for the student's learning stage and provide application problems. Each problem should require modifying a different element.\n\nExplanation of the div box model\n\nExplain the concept of the div box\nEmphasize the concepts of padding and margin\nExplain the concept and usage of the border\nUse code examples to explain the structure and usage of the div box model\n\n[Script] \n${stringifiedScript}`;

  const result = await streamText({
    model: openai("gpt-4o"),
    system: system_prompt,
    messages: [],
    onFinish: async (result) => {
      const llm_module = "c029137f-6d55-4a13-a931-b32d01fccbab"; // L1C1_2 concept feedback generator version 1

      if (result.finishReason === "stop") {
        // 이 경우에는 코희에게 직접적으로 메시지를 보낸 것이 아니기 때문에 코희 쓰레드에 추가하지 않는다.
        await prisma.message.create({
          data: {
            owner,
            llm_module,
            role: "user",
            content: system_prompt,
            tokens: result.usage.promptTokens,
          },
        });

        // 결과만 저장
        await prisma.message.create({
          data: {
            owner,
            thread: cohee_thread_id,
            role: "assistant",
            content: result.text,
            llm_module,
            tokens: result.usage.completionTokens,
          },
        });
      }
    },
  });

  return result;
}

async function content1_3ConceptGenerator(
  owner: string,
  stringifiedScript: string,
  cohee_thread_id: string
) {
  const system_prompt = `[Role]\nYou are responsible for analyzing a teacher's lesson for beginners in web development and assisting the teacher in real-time with what content to provide according to the lesson's structure and content. This time, the lesson is about applying styles to HTML elements using the style tag and property.\n\n[Instruction]\nSince this is not the first meeting between the teacher, student, and you as the assistant chatbot, you can skip the greetings. Your feedback should be in a tone that a teacher uses when explaining to a student. I will provide the script of the lesson between the teacher and the student, based on which you should identify the part the student is learning and explain the concepts and usage of the style tag and property needed for that part. Additionally, after explaining the concepts, provide application problems to aid understanding.\n\nYou should deliver web development concepts very clearly but as simply and concisely as possible to avoid overwhelming the student with too much information at once. Do not directly mention the table of contents to the student. Do not mention answer of examples. First, kindly explain the concepts of the style tag and property needed for the student's learning stage and provide application problems. Each problem should require modifying a different property.\n\nExplanation of Applying Styles\n\nExplain the concept of the style tag\nExplain how to apply styles to HTML elements using property\nExample: Change the text color of the h1 element to green and the text size of the p element to 20px.\nExample: Change the background color of the body element to lightyellow and the text size of the h1 element to 40px.\n\n[Script] \n${stringifiedScript}`;

  const result = await streamText({
    model: openai("gpt-4o"),
    system: system_prompt,
    messages: [],
    onFinish: async (result) => {
      const llm_module = "4790b2da-f882-44d3-bcfc-82c9b7983b70"; // L1C1_3 concept feedback generator version 1

      if (result.finishReason === "stop") {
        // 이 경우에는 코희에게 직접적으로 메시지를 보낸 것이 아니기 때문에 코희 쓰레드에 추가하지 않는다.
        await prisma.message.create({
          data: {
            owner,
            llm_module,
            role: "user",
            content: system_prompt,
            tokens: result.usage.promptTokens,
          },
        });

        // 결과만 저장
        await prisma.message.create({
          data: {
            owner,
            thread: cohee_thread_id,
            role: "assistant",
            content: result.text,
            llm_module,
            tokens: result.usage.completionTokens,
          },
        });
      }
    },
  });

  return result;
}
