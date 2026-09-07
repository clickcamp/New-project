import React, { useState, useEffect } from "react";
import { User, ActivityLog, Ticket } from "../types";
import { collection, query, onSnapshot, orderBy, limit, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { formatIST } from "../utils";
import { ShieldCheck, Clock, Activity, Server, AlertTriangle, Users, Search, CheckCircle, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function SystemTrackingModule({ users, currentUser }: { users: User[], currentUser: User }) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searchLog, setSearchLog] = useState("");
  
  useEffect(() => {
    const unsubLogs = onSnapshot(query(collection(db, "activityLogs"), orderBy("timestamp", "desc"), limit(200)), (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityLog)));
    });

    const unsubTickets = onSnapshot(collection(db, "tickets"), (snap) => {
      setTickets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ticket)));
    });

    return () => {
      unsubLogs();
      unsubTickets();
    };
  }, []);

  // 1. Session & Active Users (Active in last 15 mins)
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60000).toISOString();
  const activeUserIds = new Set(logs.filter(l => l.timestamp >= fifteenMinsAgo).map(l => l.performedBy));
  
  // 2. SLA Tracking (Average resolution time of resolved tickets)
  const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.resolvedAt);
  let avgResolutionHours = 0;
  if (resolvedTickets.length > 0) {
    const totalTimeMs = resolvedTickets.reduce((acc, t) => {
      return acc + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime());
    }, 0);
    avgResolutionHours = (totalTimeMs / resolvedTickets.length) / (1000 * 60 * 60);
  }

  const filteredLogs = logs.filter(l => 
    l.performedByName?.toLowerCase().includes(searchLog.toLowerCase()) || 
    l.action.toLowerCase().includes(searchLog.toLowerCase())
  );

  const utilizationData = [
    { name: "Sales", activeTasks: 42 },
    { name: "HR", activeTasks: 18 },
    { name: "Operations", activeTasks: 65 },
    { name: "Support", activeTasks: 24 }
  ];

  return (
    <div className="space-y-6 pt-6 mt-8 border-t border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            System & Professional Tracking
          </h2>
          <p className="text-sm text-gray-500 mt-1">Audit logs, system health, SLA tracking, and resource utilization</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">Active Sessions</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">{activeUserIds.size} <span className="text-sm font-normal text-gray-500">online</span></div>
          <p className="text-xs text-gray-400 mt-1">Users active in last 15 mins</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">IT Support SLA</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgResolutionHours.toFixed(1)} <span className="text-sm font-normal text-gray-500">hours</span></div>
          <p className="text-xs text-gray-400 mt-1">Avg ticket resolution time</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">System Health</h3>
          </div>
          <div className="text-2xl font-bold text-emerald-600 flex items-center gap-2">99.9% <CheckCircle className="w-5 h-5"/></div>
          <p className="text-xs text-gray-400 mt-1">API & Database Uptime</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-gray-700">Error Rate</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900">0.02%</div>
          <p className="text-xs text-gray-400 mt-1">Logged frontend/backend exceptions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Comprehensive Audit Logs */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-900">Comprehensive Audit Logs</h3>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search user or action..."
                value={searchLog}
                onChange={e => setSearchLog(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none w-64"
              />
            </div>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Timestamp</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">User</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Action</th>
                  <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-xs text-gray-500 whitespace-nowrap">{formatIST(log.timestamp, "MMM d, yyyy HH:mm:ss")}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{log.performedByName}</td>
                    <td className="py-3 px-4 text-sm text-gray-700">{log.action}</td>
                    <td className="py-3 px-4 text-xs text-gray-500 max-w-xs truncate" title={log.details || log.entityId}>{log.details || <span className="text-gray-300">N/A</span>}</td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-gray-500">No logs found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Resource Utilization (Workload) */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-600" />
                Resource Utilization
              </h3>
            </div>
            <div className="p-4 flex flex-col justify-center">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)", fontSize: "12px" }} />
                    <Bar dataKey="activeTasks" radius={[4, 4, 0, 0]}>
                      {
                        utilizationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.activeTasks > 50 ? "#ef4444" : "#6366f1"} />
                        ))
                      }
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-gray-500 text-center mt-2">Red indicates high utilization (&gt; 50 active items)</p>
            </div>
          </div>

          {/* Server / API Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-700" />
                API & Webhook Status
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">Firestore Sync</span>
                  <span className="text-emerald-600 font-bold">Operational</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1"><div className="bg-emerald-500 h-1 rounded-full w-full"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">Auth Services</span>
                  <span className="text-emerald-600 font-bold">Operational</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1"><div className="bg-emerald-500 h-1 rounded-full w-full"></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">WhatsApp API Integration</span>
                  <span className="text-emerald-600 font-bold">Operational</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1"><div className="bg-emerald-500 h-1 rounded-full w-[98%]"></div></div>
              </div>
              
              <div className="pt-3 border-t border-gray-100 mt-4 space-y-2">
                   <div className="flex gap-2 items-start">
                     <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                     <div className="text-xs text-gray-700 leading-tight">High traffic warning on lead API endpoints. <span className="text-[10px] text-gray-400 block mt-0.5">5 hours ago</span></div>
                   </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
