import { prisma } from "@/lib/prisma";
import { status, host_llm, message_role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

// Define the constants
const LECTURE_INFO_ID = "26bd98a2-cc69-41ac-a8b1-ed2b8bd47afe";
const OWNER_ID = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";
const INITIAL_MESSAGE_CONTENT = `
안녕하세요! 저는 코포자(코딩 포기자)의 마지막 희망, 코희 챗봇이에요.
저는 앞으로 여러분과 함께 [AI와 함께하는 웹개발 기초] 수업을 진행할거에요.
이번 챕터는 [음악 앨범 카드 개발하기: HTML 기초와 div 태그] 이에요.
자, 그럼 바로 실습 나갑니다. 
다음 스크린샷은 뮤직 웹앱의 [음악 앨범 카드]의 모습인데요, HTML, CSS를 활용하여 이 카드와 동일한 모습의 앨범 카드를 만들어보세요.
`;
const COHEE_FEEDBACK_GENERATOR = "036f3402-5ef0-4d4a-b6d6-200097e979bb";

// Export the POST handler function
export async function POST(req: NextRequest) {
  try {
    // Check if lecture already exists
    let lecture = await prisma.lecture.create({
      data: {
        owner: OWNER_ID,
        status: status.IN_PROGRESS,
        lecture_info: LECTURE_INFO_ID,
      },
    });

    // Check if chapter already exists
    let chapter = await prisma.chapter.findFirst({
      where: {
        owner: OWNER_ID,
        lecture: lecture.id,
      },
    });

    if (!chapter) {
      // Create chapter if it doesn't exist
      chapter = await prisma.chapter.create({
        data: {
          owner: OWNER_ID,
          lecture: lecture.id,
          status: status.IN_PROGRESS,
          title:
            "[챕터1]카드 만들기 실습:\n결과를 기반으로 HTML 기본 태그 배우기",
        },
      });
    }

    // Check if GPT thread already exists
    let gptThread = await prisma.thread.findFirst({
      where: {
        owner: OWNER_ID,
        chapter: chapter.id,
        host_llm: host_llm.gpt,
      },
    });

    if (!gptThread) {
      // Create GPT thread if it doesn't exist
      gptThread = await prisma.thread.create({
        data: {
          owner: OWNER_ID,
          chapter: chapter.id,
          host_llm: host_llm.gpt,
        },
      });
    }

    // Check if Cohee thread already exists
    let coheeThread = await prisma.thread.findFirst({
      where: {
        owner: OWNER_ID,
        chapter: chapter.id,
        host_llm: host_llm.cohee,
      },
    });

    if (!coheeThread) {
      // Create Cohee thread if it doesn't exist
      coheeThread = await prisma.thread.create({
        data: {
          owner: OWNER_ID,
          chapter: chapter.id,
          host_llm: host_llm.cohee,
        },
      });

      // Add initial assistant message to the Cohee thread
      await prisma.message.create({
        data: {
          owner: OWNER_ID,
          thread: coheeThread.id,
          role: message_role.assistant,
          content: INITIAL_MESSAGE_CONTENT,
          llm_module: COHEE_FEEDBACK_GENERATOR,
        },
      });
    }

    // Fetch messages for GPT and Cohee threads
    const gptMessages = await prisma.message.findMany({
      where: { thread: gptThread.id },
    });

    const coheeMessages = await prisma.message.findMany({
      where: { thread: coheeThread.id },
    });

    // Return the created or found records along with messages as JSON
    return NextResponse.json({
      lecture,
      chapter,
      gptThread,
      gptMessages,
      coheeThread,
      coheeMessages,
    });
  } catch (error) {
    console.error("Error initializing data:", error);
    return NextResponse.json(
      { error: "Failed to initialize data" },
      { status: 500 }
    );
  }
}
