import React, { useState, useEffect } from "react";
import { User, MeetingNote } from "../types";
import { formatIST } from "../utils";
import { Users, Send, CheckCircle2, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "../utils";

export function MeetingHubModule({ currentUser }: { currentUser: User }) {
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    let unsubscribe: () => void;
    const setupRealtime = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, orderBy, limit } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        const q = query(collection(db, "meetingNotes"), orderBy("date", "desc"), limit(20));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const data: any[] = [];
          snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
          setNotes(data);
          setLoading(false);
        });
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    setupRealtime();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;
    
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await addDoc(collection(db, "meetingNotes"), {
        title,
        content,
        date: new Date().toISOString(),
        authorId: currentUser.id,
        authorName: `${currentUser.firstName} ${currentUser.lastName}`,
        readReceipts: []
      });
      
      setTitle("");
      setContent("");
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const markAsRead = async (noteId: string) => {
    try {
      const { doc, updateDoc, arrayUnion } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "meetingNotes", noteId), { 
        readReceipts: arrayUnion(currentUser.id) 
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full max-h-[600px]">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-purple-600" />
            Meeting Hub
          </h3>
          <p className="text-xs text-gray-500 mt-1">Daily huddles & company announcements.</p>
        </div>
      </div>

      {(currentUser.role === 'Admin' || currentUser.role === 'HR') && (
        <form onSubmit={handlePost} className="p-4 border-b border-gray-100 bg-purple-50/30 space-y-3 shrink-0">
          <input
            required
            type="text"
            placeholder="Huddle Subject / Announcement Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <textarea
            required
            placeholder="Key takeaways, action items..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Send className="h-4 w-4" /> Broadcast
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        {loading ? (
          <div className="text-center text-sm text-gray-500 py-4">Loading huddles...</div>
        ) : notes.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-8">
            <MessageSquare className="h-8 w-8 mx-auto text-gray-300 mb-2" />
            No meeting notes published yet.
          </div>
        ) : (
          notes.map(note => {
            const hasRead = note.readReceipts?.includes(currentUser.id);
            
            return (
              <div key={note.id} className={cn(
                "bg-white border rounded-xl p-4 shadow-sm transition-all",
                hasRead ? "border-gray-200" : "border-purple-200 ring-1 ring-purple-100"
              )}>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-gray-900">{note.title}</h4>
                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
                    {formatIST(note.date, "MMM d, p")}
                  </span>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap mb-4">
                  {note.content}
                </div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                  <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-[10px]">
                      {note.authorName.charAt(0)}
                    </div>
                    {note.authorName}
                  </div>
                  
                  {currentUser.role === 'Employee' ? (
                    <button
                      onClick={() => !hasRead && markAsRead(note.id)}
                      disabled={hasRead}
                      className={cn(
                        "text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors",
                        hasRead 
                          ? "bg-gray-100 text-gray-500 cursor-default"
                          : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                      )}
                    >
                      {hasRead ? <><CheckCircle2 className="h-3.5 w-3.5" /> Acknowledged</> : "Mark as Read"}
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">
                      <span className="font-semibold text-purple-600">{note.readReceipts?.length || 0}</span> reads
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
