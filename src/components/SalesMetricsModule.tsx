import React, { useState, useEffect } from 'react';
import { User, ClientAccount } from '../types';
import { Trophy, TrendingUp, IndianRupee, Medal, Target } from 'lucide-react';
import { cn } from '../utils';

const BONUS_PER_ACCOUNT = 500; // Rs 500 per verified account

export function LeaderboardModule({ currentUser, users }: { currentUser: User, users: User[] }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub: () => void;
    const fetchAccounts = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        // current month filtering could be done client-side for simplicity
        const q = query(collection(db, "clientAccounts"), where("status", "==", "Verified"));
        unsub = onSnapshot(q, (snap) => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setAccounts(data);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchAccounts();
    return () => { if (unsub) unsub(); };
  }, []);

  if (loading) return <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl animate-pulse text-gray-500">Loading Leaderboard...</div>;

  // Filter for current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthAccounts = accounts.filter(acc => {
    const d = new Date(acc.submittedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Aggregate by user
  const stats: Record<string, number> = {};
  currentMonthAccounts.forEach(acc => {
    stats[acc.submittedBy] = (stats[acc.submittedBy] || 0) + 1;
  });

  const leaderboard = Object.entries(stats)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId);
      return {
        userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        count
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // top 5

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-gray-900 text-sm">Top Performers (This Month)</h3>
      </div>
      <div className="p-4 space-y-3">
        {leaderboard.length === 0 ? (
          <p className="text-xs text-gray-500 italic text-center py-4">No verified accounts this month yet.</p>
        ) : (
          leaderboard.map((entry, idx) => (
            <div key={entry.userId} className={cn(
              "flex items-center justify-between p-3 rounded-lg border",
              idx === 0 ? "bg-amber-50 border-amber-200 shadow-sm" : 
              idx === 1 ? "bg-gray-50 border-gray-200" :
              idx === 2 ? "bg-orange-50/50 border-orange-100" : "bg-white border-gray-100"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs",
                  idx === 0 ? "bg-amber-400 text-white" : 
                  idx === 1 ? "bg-gray-300 text-gray-700" :
                  idx === 2 ? "bg-orange-300 text-white" : "bg-gray-100 text-gray-500"
                )}>
                  {idx + 1}
                </div>
                <span className="font-semibold text-gray-800 text-sm">{entry.name}</span>
                {idx === 0 && <Medal className="h-4 w-4 text-amber-500" />}
              </div>
              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded text-xs font-bold border border-gray-100">
                <Target className="h-3 w-3 text-emerald-500" /> {entry.count}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}


export function IncentiveDashboard({ currentUser, targetUserId, users }: { currentUser: User, targetUserId?: string, users?: User[] }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // If Admin/HR views, they can pass targetUserId. Else employee views their own.
  const employeeId = targetUserId || currentUser.id;

  useEffect(() => {
    let unsub: () => void;
    const fetchAccounts = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        const q = query(collection(db, "clientAccounts"), where("submittedBy", "==", employeeId), where("status", "==", "Verified"));
        unsub = onSnapshot(q, (snap) => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setAccounts(data);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchAccounts();
    return () => { if (unsub) unsub(); };
  }, [employeeId]);

  if (loading) return <div className="h-32 flex items-center justify-center bg-gray-50 rounded-xl animate-pulse text-gray-500">Loading Earnings...</div>;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthAccounts = accounts.filter(acc => {
    const d = new Date(acc.submittedAt);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const verifiedCount = currentMonthAccounts.length;
  const estimatedEarnings = verifiedCount * BONUS_PER_ACCOUNT;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-emerald-50 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
          <IndianRupee className="h-5 w-5 text-emerald-600" />
          {targetUserId ? 'Employee Earnings' : 'Your Earnings'} (This Month)
        </h3>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-gray-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Verified Accounts</span>
          <div className="text-3xl font-black text-gray-900 tabular-nums flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-500" /> {verifiedCount}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Est. Commission</span>
          <div className="text-3xl font-black text-emerald-600 tabular-nums">
            ₹{estimatedEarnings.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
