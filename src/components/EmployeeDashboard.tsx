import React, { useEffect, useState } from "react";
import {
  User,
  ClientAccount,
  TimeLog,
  Lead,
  LeaveRequest,
  RegularizationRequest,
  ResignationRequest,
} from "../types";
import {
  format,
  isToday,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  isWeekend,
  isPast,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import {
  Clock,
  Plus,
  Target,
  Users,
  User as UserIcon,
  Bell,
  LogOut,
  CheckCircle,
  Target as TargetIcon,
  Briefcase,
  FileText,
  X,
  Send,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Phone,
} from "lucide-react";
import { cn } from "../utils";
import { formatIST } from "../utils";

export function EmployeeDashboard({
  currentUser,
  users,
  onBack,
  onLogout,
}: {
  currentUser: User;
  users: User[];
  onBack?: () => void;
  onLogout?: () => void;
}) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [accounts, setAccounts] = useState<ClientAccount[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [regRequests, setRegRequests] = useState<RegularizationRequest[]>([]);
  const [topPerformers, setTopPerformers] = useState<
    { id: string; count: number }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals & Drawers
  const [showLogAccount, setShowLogAccount] = useState(false);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showResignationModal, setShowResignationModal] = useState(false);
  const [showFullCalendarModal, setShowFullCalendarModal] = useState(false);
  const [showRegularizationModal, setShowRegularizationModal] =
    useState<Date | null>(null);
  const [showPipelineDrawer, setShowPipelineDrawer] = useState(false);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);

  // Forms
  const [clientName, setClientName] = useState("");
  const [platform, setPlatform] = useState("ClickCamp Pro");
  const [clientPhone, setClientPhone] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadCompany, setLeadCompany] = useState("");

  // Leave Form
  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveType, setLeaveType] = useState("Casual");

  // Resignation Form
  const [lwd, setLwd] = useState("");
  const [resignationReason, setResignationReason] = useState("");

  // Regularization Form
  const [regReasonType, setRegReasonType] = useState("Forgot to Punch");
  const [regReasonText, setRegReasonText] = useState("");

  // Calendar View
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const loadData = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, where } =
          await import("firebase/firestore");
        const { db } = await import("../lib/firebase");

        // Time Logs
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "timeLogs"),
              where("userId", "==", currentUser.id),
            ),
            (snap) => {
              const data: any[] = [];
              snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
              setTimeLogs(data);
            },
          ),
        );

        // Client Accounts
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "clientAccounts"),
              where("submittedBy", "==", currentUser.id),
            ),
            (snap) => {
              const data: any[] = [];
              snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
              setAccounts(data);
            },
          ),
        );

        // Top Performers
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "clientAccounts"),
              where("status", "==", "Verified"),
            ),
            (snap) => {
              const counts: Record<string, number> = {};
              snap.forEach((doc) => {
                const data = doc.data();
                counts[data.submittedBy] = (counts[data.submittedBy] || 0) + 1;
              });
              const sorted = Object.entries(counts)
                .map(([id, count]) => ({ id, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 3);
              setTopPerformers(sorted);
            },
          ),
        );

        // Leads
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "leads"),
              where("ownerId", "==", currentUser.id),
            ),
            (snap) => {
              const data: any[] = [];
              snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
              setLeads(data);
            },
          ),
        );

        // Leaves
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "leaveRequests"),
              where("userId", "==", currentUser.id),
            ),
            (snap) => {
              const data: any[] = [];
              snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
              setLeaveRequests(data);
            },
          ),
        );

        // Regularizations
        unsubs.push(
          onSnapshot(
            query(
              collection(db, "regularizationRequests"),
              where("userId", "==", currentUser.id),
            ),
            (snap) => {
              const data: any[] = [];
              snap.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
              setRegRequests(data);
            },
          ),
        );

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    loadData();
    return () => unsubs.forEach((u) => u());
  }, [currentUser]);

  const todayLog = timeLogs.find((log) => isToday(parseISO(log.clockIn)));

  const handleClockInOut = async () => {
    setActionLoading(true);
    try {
      const { collection, addDoc, updateDoc, doc } =
        await import("firebase/firestore");
      const { db } = await import("../lib/firebase");

      if (!todayLog) {
        await addDoc(collection(db, "timeLogs"), {
          userId: currentUser.id,
          clockIn: new Date().toISOString(),
        });
      } else if (!todayLog.clockOut) {
        const outTime = new Date();
        const inTime = parseISO(todayLog.clockIn);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);

        await updateDoc(doc(db, "timeLogs", todayLog.id), {
          clockOut: outTime.toISOString(),
          totalHours: Number(hours.toFixed(2)),
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) return;
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const docRef = await addDoc(collection(db, "clientAccounts"), {
        clientName,
        platform,
        status: "Pending Verification",
        submittedBy: currentUser.id,
        submittedByName: `${currentUser.firstName} ${currentUser.lastName}`,
        submittedAt: new Date().toISOString(),
        clientPhone,
        referenceId,
      });
      await logActivity(`submitted account ${clientName} for verification`, docRef.id, 'ClientAccount', `Platform: ${platform}`);
      setClientName("");
      setClientPhone("");
      setReferenceId("");
      setShowLogAccount(false);
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadCompany) return;
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const leadDoc = await addDoc(collection(db, "leads"), {
        name: leadName,
        company: leadCompany,
        status: "Lead",
        value: 0,
        ownerId: currentUser.id,
        createdAt: new Date().toISOString(),
        lastContacted: new Date().toISOString(),
      });
      setLeadName("");
      setLeadCompany("");
      setShowAddLead(false);
    } catch (e) {
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
        startDate: new Date(leaveStart).toISOString(),
        endDate: new Date(leaveEnd).toISOString(),
        reason: `[${leaveType}] ${leaveReason}`,
        status: "Pending",
      });
      setShowLeaveModal(false);
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitResignation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lwd || !resignationReason) return;
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "resignations"), {
        userId: currentUser.id,
        lastWorkingDay: new Date(lwd).toISOString(),
        reason: resignationReason,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      });
      setShowResignationModal(false);
      setLwd("");
      setResignationReason("");
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitRegularization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRegularizationModal) return;
    setActionLoading(true);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "regularizationRequests"), {
        userId: currentUser.id,
        date: showRegularizationModal.toISOString(),
        reason: `${regReasonType} - ${regReasonText}`,
        status: "Pending",
        submittedAt: new Date().toISOString(),
      });
      setShowRegularizationModal(null);
      setRegReasonText("");
    } catch (e) {
    } finally {
      setActionLoading(false);
    }
  };


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

  const updateLeadStatus = async (id: string, status: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "leads", id), { status, updatedAt: new Date().toISOString() });
      await logActivity(`moved lead to ${status}`, id, 'Lead');
    } catch (e) {
      console.error(e);
    }
  };

  // Performance calculations
  const targetCount = currentUser.target || 10;
  const verifiedAccounts = accounts.filter(
    (a) => a.status === "Verified",
  ).length;
  const progressPercent = Math.min((verifiedAccounts / targetCount) * 100, 100);
  const estCommission = verifiedAccounts * 500;

  // Weekly Calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i),
  );

  const endOfDay = (date: Date) => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };
  const isFutureDate = (date: Date) =>
    date.getTime() > endOfDay(new Date()).getTime();

  const getDayStatus = (date: Date) => {
    if (isFutureDate(date)) return "future";

    const isLeave = leaveRequests.find(
      (l) =>
        l.status === "Approved" &&
        date >= parseISO(l.startDate) &&
        date <= parseISO(l.endDate),
    );
    if (isLeave) return "blue";

    const log = timeLogs.find((l) => isSameDay(parseISO(l.clockIn), date));
    if (log) return "present";

    const isPendingReg = regRequests.find(
      (r) => r.status === "Pending" && isSameDay(parseISO(r.date), date),
    );
    const isPendingLeave = leaveRequests.find(
      (l) =>
        l.status === "Pending" &&
        date >= parseISO(l.startDate) &&
        date <= parseISO(l.endDate),
    );
    if (isPendingReg || isPendingLeave) return "yellow";

    if (isWeekend(date)) return "weekend";
    if (isPast(date) && !isToday(date)) return "absent";

    return "today";
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-[#05050A]">
        <div className="animate-pulse text-purple-500 font-medium">
          Loading workspace...
        </div>
      </div>
    );

  const renderCalendarGrid = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    return (
      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 mb-2"
          >
            {d}
          </div>
        ))}
        {days.map((date, i) => {
          const status = getDayStatus(date);
          const currentMonthClass =
            date.getMonth() === currentMonth.getMonth()
              ? "text-white"
              : "text-gray-700";
          return (
            <div
              key={i}
              onClick={() => {
                if (status === "absent") setShowRegularizationModal(date);
              }}
              className={cn(
                "h-10 rounded-xl flex items-center justify-center text-xs font-bold border transition-colors relative group",
                status === "present"
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                  : status === "absent"
                    ? "bg-red-500/20 border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/30"
                    : status === "yellow"
                      ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                      : status === "blue"
                        ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                        : status === "today"
                          ? "bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                          : "bg-white/5 border-transparent",
                currentMonthClass,
              )}
            >
              {format(date, "d")}
              {status === "absent" && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-[#05050A] min-h-screen text-gray-100 font-sans pb-20 sm:pb-6 selection:bg-purple-500/30 relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#0A0A0E]/80 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1 text-gray-400 hover:text-white transition-colors mr-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/20 p-1">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-full h-full object-contain brightness-0 invert"
            />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">
            Click.camp
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNotificationsDrawer(true)}
            className="relative p-2 text-gray-400 hover:text-white transition-colors"
          >
            <Bell className="w-5 h-5" />
            {(leaveRequests.some(
              (l) => l.status === "Approved" || l.status === "Rejected",
            ) ||
              regRequests.some((r) => r.status !== "Pending")) && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setShowProfileDrawer(true)}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-[2px] cursor-pointer"
          >
            <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="p-2 ml-1 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-full transition-colors hidden sm:block"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Timeclock Widget */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                todayLog
                  ? todayLog.clockOut
                    ? "bg-gray-800 text-gray-400"
                    : "bg-emerald-500/20 text-emerald-400"
                  : "bg-blue-500/20 text-blue-400",
              )}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">
                {todayLog
                  ? todayLog.clockOut
                    ? "Shift Completed"
                    : "Clocked In"
                  : "Clocked Out"}
              </div>
              <div className="text-xs text-gray-400">
                {todayLog
                  ? todayLog.clockOut
                    ? `Total: ${todayLog.totalHours}h`
                    : `Since ${formatIST(todayLog.clockIn, "h:mm a")}`
                  : "Ready for shift"}
              </div>
            </div>
          </div>
          <button
            onClick={handleClockInOut}
            disabled={actionLoading || (todayLog && !!todayLog.clockOut)}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg",
              todayLog
                ? todayLog.clockOut
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                  : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 border border-transparent",
            )}
          >
            {actionLoading
              ? "..."
              : todayLog
                ? todayLog.clockOut
                  ? "Done"
                  : "Clock Out"
                : "Clock In"}
          </button>
        </div>

        {/* Unified Performance Hub */}
        <div className="bg-gradient-to-br from-[#1A1A24] to-[#111116] border border-white/10 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <TargetIcon className="w-4 h-4 text-purple-400" /> Monthly Goal
          </h2>
          <div className="flex flex-col sm:flex-row items-center gap-8 relative z-10">
            {/* Progress Ring */}
            <div className="relative w-32 h-32 shrink-0">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * progressPercent) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient
                    id="gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">
                  {verifiedAccounts}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">
                  / {targetCount}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div>
                <div className="text-xs text-gray-400 font-medium mb-1">
                  Target Progress
                </div>
                <div className="text-lg font-bold text-white">
                  {progressPercent.toFixed(1)}% Completed
                </div>
              </div>
              <div className="h-px w-full bg-white/10"></div>
              <div>
                <div className="text-xs text-gray-400 font-medium mb-1">
                  Est. Commission
                </div>
                <div className="text-3xl font-black text-emerald-400 tracking-tight font-mono">
                  ₹{estCommission.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowLogAccount(true)}
            className="bg-[#111116] hover:bg-[#1A1A24] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all group shadow-lg"
          >
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-sm font-bold text-white">Log Account</span>
          </button>
          <button
            onClick={() => setShowAddLead(true)}
            className="bg-[#111116] hover:bg-[#1A1A24] border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 transition-all group shadow-lg"
          >
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-sm font-bold text-white">Add Lead</span>
          </button>
        </div>

        {/* Compact Weekly Calendar */}
        <div className="bg-[#111116] border border-white/10 rounded-2xl p-5 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white">This Week</h3>
            <button
              onClick={() => setShowFullCalendarModal(true)}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium"
            >
              Full Calendar
            </button>
          </div>
          <div className="flex justify-between items-center">
            {weekDays.map((date, i) => {
              const status = getDayStatus(date);
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase",
                      isToday(date) ? "text-purple-400" : "text-gray-500",
                    )}
                  >
                    {format(date, "EE")}
                  </span>
                  <div
                    onClick={() => {
                      if (status === "absent") setShowRegularizationModal(date);
                    }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border",
                      status === "present"
                        ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
                        : status === "absent"
                          ? "bg-red-500/20 border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/30 relative"
                          : status === "yellow"
                            ? "bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                            : status === "blue"
                              ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                              : status === "today"
                                ? "bg-purple-500/20 border-purple-500/50 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]"
                                : "bg-white/5 border-transparent text-gray-600",
                    )}
                  >
                    {format(date, "d")}
                    {status === "absent" && (
                      <div className="absolute top-0 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse border border-[#111116]"></div>
                    )}
                  </div>
                  <div className="h-1 w-1 rounded-full mt-1">
                    {status === "present" && (
                      <div className="w-full h-full bg-emerald-400 rounded-full"></div>
                    )}
                    {status === "absent" && (
                      <div className="w-full h-full bg-red-400 rounded-full"></div>
                    )}
                    {status === "yellow" && (
                      <div className="w-full h-full bg-yellow-400 rounded-full"></div>
                    )}
                    {status === "blue" && (
                      <div className="w-full h-full bg-blue-400 rounded-full"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Secondary Scrollable Cards */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-2">
            Pipeline & Updates
          </h3>
          <div className="flex overflow-x-auto pb-4 -mx-4 px-4 gap-4 snap-x snap-mandatory hide-scrollbar">
            {/* Lead Pipeline Summary */}
            <div
              onClick={() => setShowPipelineDrawer(true)}
              className="cursor-pointer shrink-0 w-64 bg-[#111116] border border-white/10 rounded-2xl p-4 snap-start shadow-lg hover:bg-[#1a1a24] transition-colors group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-400" />
                  <h4 className="text-sm font-bold text-white">Pipeline</h4>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-2xl font-black text-white mb-1">
                {leads.length} Active
              </div>
              <div className="text-xs text-gray-400">Leads assigned to you</div>
            </div>

            {/* Meeting Hub Summary */}
            <div className="shrink-0 w-64 bg-[#111116] border border-white/10 rounded-2xl p-4 snap-start shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-pink-400" />
                <h4 className="text-sm font-bold text-white">Daily Huddle</h4>
              </div>
              <div className="text-sm font-medium text-gray-200 mb-1 line-clamp-1">
                Q3 Kickoff Sync
              </div>
              <button className="text-xs text-pink-400 hover:text-pink-300 font-medium">
                Read Summary &rarr;
              </button>
            </div>

            {/* Top Performers */}
            <div className="shrink-0 w-64 bg-[#111116] border border-white/10 rounded-2xl p-4 snap-start shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <TargetIcon className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Top Performers</h4>
              </div>
              <div className="flex -space-x-2">
                {topPerformers.length > 0 ? (
                  topPerformers.map((tp, idx) => {
                    const user = users.find((u) => u.id === tp.id);
                    const initials = user
                      ? `${user.firstName[0]}${user.lastName[0]}`
                      : `U${idx + 1}`;
                    return (
                      <div
                        key={tp.id}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 border-2 border-[#111116] flex items-center justify-center text-[10px] font-bold text-white relative z-10 hover:z-20 hover:scale-110 transition-transform"
                        title={
                          user
                            ? `${user.firstName} ${user.lastName} - ${tp.count} Accounts`
                            : `${tp.count} Accounts`
                        }
                      >
                        {initials}
                      </div>
                    );
                  })
                ) : (
                  <span className="text-xs text-gray-500">No records</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Profile Drawer */}
      {showProfileDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111116] w-full sm:w-96 h-full border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">My Profile</h3>
              <button
                onClick={() => setShowProfileDrawer(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-[3px] mb-4">
                  <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                    <UserIcon className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h2 className="text-xl font-black text-white">
                  {currentUser.firstName} {currentUser.lastName}
                </h2>
                <p className="text-sm text-gray-400">
                  {currentUser.department} • {currentUser.role}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Employee ID
                    </div>
                    <div className="text-sm font-bold text-white uppercase">
                      {currentUser.id}
                    </div>
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs text-gray-500 font-medium">
                      Assigned Manager
                    </div>
                    <div className="text-sm font-bold text-white">
                      HR Department
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-white/10">
                <button
                  onClick={() => setShowLeaveModal(true)}
                  className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 py-3 rounded-xl font-bold transition-colors"
                >
                  Apply for Leave
                </button>
                <button
                  onClick={() => setShowResignationModal(true)}
                  className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-bold transition-colors"
                >
                  Submit Resignation
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-white/10">
              <button
                onClick={() => {
                  setShowProfileDrawer(false);
                  if (onLogout) onLogout();
                }}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111116] w-full max-w-md rounded-3xl border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Apply for Leave</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitLeave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveStart}
                    onChange={(e) => setLeaveStart(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={leaveEnd}
                    onChange={(e) => setLeaveEnd(e.target.value)}
                    className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Leave Type
                </label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500"
                >
                  <option>Casual</option>
                  <option>Sick</option>
                  <option>Earned</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Reason
                </label>
                <textarea
                  required
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-purple-500 placeholder-gray-600"
                  placeholder="Please provide details..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                Submit to HR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Resignation Modal */}
      {showResignationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111116] w-full max-w-md rounded-3xl border border-red-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" /> Submit Resignation
              </h3>
              <button
                onClick={() => setShowResignationModal(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmitResignation} className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl mb-4">
                <p className="text-xs text-red-300 font-medium">
                  Warning: This action is official. Your resignation will be
                  submitted to the HR and CEO for immediate review.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Last Working Day (Notice Period)
                </label>
                <input
                  type="date"
                  required
                  value={lwd}
                  onChange={(e) => setLwd(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Exit Reason
                </label>
                <textarea
                  required
                  value={resignationReason}
                  onChange={(e) => setResignationReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-red-500 placeholder-gray-600"
                  placeholder="Please explain your reason for leaving..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-50"
              >
                Submit Official Notice
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Regularization Modal */}
      {showRegularizationModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111116] w-full max-w-md rounded-3xl border border-yellow-500/30 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-yellow-400">
                Attendance Regularization
              </h3>
              <button
                onClick={() => setShowRegularizationModal(null)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleSubmitRegularization}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Missed Date
                </label>
                <div className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white font-medium">
                  {format(showRegularizationModal, "MMMM d, yyyy")}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Reason for Missed Punch
                </label>
                <select
                  value={regReasonType}
                  onChange={(e) => setRegReasonType(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-yellow-500"
                >
                  <option>System Error</option>
                  <option>Client Meeting Offsite</option>
                  <option>Forgot to Punch</option>
                  <option>Worked Late</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Detailed Explanation
                </label>
                <textarea
                  required
                  value={regReasonText}
                  onChange={(e) => setRegReasonText(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white outline-none focus:border-yellow-500 placeholder-gray-600"
                  placeholder="Provide context for HR..."
                ></textarea>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-4 rounded-xl font-bold text-black bg-yellow-500 hover:bg-yellow-400 transition-all disabled:opacity-50"
              >
                Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Full Calendar Modal */}
      {showFullCalendarModal && (
        <div className="fixed inset-0 z-[55] flex flex-col bg-[#05050A]/95 backdrop-blur-md animate-in fade-in duration-200">
          <header className="px-4 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0E]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFullCalendarModal(false)}
                className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-lg text-white">Full Calendar</h2>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <span className="hidden sm:inline">Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <span className="hidden sm:inline">Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                <span className="hidden sm:inline">Pending</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400"></div>
                <span className="hidden sm:inline">Approved</span>
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold text-white">
                  {format(currentMonth, "MMMM yyyy")}
                </h3>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-[#111116] border border-white/10 p-4 sm:p-6 rounded-3xl shadow-2xl">
                {renderCalendarGrid()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRM Pipeline Drawer */}
      {showPipelineDrawer && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#05050A] animate-in slide-in-from-right duration-300">
          <header className="px-4 py-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0E] shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPipelineDrawer(false)}
                className="p-2 -ml-2 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-lg text-white">Lead Pipeline</h2>
            </div>
          </header>

          <div className="flex-1 overflow-x-auto p-4 flex gap-4 h-full snap-x">
            {["Lead", "Documents Submitted", "Rejected", "Account Active"].map(
              (status) => {
                const colLeads = leads.filter((l) => l.status === status);
                return (
                  <div
                    key={status}
                    className="shrink-0 w-80 bg-[#111116] rounded-2xl border border-white/5 flex flex-col h-full snap-center"
                  >
                    <div className="p-4 border-b border-white/5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm text-gray-300">
                          {status === "Rejected"
                            ? "Rejected/KYC Issue"
                            : status}
                        </h3>
                        <span className="bg-white/10 text-xs font-bold px-2 py-0.5 rounded-full">
                          {colLeads.length}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 overflow-y-auto flex-1 space-y-3">
                      {colLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors shadow-lg"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white">
                              {lead.clientName || (lead as any).name}
                            </h4>
                            {status === "Rejected" && (
                              <span className="bg-red-500/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                                KYC Error
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 mb-3 space-y-1">
                            <div className="flex items-center gap-2">
                              <Phone className="w-3 h-3" />{" "}
                              {(lead as any).phone || "N/A"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Briefcase className="w-3 h-3" />{" "}
                              {(lead as any).company || "No Company"}
                            </div>
                          </div>
                          <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                            {status !== "Account Active" && (
                              <button
                                onClick={() =>
                                  updateLeadStatus(lead.id, "Account Active")
                                }
                                className="flex-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 py-2 rounded-lg hover:bg-emerald-500/20 transition-colors"
                              >
                                Won
                              </button>
                            )}
                            {status !== "Rejected" &&
                              status !== "Account Active" && (
                                <button
                                  onClick={() =>
                                    updateLeadStatus(lead.id, "Rejected")
                                  }
                                  className="flex-1 text-xs font-bold text-red-400 bg-red-500/10 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                                >
                                  Issue
                                </button>
                              )}
                            {status === "Rejected" && (
                              <button
                                onClick={() =>
                                  updateLeadStatus(
                                    lead.id,
                                    "Documents Submitted",
                                  )
                                }
                                className="flex-1 text-xs font-bold text-yellow-400 bg-yellow-500/10 py-2 rounded-lg hover:bg-yellow-500/20 transition-colors"
                              >
                                Fix KYC
                              </button>
                            )}
                            <a
                              href={`tel:${(lead as any).phone}`}
                              className="w-10 flex items-center justify-center text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20"
                            >
                              <Phone className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                      {colLeads.length === 0 && (
                        <div className="text-center p-6 text-gray-600 text-xs font-medium">
                          No leads in this stage
                        </div>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotificationsDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111116] w-full sm:w-96 h-full border-l border-white/10 shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h3>
              <button
                onClick={() => setShowNotificationsDrawer(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {regRequests
                .filter((r) => r.status !== "Pending")
                .map((r) => (
                  <div
                    key={r.id}
                    className="bg-black/40 border border-white/5 p-4 rounded-xl"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {formatIST(r.resolvedAt || r.submittedAt)}
                    </div>
                    <div className="text-sm text-white">
                      Regularization for{" "}
                      <span className="font-bold">
                        {formatIST(r.date, "MMM d")}
                      </span>{" "}
                      was{" "}
                      <span
                        className={
                          r.status === "Approved"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {r.status}
                      </span>
                      .
                    </div>
                  </div>
                ))}
              {leaveRequests
                .filter((l) => l.status !== "Pending")
                .map((l) => (
                  <div
                    key={l.id}
                    className="bg-black/40 border border-white/5 p-4 rounded-xl"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      Leave Update
                    </div>
                    <div className="text-sm text-white">
                      Your leave request for{" "}
                      <span className="font-bold">
                        {formatIST(l.startDate, "MMM d")}
                      </span>{" "}
                      was{" "}
                      <span
                        className={
                          l.status === "Approved"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {l.status}
                      </span>
                      .
                    </div>
                  </div>
                ))}
              {accounts
                .filter((a) => a.status !== "Pending Verification")
                .map((a) => (
                  <div
                    key={a.id}
                    className="bg-black/40 border border-white/5 p-4 rounded-xl"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      Account Verification
                    </div>
                    <div className="text-sm text-white">
                      Account <span className="font-bold">{a.clientName}</span>{" "}
                      was{" "}
                      <span
                        className={
                          a.status === "Verified"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {a.status}
                      </span>
                      .
                    </div>
                    {a.status === "Rejected" && a.reviewNotes && (
                      <div className="mt-2 text-xs text-red-300 bg-red-500/10 p-2 rounded border border-red-500/20">
                        <strong>Ops Note:</strong> {a.reviewNotes}
                      </div>
                    )}
                  </div>
                ))}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <div className="text-xs text-blue-300 mb-1">Announcement</div>
                <div className="text-sm text-blue-100 font-medium">
                  Q3 Kickoff Sync notes are now available in the Daily Huddle.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet Modals */}
      {showLogAccount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[#111116] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Log New Account</h3>
              <button
                onClick={() => setShowLogAccount(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Client Name
                </label>
                <input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Platform / Product
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all text-sm appearance-none"
                >
                  <option>ClickCamp Pro</option>
                  <option>ClickCamp Enterprise</option>
                  <option>Custom API Integration</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                Submit for Verification
              </button>
            </form>
          </div>
        </div>
      )}

      {showAddLead && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4">
          <div className="bg-[#111116] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Add New Lead</h3>
              <button
                onClick={() => setShowAddLead(false)}
                className="text-gray-400 hover:text-white bg-white/5 rounded-full p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddLead} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Lead Name
                </label>
                <input
                  required
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. John Smith"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase">
                  Company Name
                </label>
                <input
                  required
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. Globex Inc"
                />
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
              >
                Save Lead
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Global hide scrollbar styles */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
