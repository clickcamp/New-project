const fs = require('fs');

const content = `import React, { useState, useEffect, useRef } from "react";
import { User } from "../types";
import { ShieldCheck, Lock, ArrowRight, User as UserIcon, Camera, CheckCircle2 } from "lucide-react";
import * as faceapi from '@vladmandic/face-api';
import QRCode from 'react-qr-code';

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
  const [modelsLoaded, setModelsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Phase 1 States
  const [isRegistering, setIsRegistering] = useState(false);
  const [qrCodeData, setQrCodeData] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  
  // Phase 3 States
  const [require2FA, setRequire2FA] = useState(false);
  const [tempUserId, setTempUserId] = useState("");
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }
  }, [users, selectedUserId]);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];

  // Load Face API Models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load models", err);
      }
    };
    loadModels();
  }, []);

  // Start Webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (modelsLoaded && selectedUser?.role !== 'Admin' && !require2FA) {
      navigator.mediaDevices.getUserMedia({ video: {} }).then(s => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      }).catch(err => {
        setError("Webcam access denied. Please allow webcam permissions.");
      });
    }
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [modelsLoaded, selectedUser, require2FA]);

  // Phase 2: Passive Scanning Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const scanFace = async () => {
      if (!videoRef.current || !modelsLoaded || isRegistering || require2FA || selectedUser?.role === 'Admin') return;
      
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (detection) {
        // We found a face! Let's try to auto-login.
        try {
          const resp = await fetch('/api/biometric/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ descriptor: Array.from(detection.descriptor) })
          });
          
          if (resp.ok) {
            const data = await resp.json();
            if (data.require2FA) {
              setRequire2FA(true);
              setTempUserId(data.tempUserId);
            }
          }
        } catch (err) {
          // Silent fail on passive scan
        }
      }
    };

    if (modelsLoaded && !require2FA && !isRegistering && selectedUser?.role !== 'Admin') {
      interval = setInterval(scanFace, 1500);
    }
    
    return () => clearInterval(interval);
  }, [modelsLoaded, isRegistering, require2FA, selectedUser]);

  // Phase 1: Registration
  const handleRegisterFace = async () => {
    if (!videoRef.current) return;
    setLoading(true);
    setError("");
    
    try {
      const detection = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();
        
      if (!detection) {
        throw new Error("No face detected. Please look directly at the camera.");
      }
      
      const resp = await fetch('/api/biometric/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: selectedUser.id, 
          userEmail: selectedUser.email,
          descriptor: Array.from(detection.descriptor) 
        })
      });
      
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Failed to register");
      }
      
      const data = await resp.json();
      setQrCodeData(data.otpauthUrl);
      setRegistrationSuccess(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id, password })
      });
      
      if (!resp.ok) {
        throw new Error("Invalid admin credentials");
      }
      
      onLogin(selectedUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Phase 3: 2FA Verification
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const resp = await fetch('/api/biometric/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempUserId, token: otp })
      });
      
      if (!resp.ok) {
        throw new Error("Invalid 2FA code");
      }
      
      const data = await resp.json();
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
          ClickCamp Biometrics
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0A0A0F] py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-white/5 ring-1 ring-white/5 backdrop-blur-xl">
          
          {!require2FA && !isRegistering && (
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
          )}

          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3">
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
                {loading ? "Verifying..." : "Authenticate"}
              </button>
            </form>
          ) : require2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center mb-4">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-white font-medium">Face Verified</h3>
                <p className="text-sm text-gray-400">Please enter your 2FA code to proceed.</p>
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
                {loading ? "Verifying..." : "Submit 2FA"}
              </button>
            </form>
          ) : isRegistering ? (
            <div className="space-y-6">
              {!registrationSuccess ? (
                <>
                  <p className="text-sm text-gray-400 text-center">
                    Look directly at the camera to capture your facial biometric descriptor.
                  </p>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10">
                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setIsRegistering(false)}
                      className="flex-1 py-3 px-4 border border-white/10 rounded-xl text-sm font-semibold text-white bg-white/5 hover:bg-white/10"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegisterFace}
                      disabled={loading || !modelsLoaded}
                      className="flex-1 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {loading ? "Capturing..." : "Capture Face"}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <h3 className="text-emerald-400 font-medium">Capture Successful!</h3>
                  <p className="text-sm text-gray-400">
                    Scan this QR code with your Authenticator App (Google Authenticator, Authy, etc.).
                  </p>
                  <div className="bg-white p-4 rounded-xl inline-block">
                    <QRCode value={qrCodeData} size={150} />
                  </div>
                  <p className="text-xs text-amber-500">
                    Note: Your biometric profile is pending Admin approval. You will not be able to log in until an Admin approves your Face ID.
                  </p>
                  <button
                    onClick={() => {
                      setIsRegistering(false);
                      setRegistrationSuccess(false);
                    }}
                    className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 flex flex-col items-center py-2">
              <p className="text-sm text-gray-400 text-center mb-2">
                Face scanner active. Look at the camera to login passively.
              </p>
              
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {!modelsLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                    <span className="text-indigo-400 text-sm animate-pulse">Loading ML Models...</span>
                  </div>
                )}
                <div className="absolute inset-0 border-2 border-indigo-500/50 rounded-xl pointer-events-none animate-pulse" />
              </div>
              
              <button
                onClick={() => setIsRegistering(true)}
                className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Need to register your face? Click here.
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/LoginPortal.tsx', content);
console.log("LoginPortal.tsx completely updated.");
