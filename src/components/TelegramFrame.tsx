import React from 'react';
import { Smartphone, Laptop, Battery, Wifi, Flame, Sparkles, RefreshCw, Crown } from 'lucide-react';

interface TelegramFrameProps {
  children: React.ReactNode;
  viewMode: 'mobile' | 'desktop';
  setViewMode: (mode: 'mobile' | 'desktop') => void;
  streakDays: number;
  isPremium: boolean;
  onReset: () => void;
}

export default function TelegramFrame({
  children,
  viewMode,
  setViewMode,
  streakDays,
  isPremium,
  onReset
}: TelegramFrameProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] flex flex-col transition-colors duration-200 relative overflow-hidden font-sans">
      
      {/* Light sage-green premium glow patterns */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#E8F5EE]/60 blur-[130px] rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C8E6D4]/30 blur-[140px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* Top Play/Reset Simulator Header Container - White / Clean Line */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-black/[0.04] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Logo with matching sage green bolt symbol */}
          <span className="flex items-center justify-center p-2 rounded-xl bg-gradient-to-tr from-[#C8E6D4] to-[#A8D5B8] text-[#1A7A55] shadow-sm">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-[#1A7A55]">
              <path d="M12.01 21.49L20.53 10h-6.26l2.91-8L8.66 12.01h6.26z" />
            </svg>
          </span>
          <div>
            <span className="font-display font-bold text-sm tracking-tight text-[#1A1A1A]">matcha</span>
            <span className="text-[10px] text-[#6B7280] ml-2 font-mono hidden sm:inline">[ LIGHT TMA ENGINE ]</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Reset Demo */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] hover:text-[#1A1A1A] hover:bg-black/[0.03] rounded-xl transition cursor-pointer"
            title="Reset wave state"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin-reverse" />
            <span className="hidden sm:inline">Reset Deck</span>
          </button>

          {/* Day streak element */}
          <div className="flex items-center gap-1.5 bg-[#E8F5EE] text-[#1A7A55] px-3 py-1.5 rounded-full text-[11px] font-bold border border-transparent">
            <Flame className="h-3.5 w-3.5 fill-current" />
            <span>{streakDays}d Streak</span>
          </div>

          {/* Premium Account Badge status */}
          {isPremium && (
            <div className="flex items-center gap-1.5 bg-[#1A1A1A] text-[#00C896] px-3 py-1.5 rounded-full text-[11px] font-bold">
              <Crown className="h-3.5 w-3.5 fill-current" />
              <span>PRO</span>
            </div>
          )}

          {/* Screen Device viewport simulator switch button */}
          <div className="h-6 w-px bg-black/[0.06]" />
          <div className="bg-black/[0.04] p-1 rounded-xl flex items-center">
            <button
              onClick={() => setViewMode('mobile')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'mobile'
                  ? 'bg-white text-[#00C896] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
              title="Simulator View"
              id="switch-mobile-btn"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('desktop')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'desktop'
                  ? 'bg-white text-[#00C896] shadow-sm'
                  : 'text-[#6B7280] hover:text-[#1A1A1A]'
              }`}
              title="Wide layout model"
              id="switch-desktop-btn"
            >
              <Laptop className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Container Display */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-5 overflow-x-hidden z-10 bg-[#F5F5F0]">
        {viewMode === 'mobile' ? (
          /* Phone Shell wrapper simulating authentic light Telegram UI experience */
          <div className="relative w-full max-w-[400px] h-[780px] bg-white rounded-[48px] shadow-[0_24px_64px_rgba(0,0,0,0.06)] border-[8px] border-zinc-200 flex flex-col overflow-hidden transition-all duration-300">
            
            {/* Phone Camera Lens Speaker notch */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-5 bg-zinc-200 rounded-full flex items-center justify-center gap-1.5 z-50">
              <div className="w-10 h-0.5 bg-zinc-400 rounded-full" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full border border-zinc-400" />
            </div>

            {/* Simulating phone headers bar */}
            <div className="h-10 bg-white px-6 pt-3 flex items-center justify-between text-[10.5px] font-semibold tracking-tight text-[#6B7280] select-none z-10">
              <span>23:14</span>
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3 w-3 text-[#6B7280]" />
                <span className="text-[9px]">5G</span>
                <Battery className="h-3.5 w-3.5 text-[#6B7280]" />
              </div>
            </div>

            {/* Mini App Header mimicking real Bot header */}
            <div className="h-12 bg-white border-b border-black/[0.04] flex items-center justify-between px-4 text-xs font-semibold relative select-none z-10">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00C896] animate-pulse" />
                <span className="text-[#1A1A1A] font-bold tracking-tight uppercase">matcha bot</span>
              </div>
              <div className="flex items-center gap-3 text-[#6B7280] font-mono text-[10px]">
                <span className="text-[#1A7A55]">TMA INSTANT</span>
                <div className="flex items-center gap-0.5 text-zinc-300">
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span className="w-1 h-1 rounded-full bg-current" />
                  <span className="w-1 h-1 rounded-full bg-current" />
                </div>
              </div>
            </div>

            {/* Main view frame body insert */}
            <div className="flex-1 overflow-hidden flex flex-col relative bg-[#F5F5F0]">
              {children}
            </div>

            {/* iPhone footer touch selector pill */}
            <div className="h-4 bg-white flex items-center justify-center pb-1">
              <div className="w-24 h-1 bg-zinc-200 rounded-full" />
            </div>
          </div>
        ) : (
          /* Immersive Beautiful Ambient mock container wrapping the exact mobile view centered inside */
          <div className="w-full max-w-[400px] h-[780px] bg-white rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-black/[0.06] flex flex-col overflow-hidden transition-all pb-2">
            
            {/* Minimal App Header bar */}
            <div className="h-12 bg-white border-b border-black/[0.04] flex items-center justify-between px-4 text-xs font-semibold select-none">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00C896] animate-ping" />
                <span className="text-[#1A1A1A] font-bold uppercase tracking-widest text-[9.5px]">Matcha Preview</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#6B7280] text-[9px] font-mono">
                <span>PORT 3000</span>
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col relative bg-[#F5F5F0]">
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
