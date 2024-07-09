// import neo4jDriver from "@/utils/Neo4j";
import { openai } from "@ai-sdk/openai";
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

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
