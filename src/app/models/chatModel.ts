// src/models/chatModel.ts
import { supabase } from "@/lib/supabaseClient";
import { Chat } from "@/types";

export const ChatModel = {
  async getAllChats(user_id: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from("chats")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as Chat[];
  },

  async createChat(title: string, user_id: string): Promise<Chat> {
    const { data, error } = await supabase
      .from("chats")
      .insert({ title, user_id })
      .select("*")
      .single();
    if (error) throw error;
    return data as Chat;
  },

  async updateTitle(chat_id: string, title: string) {
    const { error } = await supabase
      .from("chats")
      .update({ title })
      .eq("id", chat_id);
    if (error) throw error;
  },

  async deleteChat(chat_id: string) {
    const { error } = await supabase.from("chats").delete().eq("id", chat_id);
    if (error) throw error;
  },
};