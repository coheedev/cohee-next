"use client";
import React, { useState } from "react";
import { cn } from "@/utils/shadcn/utils";
import { SideNav } from "@/components/layout/side-nav";
import { type NavItem } from "@/components/layout/side-nav";
import { useSidebar } from "@/hooks/useSidebar";
import {
  User,
  ReceiptText,
  TicketCheck,
  FileText,
  ChevronsLeft,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const NavItems: NavItem[] = [
  {
    title: "프로필",
    icon: User,
    href: "/profile",
    color: "text-slate-500",
  },
  {
    title: "구독 관리",
    icon: ReceiptText,
    href: "/subscription",
    color: "text-slate-500",
  },
  {
    title: "레퍼럴 관리",
    icon: TicketCheck,
    href: "/referral",
    color: "text-slate-500",
  },
  {
    title: "개인정보처리방침",
    icon: FileText,
    href: "/privacy",
    color: "text-slate-500",
  },
  {
    title: "이용약관",
    icon: FileText,
    href: "/terms",
    color: "text-slate-500",
  },
];

export function Sidebar({ className }: SidebarProps) {
  const { isOpen, toggle } = useSidebar();
  const [status, setStatus] = useState(false);

  const handleToggle = () => {
    setStatus(true);
    toggle();
    setTimeout(() => setStatus(false), 500);
  };

  return (
    <nav
      className={cn(
        `relative hidden h-screen border-r md:block`,
        status && "duration-500",
        isOpen ? "w-48" : "w-[64px]",
        className
      )}
    >
      <ChevronsLeft
        className={cn(
          "absolute -right-3 top-10 cursor-pointer rounded-full border bg-background text-3xl text-foreground",
          !isOpen && "rotate-180"
        )}
        onClick={handleToggle}
      />
      <div className="space-y-4 py-16">
        <div className="px-3 py-2">
          <div className="space-y-1">
            <SideNav
              itemTitleClassName="text-background opacity-0 transition-all duration-300 group-hover:z-50 group-hover:ml-0 group-hover:rounded group-hover:bg-foreground group-hover:p-1 group-hover:opacity-100 group-hover:text-slate-300 group-hover:text-sm"
              items={NavItems}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}
