// signup, email magic link confirmatiom route
import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/utils/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (token_hash && type) {
    const supabase = createClient();

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data?.user) {
      // if the user doesn't have profile data yet, send them to the onboarding page
      const profile = await prisma.$transaction(async (prisma) => {
        return await prisma.profile.findFirst({
          where: {
            user: data.user?.id,
          },
        });
      });
      if (!profile) {
        // create a profile for the user
        await prisma.profile.create({
          data: {
            user: data.user.id,
          },
        });
      }
      const forwardedHost = request.headers.get("x-forwarded-host"); // original origin before load balancer // 로드 밸런서 이전의 원래 원본
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        // 로드 밸런서가 중간에 없다는 것을 확신할 수 있으므로 X-Forwarded-Host를 주시할 필요가 없습니다.
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // redirect the user to an error page with some instructions
  redirect(
    `/login?message=${encodeURIComponent(
      "이메일 인증에 실패했습니다. 다시 시도해주세요."
    )}`
  );
}
