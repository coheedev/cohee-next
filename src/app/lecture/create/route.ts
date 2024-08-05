import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/utils/prisma";
import { redirect } from "next/navigation";
import { status, host_llm, message_role } from "@prisma/client";

// Define the constants
const INITIAL_MESSAGE_CONTENT = `
안녕하세요! 저는 코포자(코딩 포기자)의 마지막 희망, 코희 챗봇이에요.
저는 앞으로 여러분과 함께 [AI와 함께하는 웹개발 기초] 수업을 진행할거에요.
이번 챕터는 [음악 앨범 카드 개발하기: HTML 기초와 div 태그] 이에요.
자, 그럼 바로 실습 나갑니다. 
다음 스크린샷은 뮤직 웹앱의 [음악 앨범 카드]의 모습인데요, HTML, CSS를 활용하여 이 카드와 동일한 모습의 앨범 카드를 만들어보세요.
`;
const COHEE_FEEDBACK_GENERATOR = "036f3402-5ef0-4d4a-b6d6-200097e979bb";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      `${origin}/login?message=${encodeURIComponent("로그인을 먼저 해주세요.")}`
    );
  }
  const lectureInfoId = searchParams.get("id");
  let next = searchParams.get("next") ?? "/";

  if (lectureInfoId) {
    try {
      // Start a transaction
      const lecture = await prisma.$transaction(async (prisma) => {
        let lectureInfo = await prisma.lecture_info.findFirst({
          where: {
            id: lectureInfoId,
          },
        });
        // Check if lecture already exists
        let lecture = await prisma.lecture.findFirst({
          where: {
            owner: user.id,
            lecture_info: lectureInfoId,
          },
        });

        if (!lecture) {
          // Create lecture if it doesn't exist
          lecture = await prisma.lecture.create({
            data: {
              owner: user.id,
              lecture_info: lectureInfoId,
              status: status.IN_PROGRESS,
              start_date: new Date(
                new Date().getTime() + 9 * 60 * 60 * 1000
              ).toISOString(),
            },
          });
        }

        // Check if chapter already exists
        let chapter = await prisma.chapter.findFirst({
          where: {
            owner: user.id,
            lecture: lecture.id,
          },
        });

        if (!chapter) {
          // Create chapter if it doesn't exist
          chapter = await prisma.chapter.create({
            data: {
              owner: user.id,
              lecture: lecture.id,
              status: status.IN_PROGRESS,
              title: JSON.parse(lectureInfo?.chapter ?? "[]")[0].title,
            },
          });
        }

        // Check if GPT thread already exists
        let gptThread = await prisma.thread.findFirst({
          where: {
            owner: user.id,
            chapter: chapter.id,
            host_llm: host_llm.gpt,
          },
        });

        if (!gptThread) {
          // Create GPT thread if it doesn't exist
          gptThread = await prisma.thread.create({
            data: {
              owner: user.id,
              chapter: chapter.id,
              host_llm: host_llm.gpt,
            },
          });
        }

        // Check if Cohee thread already exists
        let coheeThread = await prisma.thread.findFirst({
          where: {
            owner: user.id,
            chapter: chapter.id,
            host_llm: host_llm.cohee,
          },
        });

        if (!coheeThread) {
          // Create Cohee thread if it doesn't exist
          coheeThread = await prisma.thread.create({
            data: {
              owner: user.id,
              chapter: chapter.id,
              host_llm: host_llm.cohee,
            },
          });

          // Add initial assistant message to the Cohee thread
          await prisma.message.create({
            data: {
              owner: user.id,
              thread: coheeThread.id,
              role: message_role.assistant,
              content: lectureInfo?.initial_message,
              llm_module: COHEE_FEEDBACK_GENERATOR,
            },
          });
        }

        return lecture;
      });

      return NextResponse.redirect(`${origin}/lecture/${lecture.id}`);
    } catch (error) {
      console.error("Error initializing data:", error);
      return NextResponse.redirect(
        `${origin}?message=${encodeURIComponent(
          "데이터 초기화에 실패했습니다. 다시 시도해주세요."
        )}`
      );
    }
  }

  // Return the user to an error page with instructions
  return redirect(
    `${origin}?message=${encodeURIComponent(
      "잘못된 접근입니다. 다시 시도해주세요."
    )}`
  );
}
