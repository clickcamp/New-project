import React, { useEffect, useState } from "react";
import { User, TimeLog, ClientAccount, Lead } from "../types";
import { 
  Users, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  Send,
  CheckCircle,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn, formatIST } from "../utils";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { startOfWeek, endOfWeek, isWithinInterval, format, subWeeks, addWeeks } from "date-fns";

export function TeamLeaderDashboard({ currentUser, users }: { currentUser: User, users: User[] }) {
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [clientAccounts, setClientAccounts] = useState<ClientAccount[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudgeLoading, setNudgeLoading] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    // Filter users explicitly assigned to this TL
    const myTeam = users.filter(u => u.teamLeaderId === currentUser.id && u.role === "Employee");
    setTeamMembers(myTeam);
    
    if (myTeam.length === 0) {
      setLoading(false);
      return;
    }
    
    const teamIds = myTeam.map(u => u.id);
    let unsubs: (() => void)[] = [];

    const setupData = async () => {
      try {
        const { collection, onSnapshot, query, where, documentId } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");

        // We can't query "in" if array > 10, but team size is likely small. For safety, chunk or just fetch all and filter.
        // Or if we want strict data isolation, we should query where("userId", "in", teamIds).
        // Let's assume team size < 10 for "in" query, or just use multiple queries.
        // Actually, we can just query where("teamLeaderId", "==", currentUser.id) on users, but for logs, we don't have teamLeaderId.
        // A simple way to isolate: fetch all then filter, but requirement says "strict database queries".
        // If teamIds.length > 10, we'd need to chunk. Let's do chunking.
        
        const chunks = [];
        for (let i = 0; i < teamIds.length; i += 10) {
          chunks.push(teamIds.slice(i, i + 10));
        }

        chunks.forEach(chunk => {
          // Time logs
          unsubs.push(onSnapshot(
            query(collection(db, "timeLogs"), where("userId", "in", chunk)),
            (snap) => {
              const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));
              setTimeLogs(prev => {
                const filtered = prev.filter(l => !chunk.includes(l.userId));
                return [...filtered, ...data];
              });
            }
          ));
          
          // Client Accounts (for macro target / leaderboard)
          unsubs.push(onSnapshot(
            query(collection(db, "clientAccounts"), where("submittedBy", "in", chunk)),
            (snap) => {
              const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientAccount));
              setClientAccounts(prev => {
                const filtered = prev.filter(a => !chunk.includes(a.submittedBy));
                return [...filtered, ...data];
              });
            }
          ));

          // Leads Pipeline
          unsubs.push(onSnapshot(
            query(collection(db, "leads"), where("assignedTo", "in", chunk)),
            (snap) => {
              const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
              setLeads(prev => {
                // In crmLeads, ownerId is the field. Wait, in CRMModule it's ownerId. In Lead type it's assignedTo.
                // Actually the type says assignedTo. Let's use assignedTo.
                const filtered = prev.filter(l => !chunk.includes(l.assignedTo));
                return [...filtered, ...data];
              });
            }
          ));
        });

        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    setupData();

    return () => unsubs.forEach(u => u());
  }, [currentUser.id, users]);

  // Aggregate stats
  const macroTarget = teamMembers.length * 10; // e.g. 10 accounts per team member
  const verifiedAccounts = clientAccounts.filter(a => a.status === "Verified");
  const macroProgress = Math.min((verifiedAccounts.length / macroTarget) * 100, 100) || 0;

  // Leaderboard
  const leaderboard = teamMembers.map(member => {
    return {
      user: member,
      verifiedCount: verifiedAccounts.filter(a => a.submittedBy === member.id).length
    };
  }).sort((a, b) => b.verifiedCount - a.verifiedCount);

  // Send Nudge
  const sendNudge = async (employeeId: string, message: string) => {
    setNudgeLoading(employeeId);
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "appNotifications"), {
        userId: employeeId,
        type: "reminder",
        title: "Team Leader Nudge",
        message,
        createdAt: new Date().toISOString(),
        read: false
      });
      // Optionally show a toast
    } catch(e) {
      console.error(e);
    }
    setNudgeLoading(null);
  };


  const generatePDFReport = () => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    
    const weekAccounts = clientAccounts.filter(a => {
      if (!a.submittedAt) return false;
      const d = new Date(a.submittedAt);
      return isWithinInterval(d, { start, end });
    });

    const weekVerified = weekAccounts.filter(a => a.status === "Verified");
    const conversionRate = weekAccounts.length ? ((weekVerified.length / weekAccounts.length) * 100).toFixed(1) + "%" : "0%";

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Team Performance Report", 14, 15);
    doc.setFontSize(11);
    doc.text(`Week: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`, 14, 23);
    
    doc.text(`Total Accounts Submitted: ${weekAccounts.length}`, 14, 33);
    doc.text(`Verified Accounts: ${weekVerified.length}`, 14, 40);
    doc.text(`Conversion Rate: ${conversionRate}`, 14, 47);

    const tableData = teamMembers.map(member => {
      const memberAccounts = weekAccounts.filter(a => a.submittedBy === member.id);
      const mVerified = memberAccounts.filter(a => a.status === "Verified").length;
      const mConv = memberAccounts.length ? ((mVerified / memberAccounts.length) * 100).toFixed(1) + "%" : "0%";
      return [
        `${member.firstName} ${member.lastName}`,
        memberAccounts.length.toString(),
        mVerified.toString(),
        mConv
      ];
    });

    autoTable(doc, {
      startY: 55,
      head: [['Team Member', 'Total Submitted', 'Verified', 'Conversion Rate']],
      body: tableData,
    });

    doc.save(`Team_Report_${format(start, 'yyyy-MM-dd')}.pdf`);
  };

  // Determine today's logs for attendance
  const todayStr = new Date().toISOString().split("T")[0]; // naive but works for display
  
  if (loading) return <div className="p-8 text-center text-white">Loading Team Data...</div>;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Users className="text-amber-500" />
            Team Leader Dashboard
          </h2>
          <p className="text-gray-400 mt-1">Monitor team performance, floor coverage, and pipeline metrics.</p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <div className="flex items-center bg-[#111116] rounded-xl border border-white/10 p-1">
            <button onClick={() => setSelectedDate(subWeeks(selectedDate, 1))} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-3 text-sm font-medium text-white whitespace-nowrap">
              {format(startOfWeek(selectedDate), 'MMM d')} - {format(endOfWeek(selectedDate), 'MMM d')}
            </div>
            <button onClick={() => setSelectedDate(addWeeks(selectedDate, 1))} className="p-1 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={generatePDFReport}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors border border-amber-500/50 shadow-lg"
          >
            <Download className="w-4 h-4" />
            PDF Report
          </button>
        </div>

      </div>

      {teamMembers.length === 0 ? (
        <div className="bg-[#111116] rounded-3xl p-8 border border-white/10 shadow-2xl text-center">
          <p className="text-gray-400">You have no assigned team members.</p>
        </div>
      ) : (
        <>
          {/* Aggregate Performance Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-[#111116] rounded-3xl p-6 border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -mr-24 -mt-24 pointer-events-none group-hover:bg-amber-500/20 transition-all"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Target className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">Macro Target</h3>
                  <p className="text-xs text-amber-400/80 font-medium">Team Goal: {macroTarget} Verified Accounts</p>
                </div>
              </div>

              <div className="mb-4 relative z-10">
                <div className="flex items-end justify-between mb-2">
                  <div className="text-4xl font-black text-white">{verifiedAccounts.length}</div>
                  <div className="text-sm font-bold text-amber-400">{Math.round(macroProgress)}%</div>
                </div>
                <div className="w-full bg-black/50 h-3 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-1000 relative"
                    style={{ width: `${macroProgress}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 bottom-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="lg:col-span-2 bg-[#111116] rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                Team Leaderboard
              </h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {leaderboard.map((entry, idx) => (
                  <div key={entry.user.id} className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                        idx === 0 ? "bg-amber-500 text-black" : 
                        idx === 1 ? "bg-gray-300 text-black" :
                        idx === 2 ? "bg-orange-400 text-black" : "bg-gray-800 text-gray-400"
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{entry.user.firstName} {entry.user.lastName}</div>
                        <div className="text-xs text-gray-400">Target: 10</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-emerald-400">{entry.verifiedCount} Verified</div>
                      <button
                        onClick={() => sendNudge(entry.user.id, "Log your morning numbers!")}
                        disabled={nudgeLoading === entry.user.id}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold transition-colors border border-amber-500/20 flex items-center gap-1"
                      >
                        {nudgeLoading === entry.user.id ? "..." : <><Send className="w-3 h-3" /> Nudge</>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live Activity & Pipeline Oversight */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Live Team Activity Board */}
            <div className="bg-[#111116] rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                Live Floor Coverage
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {teamMembers.map(member => {
                  const memberLogs = timeLogs.filter(l => l.userId === member.id);
                  const todayLog = memberLogs.find(l => l.clockIn.startsWith(todayStr));
                  const isClockedIn = todayLog && !todayLog.clockOut;
                  const isClockedOut = todayLog && todayLog.clockOut;
                  
                  return (
                    <div key={member.id} className="flex items-center justify-between p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div className="text-sm font-medium text-white">{member.firstName} {member.lastName}</div>
                      </div>
                      <div>
                        {isClockedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                            Clocked In
                          </span>
                        ) : isClockedOut ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-800 text-gray-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Clocked Out
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                            Offline
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Feed */}
            <ActivityFeedWidget userIds={teamMembers.map(m => m.id)} />

            {/* Pipeline & CRM Oversight */}
            <div className="bg-[#111116] rounded-3xl p-6 border border-white/10 shadow-2xl">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-400" />
                Pipeline Bottlenecks
              </h3>
              <p className="text-xs text-gray-400 mb-4">Focus on KYC errors and pending documents for coaching.</p>
              
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-2">
                {leads.filter(l => l.status === "Rejected" || l.status === "Lead").length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-4">No stalled leads found.</div>
                ) : (
                  leads
                    .filter(l => l.status === "Rejected" || l.status === "Lead")
                    .map(lead => {
                      const owner = teamMembers.find(m => m.id === lead.assignedTo);
                      return (
                        <div key={lead.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-bold text-white">{lead.clientName}</div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              lead.status === "Rejected" ? "bg-red-500/20 text-red-400" : "bg-orange-500/20 text-orange-400"
                            )}>
                              {lead.status === "Rejected" ? "KYC Error" : "Pending Docs"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <span>Owner: {owner?.firstName} {owner?.lastName}</span>
                            <button
                              onClick={() => sendNudge(lead.assignedTo, `Follow up on ${lead.clientName} (${lead.status})`)}
                              disabled={nudgeLoading === lead.assignedTo}
                              className="text-amber-400 hover:text-amber-300 font-bold transition-colors"
                            >
                              Coach
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
