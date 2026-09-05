import React, { useState, useEffect } from 'react';
import { User, Ticket, Expense } from '../types';
import { LifeBuoy, Receipt, Plus, CheckCircle, Clock } from 'lucide-react';
import { formatIST } from '../utils';
import { cn } from '../utils';

export function TicketingModule({ currentUser }: { currentUser: User }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<Ticket['category']>("IT Support");
  const [description, setDescription] = useState("");

  useEffect(() => {
    let unsub: () => void;
    const fetchTickets = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        let q = query(collection(db, "tickets"));
        if (currentUser.role === 'Employee') {
          q = query(collection(db, "tickets"), where("userId", "==", currentUser.id));
        }

        unsub = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket));
          docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setTickets(docs);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchTickets();
    return () => { if (unsub) unsub(); };
  }, [currentUser.id, currentUser.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const newTicket: Omit<Ticket, 'id'> = {
        userId: currentUser.id,
        subject,
        category,
        description,
        status: 'Open',
        createdAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "tickets"), newTicket);
      setShowForm(false);
      setSubject("");
      setDescription("");
    } catch (e) {
      console.error(e);
    }
  };

  const resolveTicket = async (ticketId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "tickets", ticketId), { 
        status: 'Resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-blue-50 flex items-center justify-between">
        <h3 className="font-bold text-blue-900 flex items-center gap-2">
          <LifeBuoy className="h-5 w-5 text-blue-600" />
          Internal Helpdesk
        </h3>
        {currentUser.role === 'Employee' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-700">
            <Plus className="h-4 w-4" /> New Ticket
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                <input required type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                  <option value="IT Support">IT Support</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea required rows={3} value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none resize-none"></textarea>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Submit Ticket</button>
            </div>
          </form>
        </div>
      )}

      <div className="p-4 space-y-3">
        {tickets.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-4">No support tickets found.</p>
        ) : (
          tickets.map(t => (
            <div key={t.id} className="border border-gray-100 rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{t.subject}</h4>
                  <span className="text-xs text-gray-500">{t.category} • {formatIST(t.createdAt, "MMM d, h:mm a")}</span>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-bold",
                  t.status === 'Resolved' ? 'bg-green-100 text-green-800' :
                  t.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                )}>{t.status}</span>
              </div>
              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">{t.description}</p>
              {t.status !== 'Resolved' && ['Admin', 'HR'].includes(currentUser.role) && (
                <div className="mt-3 flex justify-end">
                  <button onClick={() => resolveTicket(t.id)} className="text-xs flex items-center gap-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg font-medium">
                    <CheckCircle className="h-3 w-3" /> Mark Resolved
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export function ExpensesModule({ currentUser }: { currentUser: User }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<Expense['category']>("Travel");

  useEffect(() => {
    let unsub: () => void;
    const fetchExpenses = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        let q = query(collection(db, "expenses"));
        if (currentUser.role === 'Employee') {
          q = query(collection(db, "expenses"), where("userId", "==", currentUser.id));
        }

        unsub = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Expense));
          docs.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
          setExpenses(docs);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchExpenses();
    return () => { if (unsub) unsub(); };
  }, [currentUser.id, currentUser.role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const newExp: Omit<Expense, 'id'> = {
        userId: currentUser.id,
        title,
        amount: Number(amount),
        category,
        status: 'Pending',
        submittedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, "expenses"), newExp);
      setShowForm(false);
      setTitle("");
      setAmount("");
    } catch (e) {
      console.error(e);
    }
  };

  const updateStatus = async (expId: string, status: 'Approved' | 'Rejected') => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "expenses", expId), { 
        status,
        resolvedAt: new Date().toISOString(),
        resolvedBy: currentUser.id
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-purple-50 flex items-center justify-between">
        <h3 className="font-bold text-purple-900 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-purple-600" />
          Expenses & Reimbursements
        </h3>
        {currentUser.role === 'Employee' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-purple-700">
            <Plus className="h-4 w-4" /> New Expense
          </button>
        )}
      </div>

      {showForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Amount (₹)</label>
                <input required type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full border rounded-lg p-2 text-sm outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value as any)} className="w-full border rounded-lg p-2 text-sm outline-none bg-white">
                  <option value="Travel">Travel</option>
                  <option value="Meals">Meals</option>
                  <option value="Office Supplies">Office Supplies</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Submit Expense</button>
            </div>
          </form>
        </div>
      )}

      <div className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Date</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Details</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Amount</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map(e => (
              <tr key={e.id}>
                <td className="px-4 py-3 text-gray-600">{formatIST(e.submittedAt, "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-500">{e.category}</p>
                </td>
                <td className="px-4 py-3 font-bold text-gray-900">₹{e.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    e.status === 'Approved' ? 'bg-green-100 text-green-800' :
                    e.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  )}>{e.status}</span>
                </td>
                <td className="px-4 py-3 flex items-center justify-end gap-2">
                  {e.status === 'Pending' && ['Admin', 'HR'].includes(currentUser.role) && (
                    <>
                      <button onClick={() => updateStatus(e.id, 'Approved')} className="text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 px-3 py-1.5 rounded-lg flex items-center transition-colors">Approve</button>
                      <button onClick={() => updateStatus(e.id, 'Rejected')} className="text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg flex items-center transition-colors">Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4 text-sm text-gray-500 italic">No expenses reported.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
