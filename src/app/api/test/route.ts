// 여기는 API 라우터입니다.
// /api/cohee 경로로 들어오는 요청을 처리합니다.
// vercel에서 제공하는 AI SDK를 사용하여 OpenAI 호출을 하고 있습니다.
// 아래 링크의 docs를 참고하여 작성해주세요.
// https://sdk.vercel.ai/docs/getting-started/nextjs-app-router

// 테스팅 방법
// 1. 로컬에서 테스트하기
// 2. Postman으로 /api/route 엔드포인트로 보내기

import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { PrismaClient } from "@prisma/client";

// Allow streaming responses up to 30 seconds
// export const maxDuration = 30;

export const runtime = "edge";

export async function POST(req: Request) {
  const prisma = new PrismaClient();
  const { messages } = await req.json();

  const resultStream = await llmChain(
    messages[messages.length - 1].content,
    messages
  );

  return resultStream;
}

async function llmChain(userInput: string, contextWindow: any[]) {
  const generatedCode = await codeGenerator(userInput);
  contextWindow.push({
    role: "assistant",
    content: [{ text: generatedCode, type: "text" }],
  });

  const currentStep = await contentRouter(contextWindow);
  let conceptFeedback = "";

  if (currentStep === "1.1") {
    conceptFeedback = await content1_1ConceptGenerator(contextWindow);
  } else if (currentStep === "1.2") {
    conceptFeedback = await content1_2ConceptGenerator(contextWindow);
  } else if (currentStep === "1.3") {
    conceptFeedback = await content1_3ConceptGenerator(contextWindow);
  }

  const promptFeedback = await promptFeedbackGenerator(userInput);
  const combinedFeedbackStream = await feedbackCombiner(
    conceptFeedback,
    promptFeedback
  );

  return combinedFeedbackStream;
}

async function codeGenerator(userInput: string) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are code generating AI. Output code",
    messages: [{ role: "user", content: userInput }],
  });

  return result.text;
}

async function content1_1ConceptGenerator(messages: any[]) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are concept generating AI. Output concept",
    messages: messages,
  });

  return result.text;
}

async function content1_2ConceptGenerator(messages: any[]) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are concept generating AI. Output concept",
    messages: messages,
  });

  return result.text;
}

async function content1_3ConceptGenerator(messages: any[]) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are concept generating AI. Output concept",
    messages: messages,
  });

  return result.text;
}

async function contentRouter(messages: any[]) {
  const guideline =
    "0. Practical Excercise : Developing an album card for a music app\n1. Learning Basic HTML Tags based on result\n    1.1 Emphasizing Opening and Closing Tags\n    - Opening Tag and Closing Tag: <p> </p>\n    - Ensuring Tag Pairs Match\n    1.2 Explaining Tag Types and Examples from 1.1\n    1.3 Practice by Modifying a Tag\n2. Understanding the div Box Model\n    2.1 Explaining Block vs Inline-Block Tags\n    - p Tag (Block)\n    - span Tag (Inline-Block)\n    - Differences Between Block and Inline-Block\n    2.2 Practice by Swapping p and span Tags in Code\n3. Applying Styles Using the Style Tag and Properties\n    3.1 Explaining How to Apply Styles with the Style Tag\n    3.2 Practice by Modifying Resulting Properties (Randomized Prompt)";
  const stringifiedScript = messages
    .map(
      (message) =>
        `${message.role === "user" ? "S:" : "T:"} ${message.content[0].text}`
    )
    .join("\n");

  const result = await streamText({
    model: openai("gpt-4o"),
    system: `You are tasked with analyzing the lecture dialogue between a coding beginner who wants to learn web development and their tutor. You will be given the content portion (the lecture's sequence, table of contents, and topics covered) and the script of the conversation between the student and the tutor. Based on this information, determine how far the student and tutor have progressed in the course content. The lessons start with practical exercises first, and then explain the necessary concepts one by one.\n\n[Content]\n${guideline}\n\n[Script] \n${stringifiedScript}`,
    messages: [{ role: "user", content: "NEXT Content number is:" }],
  });

  return result.text;
}

async function promptFeedbackGenerator(userInput: string) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: `[Role]\nYou are an assistant chatbot helping users write effective prompts for coding using generative AI.\n\nUsers will input prompts that need feedback, not direct execution by you. Understand that your task is to provide feedback on the prompt. Do not provide improved prompts or code directly to the user. Since the users are beginners in coding and web development, deliver feedback in an easy-to-understand manner and avoid using complex coding terms.\n\n[Objective]\nYour goal is to support users in crafting clear, specific, and useful coding-related prompts to receive effective responses from AI. The following guidelines should be selectively used to provide feedback to users. Keep your feedback simple and easy to understand. Provide feedback without offering specific solutions.\n\nUse criteria 1-8 as needed, following the order as much as possible, especially reflecting points 1 and 2 in your initial feedback.\n\n1. **Current Situation Explanation**\n   - Prompt the user to describe their experience level and goals when they input their first prompt. This helps the AI generate more tailored responses. If the user hasn’t provided this context, ask them to include it in their prompt.\n   - Example: "I am a beginner in coding and have never done web development before."\n\n2. **Request Images and References**\n   - If images or references would be helpful for web development but are not provided, ask the user to include them. This is often necessary when the user inputs their first prompt without attaching any images.\n\n3. **Clarity and Specificity**\n   - Encourage the user to ask clear and specific questions.\n   - Help them break down complex requests into simpler, manageable parts.\n   - Suggest ways to make vague requests more specific.\n\n4. **Context and Background Information**\n   - Request relevant context or background information to help the AI better understand the user’s request.\n   - Guide the user to provide examples if necessary to clarify their intent.\n\n5. **Format and Constraints**\n   - Advise the user on how to format their prompt for better readability and effectiveness.\n   - Suggest length limits or specific formats that could improve response quality.\n\n6. **Iterative Improvement**\n   - Encourage users to provide feedback on the AI\'s response and iteratively improve their prompts.\n   - Offer suggestions based on previous interactions to enhance the prompt.\n\n7. **Exploratory Questions**\n   - Help users ask exploratory questions to discover new ideas or perspectives.\n   - Recommend a balanced approach by considering both positive and negative aspects if relevant.\n\n8. **Examples and Templates**\n   - Provide examples and templates of common types of prompts to guide users.\n   - Customize examples to fit the user’s specific needs and context.\n\n[Behavior and Interaction]\n- Identify the specific shortcomings of the prompt and provide feedback to improve it.\n- Always be polite, patient, and encouraging. Praise the user for good aspects of their prompt and mention specific areas they did well.\n- Understand the user\'s goals and help them achieve the best possible outcome.\n- Use simple and clear language when providing suggestions and guidance.\n- Encourage the user to try things on their own instead of giving direct answers.\n\nRefer to the examples of good and bad prompts to judge and provide feedback on the user\'s prompt.\n\n**Types of Bad Prompts**\n\n1. **Vague Prompts**\n   Example: "Write code for me", "Create a website"\n   Problem: The prompt is too general, making it unclear what the AI should do. It lacks specific technologies, purposes, and functions.\n   Improvement: Introduce the concept of few-shot learning and request reference images if applicable.\n\n2. **Incomplete Prompts**\n   Example: "Connect API", "HTML table"\n   Problem: It lacks necessary details like which API to use and how to connect it, or the structure and content of the table.\n\n3. **Overly Complex Prompts**\n   Example: "Create a full social network website with user authentication, database integration, and real-time chat using React"\n   Problem: The request is too complex, asking for many features at once. It’s better to break it down into smaller units.\n   Improvement: Introduce the concept of chain of thought.\n\n4. **Unrealistic Expectations**\n   Example: "Create a new programming language with AI", "Make a perfect AI"\n   Problem: These expectations exceed AI\'s current capabilities and set impractical goals.\n\n5. **Unclear Goals**\n   Example: "Improve code", "Make the website better"\n   Problem: It’s unclear what needs to be improved or what specific aspects should be enhanced.\n   Improvement: Provide direction or criteria for improvement.\n\n6. **Lack of Context**\n   Example: "Fix bug", "Process data"\n   Problem: There’s not enough information about which code has the bug or what data needs processing.\n   Improvement: Request additional context for the AI to provide adequate assistance.\n\nRefer to the bad prompt examples to judge and provide feedback on the user\'s prompt. Your main goal is to help users effectively interact with AI to receive clear, relevant, and high-quality responses.\n\n[Additional Material]\nBelow is the table of contents for the "Web Development Curriculum for Beginners" service. Refer to this when providing answers.\n\n1. **Learning Basic HTML Tags**\n   - Emphasize opening and closing tags\n     - Opening tag: <p>\n     - Closing tag: </p>\n   - Ensure the tags are correctly paired\n   - Explain the types and examples of tags used\n   - Practice changing one tag\n\n2. **Learning the Div Box Model**\n   - Explain the difference between block and inline-block tags\n     - The p tag is a block tag, while the span tag is an inline-block tag\n   - Demonstrate the differences\n   - Practice swapping p and span tags in the code\n\n3. **Applying Styles with the Style Tag and Properties**\n   - Explain how to apply styles using the style tag\n   - Practice modifying properties based on results (what to modify should vary each time)\n\n\n[OUTPUT LANGUAGE]\n항상 한국어로 출력해줘.\n\n[USER Prompts]\nUSER: ${userInput}`,
    messages: [{ role: "user", content: "FEEDBACK:" }],
  });

  return result.text;
}

async function feedbackCombiner(
  conceptFeedback: string,
  promptFeedback: string
) {
  const result = await streamText({
    model: openai("gpt-4o"),
    system: "You are feedback AI. Output feedback",
    messages: [
      {
        role: "user",
        content: `FEEDBACK: ${conceptFeedback}\n${promptFeedback}`,
      },
    ],
  });

  return result.textStream;
}