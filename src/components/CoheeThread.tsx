"use client";
import React, { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { Message } from "@/types/types";

interface CoheeThreadProps {
  coheeMessages: Message[];
}

export function CoheeThread({ coheeMessages }: CoheeThreadProps) {
  // console.log(coheeMessage);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [coheeMessages]);

  return (
    <div className="flex flex-col overflow-hidden h-[485px] w-full">
      <div className="flex flex-col justify-start items-start gap-2 overflow-scroll flex-1">
        {coheeMessages.map((message) =>
          message.parsedContent.map((contentItem, contentIndex) => (
            <MessageBubble
              key={`${message.id}-${contentIndex}`}
              className="bg-white text-black"
              type={contentItem.type}
            >
              {contentItem.content}
            </MessageBubble>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
