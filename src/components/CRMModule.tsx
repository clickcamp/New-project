import React, { useState, useEffect } from 'react';
import { User, Lead } from '../types';
import { Plus, GripVertical, Phone, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';
import { formatIST } from '../utils';
import { cn } from '../utils';

const STATUSES = ['Lead', 'Contacted', 'Follow-up', 'Documents Submitted', 'Account Opened'] as const;

export function CRMModule({ currentUser }: { currentUser: User }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({ clientName: '', phone: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let unsub: () => void;
    const fetchLeads = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        let q = query(collection(db, "leads"));
        if (currentUser.role === 'Employee') {
          q = query(collection(db, "leads"), where("assignedTo", "==", currentUser.id));
        }

        unsub = onSnapshot(q, (snap) => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setLeads(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchLeads();
    return () => { if (unsub) unsub(); };
  }, [currentUser]);


  const logActivity = async (action: string, entityId: string, entityType: 'Lead' | 'ClientAccount', details?: string) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
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

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const now = new Date().toISOString();
      const leadDoc = await addDoc(collection(db, "leads"), {
        clientName: newLead.clientName,
        phone: newLead.phone,
        status: 'Lead',
        assignedTo: currentUser.id,
        assignedToName: `${currentUser.firstName} ${currentUser.lastName}`,
        createdAt: now,
        updatedAt: now,
        notes: newLead.notes
      });
      
      await logActivity(`added a new lead ${newLead.clientName}`, leadDoc.id, 'Lead');
      setShowAddModal(false);
      setNewLead({ clientName: '', phone: '', notes: '' });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "leads", leadId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      await logActivity(`moved lead to ${newStatus}`, leadId, 'Lead');
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl"><div className="animate-pulse">Loading Pipeline...</div></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-600" />
          Lead Pipeline (Mini-CRM)
        </h3>
        {currentUser.role === 'Employee' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Lead
          </button>
        )}
      </div>

      <div className="flex-1 overflow-x-auto bg-gray-50/50 p-4">
        <div className="flex gap-4 min-w-max h-full">
          {STATUSES.map(status => {
            const columnLeads = leads.filter(l => l.status === status);
            return (
              <div key={status} className="w-72 flex flex-col bg-gray-100/80 rounded-xl border border-gray-200">
                <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-white rounded-t-xl shrink-0">
                  <h4 className="font-semibold text-gray-800 text-sm">{status}</h4>
                  <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{columnLeads.length}</span>
                </div>
                
                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {columnLeads.map(lead => (
                    <div key={lead.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow transition-shadow group">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium text-gray-900 text-sm">{lead.clientName}</div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                        <Phone className="h-3 w-3" /> {lead.phone}
                      </div>
                      {currentUser.role !== 'Employee' && (
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2 font-medium bg-gray-50 w-fit px-2 py-1 rounded">
                          <UserIcon className="h-3 w-3" /> {lead.assignedToName}
                        </div>
                      )}
                      
                      {currentUser.role === 'Employee' && status !== 'Account Opened' && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                          <select 
                            className="w-full text-xs bg-gray-50 border border-gray-200 rounded p-1 outline-none text-gray-700 font-medium"
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {status === 'Account Opened' && (
                         <div className="mt-2 text-[10px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                           <CheckCircle className="h-3 w-3" /> Converted
                         </div>
                      )}
                    </div>
                  ))}
                  {columnLeads.length === 0 && (
                    <div className="text-center p-4 text-xs text-gray-400 italic">No leads</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showAddModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add New Lead</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleAddLead} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={newLead.clientName} onChange={e => setNewLead({...newLead, clientName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input required type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" value={newLead.notes} onChange={e => setNewLead({...newLead, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {actionLoading ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
