// src/models/messageModel.ts
import { supabase } from "@/lib/supabaseClient";
import { Message } from "@/types";

export const MessageModel = {
  async addMessage(
    chat_id: string,
    role: "user" | "bot",
    text: string
  ): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chat_id,
        role: role,
        text: text,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error adding message:", error);
      throw error;
    }
    return data as Message;
  },

  async getMessages(chat_id: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chat_id)
      .order("created_at", { ascending: true }); 

    if (error) {
      console.error("Error fetching messages:", error);
      throw error;
    }
    return data as Message[];
  },
};
