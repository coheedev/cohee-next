"use client";
import React from "react";
import { MarkdownViewer } from "./MarkdownViewer";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  children: React.ReactNode;
  className?: string;
}

export function MessageBubble({ children, className }: MessageBubbleProps) {
  if (typeof children !== "string") {
    throw new Error("MessageBubble children should be a string");
  }

  return (
    <div
      className={cn(
        "rounded-3xl text-sm border shadow-sm px-4 py-2 bg-white",
        className
      )}
    >
      <MarkdownViewer content={children} />
    </div>
  );
}
