import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Providers } from "@/components/common/Provider";
import { Logo } from "@/components/common/Icon/Logo";
import { SearchIcon } from "@/components/common/Icon/SearchIcon";
import { NotificationIcon } from "@/components/common/Icon/NotificationIcon";
import { DashboardIcon } from "@/components/common/Icon/DashboardIcon";
import { RocketIcon } from "@/components/common/Icon/RocketIcon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SearchCommand } from "@/components/icons/searchcommand";
import { UserMenu } from "@/components/icons/UserMenu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserIcon } from "lucide-react";
import { CourseIcon } from "@/components/common/Icon/CourseIcon";
import { MyCourseIcon } from "@/components/common/Icon/MyCourseIcon";

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
        <Providers>
          <div className="flex flex-1 h-screen">
            <div className="flex flex-col w-[72px] items-center gap-10 pt-6 bg-white border-r border-slate-400 border-opacity-50">
              <Link href="/">
                <Logo />
              </Link>
              <div className="flex flex-col gap-6">
                <Link href="/">
                  <div className="px-5">
                    <DashboardIcon />
                  </div>
                </Link>
                <Link href="/">
                  <div className="px-5">
                    <CourseIcon />
                  </div>
                </Link>
                <Link href="/">
                  <div className="px-5">
                    <MyCourseIcon />
                  </div>
                </Link>
              </div>
            </div>
            <div className="flex flex-col flex-1">
              <div className="h-[64px] bg-white flex justify-end items-center pr-8 pl-5 shadow-lg border-b">
                <div className="flex items-center gap-4">
                  <Dialog>
                    <DialogTrigger>
                      <SearchIcon />
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Search</DialogTitle>
                        <DialogDescription>
                          Use the command menu to search or navigate.
                        </DialogDescription>
                      </DialogHeader>
                      <SearchCommand />
                    </DialogContent>
                  </Dialog>
                  <Popover>
                    <PopoverTrigger>
                      <NotificationIcon />
                    </PopoverTrigger>
                    <PopoverContent className="mr-2">
                      No notifications yet.
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger>
                      <UserMenu />
                    </PopoverTrigger>
                    <PopoverContent className="p-0">
                      <UserMenu />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex flex-1">
                <div className="flex flex-1">{children}</div>
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
