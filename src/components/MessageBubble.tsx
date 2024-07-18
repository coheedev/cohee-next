"use client";
import React from "react";
import { MarkdownViewer } from "./MarkdownViewer";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface MessageBubbleProps {
  children: React.ReactNode;
  type: string;
  className?: string;
}

export function MessageBubble({
  children,
  className,
  type = "text",
}: MessageBubbleProps) {
  if (typeof children !== "string") {
    throw new Error("MessageBubble children should be a string");
  }
  if (type === "text") {
    return (
      <div
        className={cn(
          "rounded-xl border shadow-sm px-4 py-2 bg-white",
          className
        )}
      >
        <MarkdownViewer content={children} />
      </div>
    );
  } else if (type === "image") {
    return (
      <div
        className={cn(
          "rounded-xl text-xs border shadow-sm bg-white w-full h-full relative min-h-[200px]",
          className
        )}
      >
        <div className="relative w-full h-full">
          <Image
            key={children}
            src={children}
            alt="cohee-image"
            layout="fill"
            objectFit="contain"
          />
        </div>
      </div>
    );
  }
}
