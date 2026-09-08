import React, { useState, useEffect } from "react";
import { User } from "../types";
import { ShieldCheck, Lock, ArrowRight, User as UserIcon, CheckCircle2 } from "lucide-react";

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
  
  // 2FA States
  const [require2FA, setRequire2FA] = useState(false);
      const [otp, setOtp] = useState("");

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, password })
      });
      
      const contentType = resp.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        throw new Error(`Server error: ${text.substring(0, 50)}`);
      }
      
      if (!resp.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      if (data.verified) {
        onLogin(data.user);
      } else if (data.require2FA) {
        setRequire2FA(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, token: otp })
      });
      
      const contentType = resp.headers.get("content-type");
      let data;
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await resp.json();
      } else {
        const text = await resp.text();
        throw new Error(`Server error: ${text.substring(0, 50)}`);
      }
      
      if (!resp.ok) {
        throw new Error(data.error || "Invalid 2FA code");
      }
      
      onLogin(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05050A] flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] animate-[pulse_10s_ease-in-out_infinite_reverse]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
            <ShieldCheck className="text-white h-8 w-8" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-white">
          ClickCamp Secure Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Two-Factor Authentication Required
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0A0A0F] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/5 ring-1 ring-white/5 backdrop-blur-xl">
          
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          {!require2FA ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Select User Profile
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-[#111116] border border-white/10 rounded-xl text-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none outline-none"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-10 pr-3 py-3 bg-[#111116] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Continue to 2FA"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
                <h3 className="text-white font-medium">Password Verified</h3>
                <p className="text-sm text-gray-400">Enter your 2FA code to proceed.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className="block w-full px-3 py-3 bg-[#111116] border border-white/10 rounded-xl text-white placeholder-gray-500 text-center tracking-widest text-lg focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="000000"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Secure Login"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
