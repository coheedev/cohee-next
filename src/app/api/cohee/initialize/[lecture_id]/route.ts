import { prisma } from "@/lib/prisma";
import { host_llm, message_role, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { MessageContents } from "@/types/types";
// Define the constants
const COHEE_FEEDBACK_GENERATOR = "036f3402-5ef0-4d4a-b6d6-200097e979bb";
const OWNER_ID = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";

export async function POST(
  req: NextRequest,
  { params }: { params: { lecture_id: string } }
) {
  const { lecture_id } = params;

  if (!lecture_id) {
    return NextResponse.json(
      { error: "Lecture ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch lecture with lecture_info
    const lecture = await prisma.lecture.findUnique({
      where: { id: lecture_id },
      include: {
        lecture_info_lecture_lecture_infoTolecture_info: true,
        chapter_chapter_lectureTolecture: true,
      },
    });

    if (!lecture) {
      return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
    }

    const lecture_info =
      lecture.lecture_info_lecture_lecture_infoTolecture_info;
    const chapter = lecture.chapter_chapter_lectureTolecture[0];

    // Fetch or create GPT thread
    let gptThread = await prisma.thread.findFirst({
      where: {
        owner: OWNER_ID,
        chapter: chapter.id,
        host_llm: host_llm.gpt,
      },
    });

    if (!gptThread) {
      gptThread = await prisma.thread.create({
        data: {
          owner: OWNER_ID,
          chapter: chapter.id,
          host_llm: host_llm.gpt,
        },
      });
    }

    // Fetch or create Cohee thread
    let coheeThread = await prisma.thread.findFirst({
      where: {
        owner: OWNER_ID,
        chapter: chapter.id,
        host_llm: host_llm.cohee,
      },
    });

    if (!coheeThread) {
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
          content: lecture_info ? lecture_info.initial_message : "",
          // content:
          // '[{"type":"text","content":"안녕하세요! 저는 코포자(코딩 포기자)의 마지막 희망, 코희 챗봇이에요."},{"type":"text","content":"저는 앞으로 여러분과 함께 [AI와 함께하는 웹개발 기초] 수업을 진행할거에요.이번 챕터는 [음악 앨범 카드 개발하기: HTML 기초와 div 태그] 이에요."},{"type":"text","content":"자, 그럼 바로 실습 나갑니다.\\n다음 스크린샷은 뮤직 웹앱의 [음악 앨범 카드]의 모습인데요, HTML, CSS를 활용하여 이 카드와 동일한 모습의 앨범 카드를 만들어보세요."},{"type":"image","content":"https://gihsuefrgxchcuwupzor.supabase.co/storage/v1/object/sign/cohee/26bd98a2-cc69-41ac-a8b1-ed2b8bd47afe/initial-message-1.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJjb2hlZS8yNmJkOThhMi1jYzY5LTQxYWMtYThiMS1lZDJiOGJkNDdhZmUvaW5pdGlhbC1tZXNzYWdlLTEucG5nIiwiaWF0IjoxNzIxMDI0MTU2LCJleHAiOjE3NTI1NjAxNTZ9.jgSqow2YeQp6TZAI_MYhb49aqqPev9Ha902vteaxdOs&t=2024-07-15T06%3A15%3A56.953Z"}]',
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

    // Return the fetched data including lecture_info
    return NextResponse.json({
      lecture,
      lecture_info,
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
