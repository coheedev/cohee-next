import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Provider";
import { LeftNavbar } from "@/components/layout/left-navbar";
import { createClient } from "@/utils/supabase/server";
import { ToastAlert } from "@/components/layout/toast-alert";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "코희 | AI에게 배우는 AI로 코딩하기",
  description: "AI에게 배우는 AI로 코딩하기",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <div className="flex flex-1 h-screen">
            <LeftNavbar />
            <div className="flex flex-col flex-1">
              <div className="flex flex-1 w-full">{children}</div>
            </div>
            <ToastAlert />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
