import React, { useState } from 'react';
import { Flame, Crown, Zap, X, Sparkles, User, Globe, MousePointer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import WebApp from '@twa-dev/sdk';

interface TelegramFrameProps {
  children: React.ReactNode;
  streakDays: number;
  isPremium: boolean;
  matchaSparks?: number;
  activeTab?: 'discover' | 'profile';
  onTabChange?: (tab: 'discover' | 'profile') => void;
  currentUser?: any;
  onInviteAndRefer?: () => void;
  onLanguageToggle?: () => void;
  appLanguage?: 'en' | 'ru';
  t?: any;
}

export default function TelegramFrame({
  children,
  streakDays,
  isPremium,
  matchaSparks,
  activeTab = 'discover',
  onTabChange,
  currentUser,
  onInviteAndRefer,
  onLanguageToggle,
  appLanguage = 'en',
  t
}: TelegramFrameProps) {
  const [showSparksModal, setShowSparksModal] = useState(false);

  const displayTranslations = t || {
    swipe: "SWIPE",
    profile: "PROFILE",
    copied: "Copied",
    copy: "Copy"
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#1A1A1A] flex items-center justify-center font-sans overflow-x-hidden relative md:p-6 lg:p-12">
      
      {/* Light sage-green fluid brand glows - Animated slow ocean float loops */}
      <motion.div
        animate={{
          scale: [1, 1.12, 0.95, 1.05, 1],
          x: ["0%", "8%", "-7%", "4%", "0%"],
          y: [0, 20, -15, 8, 0]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }}
        className="absolute top-0 right-1/4 w-[480px] h-[480px] bg-[#E8F5EE]/50 blur-[130px] rounded-full pointer-events-none z-0 animate-pulse"
      />
      <motion.div
        animate={{
          scale: [1, 0.92, 1.08, 1, 0.95],
          x: ["0%", "-6%", "5%", "-3%", "0%"],
          y: [0, -20, 15, -8, 0]
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut"
        }}
        className="absolute bottom-0 left-1/4 w-[420px] h-[420px] bg-[#C8E6D4]/30 blur-[140px] rounded-full pointer-events-none z-0"
      />

      {/* Main Core Viewport: Centered Smartphone app mockup on PC and full screen on mobile for 100% exact design & feature parity */}
      <div className="w-full max-w-[460px] min-h-screen md:min-h-0 md:h-[820px] md:max-h-[88vh] bg-[#F5F5F0] relative z-10 flex flex-col shadow-[0_24px_80px_rgba(0,0,0,0.08)] md:border border-black/[0.05] md:rounded-[40px] overflow-hidden transition-all duration-300">
        
        {/* Workspace Mini Applet Body */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#F5F5F0]">
          
          {/* Authentic Telegram Mini App Header */}
          <header className="sticky top-0 z-40 bg-white border-b border-black/[0.03] px-5 py-4 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse shrink-0" />
              <span className="font-display font-black text-[12.5px] uppercase tracking-wider text-[#1A1A1A]">MATCHA BOT</span>
            </div>

            <div className="flex items-center gap-4">
              {matchaSparks !== undefined && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSparksModal(true)}
                  className="flex items-center gap-1.5 cursor-pointer text-[#D19200] group select-none relative bg-amber-500/5 hover:bg-amber-500/10 px-2 py-1 rounded-full border border-amber-500/10 transition"
                  title="Your Matcha Sparks balance"
                >
                  <Zap className="w-3.5 h-3.5 stroke-[2.5] text-[#D19200] fill-amber-300/20 group-hover:fill-amber-400 group-hover:text-amber-600 transition duration-300 animate-[pulse_2s_infinite]" />
                  <span className="text-[11px] font-mono font-black tracking-widest leading-none">
                    {matchaSparks} <span className="text-[9px] font-bold text-[#D19200]/70">⚡</span>
                  </span>
                </motion.div>
              )}
              <span className="text-[10px] font-mono text-[#00A876] font-extrabold uppercase tracking-widest bg-[#E8F5EE] px-2 py-0.5 rounded-md">TMA INSTANT</span>
            </div>
          </header>

          {/* Unified layout sub-bar with Invite Friend and Language Switcher, visible everywhere to bridge PC and mobile feature split */}
          <div className="bg-[#FFFFFF] border-b border-black/[0.03] py-2 px-5 flex items-center justify-between gap-1.5 shrink-0 select-none z-30">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {onInviteAndRefer && (
                <button
                  onClick={() => {
                    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
                    onInviteAndRefer();
                  }}
                  className="h-7 px-3.5 rounded-full bg-[#00C896]/10 hover:bg-[#00C896]/20 border border-[#00C896]/15 text-[#1A7A55] font-black text-[9.5px] uppercase tracking-wider transition duration-150 cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs active:scale-95"
                >
                  <span>🔗 {appLanguage === 'ru' ? "Позвать друга (+10⚡)" : "Invite Friend (+10⚡)"}</span>
                </button>
              )}
              {onLanguageToggle && (
                <button
                  onClick={() => {
                    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
                    onLanguageToggle();
                  }}
                  className="h-7 px-2.5 rounded-full bg-black/[0.03] hover:bg-black/[0.06] border border-black/[0.04] text-[#1A1A1A] text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shrink-0 active:scale-95"
                >
                  <Globe className="w-3 h-3 text-[#00C896]" />
                  <span>{appLanguage === 'en' ? "US/RU 🇺🇸" : "RU/US 🇷🇺"}</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-neutral-400 font-mono text-[9px] font-black uppercase shrink-0">
              <span className="flex items-center gap-0.5 text-orange-600">
                <Flame className="w-3 h-3 fill-orange-500/10" />
                <span>{streakDays}D</span>
              </span>
              <span className="text-neutral-300">|</span>
              <span className="text-[#00C896] animate-pulse">● LIVE</span>
            </div>
          </div>

          {/* Core content stream */}
          <div className="flex-grow flex flex-col overflow-y-auto overflow-x-hidden relative scrollbar-thin">
            {children}
          </div>
        </div>

      </div>

      {/* Matcha Sparks Educational Modal overlay */}
      <AnimatePresence>
        {showSparksModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E8F5EE] rounded-[28px] p-6 max-w-xs w-full text-center space-y-4 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowSparksModal(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="relative">
                <div className="relative flex items-center justify-center text-[#D19200] mx-auto">
                  <Zap className="h-10 w-10 stroke-[2.5] fill-amber-300/10 animate-[pulse_2s_infinite]" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-extrabold text-[#1A1A1A] text-lg leading-none tracking-tight">
                  Matcha Sparks ⚡
                </h3>
                <p className="text-[11px] text-neutral-500 font-bold leading-relaxed">
                  Ваша энергия премиального подбора / Your energy for premium matches
                </p>
              </div>

              <div className="border-t border-black/[0.04] pt-3 text-left space-y-3.5">
                <div className="flex gap-2.5 items-start">
                  <span className="text-[#00C896] font-mono text-sm font-black mt-0.5">⚡</span>
                  <p className="text-[11.5px] text-neutral-600 font-bold leading-normal">
                    <span className="font-black text-[#1A1A1A]">AI Super-Match (5⚡):</span> Моментальный подбор кандидатов с пиковым совпадением по вайбу. <br/>
                    <span className="text-neutral-400 font-semibold font-mono text-[10px] uppercase">Spend 5⚡ to instantly locate peak overlaps on node layers.</span>
                  </p>
                </div>

                <div className="flex gap-2.5 items-start">
                  <span className="text-[#00C896] font-mono text-sm font-black mt-0.5">🎁</span>
                  <p className="text-[11.5px] text-neutral-600 font-bold leading-normal">
                    <span className="font-black text-[#1A1A1A]">Как получить / How to earn:</span> Приглашайте друзей через <span className="font-extrabold text-[#00C896]">PROFILE</span> и забирайте <span className="text-[#00C896] font-black">+10⚡ Sparks</span> за каждого нового основателя! <br/>
                    <span className="text-neutral-400 font-semibold font-mono text-[10px] uppercase">Score +10⚡ Sparks for every founder that joins your wave.</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowSparksModal(false)}
                className="w-full h-[44px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition duration-200 border-none shadow-sm"
              >
                Закрыть / Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

