// 여기는 API 라우터입니다.
// /api/cohee 경로로 들어오는 요청을 처리합니다.
// vercel에서 제공하는 AI SDK를 사용하여 OpenAI 호출을 하고 있습니다.
// 아래 링크의 docs를 참고하여 작성해주세요.
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

import { openai } from "@ai-sdk/openai";
import { StreamingTextResponse, streamText, StreamData } from "ai";

// Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: openai("gpt-4-turbo"),
    messages,
  });

  const data = new StreamData();

  data.append({ test: "value" });

  const stream = result.toAIStream({
    onFinal(_) {
      data.close();
    },
  });

  return new StreamingTextResponse(stream, {}, data);
}
