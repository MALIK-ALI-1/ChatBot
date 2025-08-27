export interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  created_at: string;
}

export interface Chat {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
}
