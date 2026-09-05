/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { User } from "./types";
import { AdminDashboard } from "./components/AdminDashboard";
import { TeamLeaderDashboard } from "./components/TeamLeaderDashboard";
import { OperationsDashboard } from "./components/OperationsDashboard";
import { HRDashboard } from "./components/HRDashboard";
import { EmployeeDashboard } from "./components/EmployeeDashboard";
import { HomeScreen } from "./components/HomeScreen";
import { NotificationCenter } from "./components/NotificationCenter";
import { LoginPortal } from "./components/LoginPortal";
import { DMSModule } from "./components/DMSModule";
import { ChatApp } from "./components/ChatApp";
import { WebmailApp } from "./components/WebmailApp";
import { SettingsApp } from "./components/SettingsApp";
import { Loader2, LogOut, ArrowLeft } from "lucide-react";

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeApp, setActiveApp] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;

    const setupRealtime = async () => {
      try {
        const { collection, onSnapshot, getDocs, doc, setDoc } =
          await import("firebase/firestore");
        const { db } = await import("./lib/firebase");

        // Initial check to populate if empty
        const initialSnap = await getDocs(collection(db, "users"));
        if (initialSnap.empty) {
          const defaultUsers = [
            {
              id: "admin-1",
              firstName: "System",
              lastName: "Admin",
              role: "Admin",
              status: "Approved",
              email: "system.admin@clickcamp.site",
              department: "IT",
              password: "malik123",
            },
            {
              id: "hr-1",
              firstName: "HR",
              lastName: "Manager",
              role: "HR",
              status: "Approved",
              email: "hr.manager@clickcamp.site",
              department: "Human Resources",
              password: "hr123",
            },
            {
              id: "emp-1",
              firstName: "Umama",
              lastName: "Sheikh",
              role: "HR",
              status: "Approved",
              email: "umama.sheikh@clickcamp.site",
              department: "Human Resources",
              password: "malikbaby123",
            },
            {
              id: "emp-2",
              firstName: "John",
              lastName: "Doe",
              role: "Employee",
              status: "Approved",
              email: "john.doe@clickcamp.site",
              department: "Engineering",
              password: "password123",
            },
          ];

          for (const user of defaultUsers) {
            await setDoc(doc(db, "users", user.id), user);
          }
        }

        unsubscribe = onSnapshot(
          collection(db, "users"),
          (snapshot) => {
            const usersData: User[] = [];
            snapshot.forEach((doc) => {
              usersData.push({ id: doc.id, ...doc.data() } as User);
            });
            setUsers(usersData);
            setLoading(false);
          },
          (error) => {
            console.error("Real-time listener failed", error);
            setLoading(false);
          },
        );
      } catch (e) {
        console.error("Failed to setup Firebase", e);
        // Fallback data if completely offline
        setUsers([
          {
            id: "admin-1",
            firstName: "System",
            lastName: "Admin",
            role: "Admin",
            status: "Approved",
            email: "system.admin@clickcamp.site",
            department: "IT",
            password: "malik123",
          },
          {
            id: "hr-1",
            firstName: "HR",
            lastName: "Manager",
            role: "HR",
            status: "Approved",
            email: "hr.manager@clickcamp.site",
            department: "Human Resources",
            password: "hr123",
          },
          {
            id: "emp-1",
            firstName: "Umama",
            lastName: "Sheikh",
            role: "HR",
            status: "Approved",
            email: "umama.sheikh@clickcamp.site",
            department: "Human Resources",
            password: "malikbaby123",
          },
          {
            id: "emp-2",
            firstName: "John",
            lastName: "Doe",
            role: "Employee",
            status: "Approved",
            email: "john.doe@clickcamp.site",
            department: "Engineering",
            password: "password123",
          },
        ]);
        setLoading(false);
      }
    };

    setupRealtime();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Enforce Kill Switch & Status Updates
  useEffect(() => {
    if (currentUser) {
      const updatedUser = users.find((u) => u.id === currentUser.id);
      if (updatedUser) {
        if (updatedUser.status === "Absconding") {
          setCurrentUser(null);
          setActiveApp(null);
          setTimeout(
            () => alert("Your access has been revoked. Please contact HR."),
            100,
          );
        } else if (updatedUser.status !== currentUser.status) {
          setCurrentUser(updatedUser);
        }
      }
    }
  }, [users, currentUser]);

  const fetchUsers = async () => {
    // Left for compatibility if called explicitly, but now handled by onSnapshot
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // 1. Default to Home Screen
  if (activeApp === null) {
    return (
      <HomeScreen
        onLaunch={setActiveApp}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // 2. Require Login for any app launched
  if (!currentUser) {
    return (
      <LoginPortal
        users={users}
        onLogin={setCurrentUser}
        onBack={() => setActiveApp(null)}
      />
    );
  }

  // 3. Render specific apps
  if (activeApp === "chat") {
    return (
      <ChatApp currentUser={currentUser} onBack={() => setActiveApp(null)} />
    );
  }
  if (activeApp === "webmail") {
    return (
      <WebmailApp currentUser={currentUser} onBack={() => setActiveApp(null)} />
    );
  }
  if (activeApp === "settings") {
    return (
      <SettingsApp
        currentUser={currentUser}
        onBack={() => setActiveApp(null)}
      />
    );
  }

  // 4. Render the Workspace App (default fallback for 'workspace' or others mapped to it)
  if (currentUser.role === "Employee") {
    return (
      <EmployeeDashboard
        currentUser={currentUser}
        users={users}
        onBack={() => setActiveApp(null)}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 animate-in fade-in overflow-x-hidden flex flex-col w-full">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveApp(null)}
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <img
            src="/logo.svg"
            alt="Click.camp Logo"
            className="h-8 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationCenter currentUser={currentUser} users={users} />
          <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 mr-2">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {currentUser.firstName} {currentUser.lastName} ({currentUser.role}
              )
            </span>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign out"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8 overflow-x-hidden">
        {currentUser.role === "Admin" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <AdminDashboard
              currentUser={currentUser}
              refreshUsers={fetchUsers}
            />
            <DMSModule currentUser={currentUser} />
          </div>
        )}

        {currentUser.role === "Operations" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <OperationsDashboard
              currentUser={currentUser}
              users={users}
            />
          </div>
        )}

        {currentUser.role === "Team Leader" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <TeamLeaderDashboard
              currentUser={currentUser}
              users={users}
            />
          </div>
        )}

        {currentUser.role === "HR" && (
          <div className="grid grid-cols-1 gap-6 sm:gap-8 w-full">
            <HRDashboard
              currentUser={currentUser}
              users={users}
              refreshUsers={fetchUsers}
            />
            <DMSModule currentUser={currentUser} />
          </div>
        )}
      </main>
    </div>
  );
}
