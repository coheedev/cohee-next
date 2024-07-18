"use client";
import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";

interface CoheeThreadProps {
  coheeMessageContent: { content: string; type: string }[];
}

export function CoheeThread({ coheeMessageContent }: CoheeThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [coheeMessageContent]);

  return (
    <div className="flex flex-col overflow-hidden h-[485px] w-full">
      <div className="flex flex-col justify-start items-start gap-2 overflow-scroll flex-1">
        {coheeMessageContent.map((contentItem, contentIndex) => {
          if (!contentItem) return null;
          return (
            <MessageBubble
              key={contentIndex}
              className="bg-white text-black"
              type={contentItem?.type}
            >
              {contentItem?.content}
            </MessageBubble>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
