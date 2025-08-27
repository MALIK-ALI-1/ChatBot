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
      // First, display the user's message immediately
      const userMessage: Message = {
        id: crypto.randomUUID(), // Use a UUID for a unique key
        role: "user",
        text: userMessageText,
        created_at: new Date().toISOString(),
      };

      const updatedChatWithUserMessage = {
        ...selectedChat,
        title: newTitle,
        messages: [...(selectedChat.messages ?? []), userMessage],
      };

      setSelectedChat(updatedChatWithUserMessage);
      setChats(prevChats => prevChats.map(c => c.id === updatedChatWithUserMessage.id ? updatedChatWithUserMessage : c));
      setInput("");

      // Now, call the controller to save the user message and get the bot reply
      const botMessages = await ChatController.sendMessage(
        selectedChat.id,
        userMessageText,
        "user",
        (partialText) => {
          // Update the state with the streaming bot message
          setSelectedChat(prevChat => {
            if (!prevChat) return null;
            const lastMessage = prevChat.messages[prevChat.messages.length - 1];
            const isBotMessage = lastMessage.role === 'bot';

            if (isBotMessage) {
              lastMessage.text = partialText;
              return { ...prevChat, messages: [...prevChat.messages.slice(0, -1), lastMessage] };
            } else {
              const botMessage: Message = {
                id: crypto.randomUUID(),
                role: "bot",
                text: partialText,
                created_at: new Date().toISOString(),
              };
              return { ...prevChat, messages: [...prevChat.messages, botMessage] };
            }
          });
        }
      );

      // After streaming is complete, get the final message list from the database
      // and update the local state with the complete chat data.
      const finalChat = await ChatController.getMessages(selectedChat.id);
      setSelectedChat({ ...selectedChat, messages: finalChat, title: newTitle });
      setChats(prevChats => prevChats.map(c => c.id === selectedChat.id ? { ...c, messages: finalChat, title: newTitle } : c));


      if (isNewChat) {
        await ChatController.saveTitle(selectedChat.id, newTitle);
        setChats(prevChats => prevChats.map(c => c.id === selectedChat.id ? { ...c, title: newTitle } : c));
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
      setChats(prevChats => prevChats.map(c => c.id === selectedChat.id ? updatedChatWithError : c));
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
