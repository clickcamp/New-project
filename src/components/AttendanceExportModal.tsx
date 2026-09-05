import React, { useState } from "react";
import { User, TimeLog, LeaveRequest } from "../types";
import { formatIST, calculateHours, formatHours } from "../utils";
import { 
  FileSpreadsheet, 
  Download, 
  X, 
  Calendar, 
  Filter, 
  CheckCircle,
  Clock,
  Layers,
  FileText
} from "lucide-react";

interface AttendanceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  timeLogs: TimeLog[];
  leaveRequests: LeaveRequest[];
}

export function AttendanceExportModal({
  isOpen,
  onClose,
  users,
  timeLogs,
  leaveRequests,
}: AttendanceExportModalProps) {
  // Current date in IST formatted as YYYY-MM-DD
  const now = new Date();
  const todayStr = formatIST(now.toISOString(), "yyyy-MM-dd");
  const currentMonthStr = formatIST(now.toISOString(), "yyyy-MM");

  const [reportType, setReportType] = useState<"daily" | "monthly_summary" | "detailed_range">("monthly_summary");
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [departmentFilter, setDepartmentFilter] = useState<string>("All");
  const [includeLeaves, setIncludeLeaves] = useState<boolean>(true);

  if (!isOpen) return null;

  // Extract unique departments
  const departments = Array.from(new Set(users.map((u) => u.department || "General"))).filter(Boolean);

  // Filter users by department
  const filteredUsers = departmentFilter === "All" 
    ? users 
    : users.filter((u) => u.department === departmentFilter);

  // Helper to escape CSV cell content
  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === undefined || value === null) return '""';
    const str = String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };

  // Helper to trigger CSV file download in browser
  const downloadCSV = (csvContent: string, fileName: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 1. Generate Daily Attendance Report CSV
  const generateDailyCSV = () => {
    const targetDate = selectedDate;
    const dateFormatted = formatIST(new Date(targetDate).toISOString(), "PPP");

    // Filter logs for this specific date
    const dayLogs = timeLogs.filter((log) => {
      const logDate = formatIST(log.clockIn, "yyyy-MM-dd");
      return logDate === targetDate;
    });

    // Check for approved leaves on this date
    const dayLeaves = leaveRequests.filter((lr) => {
      if (lr.status !== "Approved") return false;
      const start = formatIST(lr.startDate, "yyyy-MM-dd");
      const end = formatIST(lr.endDate, "yyyy-MM-dd");
      return targetDate >= start && targetDate <= end;
    });

    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Role",
      "Date (IST)",
      "Attendance Status",
      "Clock In (IST)",
      "Clock Out (IST)",
      "Duration (Formatted)",
      "Total Hours (Decimal)",
      "Leave Reason (If on Leave)",
      "Notes"
    ];

    const rows: string[][] = [];

    filteredUsers.forEach((user) => {
      const userLogs = dayLogs.filter((l) => l.userId === user.id);
      const userLeave = dayLeaves.find((l) => l.userId === user.id);

      if (userLogs.length > 0) {
        userLogs.forEach((log) => {
          const durationHrs = log.totalHours || calculateHours(log.clockIn, log.clockOut);
          const status = log.clockOut ? "Completed Shift" : "Active Shift (Clocked In)";

          rows.push([
            user.id,
            user.firstName,
            user.lastName,
            user.email || "N/A",
            user.department || "General",
            user.role,
            dateFormatted,
            status,
            formatIST(log.clockIn, "p"),
            log.clockOut ? formatIST(log.clockOut, "p") : "In Progress",
            formatHours(durationHrs),
            durationHrs.toFixed(2),
            userLeave ? userLeave.reason : "N/A",
            durationHrs >= 8 ? "Full Day" : durationHrs >= 4 ? "Half Day" : "Partial Shift"
          ]);
        });
      } else if (userLeave && includeLeaves) {
        rows.push([
          user.id,
          user.firstName,
          user.lastName,
          user.email || "N/A",
          user.department || "General",
          user.role,
          dateFormatted,
          "On Approved Leave",
          "N/A",
          "N/A",
          "0h 0m",
          "0.00",
          userLeave.reason,
          "Approved Leave"
        ]);
      } else {
        rows.push([
          user.id,
          user.firstName,
          user.lastName,
          user.email || "N/A",
          user.department || "General",
          user.role,
          dateFormatted,
          "Absent / No Shift",
          "N/A",
          "N/A",
          "0h 0m",
          "0.00",
          "N/A",
          "No punch recorded"
        ]);
      }
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const fileName = `ClickCamp_Daily_Attendance_${targetDate}.csv`;
    downloadCSV(csvContent, fileName);
    onClose();
  };

  // 2. Generate Monthly Attendance & Payroll Summary CSV
  const generateMonthlySummaryCSV = () => {
    const [year, month] = selectedMonth.split("-");
    const monthDisplay = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric"
    });

    // Filter logs for this month
    const monthLogs = timeLogs.filter((log) => {
      const logMonth = formatIST(log.clockIn, "yyyy-MM");
      return logMonth === selectedMonth;
    });

    // Filter approved leaves for this month
    const monthLeaves = leaveRequests.filter((lr) => {
      if (lr.status !== "Approved") return false;
      const startMonth = formatIST(lr.startDate, "yyyy-MM");
      const endMonth = formatIST(lr.endDate, "yyyy-MM");
      return startMonth <= selectedMonth && endMonth >= selectedMonth;
    });

    const headers = [
      "Employee ID",
      "First Name",
      "Last Name",
      "Official Email",
      "Department",
      "Role",
      "Account Status",
      "Payroll Period",
      "Days Worked",
      "Total Completed Shifts",
      "Total Work Hours (Decimal)",
      "Total Work Duration",
      "Average Daily Hours",
      "Approved Leave Days",
      "Payroll Eligibility Status",
      "Export Timestamp (IST)"
    ];

    const rows: string[][] = [];

    filteredUsers.forEach((user) => {
      const userLogs = monthLogs.filter((l) => l.userId === user.id);
      
      // Calculate distinct days worked
      const distinctDays = new Set(
        userLogs.map((l) => formatIST(l.clockIn, "yyyy-MM-dd"))
      );

      // Total hours
      const totalHoursDecimal = userLogs.reduce((sum, log) => {
        const hrs = log.totalHours || calculateHours(log.clockIn, log.clockOut);
        return sum + hrs;
      }, 0);

      // Leaves for user
      const userLeavesCount = monthLeaves.filter((l) => l.userId === user.id).length;

      const daysWorkedCount = distinctDays.size;
      const avgDailyHours = daysWorkedCount > 0 ? (totalHoursDecimal / daysWorkedCount).toFixed(2) : "0.00";
      const isEligible = user.status === "Approved" ? "Eligible" : "Pending Approval";

      rows.push([
        user.id,
        user.firstName,
        user.lastName,
        user.email || "N/A",
        user.department || "General",
        user.role,
        user.status,
        monthDisplay,
        daysWorkedCount.toString(),
        userLogs.length.toString(),
        totalHoursDecimal.toFixed(2),
        formatHours(totalHoursDecimal),
        avgDailyHours,
        userLeavesCount.toString(),
        isEligible,
        formatIST(new Date().toISOString(), "yyyy-MM-dd HH:mm:ss")
      ]);
    });

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const fileName = `ClickCamp_Payroll_Summary_${selectedMonth}.csv`;
    downloadCSV(csvContent, fileName);
    onClose();
  };

  // 3. Generate Detailed Date Range CSV (All shifts)
  const generateDetailedRangeCSV = () => {
    // Filter logs between startDate and endDate
    const rangeLogs = timeLogs.filter((log) => {
      const logDate = formatIST(log.clockIn, "yyyy-MM-dd");
      return logDate >= startDate && logDate <= endDate;
    });

    const headers = [
      "Shift Log ID",
      "Employee ID",
      "Employee Name",
      "Department",
      "Role",
      "Email",
      "Date (IST)",
      "Clock In Timestamp (IST)",
      "Clock Out Timestamp (IST)",
      "Duration (Hours:Mins)",
      "Decimal Hours",
      "Shift Status"
    ];

    const rows: string[][] = [];

    rangeLogs.forEach((log) => {
      const user = users.find((u) => u.id === log.userId);
      if (!user) return;
      if (departmentFilter !== "All" && user.department !== departmentFilter) return;

      const durationHrs = log.totalHours || calculateHours(log.clockIn, log.clockOut);
      const isOngoing = !log.clockOut;

      rows.push([
        log.id,
        user.id,
        `${user.firstName} ${user.lastName}`,
        user.department || "General",
        user.role,
        user.email || "N/A",
        formatIST(log.clockIn, "yyyy-MM-dd"),
        formatIST(log.clockIn, "PPP p"),
        log.clockOut ? formatIST(log.clockOut, "PPP p") : "Ongoing Shift",
        formatHours(durationHrs),
        durationHrs.toFixed(2),
        isOngoing ? "Active" : "Completed"
      ]);
    });

    // If no logs, add empty row indicator
    if (rows.length === 0) {
      rows.push(["N/A", "N/A", "No attendance records found for selected range", "", "", "", "", "", "", "", "0.00", ""]);
    }

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(","))
    ].join("\r\n");

    const fileName = `ClickCamp_Attendance_Detailed_${startDate}_to_${endDate}.csv`;
    downloadCSV(csvContent, fileName);
    onClose();
  };

  const handleExport = () => {
    if (reportType === "daily") {
      generateDailyCSV();
    } else if (reportType === "monthly_summary") {
      generateMonthlySummaryCSV();
    } else {
      generateDetailedRangeCSV();
    }
  };

  // Preview count calculation
  const getPreviewCount = () => {
    if (reportType === "daily") {
      return `${filteredUsers.length} employee record(s)`;
    } else if (reportType === "monthly_summary") {
      return `${filteredUsers.length} payroll summary row(s)`;
    } else {
      const count = timeLogs.filter((log) => {
        const logDate = formatIST(log.clockIn, "yyyy-MM-dd");
        const user = users.find((u) => u.id === log.userId);
        if (!user) return false;
        if (departmentFilter !== "All" && user.department !== departmentFilter) return false;
        return logDate >= startDate && logDate <= endDate;
      }).length;
      return `${count} shift log(s)`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <FileSpreadsheet className="h-5 w-5 text-purple-200" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Export Attendance & Payroll CSV</h3>
              <p className="text-xs text-purple-200">Generate formatted CSV sheets for payroll accounting</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Report Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Select Report Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setReportType("monthly_summary")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === "monthly_summary"
                    ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
                  <Layers className={`h-4 w-4 ${reportType === "monthly_summary" ? "text-purple-600" : "text-gray-400"}`} />
                  Monthly Payroll
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  Aggregated hours, total shifts, days worked & leave counts per staff member.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType("daily")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === "daily"
                    ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
                  <Calendar className={`h-4 w-4 ${reportType === "daily" ? "text-purple-600" : "text-gray-400"}`} />
                  Daily Attendance
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  Presents, absents, shift punch times and leave status for a single day.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReportType("detailed_range")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  reportType === "detailed_range"
                    ? "border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-500/20"
                    : "border-gray-200 hover:border-gray-300 text-gray-700 bg-white"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm mb-1">
                  <FileText className={`h-4 w-4 ${reportType === "detailed_range" ? "text-purple-600" : "text-gray-400"}`} />
                  Shift Time Logs
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">
                  Raw granular punch records with precise IST timestamps and clock durations.
                </p>
              </button>
            </div>
          </div>

          {/* Date / Period Controls */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200/80 space-y-3">
            {reportType === "monthly_summary" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  Payroll Month (IST)
                </label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                />
              </div>
            )}

            {reportType === "daily" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-purple-600" />
                  Attendance Date (IST)
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                />
              </div>
            )}

            {reportType === "detailed_range" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                  />
                </div>
              </div>
            )}

            {/* Department Filter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Filter className="h-3.5 w-3.5 text-purple-600" />
                  Filter Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                >
                  <option value="All">All Departments ({users.length} Employees)</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept} ({users.filter((u) => u.department === dept).length})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-2 p-2 bg-white border border-gray-300 rounded-lg w-full cursor-pointer text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={includeLeaves}
                    onChange={(e) => setIncludeLeaves(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                  />
                  <span>Include Leave Status & Reason</span>
                </label>
              </div>
            </div>
          </div>

          {/* Quick Info / Spec details */}
          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900 flex items-start gap-2.5">
            <CheckCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Ready to export: {getPreviewCount()}</p>
              <p className="text-purple-700/80 mt-0.5">
                Calculates precise decimal work hours, Indian Standard Time (IST) timestamps, and formatted durations matching standard payroll software standards.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm transition-all shadow-md hover:shadow-lg focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4" />
            Download CSV Report
          </button>
        </div>
      </div>
    </div>
  );
}
