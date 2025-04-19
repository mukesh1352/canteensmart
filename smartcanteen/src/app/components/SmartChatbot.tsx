"use client";

import { useState } from "react";
import { Send } from "lucide-react";

export default function SmartChatbot() {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = input;
    setMessages((prev) => [...prev, { from: "user", text: userMessage }]);
    setInput("");

    const res = await fetch("/api/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });
    const data = await res.json();
    const reply = data.reply || "Sorry, I didn’t get that.";

    setMessages((prev) => [...prev, { from: "bot", text: reply }]);
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white shadow-lg rounded-xl border flex flex-col max-h-[80vh]">
      <div className="bg-blue-600 text-white font-semibold text-center p-2 rounded-t-xl">
        Smart Canteen Chatbot
      </div>
      <div className="flex-1 p-2 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`my-1 text-sm ${msg.from === "user" ? "text-right" : "text-left"}`}>
            <span
              className={`inline-block px-3 py-1 rounded-xl ${
                msg.from === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {msg.text}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center p-2 border-t gap-2">
        <input
          type="text"
          placeholder="Ask me something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          className="flex-1 border rounded-full px-3 py-1 text-sm outline-none"
        />
        <button onClick={sendMessage} className="text-blue-600">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
