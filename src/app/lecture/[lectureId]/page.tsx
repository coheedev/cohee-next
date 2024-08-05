import { redirect, RedirectType } from "next/navigation";
import LectureLayout from "./LectureLayout";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/utils/prisma";
import { revalidatePath } from "next/cache";

export default async function Page({
  params,
}: {
  params: { lectureId: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    revalidatePath("/");
    redirect(
      `/login?message=${encodeURIComponent("로그인을 먼저 해주세요.")}`,
      RedirectType.push
    );
  }

  let lecture;

  lecture = await prisma.lecture.findUnique({
    where: { id: params.lectureId, owner: user.id },
  });

  if (!lecture) {
    revalidatePath("/");
    redirect(
      `/?message=${encodeURIComponent("해당 강의 권한이 없습니다.")}`,
      RedirectType.push
    );
  }
  // revalidatePath("/");
  // redirect(`/?message=${encodeURIComponent("강의를 확인해주세요.")}`);

  return (
    <main className="flex flex-1 bg-[#F3F7FA]">
      <LectureLayout lectureId={params.lectureId} />
    </main>
  );
}
