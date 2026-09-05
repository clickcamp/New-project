import React, { useEffect, useState } from "react";
import { User, ClientAccount } from "../types";
import { 
  CheckCircle, XCircle, Search, Filter, Phone, MessageSquare, 
  Lock, Clock, AlertCircle, FileText, ChevronRight
} from "lucide-react";
import { cn, formatIST } from "../utils";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";

export function OperationsDashboard({ currentUser, users }: { currentUser: User, users: User[] }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<"Pending Verification" | "Verified" | "Rejected">("Pending Verification");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Panel
  const [selectedAccount, setSelectedAccount] = useState<ClientAccount | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockingError, setLockingError] = useState("");

  useEffect(() => {
    const q = query(collection(db, "clientAccounts"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientAccount));
      // sort by date descending
      data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      setAccounts(data);
      setLoading(false);
      
      // Update selected account if it changes
      if (selectedAccount) {
        const updated = data.find(a => a.id === selectedAccount.id);
        if (updated) setSelectedAccount(updated);
      }
    });
    return () => unsub();
  }, []);

  const filteredAccounts = accounts.filter(a => {
    if (a.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.clientName.toLowerCase().includes(q) ||
        a.submittedByName.toLowerCase().includes(q) ||
        (a.platform && a.platform.toLowerCase().includes(q)) ||
        (a.clientPhone && a.clientPhone.includes(q)) ||
        (a.referenceId && a.referenceId.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenPanel = async (acc: ClientAccount) => {
    if (acc.lockedBy && acc.lockedBy !== currentUser.id && acc.status === "Pending Verification") {
      setLockingError(`Currently being reviewed by ${acc.lockedByName}`);
      setTimeout(() => setLockingError(""), 3000);
      return;
    }
    
    setSelectedAccount(acc);
    setRejectReason("");
    
    if (acc.status === "Pending Verification" && acc.lockedBy !== currentUser.id) {
      try {
        await updateDoc(doc(db, "clientAccounts", acc.id), {
          lockedBy: currentUser.id,
          lockedByName: currentUser.firstName + " " + currentUser.lastName,
          lockedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Lock error", e);
      }
    }
  };

  const handleClosePanel = async () => {
    if (selectedAccount && selectedAccount.status === "Pending Verification" && selectedAccount.lockedBy === currentUser.id) {
      try {
        await updateDoc(doc(db, "clientAccounts", selectedAccount.id), {
          lockedBy: null,
          lockedByName: null,
          lockedAt: null
        });
      } catch (e) {
        console.error("Unlock error", e);
      }
    }
    setSelectedAccount(null);
  };


  const logActivity = async (action: string, entityId: string, entityType: 'Lead' | 'ClientAccount', details?: string) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "activityLogs"), {
        action,
        entityId,
        entityType,
        performedBy: currentUser.id,
        performedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: new Date().toISOString(),
        details
      });
    } catch(e) { console.error(e); }
  };

  const handleAction = async (action: "Verified" | "Rejected") => {
    if (!selectedAccount) return;
    if (action === "Rejected" && !rejectReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "clientAccounts", selectedAccount.id), {
        status: action,
        reviewedBy: currentUser.id,
        reviewedByName: currentUser.firstName + " " + currentUser.lastName,
        reviewNotes: action === "Rejected" ? rejectReason : "Verified successfully",
        verifiedAt: new Date().toISOString(),
        lockedBy: null,
        lockedByName: null,
        lockedAt: null
      });
      await logActivity(`${action === 'Verified' ? 'approved' : 'rejected'} account ${selectedAccount.clientName}`, selectedAccount.id, 'ClientAccount', action === 'Rejected' ? rejectReason : '');
      setSelectedAccount(null);
    } catch (e) {
      console.error(e);
      alert("Failed to update status");
    }
    setIsSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Queue...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto flex flex-col h-[calc(100vh-100px)]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <CheckCircle className="text-emerald-500" />
            Global Verification Queue
          </h2>
          <p className="text-gray-400 mt-1">Review and verify Demat accounts submitted by sales employees.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search client, platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111116] border border-white/10 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {lockingError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-lg text-sm shrink-0 flex items-center gap-2">
          <Lock className="w-4 h-4" /> {lockingError}
        </div>
      )}

      {/* High-density Table */}
      <div className="bg-[#111116] border border-white/10 rounded-xl shadow-2xl flex-1 overflow-hidden flex flex-col">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-2 border-b border-white/10 shrink-0">
          {(["Pending Verification", "Verified", "Rejected"] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                statusFilter === status 
                  ? "bg-white/10 text-white" 
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              )}
            >
              {status}
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-black/40">
                {accounts.filter(a => a.status === status).length}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-black/40 text-xs uppercase tracking-wider text-gray-400 sticky top-0 z-10 backdrop-blur-sm">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-white/5">Date</th>
                <th className="px-4 py-3 font-medium border-b border-white/5">Client</th>
                <th className="px-4 py-3 font-medium border-b border-white/5">Platform & Ref</th>
                <th className="px-4 py-3 font-medium border-b border-white/5">Submitted By</th>
                <th className="px-4 py-3 font-medium border-b border-white/5">Status</th>
                <th className="px-4 py-3 font-medium border-b border-white/5">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No accounts found in this view.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => (
                  <tr 
                    key={acc.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handleOpenPanel(acc)}
                  >
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {formatIST(acc.submittedAt, "MMM d, h:mm a")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{acc.clientName}</div>
                      <div className="text-xs text-gray-500">{acc.clientPhone || "No phone"}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-300">{acc.platform}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">
                        {acc.referenceId || acc.id.substring(0,8)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">
                      {acc.submittedByName}
                    </td>
                    <td className="px-4 py-3">
                      {acc.status === "Pending Verification" && acc.lockedBy && acc.lockedBy !== currentUser.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Lock className="w-3 h-3" />
                          Reviewing: {acc.lockedByName}
                        </span>
                      ) : (
                        <span className={cn(
                          "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider",
                          acc.status === "Verified" ? "bg-emerald-500/20 text-emerald-400" :
                          acc.status === "Rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-amber-500/20 text-amber-400"
                        )}>
                          {acc.status === "Pending Verification" ? "Pending" : acc.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button 
                        className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity font-medium text-xs flex items-center gap-1"
                      >
                        Review <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Panel (Slide-over) */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111116] w-full sm:w-[450px] h-full border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            
            <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-black/20">
              <h3 className="font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" /> 
                Verification Panel
              </h3>
              <button
                onClick={handleClosePanel}
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1.5 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              
              {/* Client Info */}
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedAccount.clientName}</h2>
                    <p className="text-gray-400">{selectedAccount.platform}</p>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 rounded text-xs font-bold uppercase",
                    selectedAccount.status === "Verified" ? "bg-emerald-500/20 text-emerald-400" :
                    selectedAccount.status === "Rejected" ? "bg-red-500/20 text-red-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {selectedAccount.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="text-gray-500 text-xs mb-1">Ref ID</div>
                    <div className="text-gray-200 font-mono">{selectedAccount.referenceId || "N/A"}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5">
                    <div className="text-gray-500 text-xs mb-1">Submitted By</div>
                    <div className="text-gray-200">{selectedAccount.submittedByName}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg border border-white/5 col-span-2">
                    <div className="text-gray-500 text-xs mb-1">Date Submitted</div>
                    <div className="text-gray-200">{formatIST(selectedAccount.submittedAt, "PPpp")}</div>
                  </div>
                </div>
              </div>

              {/* Direct Follow-Up Tools */}
              {selectedAccount.clientPhone && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" /> Client Follow-Up
                  </h4>
                  <div className="flex gap-2">
                    <a 
                      href={`https://wa.me/91${selectedAccount.clientPhone}?text=Hi ${encodeURIComponent(selectedAccount.clientName)}, we need additional details for your ${selectedAccount.platform} account verification.`}
                      target="_blank" rel="noreferrer"
                      className="flex-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                    <a 
                      href={`tel:${selectedAccount.clientPhone}`}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors"
                    >
                      <Phone className="w-4 h-4" /> Call Client
                    </a>
                  </div>
                </div>
              )}

              {/* Action Area */}
              {selectedAccount.status === "Pending Verification" ? (
                <div className="border-t border-white/10 pt-6 space-y-4">
                  <h4 className="text-sm font-bold text-gray-300">Verification Decision</h4>
                  
                  <div className="space-y-3">
                    <button
                      onClick={() => handleAction("Verified")}
                      disabled={isSubmitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="w-5 h-5" /> Approve Account
                    </button>
                    
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-4 space-y-3 mt-4">
                      <label className="text-xs font-semibold text-red-400 uppercase tracking-wider block">
                        Reject & Return to Employee
                      </label>
                      <select 
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full bg-black/40 border border-red-500/20 rounded-lg p-2.5 text-sm text-gray-200 focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Select Rejection Reason...</option>
                        <option value="Aadhaar Mismatch">Aadhaar Mismatch</option>
                        <option value="Signature Blurry">Signature Blurry</option>
                        <option value="OTP Pending">OTP Pending</option>
                        <option value="Bank Proof Rejected">Bank Proof Rejected</option>
                        <option value="Other">Other (Type below)</option>
                      </select>
                      
                      {rejectReason === "Other" && (
                        <textarea
                          placeholder="Type specific reason..."
                          className="w-full bg-black/40 border border-red-500/20 rounded-lg p-2 text-sm text-white"
                          rows={2}
                          onChange={(e) => setRejectReason(e.target.value)} // Note: in real app might want separate state for custom reason
                        />
                      )}
                      
                      <button
                        onClick={() => handleAction("Rejected")}
                        disabled={isSubmitting || !rejectReason}
                        className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-600/30 py-2.5 rounded-lg font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" /> Reject Account
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-t border-white/10 pt-6">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2">
                    <h4 className="text-sm font-bold text-gray-300">Audit Trail</h4>
                    <p className="text-xs text-gray-400 flex items-center justify-between">
                      <span>Reviewed By:</span>
                      <span className="text-white font-medium">{selectedAccount.reviewedByName || "Unknown"}</span>
                    </p>
                    <p className="text-xs text-gray-400 flex items-center justify-between">
                      <span>Date:</span>
                      <span className="text-white">{selectedAccount.verifiedAt ? formatIST(selectedAccount.verifiedAt, "PPpp") : "N/A"}</span>
                    </p>
                    {selectedAccount.reviewNotes && (
                      <div className="pt-2 mt-2 border-t border-white/5">
                        <span className="text-xs text-gray-500 block mb-1">Notes:</span>
                        <p className="text-sm text-gray-300">{selectedAccount.reviewNotes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
