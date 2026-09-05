import React, { useEffect, useState } from "react";
import { User, ClientAccount } from "../types";
import { CheckCircle, BarChart2 } from "lucide-react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export function OpsPerformanceWidget({ users }: { users: User[] }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const opsUsers = users.filter(u => u.role === "Operations");

  useEffect(() => {
    // get verified accounts today or recently
    const startOfToday = new Date();
    startOfToday.setHours(0,0,0,0);
    const isoStart = startOfToday.toISOString();

    // just fetch accounts that have verifiedAt today
    const q = query(
      collection(db, "clientAccounts"),
      where("verifiedAt", ">=", isoStart)
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data() as ClientAccount);
      setAccounts(data);
    });
    return () => unsub();
  }, []);

  if (opsUsers.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-emerald-600" />
        <h3 className="font-bold text-gray-900">Ops Performance (Today)</h3>
      </div>
      <div className="p-4 divide-y divide-gray-100">
        {opsUsers.map(ops => {
          const count = accounts.filter(a => a.reviewedBy === ops.id && a.status === "Verified").length;
          const rejectCount = accounts.filter(a => a.reviewedBy === ops.id && a.status === "Rejected").length;
          const total = count + rejectCount;
          return (
            <div key={ops.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
                  {ops.firstName[0]}{ops.lastName[0]}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{ops.firstName} {ops.lastName}</div>
                  <div className="text-xs text-gray-500">Verified: {count} • Rejected: {rejectCount}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-gray-900">{total}</div>
                <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Processed</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
