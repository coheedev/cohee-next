"use client";
import { SearchIcon, NotificationIcon } from "@/components/Icon";
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
import { Button } from "@/components/ui/button";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { LogIn, LogOut } from "lucide-react";
import { type User } from "@supabase/supabase-js";
import Link from "next/link";

export function TopNavbar({ user }: { user: User | null }) {
  return (
    <div className="h-[52px] bg-white flex justify-end items-center pr-8 pl-5 shadow-sm border-b">
      <div className="flex items-center gap-4">
        <Dialog>
          {/* Search */}
          <DialogTrigger>
            <SearchIcon />
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Are you absolutely sure?</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Popover>
          {/* Notification */}
          <PopoverTrigger>
            <NotificationIcon />
          </PopoverTrigger>
          <PopoverContent className="mr-2">
            Place content for the popover here.
          </PopoverContent>
        </Popover>
        <Menubar>
          {/* Profile */}
          <MenubarMenu>
            <MenubarTrigger transparent>
              <div className="h-7 w-7 rounded-full bg-slate-400"></div>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                {user ? (
                  <Link href="/logout">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </Link>
                ) : (
                  <Link href="/login" className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    로그인
                  </Link>
                )}
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  );
}
