import React, { useState, useEffect, useRef } from "react";
import { User } from "../types";
import { Send, ArrowLeft } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { formatIST } from "../utils";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export function ChatApp({ currentUser, onBack }: { currentUser: User, onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to same host/port automatically since we're serving from the same Express instance
    socketRef.current = io();

    socketRef.current.on("chat_history", (history: ChatMessage[]) => {
      setMessages(history);
    });

    socketRef.current.on("new_message", (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    socketRef.current?.emit("send_message", {
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.lastName}`,
      text: inputText.trim()
    });
    
    setInputText("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Company Chat</h1>
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
              Live Server Connection
            </p>
          </div>
        </div>
        <img src="/logo.svg" alt="Click.camp Logo" className="h-8 w-auto object-contain hidden sm:block" />
      </header>

      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col overflow-hidden">
        <div className="flex-1 bg-white border border-gray-200 rounded-t-xl shadow-sm p-4 overflow-y-auto flex flex-col gap-4">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUser.id;
              return (
                <div key={msg.id} className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  <span className="text-[10px] text-gray-500 mb-1 px-1">{msg.senderName} • {formatIST(msg.timestamp, 'HH:mm')}</span>
                  <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="bg-white border-x border-b border-gray-200 rounded-b-xl shadow-sm p-3">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message..." 
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button type="submit" disabled={!inputText.trim()} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
