import React, { useState, useEffect } from 'react';
import { User, TimeLog, LeaveRequest, RegularizationRequest } from '../types';
import { cn } from '../utils';
import { Calendar as CalendarIcon, Clock, CheckCircle, XCircle, AlertCircle, Send, ChevronLeft, ChevronRight, User as UserIcon, HelpCircle, X } from 'lucide-react';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isToday, parseISO, isWeekend, isPast, addMonths, subMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export function AttendanceCalendarModule({ currentUser }: { currentUser: User }) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regRequests, setRegRequests] = useState<RegularizationRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.role === 'Employee' ? currentUser.id : 'ALL');
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Leave Form
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  // Reg Form
  const [showRegModal, setShowRegModal] = useState<{date: Date, type: 'Absent'} | null>(null);
  const [regReason, setRegReason] = useState("");

  useEffect(() => {
    let unsubs: (() => void)[] = [];
    
    const loadData = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        let logsQ = query(collection(db, "timeLogs"));
        let leavesQ = query(collection(db, "leaveRequests"));
        let regsQ = query(collection(db, "regularizationRequests"));
        
        if (currentUser.role === 'Employee') {
          logsQ = query(collection(db, "timeLogs"), where("userId", "==", currentUser.id));
          leavesQ = query(collection(db, "leaveRequests"), where("userId", "==", currentUser.id));
          regsQ = query(collection(db, "regularizationRequests"), where("userId", "==", currentUser.id));
        } else {
          const usersUnsub = onSnapshot(collection(db, "users"), snap => {
            const u: any[] = [];
            snap.forEach(d => u.push({ id: d.id, ...d.data() }));
            setUsers(u);
          });
          unsubs.push(usersUnsub);
        }

        const logsUnsub = onSnapshot(logsQ, snap => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setTimeLogs(data);
        });
        unsubs.push(logsUnsub);

        const leavesUnsub = onSnapshot(leavesQ, snap => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setLeaveRequests(data);
        });
        unsubs.push(leavesUnsub);
        
        const regsUnsub = onSnapshot(regsQ, snap => {
          const data: any[] = [];
          snap.forEach(d => data.push({ id: d.id, ...d.data() }));
          setRegRequests(data);
          setLoading(false);
        });
        unsubs.push(regsUnsub);
        
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    loadData();
    return () => unsubs.forEach(u => u());
  }, [currentUser]);

  // Find active clock-in for today
  const todayLog = timeLogs.find(log => log.userId === currentUser.id && isToday(parseISO(log.clockIn)));

  const handleClockInOut = async () => {
    setActionLoading(true);
    try {
      const { collection, addDoc, updateDoc, doc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      if (!todayLog) {
        // Clock In
        await addDoc(collection(db, "timeLogs"), {
          userId: currentUser.id,
          clockIn: new Date().toISOString(),
        });
      } else if (!todayLog.clockOut) {
        // Clock Out
        const outTime = new Date();
        const inTime = parseISO(todayLog.clockIn);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);
        
        await updateDoc(doc(db, "timeLogs", todayLog.id), {
          clockOut: outTime.toISOString(),
          totalHours: Number(hours.toFixed(2))
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) return;
    
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "leaveRequests"), {
        userId: currentUser.id,
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason,
        status: "Pending"
      });
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitReg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRegModal || !regReason) return;
    
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "regularizationRequests"), {
        userId: currentUser.id,
        date: format(showRegModal.date, "yyyy-MM-dd"),
        reason: regReason,
        status: "Pending",
        submittedAt: new Date().toISOString()
      });
      setShowRegModal(null);
      setRegReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "leaveRequests", id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateRegStatus = async (req: RegularizationRequest, status: 'Approved' | 'Rejected') => {
    try {
      const { doc, updateDoc, collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const now = new Date().toISOString();
      
      await updateDoc(doc(db, "regularizationRequests", req.id), { 
        status,
        resolvedAt: now,
        resolvedBy: currentUser.id
      });
      
      await addDoc(collection(db, "regularizationAuditLogs"), {
        requestId: req.id,
        userId: req.userId,
        date: req.date,
        action: status,
        performedBy: currentUser.id,
        performedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        timestamp: now
      });
      
      if (status === 'Approved') {
        const fakeClockIn = new Date(req.date);
        fakeClockIn.setHours(9, 0, 0, 0); // 9 AM
        const fakeClockOut = new Date(req.date);
        fakeClockOut.setHours(17, 0, 0, 0); // 5 PM
        
        await addDoc(collection(db, "timeLogs"), {
          userId: req.userId,
          clockIn: fakeClockIn.toISOString(),
          clockOut: fakeClockOut.toISOString(),
          totalHours: 8
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Calendar Generation
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getDayStatus = (date: Date, uid: string) => {
    // Check Leaves
    const userLeaves = leaveRequests.filter(l => l.userId === uid && l.status !== 'Rejected');
    const onLeave = userLeaves.find(l => {
      const start = startOfDay(parseISO(l.startDate));
      const end = endOfDay(parseISO(l.endDate));
      return isWithinInterval(date, { start, end });
    });
    
    if (onLeave) {
      return onLeave.status === 'Approved' ? 'Leave Approved' : 'Leave Pending';
    }
    
    // Check Regs
    const userRegs = regRequests.filter(r => r.userId === uid && r.date === format(date, "yyyy-MM-dd") && r.status === 'Pending');
    if (userRegs.length > 0) {
      return 'Reg Pending';
    }
    
    // Check TimeLogs
    const log = timeLogs.find(l => l.userId === uid && isSameDay(parseISO(l.clockIn), date));
    if (log) return 'Present';
    
    // Absent if past weekday
    if (isPast(date) && !isToday(date) && !isWeekend(date)) return 'Absent';
    
    return 'None';
  };

  const getUserName = (uid: string) => {
    const u = users.find(x => x.id === uid);
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
  };

  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  const pendingRegs = regRequests.filter(r => r.status === 'Pending');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full relative">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-blue-600" />
            Attendance & Leave
          </h3>
          <p className="text-xs text-gray-500 mt-1">Real-time presence and leave tracker.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {currentUser.role !== 'Employee' && (
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="text-sm border-gray-300 rounded-lg py-1.5 pl-3 pr-8 focus:ring-blue-500 focus:border-blue-500 outline-none border bg-white"
            >
              <option value="ALL">Company-Wide</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
              ))}
            </select>
          )}
          
          {currentUser.role === 'Employee' && (
            <button
              onClick={handleClockInOut}
              disabled={actionLoading || (!!todayLog && !!todayLog.clockOut)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors text-white",
                !todayLog ? "bg-emerald-600 hover:bg-emerald-700" :
                !todayLog.clockOut ? "bg-red-600 hover:bg-red-700" :
                "bg-gray-400 cursor-not-allowed"
              )}
            >
              <Clock className="h-4 w-4" />
              {!todayLog ? "Clock In" : !todayLog.clockOut ? "Clock Out" : "Day Completed"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 min-h-0">
        
        {/* Left Side: Calendar */}
        <div className="flex-1 p-4 border-r border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">{format(currentMonth, "MMMM yyyy")}</h4>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-md">
                <ChevronLeft className="h-5 w-5 text-gray-500" />
              </button>
              <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded-md">
                <ChevronRight className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d} className="text-xs font-semibold text-gray-500 py-1">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1 flex-1">
            {/* Empty slots for start of month */}
            {Array.from({ length: currentMonth.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50/50 rounded-lg border border-transparent"></div>
            ))}
            
            {daysInMonth.map(date => {
              let statuses: Record<string, number> = { 'Present': 0, 'Absent': 0, 'Leave Approved': 0, 'Leave Pending': 0, 'Reg Pending': 0, 'None': 0 };
              
              if (selectedUserId === 'ALL') {
                users.forEach(u => statuses[getDayStatus(date, u.id)]++);
              } else {
                statuses[getDayStatus(date, selectedUserId)]++;
              }
              
              const isTodayDate = isToday(date);
              const singleStatus = selectedUserId !== 'ALL' ? getDayStatus(date, selectedUserId) : null;
              
              return (
                <div 
                  key={date.toISOString()} 
                  onClick={() => {
                    if (currentUser.role === 'Employee' && singleStatus === 'Absent') {
                      setShowRegModal({ date, type: 'Absent' });
                    }
                  }}
                  className={cn(
                    "border rounded-lg p-1.5 flex flex-col transition-colors",
                    isTodayDate ? "border-blue-500 shadow-sm" : "border-gray-100",
                    isWeekend(date) ? "bg-gray-50 text-gray-400" : "bg-white",
                    singleStatus === 'Present' ? "bg-emerald-50 border-emerald-200" :
                    singleStatus === 'Absent' ? "bg-red-50 border-red-200 cursor-pointer hover:bg-red-100" :
                    singleStatus === 'Reg Pending' ? "bg-orange-50 border-orange-200" :
                    singleStatus === 'Leave Approved' ? "bg-blue-50 border-blue-200" :
                    singleStatus === 'Leave Pending' ? "bg-yellow-50 border-yellow-200" : ""
                  )}
                >
                  <div className="flex justify-between items-start mb-1">
                    {singleStatus === 'Absent' && currentUser.role === 'Employee' && !isWeekend(date) && (
                      <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Fix</span>
                    )}
                    <div className="text-xs font-medium text-right pr-1 ml-auto">
                      {format(date, "d")}
                    </div>
                  </div>
                  
                  {selectedUserId === 'ALL' && !isWeekend(date) && (
                    <div className="flex-1 flex flex-col justify-end gap-0.5 text-[9px] font-medium px-0.5">
                      {statuses['Present'] > 0 && <div className="text-emerald-700 bg-emerald-100 rounded px-1">{statuses['Present']} Prs</div>}
                      {statuses['Leave Approved'] > 0 && <div className="text-blue-700 bg-blue-100 rounded px-1">{statuses['Leave Approved']} Lva</div>}
                      {statuses['Leave Pending'] > 0 && <div className="text-yellow-700 bg-yellow-100 rounded px-1">{statuses['Leave Pending']} Lvp</div>}
                      {statuses['Reg Pending'] > 0 && <div className="text-orange-700 bg-orange-100 rounded px-1">{statuses['Reg Pending']} Reg</div>}
                      {statuses['Absent'] > 0 && <div className="text-red-700 bg-red-100 rounded px-1">{statuses['Absent']} Abs</div>}
                    </div>
                  )}
                  {selectedUserId !== 'ALL' && singleStatus !== 'None' && !isWeekend(date) && (
                     <div className="flex-1 flex items-center justify-center">
                       {singleStatus === 'Present' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                       {singleStatus === 'Absent' && <XCircle className="h-4 w-4 text-red-500" />}
                       {singleStatus === 'Leave Approved' && <CalendarIcon className="h-4 w-4 text-blue-500" />}
                       {singleStatus === 'Leave Pending' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                       {singleStatus === 'Reg Pending' && <HelpCircle className="h-4 w-4 text-orange-500 animate-pulse" />}
                     </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 justify-center">
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Present</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500"></div> Absent</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div> Leave (Approved)</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div> Leave (Pending)</div>
            <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div> Reg (Pending)</div>
          </div>
        </div>
        
        {/* Right Side: Actions & Info */}
        <div className="w-full lg:w-80 flex flex-col bg-gray-50/30 overflow-y-auto">
          
          {currentUser.role === 'Employee' && (
            <div className="p-4 border-b border-gray-100 shrink-0">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Request Leave</h4>
              <form onSubmit={handleSubmitLeave} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">Start</label>
                    <input type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className="w-full text-xs p-1.5 border border-gray-300 rounded" />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 uppercase">End</label>
                    <input type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className="w-full text-xs p-1.5 border border-gray-300 rounded" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Reason</label>
                  <input type="text" required placeholder="Medical, Vacation..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} className="w-full text-xs p-1.5 border border-gray-300 rounded" />
                </div>
                <button type="submit" disabled={actionLoading} className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-2 rounded flex items-center justify-center gap-2">
                  <Send className="h-3.5 w-3.5" /> Submit Request
                </button>
              </form>
            </div>
          )}

          {currentUser.role !== 'Employee' && (
            <div className="flex flex-col gap-4 p-4 shrink-0">
              {/* Regularization Approvals */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-orange-500" /> Pending Regularizations ({pendingRegs.length})
                </h4>
                <div className="space-y-3">
                  {pendingRegs.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No pending regularizations.</p>
                  ) : (
                    pendingRegs.map(req => (
                      <div key={req.id} className="bg-white border border-orange-200 rounded-lg p-3 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
                        <div className="text-xs font-semibold text-gray-900">{getUserName(req.userId)}</div>
                        <div className="text-[10px] text-gray-500 mb-1">
                          Date: {format(parseISO(req.date), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded mb-2">
                          {req.reason}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateRegStatus(req, 'Approved')} className="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium py-1 rounded">Approve</button>
                          <button onClick={() => handleUpdateRegStatus(req, 'Rejected')} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium py-1 rounded">Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Leave Approvals */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-yellow-500" /> Pending Leaves ({pendingLeaves.length})
                </h4>
                <div className="space-y-3">
                  {pendingLeaves.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">No pending leave requests.</p>
                  ) : (
                    pendingLeaves.map(leave => (
                      <div key={leave.id} className="bg-white border border-yellow-200 rounded-lg p-3 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400"></div>
                        <div className="text-xs font-semibold text-gray-900">{getUserName(leave.userId)}</div>
                        <div className="text-[10px] text-gray-500 mb-1">
                          {format(parseISO(leave.startDate), "MMM d")} - {format(parseISO(leave.endDate), "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 p-1.5 rounded mb-2">
                          {leave.reason}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Approved')} className="flex-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium py-1 rounded">Approve</button>
                          <button onClick={() => handleUpdateLeaveStatus(leave.id, 'Rejected')} className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 text-xs font-medium py-1 rounded">Reject</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          
          {currentUser.role === 'Employee' && (
            <div className="p-4 flex flex-col gap-4 border-t border-gray-100 shrink-0">
              
              {/* Employee Pending Regularizations list */}
              {regRequests.filter(r => r.userId === currentUser.id && r.status === 'Pending').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Pending Regularizations</h4>
                  <div className="space-y-2">
                    {regRequests.filter(r => r.userId === currentUser.id && r.status === 'Pending').map(r => (
                      <div key={r.id} className="text-xs border border-orange-100 bg-orange-50 rounded p-2">
                        <div className="font-medium">{format(parseISO(r.date), "MMM d")} - Pending</div>
                        <div className="text-[10px] text-gray-500">{r.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Employee Leave History */}
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Your Recent Leaves</h4>
                <div className="space-y-2">
                  {leaveRequests.filter(l => l.userId === currentUser.id).slice(0, 5).map(leave => (
                    <div key={leave.id} className="text-xs border border-gray-100 bg-white rounded p-2 flex justify-between items-center">
                      <div>
                        <div className="font-medium">{format(parseISO(leave.startDate), "MMM d")} - {format(parseISO(leave.endDate), "MMM d")}</div>
                        <div className="text-[10px] text-gray-500">{leave.reason}</div>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-medium",
                        leave.status === 'Approved' ? "bg-blue-100 text-blue-700" :
                        leave.status === 'Pending' ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      )}>
                        {leave.status}
                      </span>
                    </div>
                  ))}
                  {leaveRequests.filter(l => l.userId === currentUser.id).length === 0 && (
                    <p className="text-xs text-gray-500 italic">No history found.</p>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Regularization Modal */}
      {showRegModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Regularize Attendance</h3>
              <button onClick={() => setShowRegModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitReg} className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-1">Date</div>
                <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">
                  {format(showRegModal.date, "EEEE, MMMM d, yyyy")}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Missing Punch</label>
                <textarea 
                  required 
                  rows={3} 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none" 
                  placeholder="e.g., Forgot to clock in, Client meeting off-site, System error..." 
                  value={regReason} 
                  onChange={e => setRegReason(e.target.value)} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowRegModal(null)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" disabled={actionLoading} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  <Send className="h-4 w-4" /> Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

