import { prisma } from "@/lib/prisma";
import { host_llm, message_role, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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

      // Convert initial_message to the expected type
      const initialMessageContent: Prisma.InputJsonValue[] = lecture_info
        ? (lecture_info.initial_message as Prisma.InputJsonArray[])
        : [];

      // Add initial assistant message to the Cohee thread
      await prisma.message.create({
        data: {
          owner: OWNER_ID,
          thread: coheeThread.id,
          role: message_role.assistant,
          content: initialMessageContent,
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
