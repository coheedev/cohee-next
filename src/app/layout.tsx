import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/common/Provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "코희 | AI에게 배우는 AI로 코딩하기",
  description: "AI에게 배우는 AI로 코딩하기",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
