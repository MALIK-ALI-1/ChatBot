"use client";

import { Dispatch, SetStateAction, useRef, KeyboardEvent, useEffect } from "react";

interface Props {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  sendMessage: () => Promise<void>;
  loading: boolean;
}

export default function ChatInput({ input, setInput, sendMessage, loading }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    resizeTextarea(); // Resize on input change
  }, [input]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    resizeTextarea();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!loading && input.trim()) sendMessage();
    }
  };

  return (
    <div className="p-3 md:p-4 border-t bg-white">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          rows={1}
          disabled={loading}
          className="flex-1 resize-none border rounded-xl p-3 pr-12 focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-100 transition-all duration-100"
          style={{ maxHeight: "150px" }}
        />
        <button
          onClick={() => !loading && input.trim() && sendMessage()}
          disabled={loading || !input.trim()}
          className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4l-3 3 3 3h-4z"
              ></path>
            </svg>
          ) : (
            "➤"
          )}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Press <b>Enter</b> to send, <b>Shift+Enter</b> for new line
      </p>
    </div>
  );
}
