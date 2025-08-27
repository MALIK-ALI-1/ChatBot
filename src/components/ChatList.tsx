"use client";

import { Chat } from "@/types";
import { Dispatch, SetStateAction, useRef, useState, useEffect } from "react";

interface Props {
  chats: Chat[];
  selectedChatId?: string | null;
  editingChatId?: string | null;
  tempTitles: { [key: string]: string };
  setEditingChatId: Dispatch<SetStateAction<string | null>>;
  setTempTitles: Dispatch<SetStateAction<{ [key: string]: string }>>;
  saveTitle: (chatId: string) => void;
  setSelectedChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => void;
}

export default function ChatList({
  chats,
  selectedChatId,
  editingChatId,
  tempTitles,
  setEditingChatId,
  setTempTitles,
  saveTitle,
  setSelectedChat,
  deleteChat,
}: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 w-full md:w-64">
      {chats.map((chat) => {
        const isEditing = editingChatId === chat.id;

        return (
          <div
            key={chat.id}
            className={`group relative flex items-center p-2 rounded-lg cursor-pointer transition-colors duration-200
              ${selectedChatId === chat.id ? "bg-emerald-700 text-white" : "bg-emerald-100 hover:bg-emerald-200"}`}
          >
            {isEditing ? (
              <input
                type="text"
                value={tempTitles[chat.id] ?? chat.title ?? ""}
                onChange={(e) => setTempTitles({ ...tempTitles, [chat.id]: e.target.value })}
                onBlur={() => saveTitle(chat.id)}
                onKeyDown={(e) => e.key === "Enter" && saveTitle(chat.id)}
                autoFocus
                className="flex-1 bg-transparent border-b border-emerald-400 focus:outline-none truncate"
              />
            ) : (
              <div onClick={() => setSelectedChat(chat.id)} className="flex-1 truncate">
                {chat.title || "Untitled Chat"}
              </div>
            )}

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === chat.id ? null : chat.id);
                }}
                className="p-1 rounded-full hover:bg-emerald-300 dark:hover:bg-emerald-600
                           opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
              >
                •••
              </button>

              {activeMenu === chat.id && (
                <div className="absolute right-0 md:right-auto md:left-full mt-2 w-40 bg-white dark:bg-emerald-800 rounded-md shadow-lg py-1 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingChatId(chat.id);
                      setTempTitles({ ...tempTitles, [chat.id]: chat.title || "" });
                      setActiveMenu(null);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Edit name
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
                  >
                    Delete chat
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
