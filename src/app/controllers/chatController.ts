import { ChatModel } from "@/app/models/chatModel";
import { MessageModel } from "@/app/models/messageModel";
import { Message } from "@/types";

export const ChatController = {
  async loadChats(user_id: string) {
    return await ChatModel.getAllChats(user_id);
  },

  async startNewChat(user_id: string, title?: string) {
    return await ChatModel.createChat(title || "New Chat", user_id);
  },

  async deleteChat(chat_id: string) {
    await ChatModel.deleteChat(chat_id);
  },

  async saveTitle(chat_id: string, title: string) {
    await ChatModel.updateTitle(chat_id, title);
  },

  async getMessages(chat_id: string) {
    return await MessageModel.getMessages(chat_id);
  },

  // In ChatController
  async sendMessage(
    chat_id: string,
    message: string,
    role: "user" | "bot",
    onStream?: (partialText: string) => void // callback for incremental text
  ) {
    const userMessage = await MessageModel.addMessage(chat_id, role, message);

    let botMessage = null;

    if (role === "user") {
      let replyText = "";

      try {
        if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
          const chatHistory = await MessageModel.getMessages(chat_id);

          const formattedHistory = chatHistory.map((msg: Message) => ({
            role: msg.role === "user" ? "user" : "model",
            parts: [{ text: msg.text || "" }],
          }));

          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contents: formattedHistory }),
            }
          );

          const data = await response.json();
          replyText =
            data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No reply.";

          // Stream the reply character by character (simulation)
          if (onStream) {
            for (let i = 1; i <= replyText.length; i++) {
              onStream(replyText.slice(0, i));
              await new Promise((r) => setTimeout(r, 20)); // adjust speed
            }
          }
        } else {
          replyText = `Echo: ${message}`;
          if (onStream) {
            onStream(replyText);
          }
        }

        botMessage = await MessageModel.addMessage(chat_id, "bot", replyText);
      } catch (err) {
        console.error("Gemini reply error:", err);
        botMessage = await MessageModel.addMessage(chat_id, "bot", "⚠️ Server error");
      }
    }

    return botMessage ? [userMessage, botMessage] : [userMessage];
  },
};