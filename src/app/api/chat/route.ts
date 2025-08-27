import { NextResponse } from "next/server";
import { ChatController } from "@/app/controllers/chatController";

export const runtime = "edge"; // For Vercel Edge functions, required for streaming

export async function POST(req: Request) {
  try {
    const { chat_id, message } = await req.json();

    if (!chat_id || !message) {
      return NextResponse.json(
        { error: "chat_id and message are required" },
        { status: 400 }
      );
    }

    const readableStream = new ReadableStream({
      async start(controller) {
        // This is a placeholder for the stream
        await ChatController.sendMessage(chat_id, message, "user", (chunk) => {
          controller.enqueue(chunk);
        });
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (err) {
    console.error("API /chat error:", err);
    return NextResponse.json({ error: "⚠️ Server error" }, { status: 500 });
  }
}