import React, { useState, useEffect } from 'react';
import { User, PayrollRecord, TimeLog, LeaveRequest } from '../types';
import { FileText, Download, Banknote, CheckCircle, Calculator } from 'lucide-react';
import { formatIST } from '../utils';

export function PayrollModule({ currentUser, users, timeLogs, leaveRequests }: { currentUser: User, users: User[], timeLogs: TimeLog[], leaveRequests: LeaveRequest[] }) {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(formatIST(new Date().toISOString(), "yyyy-MM"));

  useEffect(() => {
    let unsub: () => void;
    const fetchPayroll = async () => {
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        let q = query(collection(db, "payroll"), where("month", "==", month));
        if (currentUser.role === 'Employee') {
           q = query(collection(db, "payroll"), where("month", "==", month), where("userId", "==", currentUser.id));
        }

        unsub = onSnapshot(q, (snap) => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as PayrollRecord));
          setPayrolls(docs);
          setLoading(false);
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchPayroll();
    return () => { if (unsub) unsub(); };
  }, [month, currentUser.id, currentUser.role]);

  const generatePayroll = async (userId: string) => {
    // Generate Payroll for user for the selected month
    const u = users.find(x => x.id === userId);
    if (!u) return;

    // Simulated calculations
    const baseSalary = 30000;
    
    // Check if payroll already exists
    if (payrolls.find(p => p.userId === userId)) {
        alert("Payroll already generated for this month.");
        return;
    }

    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const newRecord: Omit<PayrollRecord, 'id'> = {
        userId,
        month,
        baseSalary,
        commissions: 5000, // Hardcoded for demo, normally would aggregate from sales
        deductions: 0,
        netPay: baseSalary + 5000,
        status: 'Draft',
        generatedAt: new Date().toISOString(),
        generatedBy: currentUser.id
      };
      
      await addDoc(collection(db, "payroll"), newRecord);
    } catch (e) {
      console.error(e);
    }
  };

  const processPayment = async (payrollId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "payroll", payrollId), { status: 'Paid' });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-emerald-50 flex items-center justify-between">
        <h3 className="font-bold text-emerald-900 flex items-center gap-2">
          <Banknote className="h-5 w-5 text-emerald-600" />
          Payroll & Compensation
        </h3>
        <input 
          type="month" 
          value={month} 
          onChange={e => setMonth(e.target.value)} 
          className="px-3 py-1.5 border border-emerald-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
        />
      </div>
      
      <div className="p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-semibold text-gray-600">Employee</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Base Salary</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Commissions</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Net Pay</th>
              <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 font-semibold text-gray-600 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(currentUser.role === 'Employee' ? users.filter(u => u.id === currentUser.id) : users.filter(u => u.role === 'Employee' && u.status === 'Approved')).map(u => {
              const record = payrolls.find(p => p.userId === u.id);
              return (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                  <td className="px-4 py-3 text-gray-600">{record ? `₹${record.baseSalary.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{record ? `+₹${record.commissions.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{record ? `₹${record.netPay.toLocaleString()}` : '-'}</td>
                  <td className="px-4 py-3">
                    {record ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${record.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                        {record.status}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Not Generated</span>
                    )}
                  </td>
                  <td className="px-4 py-3 flex items-center justify-end gap-2">
                    {!record && ['HR', 'Admin'].includes(currentUser.role) && (
                      <button onClick={() => generatePayroll(u.id)} className="text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Calculator className="h-3 w-3" /> Generate
                      </button>
                    )}
                    {record && record.status === 'Draft' && ['HR', 'Admin'].includes(currentUser.role) && (
                      <button onClick={() => processPayment(record.id)} className="text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <CheckCircle className="h-3 w-3" /> Mark Paid
                      </button>
                    )}
                    {record && (
                      <button onClick={() => alert("Downloading Payslip...")} className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                        <Download className="h-3 w-3" /> Payslip
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
