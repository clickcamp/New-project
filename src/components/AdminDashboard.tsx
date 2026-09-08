import React, { useEffect, useState } from "react";
import { User, TimeLog, TaskReport, LeaveRequest } from "../types";
import { 
  Check, 
  ShieldCheck, 
  Users, 
  Clock, 
  AlertCircle, 
  Lock, 
  Plus, 
  X, 
  Trash2, 
  Search, 
  UserPlus, 
  UserMinus, 
  Briefcase, 
  UserCheck, 
  ShieldAlert,
  Building2,
  Mail,
  Target
} from "lucide-react";
import { formatIST, formatHours } from "../utils";
import { cn } from "../utils";
import { MeetingHubModule } from "./MeetingHubModule";
import { OpsPerformanceWidget } from "./OpsPerformanceWidget";
import { ActivityFeedWidget } from "./ActivityFeedWidget";
import { TargetDashboardModule } from "./TargetDashboardModule";
import { AttendanceCalendarModule } from "./AttendanceCalendarModule";
import { SecurityAdminPanel } from "./SecurityAdminPanel";
import { CRMModule } from "./CRMModule";
import { LeaderboardModule, IncentiveDashboard } from "./SalesMetricsModule";
import { ResourceLibraryModule } from "./ResourceLibraryModule";
import { HROffboarding } from "./OffboardingModule";
import { PayrollModule } from "./PayrollModule";
import { TicketingModule, ExpensesModule } from "./SupportModule";
import { SystemTrackingModule } from "./SystemTrackingModule";

export function AdminDashboard({ currentUser, refreshUsers }: { currentUser: User, refreshUsers: () => void }) {
  const [users, setUsers] = useState<User[]>([]);
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [taskReports, setTaskReports] = useState<TaskReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  
  // Add User State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmp, setNewEmp] = useState({ 
    firstName: "", 
    lastName: "", 
    role: "Employee", 
    department: "Engineering",
    autoApprove: true,
    password: ""
  });

  // Delete User State
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Directory filter state
  const [roleFilter, setRoleFilter] = useState<"All" | "Employee" | "HR" | "Team Leader" | "Operations" | "Pending">("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let unsubscribeUsers: () => void;
    let unsubscribeLogs: () => void;
    let unsubscribeTaskReports: () => void;

    const setupRealtime = async () => {
      if (!isUnlocked) return;
      setLoading(true);
      try {
        const { collection, onSnapshot } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
          const uData: any[] = [];
          snapshot.forEach(doc => uData.push({ id: doc.id, ...doc.data() }));
          setUsers(uData);
        });

        unsubscribeLogs = onSnapshot(collection(db, "timeLogs"), (snapshot) => {
          const tData: any[] = [];
          snapshot.forEach(doc => tData.push({ id: doc.id, ...doc.data() }));
          setTimeLogs(tData);
          setLoading(false);
        });

        unsubscribeTaskReports = onSnapshot(collection(db, "taskReports"), (snapshot) => {
          const rData: any[] = [];
          snapshot.forEach(doc => rData.push({ id: doc.id, ...doc.data() }));
          setTaskReports(rData);
        });
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeLogs) unsubscribeLogs();
      if (unsubscribeTaskReports) unsubscribeTaskReports();
    };
  }, [isUnlocked]);

  const fetchData = async () => {
    // Kept for backward compatibility, but state is now handled by onSnapshot
  };

  const handleAssignTL = async (userId: string, tlId: string) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "users", userId), { teamLeaderId: tlId });
      await fetchData();
      refreshUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const { doc, updateDoc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const userRef = doc(db, "users", id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const u = userDoc.data();
        await updateDoc(userRef, {
          status: "Approved",
          email: `${u.firstName.toLowerCase()}.${u.lastName.toLowerCase()}@clickcamp.site`
        });
      }
      await fetchData();
      refreshUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "malik123") {
      setIsUnlocked(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { doc, setDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(7);
      
      const newUser = {
        id: newId,
        firstName: newEmp.firstName,
        lastName: newEmp.lastName,
        role: newEmp.role,
        department: newEmp.department,
        password: newEmp.password || "clickcamp123",
        status: newEmp.autoApprove ? "Approved" : "Pending",
        email: newEmp.autoApprove ? `${newEmp.firstName.toLowerCase()}.${newEmp.lastName.toLowerCase()}@clickcamp.site` : ""
      };
      
      await setDoc(doc(db, "users", newId), newUser);
      
      await fetchData();
      refreshUsers();

      setShowAddModal(false);
      setNewEmp({ 
        firstName: "", 
        lastName: "", 
        role: "Employee", 
        department: "Engineering",
        autoApprove: true,
        password: ""
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser.id) {
      setDeleteError("You cannot delete your own active Admin account.");
      return;
    }

    setIsDeleting(true);
    setDeleteError("");
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      await deleteDoc(doc(db, "users", userToDelete.id));

      await fetchData();
      refreshUsers();
      setUserToDelete(null);
    } catch (err: any) {
      console.error("Delete user error:", err);
      setDeleteError(err.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Access</h2>
          <p className="text-sm text-gray-500 mb-6">Enter the administrative password to unlock this dashboard.</p>
          <form onSubmit={handleUnlock}>
            <input
              type="password"
              className={cn(
                "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2 transition-colors outline-none",
                error ? "border-red-300 bg-red-50" : "border-gray-300 bg-gray-50"
              )}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-red-500 text-xs mb-4 text-left font-medium">{error}</p>}
            <button className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors mt-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Unlock Dashboard
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-6 font-medium">Protected System Console</p>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === "Pending");
  const approvedUsers = users.filter(u => u.status === "Approved");
  const employeeCount = users.filter(u => u.role === "Employee").length;
  const tlCount = users.filter(u => u.role === "Team Leader").length;
  const hrCount = users.filter(u => u.role === "HR").length;
  const opsCount = users.filter(u => u.role === "Operations").length;

  // Filtered users for directory
  const filteredUsers = users.filter(user => {
    // Role filter
    if (roleFilter === "Employee" && user.role !== "Employee") return false;
    if (roleFilter === "Team Leader" && user.role !== "Team Leader") return false;
    if (roleFilter === "HR" && user.role !== "HR") return false;
    if (roleFilter === "Operations" && user.role !== "Operations") return false;
    if (roleFilter === "Pending" && user.status !== "Pending") return false;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      const email = (user.email || "").toLowerCase();
      const dept = (user.department || "").toLowerCase();
      return fullName.includes(q) || email.includes(q) || dept.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-600" />
            Admin Dashboard
          </h2>
          <p className="text-gray-500 mt-1">Manage employees & HR personnel, approve onboarding, and oversee company logs.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => {
              setNewEmp({ firstName: "", lastName: "", role: "HR", department: "Human Resources", autoApprove: true, password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add HR
          </button>
          <button 
            onClick={() => {
              setNewEmp({ firstName: "", lastName: "", role: "Employee", department: "Engineering", autoApprove: true, password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </button>
          <button 
            onClick={() => {
              setNewEmp({ firstName: "", lastName: "", role: "Team Leader", department: "Sales", autoApprove: true, password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-amber-700 transition-colors shadow-sm text-sm"
          >
            <Plus className="h-4 w-4" />
            Add TL
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{employeeCount}</p>
            <p className="text-xs text-gray-500 font-medium">Total Employees</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{hrCount}</p>
            <p className="text-xs text-gray-500 font-medium">HR Personnel</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{tlCount}</p>
            <p className="text-xs text-gray-500 font-medium">Team Leaders</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingUsers.length}</p>
            <p className="text-xs text-gray-500 font-medium">Pending Approvals</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{timeLogs.length}</p>
            <p className="text-xs text-gray-500 font-medium">Total Shifts Logged</p>
          </div>
        </div>
      </div>

      {/* Main Personnel Management Directory (Add / Delete Employees & HR) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-200 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Personnel Directory & Management
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Add, review, approve, and delete Employee and HR accounts across departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search staff by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center bg-gray-200/70 p-1 rounded-lg text-xs font-medium">
              <button
                onClick={() => setRoleFilter("All")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "All" ? "bg-white text-gray-900 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter("Employee")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "Employee" ? "bg-white text-blue-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                Employees ({employeeCount})
              </button>
              <button
                onClick={() => setRoleFilter("HR")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "HR" ? "bg-white text-purple-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                HR ({hrCount})
              </button>
              <button
                onClick={() => setRoleFilter("Team Leader")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "Team Leader" ? "bg-white text-amber-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                TLs ({tlCount})
              </button>
              <button
                onClick={() => setRoleFilter("Operations")}
                className={cn(
                  "px-3 py-1 rounded-md transition-colors",
                  roleFilter === "Operations" ? "bg-white text-emerald-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                )}
              >
                Ops ({opsCount})
              </button>
              {pendingUsers.length > 0 && (
                <button
                  onClick={() => setRoleFilter("Pending")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-colors",
                    roleFilter === "Pending" ? "bg-white text-amber-700 shadow-sm font-semibold" : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  Pending ({pendingUsers.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5 font-semibold">Personnel Name</th>
                <th className="px-6 py-3.5 font-semibold">Role</th>
                <th className="px-6 py-3.5 font-semibold">Department</th>
                <th className="px-6 py-3.5 font-semibold">Official Email</th>
                <th className="px-6 py-3.5 font-semibold">Password</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
                <th className="px-6 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="max-w-xs mx-auto flex flex-col items-center">
                      <Users className="h-8 w-8 text-gray-300 mb-2" />
                      <p className="font-medium text-gray-700">No personnel found</p>
                      <p className="text-xs text-gray-400 mt-1">Try adjusting your search query or role filter.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentAdmin = user.id === currentUser.id;
                  const isPending = user.status === "Pending";

                  return (
                    <tr key={user.id} className="bg-white hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                            user.role === "HR" 
                              ? "bg-purple-100 text-purple-700" 
                              : user.role === "Admin" 
                              ? "bg-slate-800 text-white" 
                              : "bg-blue-100 text-blue-700"
                          )}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-tight">
                              {user.firstName} {user.lastName}
                              {isCurrentAdmin && (
                                <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-normal">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-400">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1",
                          user.role === "HR"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "Team Leader"
                            ? "bg-amber-100 text-amber-800"
                            : user.role === "Operations"
                            ? "bg-emerald-100 text-emerald-800"
                            : user.role === "Admin"
                            ? "bg-slate-100 text-slate-800"
                            : "bg-blue-100 text-blue-800"
                        )}>
                          {user.role === "HR" && <Briefcase className="h-3 w-3" />}
                          {user.role === "Admin" && <ShieldCheck className="h-3 w-3" />}
                          {user.role}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {user.department || "General"}
                        {user.role === "Employee" && (
                          <div className="mt-1">
                            <select
                              className="text-xs border border-gray-200 rounded p-1"
                              value={user.teamLeaderId || ""}
                              onChange={(e) => handleAssignTL(user.id, e.target.value)}
                            >
                              <option value="">No TL Assigned</option>
                              {users.filter(u => u.role === "Team Leader").map(tl => (
                                <option key={tl.id} value={tl.id}>{tl.firstName} {tl.lastName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {user.email || (
                          <span className="text-gray-400 italic">Pending provisioning</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-gray-800 font-mono text-xs font-semibold">
                        {user.password || <span className="text-gray-400 italic font-normal">Not set</span>}
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center gap-1",
                          isPending ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                        )}>
                          {isPending ? "Pending Onboarding" : "Approved"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && (
                            <button
                              onClick={() => handleApprove(user.id)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                              title="Approve onboarding"
                            >
                              <UserCheck className="h-3.5 w-3.5" />
                              Approve
                            </button>
                          )}

                          {!isCurrentAdmin ? (
                            <button
                              onClick={() => {
                                setUserToDelete(user);
                                setDeleteError("");
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={`Delete ${user.role} ${user.firstName} ${user.lastName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic px-2">Primary Admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Approvals Quick Queue & Attendance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Onboarding Approval Queue ({pendingUsers.length})
            </h3>
          </div>
          <div className="p-0 max-h-[360px] overflow-y-auto">
            {pendingUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
                <Check className="h-8 w-8 text-green-400 mb-2" />
                <p className="text-sm font-medium">All personnel approved</p>
                <p className="text-xs text-gray-400 mt-1">No onboarding accounts pending.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {pendingUsers.map(user => (
                  <li key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">
                        <span className={user.role === "HR" ? "text-purple-600 font-semibold" : "text-blue-600 font-semibold"}>
                          {user.role}
                        </span> &middot; {user.department || "General"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteError("");
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete pending user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Company Attendance Logs Preview - AttendanceCalendarModule */}
        <div className="lg:col-span-2">
           <AttendanceCalendarModule currentUser={currentUser} />
        </div>
      </div>

      {/* Daily Targets Report */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col mt-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-gray-500" />
            Global Daily Target Submissions
          </h3>
          <span className="text-xs text-gray-500">{taskReports.length} total reports</span>
        </div>
        <div className="overflow-x-auto flex-1 max-h-[360px] overflow-y-auto">
          {taskReports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No daily target submissions have been recorded yet.
            </div>
          ) : (
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date (IST)</th>
                  <th className="px-4 py-3 font-semibold">Employee</th>
                  <th className="px-4 py-3 font-semibold">Completed</th>
                  <th className="px-4 py-3 font-semibold">Notes</th>
                  <th className="px-4 py-3 font-semibold">Submitted At</th>
                </tr>
              </thead>
              <tbody>
                {[...taskReports].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()).map(report => (
                  <tr key={report.id} className="bg-white border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{report.date}</td>
                    <td className="px-4 py-3 text-gray-900">{report.userName}</td>
                    <td className="px-4 py-3 font-medium text-green-700">{report.completedCount}</td>
                    <td className="px-4 py-3 italic max-w-xs truncate">{report.notes || "-"}</td>
                    <td className="px-4 py-3 text-xs">{formatIST(report.submittedAt, "p")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

            {/* ClickCamp Technologies Specific Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeaderboardModule currentUser={currentUser} users={users} />
        <div className="space-y-6">
          <ResourceLibraryModule currentUser={currentUser} />
          <OpsPerformanceWidget users={users} />
          <ActivityFeedWidget />
        </div>
        <TargetDashboardModule currentUser={currentUser} />
        <MeetingHubModule currentUser={currentUser} />
      </div>

      <div className="mt-6">
        <SecurityAdminPanel users={users} />
        <CRMModule currentUser={currentUser} />
      </div>

      {/* Add Employee / HR Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className={cn(
              "px-6 py-4 text-white flex items-center justify-between",
              newEmp.role === "HR" ? "bg-gradient-to-r from-purple-700 to-indigo-700" : "bg-gradient-to-r from-blue-700 to-indigo-700"
            )}>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">
                    Add New {newEmp.role === "HR" ? "HR Personnel" : "Employee"}
                  </h3>
                  <p className="text-xs text-white/80">Provision portal access and create system identity</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
                  Account Role
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "Employee", department: newEmp.department === "Human Resources" ? "Engineering" : newEmp.department })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "Employee"
                        ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Users className="h-4 w-4 text-blue-600" />
                      Employee
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Punch clock, timesheet & leave portal</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "Team Leader", department: "Sales" })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "Team Leader"
                        ? "border-amber-600 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Target className="h-4 w-4 text-amber-600" />
                      Team Leader
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Manage teams & targets</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "Operations", department: "Verification" })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "Operations"
                        ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 ring-2 ring-emerald-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-emerald-600" />
                      Operations
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">QA & Verification</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEmp({ ...newEmp, role: "HR", department: "Human Resources" })}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      newEmp.role === "HR"
                        ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    )}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4 text-purple-600" />
                      HR Personnel
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">Leave approval, who's in & payroll exports</p>
                  </button>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">First Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Rahul"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newEmp.firstName} 
                    onChange={e => setNewEmp({...newEmp, firstName: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Last Name</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. Sharma"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newEmp.lastName} 
                    onChange={e => setNewEmp({...newEmp, lastName: e.target.value})} 
                  />
                </div>
              </div>

              {/* Department and Password */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                  <input 
                    required 
                    type="text" 
                    list="dept-list"
                    placeholder="e.g. Engineering, Human Resources, Design"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newEmp.department} 
                    onChange={e => setNewEmp({...newEmp, department: e.target.value})} 
                  />
                  <datalist id="dept-list">
                    <option value="Engineering" />
                    <option value="Human Resources" />
                    <option value="Product Design" />
                    <option value="Marketing" />
                    <option value="Sales & Growth" />
                    <option value="Finance & Accounting" />
                    <option value="Customer Operations" />
                    <option value="Quality Assurance" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Login Password</label>
                  <input 
                    required 
                    type="text" 
                    placeholder="e.g. securePass123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newEmp.password} 
                    onChange={e => setNewEmp({...newEmp, password: e.target.value})} 
                  />
                </div>
              </div>

              {/* Instant Approval Option */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={newEmp.autoApprove}
                    onChange={(e) => setNewEmp({ ...newEmp, autoApprove: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-gray-800">Immediately Approve & Provision Email</span>
                    <p className="text-gray-500 text-[11px] mt-0.5">
                      Automatically issues official <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">@clickcamp.site</code> login credentials.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 flex justify-end gap-2.5 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)} 
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !newEmp.firstName.trim() || !newEmp.lastName.trim()} 
                  className={cn(
                    "px-5 py-2 text-white rounded-lg font-medium text-sm transition-all shadow-sm disabled:opacity-50",
                    newEmp.role === "HR" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"
                  )}
                >
                  {isSubmitting ? "Creating..." : `Add ${newEmp.role}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                <UserMinus className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                Delete {userToDelete.role}: {userToDelete.firstName} {userToDelete.lastName}?
              </h3>
              
              <p className="text-sm text-gray-600 mt-2">
                Are you sure you want to permanently remove this {userToDelete.role.toLowerCase()} account? This action will revoke portal login access and purge associated shift logs.
              </p>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">Personnel ID:</span>
                  <span className="font-mono font-medium text-gray-700">{userToDelete.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Role:</span>
                  <span className="font-semibold text-gray-800">{userToDelete.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-medium text-gray-800">{userToDelete.department || "General"}</span>
                </div>
                {userToDelete.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-mono text-gray-700">{userToDelete.email}</span>
                  </div>
                )}
              </div>

              {deleteError && (
                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setUserToDelete(null);
                    setDeleteError("");
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteUser}
                  disabled={isDeleting}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all shadow-sm focus:ring-2 focus:ring-red-500 focus:ring-offset-2 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
