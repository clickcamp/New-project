import React from "react";
import { User } from "../types";
import { ArrowRight, Activity, TrendingUp, BarChart3, ShieldCheck } from "lucide-react";

interface HomeScreenProps {
  onLaunch: (appId: string) => void;
  currentUser: User | null;
  onLogout: () => void;
}

export function HomeScreen({ onLaunch, currentUser, onLogout }: HomeScreenProps) {
  return (
    <div className="min-h-screen bg-[#050505] font-sans selection:bg-purple-500/30 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-900/10 blur-[120px] mix-blend-screen" />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-blue-900/10 blur-[120px] mix-blend-screen" />
      </div>

      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <img src="/logo.svg" alt="Click.camp Logo" className="h-6 w-auto object-contain brightness-0 invert" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">Click.camp</span>
        </div>
        
        <div className="flex items-center gap-4">
          {currentUser ? (
            <button 
              onClick={() => onLaunch('workspace')}
              className="px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2"
            >
              Go to Portal <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={() => onLaunch('workspace')}
              className="px-5 py-2.5 bg-white/10 border border-white/20 text-white text-sm font-semibold rounded-full hover:bg-white/20 transition-all flex items-center gap-2 backdrop-blur-md"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </nav>

      {/* Main Hero Section */}
      <main className="relative z-10 flex flex-col lg:flex-row items-center justify-between px-6 lg:px-12 py-12 lg:py-20 max-w-7xl mx-auto min-h-[calc(100vh-88px)] gap-12">
        
        {/* Left Typography & CTAs */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-8 z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md w-fit">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">System Online | Q3 Target Sprint Active</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Drive <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Targets.</span> <br />
            Simplify Operations.
          </h1>
          
          <p className="text-lg text-white/60 leading-relaxed max-w-lg font-light">
            The unified command center for ClickCamp Technologies. Track daily account targets, manage seamless HR workflows, and monitor real-time performance—all in one secure portal.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button 
              onClick={() => onLaunch('workspace')}
              className="w-full sm:w-auto px-8 py-4 bg-white text-black rounded-full font-bold hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
            >
              Employee Portal Login
            </button>
            <button 
              onClick={() => onLaunch('workspace')}
              className="w-full sm:w-auto px-8 py-4 bg-transparent text-white rounded-full font-bold hover:bg-white/10 transition-colors backdrop-blur-md border border-white/20 flex items-center justify-center gap-2"
            >
              HR & Admin Access
            </button>
          </div>
        </div>

        {/* Right Dashboard Visual Composition */}
        <div className="w-full lg:w-1/2 h-[500px] lg:h-[600px] flex items-center justify-center relative perspective-[2000px] mt-8 lg:mt-0">
          <div className="relative w-full max-w-lg aspect-square [transform-style:preserve-3d] [transform:rotateX(10deg)_rotateY(-20deg)] hover:[transform:rotateX(15deg)_rotateY(-15deg)] transition-transform duration-1000 ease-out">
            
            {/* Dashboard Mockup Base */}
            <div className="absolute inset-0 bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(124,58,237,0.2)] p-6 [transform:translateZ(0px)] flex flex-col gap-6">
              
              {/* Header Mockup */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5">
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="h-4 w-24 bg-white/10 rounded"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/5"></div>
                  <div className="w-6 h-6 rounded-full bg-white/5"></div>
                </div>
              </div>

              {/* Stats Row Mockup */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="h-3 w-16 bg-white/20 rounded mb-3"></div>
                  <div className="h-8 w-20 bg-emerald-400/20 rounded"></div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="h-3 w-16 bg-white/20 rounded mb-3"></div>
                  <div className="h-8 w-20 bg-indigo-400/20 rounded"></div>
                </div>
              </div>

              {/* Chart Mockup */}
              <div className="flex-1 bg-white/5 rounded-xl border border-white/5 p-4 flex flex-col justify-end gap-2">
                <div className="flex items-end justify-between h-full px-2 gap-2">
                  {[40, 60, 30, 80, 50, 90, 70].map((height, i) => (
                    <div key={i} className="w-full bg-gradient-to-t from-purple-500/40 to-indigo-500/40 rounded-t-sm" style={{ height: `${height}%` }}></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Element 1 */}
            <div className="absolute -top-6 -right-6 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl [transform:translateZ(60px)] animate-[bounce_5s_infinite_ease-in-out]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">Target Exceeded</div>
                  <div className="text-xs text-white/50">+24% this week</div>
                </div>
              </div>
            </div>

            {/* Floating Element 2 */}
            <div className="absolute -bottom-10 -left-10 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl [transform:translateZ(80px)] animate-[bounce_6s_infinite_ease-in-out_reverse]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">14 Accounts</div>
                  <div className="text-xs text-white/50">Verified Today</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
