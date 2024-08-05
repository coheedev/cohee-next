import { prisma } from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { host_llm, message, thread, chapter, code } from "@prisma/client";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { lectureId: string } }
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "User not authenticated" },
      { status: 401 }
    );
  }

  const { lectureId } = params;
  if (!lectureId) {
    return NextResponse.json(
      { error: "Lecture ID is required" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Fetch the lecture and its chapters
      const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId, owner: user.id },
        include: {
          lecture_info_lecture_lecture_infoTolecture_info: true,
          chapter_chapter_lectureTolecture: true,
        },
      });

      if (!lecture) {
        throw new Error("Lecture not Authorized");
      }

      const chapters = lecture.chapter_chapter_lectureTolecture;

      // Fetch threads, messages, and codes for each chapter
      const chapterDetails = await Promise.all(
        chapters.map(async (chapter) => {
          const gptThread = await prisma.thread.findFirst({
            where: {
              owner: user.id,
              chapter: chapter.id,
              host_llm: host_llm.gpt,
            },
          });

          const coheeThread = await prisma.thread.findFirst({
            where: {
              owner: user.id,
              chapter: chapter.id,
              host_llm: host_llm.cohee,
            },
          });

          const gptMessages = gptThread
            ? await prisma.message.findMany({
                where: { thread: gptThread.id },
              })
            : [];

          const coheeMessages = coheeThread
            ? await prisma.message.findMany({
                where: { thread: coheeThread.id },
              })
            : [];

          const codes = await prisma.code.findMany({
            where: { chapter: chapter.id },
            orderBy: { created_at: "asc" },
          });

          const latestCode = codes.length > 0 ? codes[codes.length - 1] : null;

          return {
            chapter,
            // gptThread,
            gptThread: gptThread
              ? { ...gptThread, messages: gptMessages }
              : null,
            // coheeThread,
            coheeThread: coheeThread
              ? { ...coheeThread, messages: coheeMessages }
              : null,
            gptMessages,
            coheeMessages,
            codes,
            latestCode,
          };
        })
      );

      const gptThreads = chapterDetails
        .filter((detail) => detail.gptThread)
        .map(({ gptThread }) => gptThread);

      const coheeThreads = chapterDetails
        .filter((detail) => detail.coheeThread)
        .map(({ coheeThread }) => coheeThread);

      const gptMessages = chapterDetails.reduce<message[]>(
        (acc, { gptMessages }) => [...acc, ...gptMessages],
        []
      );

      const coheeMessages = chapterDetails.reduce<message[]>(
        (acc, { coheeMessages }) => [...acc, ...coheeMessages],
        []
      );

      const latestChapter =
        chapterDetails.length > 0 ? chapterDetails[0] : null;
      const latestCode = latestChapter && latestChapter.latestCode;

      return {
        lecture,
        chapters: chapterDetails.map(({ chapter, codes }) => ({
          ...chapter,
          codes,
        })),
        gptThreads,
        coheeThreads,
        gptMessages: gptMessages.map((msg) => ({
          ...msg,
          parsedContent: JSON.parse(msg.content ?? ""),
        })),
        coheeMessages: coheeMessages.map((msg) => ({
          ...msg,
          parsedContent: JSON.parse(msg.content ?? ""),
        })),
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
