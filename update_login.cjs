const fs = require('fs');
const content = `import React, { useState, useEffect } from "react";
import { User } from "../types";
import { ShieldCheck, Lock, ArrowRight, ArrowLeft, Github, User as UserIcon, Fingerprint, Key } from "lucide-react";
import { cn } from "../utils";

interface LoginPortalProps {
  users: User[];
  onLogin: (user: User) => void;
  onBack: () => void;
}

export function LoginPortal({ users, onLogin, onBack }: LoginPortalProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSwitching, setIsSwitching] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      
      const userDoc = await getDoc(doc(db, "users", selectedUserId));
      
      if (!userDoc.exists()) {
        throw new Error("User not found.");
      }
      
      const userData = { id: userDoc.id, ...userDoc.data() } as any;
      
      if (userData.password !== password) {
        throw new Error("Invalid password.");
      }
      
      if (userData.status === 'Absconding') {
        throw new Error("Access denied: Your account has been suspended.");
      }
      
      onLogin(userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId) || users[0];

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      
      {/* Animated Geometric Network Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-50"></div>
        
        {/* Glowing Orbs */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        
        {/* Connection Nodes (Abstract) */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20%" cy="30%" r="2" fill="#a855f7" className="animate-ping" style={{animationDuration: '3s'}}/>
          <circle cx="80%" cy="70%" r="2" fill="#3b82f6" className="animate-ping" style={{animationDuration: '4s'}}/>
          <circle cx="70%" cy="20%" r="2" fill="#a855f7" className="animate-ping" style={{animationDuration: '5s'}}/>
          <circle cx="30%" cy="80%" r="2" fill="#3b82f6" className="animate-ping" style={{animationDuration: '6s'}}/>
          <line x1="20%" y1="30%" x2="70%" y2="20%" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" />
          <line x1="80%" y1="70%" x2="30%" y2="80%" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" />
          <line x1="20%" y1="30%" x2="30%" y2="80%" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          <line x1="70%" y1="20%" x2="80%" y2="70%" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
        </svg>
      </div>

      {/* Top Nav */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-20">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-gray-300 hover:text-white bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 transition-colors shadow-sm text-sm"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Home
        </button>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md relative z-20 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)] mb-6 border border-white/20 relative">
             <div className="absolute inset-0 rounded-2xl bg-white/20 blur-sm mix-blend-overlay"></div>
             <ShieldCheck className="h-8 w-8 text-white relative z-10" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2">
            Corporate Workspace SSO Portal
          </h2>
          <p className="text-sm text-gray-400">
            Secure Enterprise Access for Verified Personnel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#111116]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
          {/* subtle top glare */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

          <form className="space-y-6" onSubmit={handleLogin}>
            
            {/* Authorized Personnel Block */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Authorized Personnel
              </label>
              
              {!isSwitching ? (
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 p-[2px]">
                      <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                        <UserIcon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-[#111116] rounded-full p-0.5">
                      <Github className="h-4 w-4 text-gray-300" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">
                      {selectedUser?.firstName} {selectedUser?.lastName}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      ({selectedUser?.department || selectedUser?.role}) — {selectedUser?.role}
                    </p>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => setIsSwitching(true)}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium px-2 py-1 bg-purple-500/10 rounded-md transition-colors whitespace-nowrap"
                  >
                    Switch Account
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                  </div>
                  <select
                    className="block w-full pl-10 pr-3 py-3.5 text-sm bg-black/50 border border-white/20 rounded-2xl text-white focus:ring-purple-500 focus:border-purple-500 transition-colors cursor-pointer appearance-none outline-none"
                    value={selectedUserId}
                    onChange={(e) => {
                      setSelectedUserId(e.target.value);
                      setIsSwitching(false);
                    }}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="bg-[#111116] text-white">
                        {user.firstName} {user.lastName} ({user.department || user.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
                Security Password
              </label>
              <div className="relative rounded-2xl shadow-sm group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" aria-hidden="true" />
                </div>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  className="block w-full pl-11 pr-4 py-3.5 text-sm bg-black/50 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  placeholder="Enter authorized password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* Multi-Factor Verification Block */}
            <div className="pt-2 border-t border-white/5">
              <label className="block text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider">
                Multi-Factor Verification
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex flex-col items-center justify-center gap-2 py-3 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors group">
                  <Fingerprint className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">Biometrics<br/>(Fingerprint/FaceID)</span>
                </button>
                <button type="button" className="flex flex-col items-center justify-center gap-2 py-3 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-colors group">
                  <Key className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                  <span className="text-[10px] text-gray-400 font-medium text-center leading-tight">FIDO<br/>Security Key</span>
                </button>
              </div>
              <p className="mt-3 text-[11px] text-emerald-400/80 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Recent Logins: 3 successful, 1 pending
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-sm border border-red-500/20 flex items-center justify-center font-medium">
                {error}
              </div>
            )}

            <div className="pt-2">
              <div className="flex justify-between items-end mb-3">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Internal Use Only</p>
                <p className="text-[10px] text-gray-500 font-mono tracking-tight">Timestamp at: {currentTime}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-[#111116] transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)]",
                  loading ? "opacity-75 cursor-not-allowed" : "hover:scale-[1.02]"
                )}
              >
                {loading ? "Authenticating Connection..." : "Sign In Securely"}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 w-full text-center z-10 pointer-events-none">
        <p className="text-xs font-medium text-gray-600 tracking-wider">© 2026 ClickCamp Enterprise</p>
      </div>

    </div>
  );
}
`;
fs.writeFileSync('src/components/LoginPortal.tsx', content);
