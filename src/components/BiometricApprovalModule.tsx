import React, { useState, useEffect } from "react";
import { User } from "../types";
import { Fingerprint, Check, X } from "lucide-react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export function BiometricApprovalModule() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPending = async () => {
    try {
      const q = query(collection(db, "users"), where("face_status", "==", "pending"));
      const snap = await getDocs(q);
      setPendingUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveBiometric = async (userId: string) => {
    setLoading(true);
    try {
      await fetch('/api/biometric/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      fetchPending();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (pendingUsers.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Fingerprint className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Pending Biometric Approvals</h3>
            <p className="text-sm text-gray-500">Manual admin verification required for Face ID</p>
          </div>
        </div>
      </div>
      
      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
      
      <div className="space-y-3">
        {pendingUsers.map(u => (
          <div key={u.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div>
              <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
              <p className="text-sm text-gray-500">{u.email} ({u.role})</p>
            </div>
            <button
              onClick={() => approveBiometric(u.id)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              Approve
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
