// "use client";
import React from "react";
import Link from "next/link";
import { Logo, DashboardIcon, RocketIcon } from "@/components/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  ReceiptText,
  TicketCheck,
  FileText,
  LogIn,
  LogOut,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/(auth)/login/actions";
import { prisma } from "@/utils/prisma";

export async function LeftNavbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? await prisma.$transaction(async (prisma) => {
        return await prisma.profile.findFirst({
          where: {
            user: user.id,
          },
        });
      })
    : null;

  return (
    <div className="w-[72px] flex flex-col justify-between items-center py-6 bg-white border-r border-slate-400 border-opacity-50">
      <div className="flex flex-col gap-10 items-center">
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
              <RocketIcon />
            </div>
          </Link>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar>
            {user && profile && profile.profile_image_url ? (
              <AvatarImage src={profile.profile_image_url} alt={user.email} />
            ) : (
              <AvatarImage
                src="/images/default-profile.png"
                alt={`프로필 이미지`}
              />
            )}
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          {/* <div className="h-9 w-9 rounded-full bg-slate-400"></div> */}
        </DropdownMenuTrigger>
        {user ? <LoggedInDrowdownContent /> : <LoggedOutDrowdownContent />}
      </DropdownMenu>
    </div>
  );
}

function LoggedInDrowdownContent() {
  return (
    <DropdownMenuContent
      className="w-56"
      side="right"
      sideOffset={10}
      align="end"
      alignOffset={0}
      // className="flex flex-col gap-1"
    >
      <DropdownMenuItem asChild>
        <Link href="/profile">
          <User className="mr-3" size={16} strokeWidth={2} />
          프로필
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/subscription">
          <ReceiptText className="mr-3" size={16} strokeWidth={2} />
          구독
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link href="/referral">
          <TicketCheck className="mr-3" size={16} strokeWidth={2} />
          레퍼럴
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel>설정 더보기</DropdownMenuLabel>
      <DropdownMenuItem asChild className="justify-between">
        <Link href="/policy" target="_blank">
          <div className="flex">
            <FileText className="mr-3" size={16} strokeWidth={2} />
            서비스 약관
          </div>
          <ExternalLink size={16} strokeWidth={2} />
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="justify-between">
        <Link href="/privacy" target="_blank">
          <div className="flex">
            <FileText className="mr-3" size={16} strokeWidth={2} />
            개인정보처리방침
          </div>
          <ExternalLink size={16} strokeWidth={2} />
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild className="p-0">
        <form action={signOut} className="flex items-center">
          <Button className="bg-transparent w-full h-full  justify-start px-2 py-1.5 text-primary hover:text-white hover:bg-red-400">
            <LogOut className="mr-3" size={16} strokeWidth={2} />
            로그아웃
          </Button>
        </form>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
function LoggedOutDrowdownContent() {
  return (
    <DropdownMenuContent
      className="w-56"
      side="right"
      sideOffset={10}
      align="end"
      alignOffset={0}
    >
      <DropdownMenuItem asChild>
        <Link href="/login">
          <LogIn className="mr-3" size={16} strokeWidth={2} />
          로그인
        </Link>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
