import React, { useState, useRef, useEffect } from "react";
import { Bell, AlertCircle, Info, Clock, CheckCircle } from "lucide-react";
import { User } from "../types";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { cn } from "../utils";

interface NotificationCenterProps {
  currentUser: User;
  users: User[];
}

export function NotificationCenter({ currentUser, users }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [appNotifications, setAppNotifications] = useState<any[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser.id) return;
    const q = query(collection(db, "appNotifications"), where("userId", "==", currentUser.id));
    const unsub = onSnapshot(q, (snapshot) => {
      const notifs: any[] = [];
      snapshot.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
      setAppNotifications(notifs);
    });
    return () => unsub();
  }, [currentUser.id]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pendingCount = users.filter((u) => u.status === "Pending").length;

  const mappedAppNotifs = appNotifications.map(n => ({
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    icon: n.type === 'reminder' ? AlertCircle : Info,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
    createdAt: n.createdAt
  })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const notifications = [
    ...mappedAppNotifs,
    {
      id: "sys-1",
      type: "system",
      title: "System Update",
      message: "Welcome to the new Click Camp IST Workspace.",
      icon: Info,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  if (currentUser.role === "Admin" && pendingCount > 0) {
    notifications.unshift({
      id: "app-1",
      type: "approval",
      title: "Pending Approvals",
      message: `There are ${pendingCount} new candidates awaiting your approval.`,
      icon: AlertCircle,
      color: "text-amber-600",
      bgColor: "bg-amber-100",
    });
  }

  if (currentUser.role === "Employee") {
    notifications.unshift({
      id: "rem-1",
      type: "reminder",
      title: "Shift Reminder",
      message: "Don't forget to clock in when your shift starts!",
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100",
    });
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Bell className="h-5 w-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              {notifications.length} new
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                <CheckCircle className="h-8 w-8 text-green-400 mb-2" />
                <p>You're all caught up!</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {notifications.map((notif) => {
                  const Icon = notif.icon;
                  return (
                    <li
                      key={notif.id}
                      className="p-4 hover:bg-gray-50 transition-colors flex gap-3 items-start cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mt-0.5 p-2 rounded-full flex-shrink-0",
                          notif.bgColor,
                          notif.color
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{notif.message}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
