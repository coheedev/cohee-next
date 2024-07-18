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
    const result = await prisma.$transaction(async (prisma) => {
      const lecture = await prisma.lecture.findUnique({
        where: { id: lecture_id },
        include: {
          lecture_info_lecture_lecture_infoTolecture_info: true,
          chapter_chapter_lectureTolecture: true,
        },
      });

      if (!lecture) {
        throw new Error("Lecture not found");
      }

      const lecture_info =
        lecture.lecture_info_lecture_lecture_infoTolecture_info;
      const chapter = lecture.chapter_chapter_lectureTolecture[0];

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

        await prisma.message.create({
          data: {
            owner: OWNER_ID,
            thread: coheeThread.id,
            role: message_role.assistant,
            content: lecture_info ? lecture_info.initial_message : "",
            llm_module: COHEE_FEEDBACK_GENERATOR,
          },
        });
      }

      const gptMessages = await prisma.message.findMany({
        where: { thread: gptThread.id },
      });

      const coheeMessages = await prisma.message.findMany({
        where: { thread: coheeThread.id },
      });

      // Fetch the latest code related to the current chapter
      const latestCode = await prisma.code.findFirst({
        where: { chapter: chapter.id },
        orderBy: { created_at: "desc" },
      });

      return {
        lecture,
        lecture_info,
        chapter,
        gptThread,
        gptMessages,
        coheeThread,
        coheeMessages,
        latestCode,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error initializing data:", error);
    return NextResponse.json(
      { error: "Failed to initialize data" },
      { status: 500 }
    );
  }
}
