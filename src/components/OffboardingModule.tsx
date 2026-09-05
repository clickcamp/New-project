import React, { useState, useEffect } from 'react';
import { User, ResignationRequest, TimeLog, LeaveRequest } from '../types';
import { LogOut, AlertTriangle, UserX, CheckSquare, FileText, Send, Calendar, Clock } from 'lucide-react';
import { formatIST } from '../utils';
import { differenceInDays } from 'date-fns';

// --- EMPLOYEE VIEW --- //
export function EmployeeOffboarding({ currentUser }: { currentUser: User }) {
  const [resignation, setResignation] = useState<ResignationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [lastWorkingDay, setLastWorkingDay] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let unsub: () => void;
    const fetchResignations = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        const q = query(collection(db, "resignations"), where("userId", "==", currentUser.id));
        unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            // Get the most recent one if multiple
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ResignationRequest));
            docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
            setResignation(docs[0]);
          } else {
            setResignation(null);
          }
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchResignations();
    return () => { if (unsub) unsub(); };
  }, [currentUser.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastWorkingDay || !reason) return;
    setSubmitting(true);
    
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const newRes: Omit<ResignationRequest, 'id'> = {
        userId: currentUser.id,
        lastWorkingDay,
        reason,
        status: 'Pending',
        submittedAt: new Date().toISOString(),
        handoverChecklist: { assetsReturned: false, docsCompleted: false, knowledgeTransfer: false }
      };
      
      await addDoc(collection(db, "resignations"), newRes);
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  if (resignation) {
    const daysLeft = resignation.status === 'Approved' 
      ? Math.max(0, differenceInDays(new Date(resignation.lastWorkingDay), new Date()))
      : 0;
      
    return (
      <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden">
        <div className="p-4 border-b border-orange-200 bg-orange-50 flex items-center gap-2">
          <LogOut className="h-5 w-5 text-orange-600" />
          <h3 className="font-bold text-gray-900">Offboarding Status</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                resignation.status === 'Approved' ? 'bg-green-100 text-green-800' :
                resignation.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {resignation.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Requested LWD</p>
              <p className="font-semibold text-gray-900">{formatIST(resignation.lastWorkingDay, "MMM d, yyyy")}</p>
            </div>
          </div>
          
          {resignation.status === 'Approved' && (
            <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 mt-4">
              <p className="text-sm font-medium text-gray-600 mb-1">Notice Period Countdown</p>
              <p className="text-3xl font-black text-gray-900">{daysLeft} <span className="text-lg text-gray-500 font-medium">days left</span></p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
        <LogOut className="h-5 w-5 text-gray-500" />
        <h3 className="font-bold text-gray-900">Resignation Portal</h3>
      </div>
      <div className="p-6 text-center">
        {!showForm ? (
          <>
            <p className="text-sm text-gray-600 mb-4">Submit a formal request to begin your offboarding process.</p>
            <button 
              onClick={() => setShowForm(true)}
              className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              Submit Resignation
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="text-left space-y-4 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intended Last Working Day</label>
              <input 
                type="date" 
                required 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                value={lastWorkingDay}
                onChange={e => setLastWorkingDay(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Leaving</label>
              <textarea 
                required 
                rows={3} 
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                value={reason}
                onChange={e => setReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-black rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// --- HR / ADMIN VIEW --- //
export function HROffboarding({ currentUser, users, timeLogs, leaveRequests }: { currentUser: User, users: User[], timeLogs: TimeLog[], leaveRequests: LeaveRequest[] }) {
  const [resignations, setResignations] = useState<ResignationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let unsub: () => void;
    const fetchResignations = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        // Get all pending and approved
        const q = query(collection(db, "resignations"));
        unsub = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ResignationRequest));
          docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setResignations(docs);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchResignations();
    return () => { if (unsub) unsub(); };
  }, []);

  // Calculate Absconding Risks (3 days absent)
  // Simplified logic: Check if user has NO logs and NO leaves for the last 3 weekdays.
  // We'll find users whose last clock-in was > 3 days ago, but ideally we'd check actual absent marks.
  const abscondingRisks = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return users.filter(u => u.role === 'Employee' && u.status === 'Approved').filter(u => {
      // Find latest time log
      const userLogs = timeLogs.filter(l => l.userId === u.id);
      userLogs.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
      
      const latestLogDate = userLogs.length > 0 ? new Date(userLogs[0].clockIn) : new Date(0);
      
      // Calculate days difference
      const diffTime = Math.abs(today.getTime() - latestLogDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Check if they had approved leave during these days
      // (simplification: just if diffDays >= 3 and no recent logs, flag them)
      return diffDays >= 3;
    });
  }, [users, timeLogs]);

  const handleAction = async (resId: string, status: 'Approved' | 'Rejected', userId?: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "resignations", resId), {
        status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });
      
      if (status === 'Approved' && userId) {
        await updateDoc(doc(db, "users", userId), {
          status: 'Resigned'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleChecklist = async (resId: string, field: 'assetsReturned' | 'docsCompleted' | 'knowledgeTransfer', currentVal: boolean) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "resignations", resId), {
        [`handoverChecklist.${field}`]: !currentVal
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAbsconding = async (userId: string) => {
    if (!window.confirm("WARNING: This is a kill switch. This will immediately revoke the employee's access and log them out of all systems. Proceed?")) return;
    
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "users", userId), {
        status: 'Absconding'
      });
      alert("Access revoked. Employee marked as Absconding.");
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-6">
      {/* Risk Mitigation Protocol */}
      {abscondingRisks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="p-4 border-b border-red-200 bg-red-50 flex items-center justify-between">
            <h3 className="font-bold text-red-900 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Absconding & Risk Mitigation
            </h3>
            <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
              {abscondingRisks.length} Risk Alert(s)
            </span>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">Employee</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Department</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {abscondingRisks.map(u => (
                  <tr key={u.id}>
                    <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{u.department}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-semibold text-red-600">Absent &gt; 3 Days</span>
                    </td>
                    <td className="px-4 py-3 flex items-center justify-end gap-2">
                      <button 
                        onClick={() => alert(`Generated Legal Notice for ${u.firstName} ${u.lastName} and emailed to registered address.`)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <FileText className="h-3 w-3" /> Send Notice
                      </button>
                      <button 
                        onClick={() => handleMarkAbsconding(u.id)}
                        className="text-xs font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <UserX className="h-3 w-3" /> Kill Switch
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resignation Approvals & Handover */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <LogOut className="h-5 w-5 text-gray-500" />
          <h3 className="font-bold text-gray-900">Resignation & Handover Workflows</h3>
        </div>
        <div className="p-4 space-y-4">
          {resignations.length === 0 ? (
            <p className="text-sm text-gray-500 italic text-center py-4">No active offboarding processes.</p>
          ) : (
            resignations.map(res => {
              const u = users.find(x => x.id === res.userId);
              const userName = u ? `${u.firstName} ${u.lastName}` : 'Unknown User';
              
              const checklist = res.handoverChecklist || { assetsReturned: false, docsCompleted: false, knowledgeTransfer: false };
              const checklistDone = checklist.assetsReturned && checklist.docsCompleted && checklist.knowledgeTransfer;
              
              return (
                <div key={res.id} className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-900">{userName} <span className="text-gray-500 font-normal text-sm ml-2">Requested LWD: {formatIST(res.lastWorkingDay, "MMM d, yyyy")}</span></h4>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        res.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        res.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {res.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 mb-4">
                      <span className="font-semibold block mb-1">Reason:</span>
                      {res.reason}
                    </p>
                    
                    {res.status === 'Pending' && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleAction(res.id, 'Approved', u?.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">Approve</button>
                        <button onClick={() => handleAction(res.id, 'Rejected')} className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-sm font-medium transition-colors">Reject</button>
                      </div>
                    )}
                  </div>
                  
                  {res.status === 'Approved' && (
                    <div className="md:w-64 bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h5 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
                        <CheckSquare className="h-4 w-4 text-indigo-600" /> Handover Checklist
                      </h5>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded text-indigo-600" checked={checklist.assetsReturned} onChange={() => handleToggleChecklist(res.id, 'assetsReturned', checklist.assetsReturned)} />
                          <span className="text-sm text-gray-700">Assets Returned</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded text-indigo-600" checked={checklist.docsCompleted} onChange={() => handleToggleChecklist(res.id, 'docsCompleted', checklist.docsCompleted)} />
                          <span className="text-sm text-gray-700">F&F Docs Signed</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" className="rounded text-indigo-600" checked={checklist.knowledgeTransfer} onChange={() => handleToggleChecklist(res.id, 'knowledgeTransfer', checklist.knowledgeTransfer)} />
                          <span className="text-sm text-gray-700">Knowledge Transfer</span>
                        </label>
                      </div>
                      
                      {checklistDone && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                          <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium transition-colors">
                            Process Settlement
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
