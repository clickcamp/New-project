import React, { useEffect, useState } from "react";
import { ActivityLog } from "../types";
import { Activity, Clock } from "lucide-react";
import { collection, query, onSnapshot, orderBy, limit, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatIST } from "../utils";

export function ActivityFeedWidget({ userIds }: { userIds?: string[] }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    if (userIds && userIds.length > 0) {
      // Chunk userIds to max 10
      const chunks = [];
      for (let i = 0; i < userIds.length; i += 10) {
        chunks.push(userIds.slice(i, i + 10));
      }
      
      chunks.forEach(chunk => {
        const q = query(
          collection(db, "activityLogs"),
          where("performedBy", "in", chunk)
        );
        unsubs.push(onSnapshot(q, (snap) => {
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
          setLogs(prev => {
            const filtered = prev.filter(l => !chunk.includes(l.performedBy));
            const newLogs = [...filtered, ...data].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return newLogs.slice(0, 50); // limit local state to 50
          });
          setLoading(false);
        }));
      });
    } else {
      // No userIds restriction, fetch global recent 50
      const q = query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(50));
      unsubs.push(onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog));
        setLogs(data);
        setLoading(false);
      }));
    }

    return () => unsubs.forEach(u => u());
  }, [userIds]);

  if (loading && logs.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 shrink-0">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          Pipeline Activity Feed
        </h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {logs.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">No recent activity</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm text-gray-900">
                  <span className="font-semibold">{log.performedByName}</span> {log.action}
                </div>
                {log.details && <div className="text-xs text-gray-600 mt-0.5">{log.details}</div>}
                <div className="text-[10px] text-gray-400 mt-1">{formatIST(log.timestamp, "MMM d, h:mm a")}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
