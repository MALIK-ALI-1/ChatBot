// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Chat, Message } from "@/types";
import { ChatController } from "@/app/controllers/chatController";
import Sidebar from "@/components/sideBar";
import ChatWindow from "@/components/ChatWindow";
import ChatInput from "@/components/ChatInput";

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [tempTitles, setTempTitles] = useState<{ [key: string]: string }>({});

  const USER_ID = "guest";

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const allChats = await ChatController.loadChats(USER_ID);
        setChats(allChats);

        if (allChats.length > 0) {
          const firstChat = allChats[0];
          await handleChatSelect(firstChat.id);
        }
      } catch (error) {
        console.error("Failed to load chats:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleChatSelect = async (chatId: string) => {
    setLoading(true);
    try {
      const messages = await ChatController.getMessages(chatId);
      const chatToSelect = chats.find(c => c.id === chatId);
      if (chatToSelect) {
        setSelectedChat({ ...chatToSelect, messages });
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = async () => {
    setLoading(true);
    try {
      const newChat = await ChatController.startNewChat(USER_ID, "Untitled Chat");
      setChats([newChat, ...chats]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error("Failed to start new chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await ChatController.deleteChat(chatId);
      setChats(chats.filter((c) => c.id !== chatId));
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const saveTitle = async (chatId: string) => {
    const newTitle = tempTitles[chatId]?.trim();
    if (!newTitle) {
      setEditingChatId(null);
      return;
    }
    try {
      await ChatController.saveTitle(chatId, newTitle);
      const updatedChats = chats.map(c => c.id === chatId ? { ...c, title: newTitle } : c);
      setChats(updatedChats);
      if (selectedChat?.id === chatId) {
        setSelectedChat({ ...selectedChat, title: newTitle });
      }
    } catch (error) {
      console.error("Failed to save title:", error);
    } finally {
      setEditingChatId(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedChat || loading) return;
    setLoading(true);

    const userMessageText = input;
    const isNewChat = selectedChat.title === "Untitled Chat";
    const newTitle = isNewChat ? userMessageText.slice(0, 30) : selectedChat.title;

    try {
      const userMessage: Message = {
        id: Date.now().toString() + "_user",
        role: "user",
        text: userMessageText,
        created_at: new Date().toISOString(),
      };

      const updatedChatBase = {
        ...selectedChat,
        title: newTitle,
        messages: [...(selectedChat.messages ?? []), userMessage],
      };

      setSelectedChat(updatedChatBase);
      setChats(chats.map(c => c.id === updatedChatBase.id ? updatedChatBase : c));
      setInput("");

      const botMessage: Message = {
        id: Date.now().toString() + "_bot",
        role: "bot",
        text: "",
        created_at: new Date().toISOString(),
      };

      let streamingChat = { ...updatedChatBase, messages: [...updatedChatBase.messages, botMessage] };
      setSelectedChat(streamingChat);
      setChats(chats.map(c => c.id === streamingChat.id ? streamingChat : c));

      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: userMessageText }] }],
            }),
          }
        );

        const data = await response.json();
        const fullText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No reply.";

        for (let i = 0; i < fullText.length; i++) {
          botMessage.text += fullText[i];
          streamingChat = {
            ...streamingChat,
            messages: [...streamingChat.messages.slice(0, -1), botMessage],
          };
          setSelectedChat({ ...streamingChat });
          setChats(chats.map(c => c.id === streamingChat.id ? streamingChat : c));
          await new Promise(res => setTimeout(res, 20));
        }
      } else {
        botMessage.text = `Echo: ${userMessageText}`;
        streamingChat = { ...streamingChat, messages: [...streamingChat.messages.slice(0, -1), botMessage] };
        setSelectedChat(streamingChat);
        setChats(chats.map(c => c.id === streamingChat.id ? streamingChat : c));
      }

      if (isNewChat) {
        await ChatController.saveTitle(selectedChat.id, newTitle);
        const updatedChats = chats.map(c => c.id === selectedChat.id ? { ...c, title: newTitle } : c);
        setChats(updatedChats);
      }

    } catch (error) {
      console.error("Failed to send message:", error);
      const botMessageError: Message = {
        id: Date.now().toString() + "_bot_error",
        role: "bot",
        text: "⚠️ An error occurred while fetching response.",
        created_at: new Date().toISOString(),
      };
      const updatedChatWithError = { ...selectedChat, messages: [...(selectedChat.messages ?? []), botMessageError] };
      setSelectedChat(updatedChatWithError);
      setChats(chats.map(c => c.id === selectedChat.id ? updatedChatWithError : c));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        chats={chats}
        selectedChatId={selectedChat?.id}
        editingChatId={editingChatId}
        tempTitles={tempTitles}
        setEditingChatId={setEditingChatId}
        setTempTitles={setTempTitles}
        saveTitle={saveTitle}
        setSelectedChat={handleChatSelect}
        deleteChat={deleteChat}
        startNewChat={startNewChat}
      />

      <div className="flex-1 flex flex-col bg-emerald-50">
        <ChatWindow selectedChat={selectedChat} />
        {selectedChat && (
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}
