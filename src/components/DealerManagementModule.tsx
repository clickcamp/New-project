import React, { useState, useEffect } from "react";
import { User, Dealer } from "../types";
import { Store, Plus, X, Search, CheckCircle, AlertCircle, Clock, MapPin, Phone, User as UserIcon } from "lucide-react";
import { formatIST } from "../utils";
import { cn } from "../utils";

export function DealerManagementModule({ currentUser }: { currentUser: User }) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [newDealer, setNewDealer] = useState<Partial<Dealer>>({
    businessName: "",
    ownerName: "",
    contactNumber: "",
    location: "",
    status: "Lead"
  });

  useEffect(() => {
    let unsubscribe: () => void;
    const setupRealtime = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        // Either get all dealers or just assigned ones
        const q = query(collection(db, "dealers"));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const data: any[] = [];
          snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
          setDealers(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          setLoading(false);
        });
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    setupRealtime();
    return () => { if (unsubscribe) unsubscribe(); };
  }, [currentUser.id]);

  const handleAddDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealer.businessName || !newDealer.ownerName) return;
    
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await addDoc(collection(db, "dealers"), {
        ...newDealer,
        assignedTo: currentUser.id,
        createdAt: new Date().toISOString()
      });
      
      setShowAddModal(false);
      setNewDealer({ businessName: "", ownerName: "", contactNumber: "", location: "", status: "Lead" });
    } catch (error) {
      console.error("Error adding dealer:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Dealer['status']) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "dealers", id), { status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const filteredDealers = dealers.filter(d => 
    d.businessName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.ownerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Store className="h-4 w-4 text-blue-600" />
            Dealer Management System (DMS)
          </h3>
          <p className="text-xs text-gray-500 mt-1">Track merchants and field onboarding.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Merchant
        </button>
      </div>

      <div className="p-4 border-b border-gray-100 bg-white">
        <div className="relative">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search merchants..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-[500px] p-0 flex-1">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading records...</div>
        ) : filteredDealers.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No merchants found.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredDealers.map(dealer => (
              <li key={dealer.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{dealer.businessName}</h4>
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                      <UserIcon className="h-3 w-3" /> {dealer.ownerName}
                    </div>
                  </div>
                  <span className={cn(
                    "px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider border",
                    dealer.status === "Lead" ? "bg-gray-100 text-gray-700 border-gray-200" :
                    dealer.status === "Onboarding" ? "bg-blue-100 text-blue-700 border-blue-200" :
                    dealer.status === "Active" ? "bg-green-100 text-green-700 border-green-200" :
                    "bg-red-100 text-red-700 border-red-200"
                  )}>
                    {dealer.status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400"/> {dealer.contactNumber || "N/A"}</div>
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400"/> {dealer.location || "N/A"}</div>
                </div>

                <div className="flex gap-2">
                  <select 
                    value={dealer.status}
                    onChange={(e) => updateStatus(dealer.id, e.target.value as Dealer['status'])}
                    className="text-xs border border-gray-200 rounded p-1 bg-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <span className="text-xs text-gray-400 flex items-center ml-auto">
                    <Clock className="h-3 w-3 mr-1"/>
                    {formatIST(dealer.createdAt, "MMM d")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-5 w-5 text-blue-600" />
                Add New Merchant/Dealer
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAddDealer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700" value={newDealer.businessName} onChange={e => setNewDealer({...newDealer, businessName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                <input required type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700" value={newDealer.ownerName} onChange={e => setNewDealer({...newDealer, ownerName: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700" value={newDealer.contactNumber} onChange={e => setNewDealer({...newDealer, contactNumber: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 bg-white" value={newDealer.status} onChange={e => setNewDealer({...newDealer, status: e.target.value as Dealer['status']})}>
                    <option value="Lead">Lead</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Active">Active</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Zone</label>
                <input type="text" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-700" value={newDealer.location} onChange={e => setNewDealer({...newDealer, location: e.target.value})} />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50">
                  {actionLoading ? "Saving..." : "Add Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
