const fs = require('fs');

const code = `
import React, { useState, useEffect } from "react";
import { User, WebAuthnCredential } from "../types";
import { ShieldCheck, Lock, ArrowRight, User as UserIcon, Fingerprint } from "lucide-react";
import { cn } from "../utils";
import { startRegistration, startAuthentication } from '@simplewebauthn/browser';

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
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [hasCredential, setHasCredential] = useState<boolean>(false);
  const [credentials, setCredentials] = useState<any[]>([]);

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Check for existing WebAuthn credentials when employee is selected
  useEffect(() => {
    const checkCreds = async () => {
      if (!selectedUser || selectedUser.role === 'Admin') return;
      try {
        const { collection, query, where, getDocs } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        const q = query(collection(db, "webAuthnCredentials"), where("userId", "==", selectedUser.id));
        const snap = await getDocs(q);
        setHasCredential(!snap.empty);
        setCredentials(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to check credentials", err);
      }
    };
    checkCreds();
  }, [selectedUser]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { doc, getDoc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const userDoc = await getDoc(doc(db, "users", selectedUserId));
      if (!userDoc.exists()) throw new Error("User not found.");
      
      const userData = { id: userDoc.id, ...userDoc.data() } as any;

      // Auto-migrate standard password to password_hash if needed for the prototype
      let storedHash = userData.password_hash;
      if (!storedHash) {
        const bcrypt = await import("bcryptjs");
        storedHash = await bcrypt.default.hash(userData.password || "malik123", 10);
        await updateDoc(doc(db, "users", selectedUserId), { password_hash: storedHash });
      }

      // Hit our Admin route
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, storedHash })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Login failed");

      if (userData.status === "Absconding") throw new Error("Access denied: suspended.");
      onLogin(userData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterFaceID = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch('/api/webauthn/generate-registration-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, userEmail: selectedUser.email })
      });
      const options = await resp.json();
      
      const attResp = await startRegistration(options);
      
      const verifyResp = await fetch('/api/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, body: attResp })
      });
      const verification = await verifyResp.json();
      
      if (verification.verified) {
        const { collection, addDoc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        
        // registrationInfo has credentialID (Uint8Array converted to map or array sometimes, or base64)
        // simplewebauthn might return them as Buffer or base64. Let's just store base64 string
        const base64Encode = (arr: any) => btoa(String.fromCharCode.apply(null, new Uint8Array(arr) as any));
        
        const newCred = {
          userId: selectedUser.id,
          credentialID: attResp.id, // simplewebauthn response has it in base64url format
          publicKey: base64Encode(verification.registrationInfo.credentialPublicKey),
          counter: verification.registrationInfo.counter,
          transports: attResp.response.transports || []
        };
        
        await addDoc(collection(db, "webAuthnCredentials"), newCred);
        setHasCredential(true);
        setCredentials([newCred]);
        setError("Face ID registered successfully! Please login now.");
      } else {
        throw new Error("Verification failed on server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to register Face ID");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginFaceID = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await fetch('/api/webauthn/generate-authentication-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, allowCredentials: credentials })
      });
      const options = await resp.json();
      
      const asseResp = await startAuthentication(options);
      
      // Find the corresponding stored credential
      const cred = credentials.find(c => c.credentialID === asseResp.id);
      
      const verifyResp = await fetch('/api/webauthn/verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          body: asseResp,
          authenticator: cred 
        })
      });
      const verification = await verifyResp.json();
      
      if (verification.verified) {
        // success!
        const { doc, getDoc } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        const userDoc = await getDoc(doc(db, "users", selectedUser.id));
        const userData = { id: userDoc.id, ...userDoc.data() } as any;
        if (userData.status === "Absconding") throw new Error("Access denied: suspended.");
        onLogin(userData);
      } else {
        throw new Error("Face ID verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to login with Face ID");
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
          ClickCamp Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Biometric & Secure Workspace Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0A0A0F] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/5 ring-1 ring-white/5 backdrop-blur-xl">
          
          <div className="mb-6">
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
                className="block w-full pl-10 pr-3 py-3 bg-[#111116] border border-white/10 rounded-xl text-gray-200 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 appearance-none transition-all outline-none"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm text-red-400 font-medium">{error}</p>
            </div>
          )}

          {selectedUser?.role === 'Admin' ? (
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Admin Password
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
                    className="block w-full pl-10 pr-3 py-3 bg-[#111116] border border-white/10 rounded-xl text-white placeholder-gray-500 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0A0A0F] focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Verifying..." : "Authenticate"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <div className="space-y-6 flex flex-col items-center py-4">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center border border-indigo-500/20 mb-2">
                <Fingerprint className="w-10 h-10 text-indigo-400" />
              </div>
              <p className="text-sm text-gray-400 text-center mb-4">
                Employee access requires biometric attestation (Face ID / Touch ID) linked to your device hardware.
              </p>

              {hasCredential ? (
                <button
                  onClick={handleLoginFaceID}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-indigo-500/30 rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.15)] text-sm font-semibold text-white bg-indigo-600/20 hover:bg-indigo-600/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Authenticating..." : "Login with Face ID / Touch ID"}
                </button>
              ) : (
                <button
                  onClick={handleRegisterFaceID}
                  disabled={loading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-emerald-500/30 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.15)] text-sm font-semibold text-white bg-emerald-600/20 hover:bg-emerald-600/30 transition-all disabled:opacity-50"
                >
                  {loading ? "Registering..." : "Register Face ID (First Time)"}
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="mt-8 text-center text-xs text-gray-500 font-medium">
          <p>{currentTime} • Secured by ClickCamp Intranet</p>
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/LoginPortal.tsx', code);
