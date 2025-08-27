"use client";

import { Chat } from "@/types";
import { Dispatch, SetStateAction, useState } from "react";
import ChatList from "./ChatList";

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
  startNewChat: () => Promise<void>;
}

export default function Sidebar({
  chats,
  selectedChatId,
  editingChatId,
  tempTitles,
  setEditingChatId,
  setTempTitles,
  saveTitle,
  setSelectedChat,
  deleteChat,
  startNewChat,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:flex">
      {/* Hamburger for mobile only */}
      <div className="md:hidden flex items-center p-2 bg-emerald-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"
        >
          ☰
        </button>
      </div>

      {/* Sidebar chat list */}
      <div
        className={`
      w-64 bg-gradient-to-b from-emerald-200 to-emerald-400 p-4 text-black overflow-y-auto overflow-x-hidden
      ${isOpen ? "block" : "hidden"} md:block
    `}
      >
        {/* New Chat button for desktop only */}
        <div className="hidden md:block mb-4">
          <button
            onClick={startNewChat}
            className="w-full p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            ➕ New Chat
          </button>
        </div>

        <ChatList
          chats={chats}
          selectedChatId={selectedChatId}
          editingChatId={editingChatId}
          tempTitles={tempTitles}
          setEditingChatId={setEditingChatId}
          setTempTitles={setTempTitles}
          saveTitle={saveTitle}
          setSelectedChat={setSelectedChat}
          deleteChat={deleteChat}
        />
      </div>
    </div>
  );
}
