import { NextResponse } from "next/server";
import { ChatController } from "@/app/controllers/chatController";

export async function POST(req: Request) {
  try {
    const { chat_id, message } = await req.json();

    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "chat_id and message are required" },
        { status: 400 }
      );
    }

    // ➡️ Corrected: Get both messages from the controller
    const messages = await ChatController.sendMessage(chat_id, message, "user");

    // ➡️ Corrected: Return the complete messages array
    return NextResponse.json({ messages });
  } catch (err) {
    console.error("API /chat error:", err);
    return NextResponse.json({ error: "⚠️ Server error" }, { status: 500 });
  }
}