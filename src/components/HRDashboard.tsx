import React, { useEffect, useState } from "react";
import { User, TimeLog, LeaveRequest, DailyTask, TaskReport } from "../types";
import { Users, Building2, Clock, Mail, Plane, CheckCircle, XCircle, FileSpreadsheet, Download, Calendar, Activity, TrendingUp, Target, Send } from "lucide-react";
import { formatIST, formatHours } from "../utils";
import { cn } from "../utils";
import { AttendanceExportModal } from "./AttendanceExportModal";
import { MeetingHubModule } from "./MeetingHubModule";
import { TargetDashboardModule } from "./TargetDashboardModule";
import { AttendanceCalendarModule } from "./AttendanceCalendarModule";
import { CRMModule } from "./CRMModule";
import { LeaderboardModule, IncentiveDashboard } from "./SalesMetricsModule";
import { ResourceLibraryModule } from "./ResourceLibraryModule";
import { HROffboarding } from "./OffboardingModule";
import { PayrollModule } from "./PayrollModule";
import { TicketingModule, ExpensesModule } from "./SupportModule";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function HRDashboard({ currentUser, users, refreshUsers }: { currentUser: User, users: User[], refreshUsers: () => void }) {
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [taskReports, setTaskReports] = useState<TaskReport[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTargetCount, setNewTaskTargetCount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    let unsubscribeTimeLogs: () => void;
    let unsubscribeLeaveRequests: () => void;
    let unsubscribeDailyTasks: () => void;
    let unsubscribeTaskReports: () => void;

    const setupRealtime = async () => {
      setLoading(true);
      try {
        const { collection, onSnapshot, query, orderBy } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        unsubscribeTimeLogs = onSnapshot(collection(db, "timeLogs"), (snapshot) => {
          const tData: any[] = [];
          snapshot.forEach(doc => tData.push({ id: doc.id, ...doc.data() }));
          setTimeLogs(tData);
        });

        unsubscribeLeaveRequests = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
          const lData: any[] = [];
          snapshot.forEach(doc => lData.push({ id: doc.id, ...doc.data() }));
          setLeaveRequests(lData);
        });

        unsubscribeDailyTasks = onSnapshot(collection(db, "dailyTasks"), (snapshot) => {
          const dData: any[] = [];
          snapshot.forEach(doc => dData.push({ id: doc.id, ...doc.data() }));
          // Sort descending by date locally or in query, let's sort locally for simplicity
          setDailyTasks(dData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        });

        unsubscribeTaskReports = onSnapshot(collection(db, "taskReports"), (snapshot) => {
          const rData: any[] = [];
          snapshot.forEach(doc => rData.push({ id: doc.id, ...doc.data() }));
          setTaskReports(rData);
          setLoading(false);
        });

      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribeTimeLogs) unsubscribeTimeLogs();
      if (unsubscribeLeaveRequests) unsubscribeLeaveRequests();
      if (unsubscribeDailyTasks) unsubscribeDailyTasks();
      if (unsubscribeTaskReports) unsubscribeTaskReports();
    };
  }, []);

  const fetchData = async () => {
    // Kept for backward compatibility, state handled by onSnapshot
  };

  const updateLeaveStatus = async (id: string, status: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await updateDoc(doc(db, "leaveRequests", id), { status });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const createDailyTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskTargetCount) return;
    
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const todayIST = formatIST(new Date().toISOString(), "yyyy-MM-dd");
      
      await addDoc(collection(db, "dailyTasks"), {
        date: todayIST,
        title: newTaskTitle,
        description: `Please complete the target of ${newTaskTargetCount} for ${newTaskTitle}`,
        targetCount: Number(newTaskTargetCount),
        createdBy: currentUser.id,
        createdAt: new Date().toISOString()
      });
      
      setNewTaskTitle("");
      setNewTaskTargetCount("");
    } catch (error) {
      console.error("Error creating daily task:", error);
    }
  };

  const hrUsers = users.filter(u => u.department === currentUser.department);
  const pendingUsers = users.filter(u => u.status === "Pending");
  const approvedUsers = users.filter(u => u.status === "Approved");
  const pendingLeaves = leaveRequests.filter(req => req.status === "Pending");
  const activeLogs = timeLogs.filter(l => !l.clockOut);

  // --- Analytics Data Calculation ---
  const getAttendanceTrends = () => {
    const trends: Record<string, Set<string>> = {};
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return formatIST(d.toISOString(), "MMM dd");
    });
    
    last7Days.forEach(day => { trends[day] = new Set(); });

    timeLogs.forEach(log => {
      const logDay = formatIST(log.clockIn, "MMM dd");
      if (trends[logDay]) {
        trends[logDay].add(log.userId);
      }
    });

    return last7Days.map(day => ({
      name: day,
      Employees: trends[day].size
    }));
  };

  const getPeakWorkingHours = () => {
    const hoursCount = new Array(24).fill(0);
    
    timeLogs.forEach(log => {
      try {
        const istTimeStr = new Date(log.clockIn).toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        const hour = new Date(istTimeStr).getHours();
        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          hoursCount[hour]++;
        }
      } catch (e) {
        // Ignore parsing errors for invalid dates
      }
    });

    // Filter to show active working hours roughly between 6 AM and 10 PM
    return hoursCount.map((count, index) => {
      const hourLabel = index === 0 ? "12 AM" : index < 12 ? `${index} AM` : index === 12 ? "12 PM" : `${index - 12} PM`;
      return {
        name: hourLabel,
        Shifts: count,
        hour: index
      };
    }).filter(data => data.hour >= 6 && data.hour <= 22);
  };

  const attendanceData = getAttendanceTrends();
  const peakHoursData = getPeakWorkingHours();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-purple-600" />
            HR Team Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Manage onboarding pipelines, attendance records, and payroll reports.</p>
        </div>
        <button
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:from-purple-700 hover:to-indigo-700 transition-all focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Attendance (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Pipeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              Candidate Onboarding Pipeline
            </h3>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {users.map(user => (
                <li key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-sm text-gray-500">{user.role} &middot; {user.department}</p>
                    {user.email && (
                      <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                        <Mail className="h-3 w-3" /> {user.email}
                      </p>
                    )}
                  </div>
                  <span className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full",
                    user.status === "Approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  )}>
                    {user.status === "Approved" ? "Provisioned" : "Awaiting Admin"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* HR Actions Column - AttendanceCalendarModule */}
        <div className="grid grid-cols-1 gap-6">
           <AttendanceCalendarModule currentUser={currentUser} />
        </div>
      </div>

      {/* Daily Targets & Tasks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Set Daily Targets</h3>
              <p className="text-sm text-gray-500">Assign KYC or daily task targets to employees.</p>
            </div>
          </div>
          
          <form onSubmit={createDailyTask} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Name</label>
              <input 
                type="text" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. KYC Target"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 p-2 border"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Count</label>
              <input 
                type="number" 
                value={newTaskTargetCount}
                onChange={(e) => setNewTaskTargetCount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 50"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-pink-500 focus:ring-pink-500 p-2 border"
                required
                min="1"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-all focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              <Send className="h-4 w-4" />
              Broadcast Target to Staff
            </button>
          </form>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col max-h-[420px]">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <div className="p-1.5 bg-green-100 text-green-600 rounded-lg">
              <CheckCircle className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-gray-900">Today's Submissions</h3>
          </div>
          <div className="p-0 overflow-y-auto flex-1">
            {taskReports.filter(r => r.date === formatIST(new Date().toISOString(), "yyyy-MM-dd")).length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>No submissions for today yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {taskReports.filter(r => r.date === formatIST(new Date().toISOString(), "yyyy-MM-dd")).map(report => (
                  <li key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-gray-900">{report.userName}</p>
                      <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {report.completedCount} Completed
                      </span>
                    </div>
                    {report.notes && <p className="text-sm text-gray-600 mt-1 italic">"{report.notes}"</p>}
                    <p className="text-xs text-gray-400 mt-2">Submitted at {formatIST(report.submittedAt, "p")}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ClickCamp Technologies Specific Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardModule currentUser={currentUser} users={users} />
        <ResourceLibraryModule currentUser={currentUser} />
        <TargetDashboardModule currentUser={currentUser} />
        <MeetingHubModule currentUser={currentUser} />
      </div>

      <div className="mt-6 mb-6">
        <CRMModule currentUser={currentUser} />
      </div>

      <div className="mb-6">
        <HROffboarding currentUser={currentUser} users={users} timeLogs={timeLogs} leaveRequests={leaveRequests} />
      </div>

      <div className="mb-6">
        <PayrollModule currentUser={currentUser} users={users} timeLogs={timeLogs} leaveRequests={leaveRequests} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <TicketingModule currentUser={currentUser} />
        <ExpensesModule currentUser={currentUser} />
      </div>

      {/* Productivity Analytics Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Productivity Analytics</h3>
            <p className="text-sm text-gray-500">Visualize team attendance trends and peak working hours.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Attendance Trends Chart */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              7-Day Attendance Trend
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={attendanceData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4b5563' }} />
                  <Line type="monotone" dataKey="Employees" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Working Hours Chart */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Peak Working Hours
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4b5563' }} />
                  <Bar dataKey="Shifts" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance & Payroll Reporting Quick Bar */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/70 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 text-white rounded-lg">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Attendance & Payroll Export Center</h3>
            </div>
            <p className="text-sm text-gray-600 max-w-2xl">
              Export comprehensive attendance logs, calculated work hours, and daily/monthly summaries formatted for payroll processing and auditing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm hover:shadow focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4" />
              Export Custom CSV Report
            </button>
          </div>
        </div>
      </div>

      {/* Export Configuration Modal */}
      <AttendanceExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        users={users}
        timeLogs={timeLogs}
        leaveRequests={leaveRequests}
      />
    </div>
  );
}
