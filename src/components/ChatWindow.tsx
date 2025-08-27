"use client";

import { Chat } from "@/types";
import { useRef, useEffect } from "react";

interface Props {
  selectedChat: Chat | null;
}

export default function ChatWindow({ selectedChat }: Props) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedChat?.messages]);

  const messages = selectedChat?.messages || [];

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 bg-emerald-50">
      {messages.length > 0 ? (
        messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-xl break-words whitespace-pre-wrap w-fit max-w-[75%] 
              ${msg.role === "user"
                ? "bg-emerald-200 self-end text-right ml-auto"
                : "bg-white border border-emerald-300 self-start"
              }`}
          >
            {msg.text.replace(/\*+/g, "")}
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center mt-4">
          {selectedChat
            ? "No messages yet. Start the conversation!"
            : "Select a chat or start a new one"}
        </p>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
