import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";

export default async function EmailVerification({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // 3초 기다렸다가 넘어가기
    // return redirect("/");
  }

  return (
    <section className="flex flex-1 flex-col justify-center items-center relative">
      <Image src="/images/cohee-logo.png" alt="Logo" width={200} height={100} />
      <h3 className="text-3xl font-bold mt-4">
        이메일 인증을 완료하고 회원가입을 마무리해주세요 💌
      </h3>
      <div className="absolute bottom-0 left-0 w-2/5 h-48">
        <Image src="/images/cohee-background.png" alt="Illustration" fill />
      </div>
    </section>
  );
}
