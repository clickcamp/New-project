import React, { useState } from "react";
import { User } from "../types";
import { ArrowLeft, Inbox, Send, Edit, Star, Search, Paperclip } from "lucide-react";
import { formatIST } from "../utils";

export function WebmailApp({ currentUser, onBack }: { currentUser: User, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [showCompose, setShowCompose] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col animate-in fade-in">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-red-500 text-white p-2 rounded-lg">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Webmail</h1>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-80">
            <Search className="w-4 h-4 text-gray-500" />
            <input type="text" placeholder="Search mail..." className="bg-transparent border-none focus:outline-none text-sm w-full" />
          </div>
          <img src="/logo.svg" alt="Click.camp Logo" className="h-8 w-auto object-contain hidden sm:block" />
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-200 bg-white p-4 hidden md:block">
          <button onClick={() => setShowCompose(true)} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors mb-6 shadow-sm">
            <Edit className="w-4 h-4" /> Compose
          </button>
          
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('inbox')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${activeTab === 'inbox' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><Inbox className="w-4 h-4" /> Inbox</div>
              <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold">2</span>
            </button>
            <button onClick={() => setActiveTab('starred')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${activeTab === 'starred' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><Star className="w-4 h-4" /> Starred</div>
            </button>
            <button onClick={() => setActiveTab('sent')} className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${activeTab === 'sent' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className="flex items-center gap-3"><Send className="w-4 h-4" /> Sent</div>
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-gray-500">
            <Inbox className="w-12 h-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Your inbox is empty</h3>
            <p className="text-sm">Messages sent to {currentUser.email || `${currentUser.firstName.toLowerCase()}@clickcamp.site`} will appear here.</p>
          </div>
        </div>
      </div>

      {showCompose && (
        <div className="fixed bottom-0 right-24 w-[500px] h-[500px] bg-white rounded-t-xl shadow-2xl border border-gray-200 flex flex-col z-50 animate-in slide-in-from-bottom-10">
          <div className="bg-gray-900 text-white px-4 py-3 rounded-t-xl flex justify-between items-center cursor-pointer">
            <span className="font-medium text-sm">New Message</span>
            <button onClick={() => setShowCompose(false)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <div className="flex-1 p-0 flex flex-col">
            <input type="text" placeholder="Recipients" className="border-b border-gray-200 px-4 py-2 focus:outline-none text-sm" />
            <input type="text" placeholder="Subject" className="border-b border-gray-200 px-4 py-2 focus:outline-none text-sm font-medium" />
            <textarea className="flex-1 p-4 focus:outline-none resize-none text-sm" placeholder="Write something..."></textarea>
          </div>
          <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center gap-4">
            <button onClick={() => setShowCompose(false)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Send</button>
            <button className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-200"><Paperclip className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
}
