// /api/code/crete/route.ts
// 사람이 직접 수정한 코드를 추가하는 라우터입니다.

import { prisma } from "@/lib/prisma";
import { code_author } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

const OWNER_ID = "03f3ec0f-1cbb-438c-954a-4dfaa35c1ac5";

export async function POST(req: NextRequest) {
  const { chapterId, content, language } = await req.json();

  if (!chapterId || !content || !language) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (prisma) => {
      // Count the existing code entries for the chapter
      const codeCount = await prisma.code.count({
        where: { chapter: chapterId },
      });

      // Create the new code entry with the next version number
      const newCode = await prisma.code.create({
        data: {
          owner: OWNER_ID,
          chapter: chapterId,
          author: code_author.user,
          content,
          language,
          version: codeCount + 1,
        },
      });

      return newCode;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error creating code:", error);
    return NextResponse.json(
      { error: "Failed to create code" },
      { status: 500 }
    );
  }
}
