// oauth login callback route
import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/utils/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  // "next"가 매개변수에 있으면 리디렉션 URL로 사용합니다.
  let next = searchParams.get("next") ?? "/";
  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // if the user doesn't have profile data yet, send them to the onboarding page
      const profile = await prisma.$transaction(async (prisma) => {
        return await prisma.profile.findFirst({
          where: {
            user: data.user.id,
          },
        });
      });
      if (!profile) {
        next = "/onboarding";
        // create a profile for the user
        await prisma.profile.create({
          data: {
            user: data.user.id,
            profile_image_url: data.user.user_metadata.avatar_url,
            name: data.user.user_metadata.full_name,
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

  // return the user to an error page with instructions
  // 사용자를 오류 페이지로 리디렉션하고 지침을 제공합니다.
  return NextResponse.redirect(
    `${origin}/login?message=${encodeURIComponent(
      "로그인에 실패했습니다. 다시 시도해주세요."
    )}`
  );
}
