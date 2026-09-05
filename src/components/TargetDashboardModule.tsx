import React, { useState, useEffect } from "react";
import { User, ClientAccount, ConnectedCompany } from "../types";
import { formatIST } from "../utils";
import { cn } from "../utils";
import { Target, CheckCircle, Clock, Check, X, Send, Building, Edit2 } from "lucide-react";

export function TargetDashboardModule({ currentUser }: { currentUser: User }) {
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [companies, setCompanies] = useState<ConnectedCompany[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // New account form
  const [clientName, setClientName] = useState("");
  const [platform, setPlatform] = useState<string>("");

  // New company form
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");

  // Edit target form
  const [editingTargetUserId, setEditingTargetUserId] = useState<string | null>(null);
  const [editTargetValue, setEditTargetValue] = useState<number | "">("");

  useEffect(() => {
    let unsubscribeAccounts: () => void;
    let unsubscribeCompanies: () => void;
    let unsubscribeUsers: () => void;

    const setupRealtime = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, where, orderBy } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        // Fetch Client Accounts
        let qAccounts;
        if (currentUser.role === 'Employee') {
          qAccounts = query(collection(db, "clientAccounts"), where("submittedBy", "==", currentUser.id));
        } else {
          qAccounts = query(collection(db, "clientAccounts"));
        }

        unsubscribeAccounts = onSnapshot(qAccounts, (snapshot) => {
          const data: any[] = [];
          snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
          setAccounts(data.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()));
        });

        // Fetch Connected Companies
        unsubscribeCompanies = onSnapshot(collection(db, "connectedCompanies"), (snapshot) => {
          const cData: any[] = [];
          snapshot.forEach(doc => cData.push({ id: doc.id, ...doc.data() }));
          setCompanies(cData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
          if (cData.length > 0 && !platform) {
            setPlatform(cData[0].name);
          }
        });

        // Fetch Users (for HR/Admin to edit targets)
        if (currentUser.role !== 'Employee') {
          unsubscribeUsers = onSnapshot(query(collection(db, "users"), where("role", "==", "Employee")), (snapshot) => {
            const uData: any[] = [];
            snapshot.forEach(doc => uData.push({ id: doc.id, ...doc.data() }));
            setUsers(uData);
          });
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };
    setupRealtime();
    return () => { 
      if (unsubscribeAccounts) unsubscribeAccounts(); 
      if (unsubscribeCompanies) unsubscribeCompanies();
      if (unsubscribeUsers) unsubscribeUsers();
    };
  }, [currentUser.id, currentUser.role]);

  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !platform) return;
    
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await addDoc(collection(db, "clientAccounts"), {
        clientName,
        platform,
        status: 'Pending Verification',
        submittedBy: currentUser.id,
        submittedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        submittedAt: new Date().toISOString()
      });
      
      setClientName("");
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const updateAccountStatus = async (id: string, status: ClientAccount['status']) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "clientAccounts", id), { status });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName) return;

    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await addDoc(collection(db, "connectedCompanies"), {
        name: newCompanyName,
        addedBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
      
      setNewCompanyName("");
      setShowAddCompany(false);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTarget = async (userId: string) => {
    if (editTargetValue === "") return;
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "users", userId), { target: Number(editTargetValue) });
      setEditingTargetUserId(null);
      setEditTargetValue("");
    } catch (error) {
      console.error(error);
    }
  };

  // Metrics calculations
  const personalTarget = currentUser.target || 10;
  
  // Calculate company-wide target as sum of all employee targets (or fallback to 100)
  const companyTarget = users.length > 0 
    ? users.reduce((acc, user) => acc + (user.target || 10), 0) 
    : 100;

  const myApproved = accounts.filter(a => a.submittedBy === currentUser.id && a.status === 'Verified').length;
  const totalApproved = accounts.filter(a => a.status === 'Verified').length;

  const progress = currentUser.role === 'Employee' 
    ? Math.min((myApproved / personalTarget) * 100, 100)
    : Math.min((totalApproved / companyTarget) * 100, 100);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-emerald-600" />
            Account Opening Targets
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            {currentUser.role === 'Employee' ? "Your Monthly Goal" : "Company-Wide Monthly Goal"}
          </p>
        </div>
        
        {currentUser.role !== 'Employee' && (
          <button 
            onClick={() => setShowAddCompany(!showAddCompany)}
            className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Building className="h-3.5 w-3.5" />
            Manage Companies
          </button>
        )}
        
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">
            {currentUser.role === 'Employee' ? `${myApproved} / ${personalTarget}` : `${totalApproved} / ${companyTarget}`}
          </div>
          <div className="text-xs font-medium text-emerald-600">Accounts Verified</div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="p-4 border-b border-gray-100">
        <div className="w-full bg-gray-100 rounded-full h-3 mb-2 overflow-hidden">
          <div className="bg-emerald-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% of Target Achieved</p>
      </div>

      {/* Add Company Form */}
      {showAddCompany && currentUser.role !== 'Employee' && (
        <form onSubmit={handleAddCompany} className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <input 
            type="text"
            required
            placeholder="New Company Platform Name"
            value={newCompanyName}
            onChange={e => setNewCompanyName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button 
            type="submit"
            disabled={actionLoading}
            className="px-4 py-1.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
          >
            Add Company
          </button>
        </form>
      )}

      {currentUser.role === 'Employee' && (
        <form onSubmit={handleSubmitAccount} className="p-4 bg-emerald-50/50 border-b border-gray-100">
          <h4 className="text-sm font-semibold mb-3 text-gray-800">Log New Account</h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              required
              type="text" 
              placeholder="Client Name" 
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <select 
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
              required
            >
              {companies.length === 0 && <option value="">No companies added</option>}
              {companies.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <button 
              type="submit" 
              disabled={actionLoading || companies.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 justify-center disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> Submit
            </button>
          </div>
        </form>
      )}

      {/* Target Management (Admin/HR) */}
      {currentUser.role !== 'Employee' && (
        <div className="border-b border-gray-100 bg-gray-50/50 p-4">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Employee Monthly Targets</h4>
           <div className="space-y-2 max-h-48 overflow-y-auto">
             {users.length === 0 ? (
               <p className="text-xs text-gray-500 italic">No employees found.</p>
             ) : (
               users.map(user => {
                 const approvedCount = accounts.filter(a => a.submittedBy === user.id && a.status === 'Verified').length;
                 const target = user.target || 10;
                 return (
                   <div key={user.id} className="flex items-center justify-between bg-white p-2 border border-gray-100 rounded-lg shadow-sm">
                     <div>
                       <span className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</span>
                       <span className="text-xs text-gray-500 ml-2">({approvedCount} / {target} verified)</span>
                     </div>
                     {editingTargetUserId === user.id ? (
                       <div className="flex items-center gap-2">
                         <input 
                           type="number"
                           className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-emerald-500"
                           value={editTargetValue}
                           onChange={e => setEditTargetValue(e.target.value === "" ? "" : Number(e.target.value))}
                           autoFocus
                         />
                         <button onClick={() => handleUpdateTarget(user.id)} className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium hover:bg-emerald-200">Save</button>
                         <button onClick={() => setEditingTargetUserId(null)} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium hover:bg-gray-200">Cancel</button>
                       </div>
                     ) : (
                       <button onClick={() => {
                         setEditingTargetUserId(user.id);
                         setEditTargetValue(target);
                       }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md">
                         <Edit2 className="h-3.5 w-3.5" />
                       </button>
                     )}
                   </div>
                 );
               })
             )}
           </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-semibold">Client Name</th>
              <th className="px-4 py-3 font-semibold">Platform</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              {currentUser.role !== 'Employee' && <th className="px-4 py-3 font-semibold">Employee</th>}
              <th className="px-4 py-3 font-semibold">Date</th>
              {currentUser.role !== 'Employee' && <th className="px-4 py-3 font-semibold text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={currentUser.role === 'Employee' ? 4 : 6} className="px-4 py-8 text-center text-gray-500">
                  No accounts logged yet.
                </td>
              </tr>
            ) : (
              accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{acc.clientName}</td>
                  <td className="px-4 py-3">{acc.platform}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider border",
                      acc.status === "Pending Verification" ? "bg-amber-100 text-amber-700 border-amber-200" :
                      acc.status === "Verified" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                      "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {acc.status}
                    </span>
                  </td>
                  {currentUser.role !== 'Employee' && (
                    <td className="px-4 py-3 text-xs">{acc.submittedByName}</td>
                  )}
                  <td className="px-4 py-3 text-xs text-gray-500">{formatIST(acc.submittedAt, "MMM d")}</td>
                  {currentUser.role !== 'Employee' && (
                    <td className="px-4 py-3 text-right">
                      {acc.status === "Pending Verification" && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => updateAccountStatus(acc.id, 'Verified')} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Verify Account">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateAccountStatus(acc.id, 'Rejected')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Reject Account">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
