import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import TelegramFrame from './components/TelegramFrame';
import OnboardingView from './components/OnboardingView';
import DashboardView from './components/DashboardView';
import PremiumModal from './components/PremiumModal';
import { GlassCard } from './components/GlassCard';
import { CurrentUser } from './types';
import {
  Sparkles,
  User,
  Crown,
  Bell,
  Shield,
  Link2,
  LogOut,
  ChevronRight,
  Flame,
  Check
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');
  
  // Immersive Mobile Tabs: exactly 2 tabs ('discover' | 'profile')
  const [mobileTab, setMobileTab] = useState<'discover' | 'profile'>('discover');
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");

  // Initialize Telegram TMA environment params safely
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#FFFFFF');
      WebApp.setBackgroundColor('#F0F0EB');
    } catch (e) {
      console.log("Telegram TMA SDK bypass on outer desktop browser.");
    }
  }, []);

  const fetchCurrentUserAndConfig = async () => {
    try {
      const response = await fetch('/api/user/me');
      const data = await response.json();
      setCurrentUser(data);
    } catch (err) {
      console.error("Configuration loading failed:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUserAndConfig();
  }, []);

  const handleOnboardingComplete = (onboardedUser: CurrentUser) => {
    setCurrentUser(onboardedUser);
    setHasOnboarded(true);
    setMobileTab('discover');
  };

  const handleUpdateCurrentUser = (updatedUser: CurrentUser) => {
    setCurrentUser(updatedUser);
  };

  const handlePremiumSuccess = (isPremiumStatus: boolean) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, isPremium: isPremiumStatus });
    }
  };

  const handleResetDemo = async () => {
    try {
      await fetch('/api/debug/reset', { method: 'POST' });
      await fetchCurrentUserAndConfig();
      setMobileTab('discover');
      setInviteFeedback("");
      setCopiedLink(false);
    } catch (err) {
      console.error("Demo reset triggers failed:", err);
    }
  };

  // Grow feature: Invite referral trigger
  const handleInviteAndRefer = async () => {
    if (!currentUser) return;
    const refUrl = `t.me/matchabot?start=REF_${currentUser.id}`;
    
    // Copy the real link safely to clipboard
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    try {
      // Simulate real user registering using referral URL: award both +5 Priority points
      const response = await fetch('/api/user/refer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referrerId: currentUser.id })
      });
      const data = await response.json();
      if (data.success && currentUser) {
        setInviteFeedback("+5 Priority Boost Activated!");
        setCurrentUser({
          ...currentUser,
          priorityPoints: data.priorityPoints
        });
        setTimeout(() => setInviteFeedback(""), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F0F0EB] flex flex-col items-center justify-center text-center px-4 font-mono">
        <div className="relative mb-4 flex items-center justify-center">
          <div className="absolute w-8 h-8 rounded-full border-2 border-[#00C896]/20 animate-ping" />
          <svg className="animate-spin h-8 w-8 text-[#00C896]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
        <p className="text-[#1A7A55] text-[10px] uppercase tracking-[0.2em] font-extrabold">Connecting Matcha Vibe Lobbie...</p>
      </div>
    );
  }

  return (
    <TelegramFrame
      viewMode={viewMode}
      setViewMode={setViewMode}
      streakDays={currentUser.streakDays}
      isPremium={currentUser.isPremium}
      onReset={handleResetDemo}
    >
      {!hasOnboarded ? (
        <OnboardingView onComplete={handleOnboardingComplete} />
      ) : (
        <div className="flex-1 flex flex-col justify-between h-full bg-[#F0F0EB] overflow-hidden relative" id="mobile-applet-mount">
          
          {/* Main Content Pane */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col h-full scrollbar-none select-none">
            <AnimatePresence mode="wait">
              
              {/* SWIPE MAIN SCREEN */}
              {mobileTab === 'discover' && (
                <motion.div
                  key="discover"
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="flex-grow flex flex-col h-full overflow-hidden"
                >
                  <DashboardView
                    currentUser={currentUser}
                    onOpenPremium={() => setIsPremiumOpen(true)}
                    onUpdateCurrentUser={handleUpdateCurrentUser}
                  />
                </motion.div>
              )}

              {/* PROFILE SCREEN */}
              {mobileTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 24 }}
                  className="space-y-5 flex flex-col h-full"
                  id="profile-screen-me"
                >
                  {/* Identity Header */}
                  <div className="text-center space-y-3 pt-2">
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-[#E8F5EE] blur-md animate-pulse" />
                      <div className="relative w-full h-full rounded-full bg-white text-[#1A1A1A] border-2 border-[#1A7A55]/10 flex items-center justify-center font-extrabold text-3xl shadow-sm">
                        {currentUser.name.charAt(0)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-[26px] font-black text-[#1A1A1A] leading-none tracking-tight">
                        {currentUser.name}
                      </h2>
                      <p className="text-[13px] text-[#1A7A55] font-extrabold">
                        @{currentUser.username}
                      </p>
                      
                      <div className="pt-2 flex justify-center">
                        <span className="px-3 py-1 rounded-full bg-[#E8F5EE] text-[#1A7A55] border border-[#00C896]/10 text-[11px] font-extrabold uppercase tracking-wide">
                          {currentUser.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Growth Block: "Invite a founder" - Light sage green gradient */}
                  <div 
                    onClick={handleInviteAndRefer}
                    className="bg-gradient-to-br from-[#C8E6D4] to-[#A8D5B8] rounded-[24px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] border border-black/[0.03] space-y-3.5 cursor-pointer hover:opacity-95 transition relative overflow-hidden"
                    id="invite-generator-card"
                  >
                    <div className="absolute right-3.5 top-3.5 bg-white/40 text-[#1A7A55] font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                      GROWTH ⚡
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-[17px] font-black text-[#1A1A1A] tracking-tight">
                        Invite a founder
                      </h3>
                      <p className="text-xs text-[#1A7A55] font-extrabold leading-tight">
                        Generate ref links and score +5 stack priority boost for both when they join.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-white/70 py-2.5 px-4 rounded-xl border border-black/[0.02]">
                      <span className="text-[11px] font-mono text-[#1A1A1A]/70 font-bold truncate max-w-[170px]">
                        t.me/matchabot?start=REF_{currentUser.id}
                      </span>
                      <button className="text-[11px] font-extrabold text-[#1A7A55] uppercase shrink-0 flex items-center gap-1">
                        {copiedLink ? <Check className="h-3 w-3 stroke-[3]" /> : <Link2 className="h-3.5 w-3.5" />}
                        <span>{copiedLink ? "Copied" : "Copy"}</span>
                      </button>
                    </div>

                    {inviteFeedback && (
                      <div className="bg-[#1A1A1A] text-white py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider text-center animate-bounce">
                        {inviteFeedback}
                      </div>
                    )}
                  </div>

                  {/* Energy tags */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#1A7A55] block">
                      // CONFIG ENERGY SIGNATURE
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {currentUser.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-white border border-black/[0.04] text-[#1A1A1A] font-extrabold text-[11px] px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI vibe facts signature preview */}
                  {currentUser.ai_facts && currentUser.ai_facts.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#1A7A55] block">
                        // YOUR AI VIBE SIGNATURE
                      </label>
                      <div className="bg-white border border-black/[0.04] p-4 rounded-[24px] space-y-2.5 shadow-sm">
                        {currentUser.ai_facts.map((fact, index) => (
                          <div key={index} className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[10px] font-bold text-[#1A7A55] shrink-0">
                              ⚡
                            </span>
                            <p className="text-[12.5px] text-[#1A1A1A] font-bold leading-tight">
                              {fact}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3" id="profile-stats-grid">
                    <GlassCard className="p-3 text-center border border-black/[0.04]">
                      <span className="text-xl font-black text-[#1A1A1A] block font-mono">
                        {currentUser.matchesToday}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">Liked Today</span>
                    </GlassCard>

                    <GlassCard className="p-3 text-center border border-black/[0.04]">
                      <span className="text-xl font-black text-[#1A1A1A] block font-mono">
                        {currentUser.streakDays}d
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">Streak</span>
                    </GlassCard>

                    <GlassCard className="p-3 text-center border border-black/[0.04]">
                      <span className="text-xl font-black text-[#1A1A1A] block font-mono">
                        +{currentUser.priorityPoints || 0}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">Boost Pts</span>
                    </GlassCard>
                  </div>

                  {/* Secure Settings List */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#1A7A55] ml-1 block">
                      // SETTINGS SECURE
                    </h4>

                    <GlassCard className="overflow-hidden border border-black/[0.04] rounded-2xl">
                      <div className="divide-y divide-black/[0.03]">
                        {[
                          { id: 'notif', name: 'Ambient Pushes', icon: Bell },
                          { id: 'privacy', name: 'Ghost Mode', icon: Shield },
                          { id: 'reset', name: 'Reset Simulation Deck', icon: LogOut, danger: true }
                        ].map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              if (item.id === 'reset') {
                                handleResetDemo();
                              } else {
                                try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
                              }
                            }}
                            className="h-[48px] px-4 flex items-center justify-between hover:bg-black/[0.01] cursor-pointer transition duration-150"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className={`h-4.5 w-4.5 ${item.danger ? 'text-rose-500 animate-pulse' : 'text-[#6B7280]'}`} />
                              <span className={`text-[13px] font-extrabold ${item.danger ? 'text-rose-600' : 'text-[#1A1A1A]'}`}>
                                {item.name}
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-zinc-300" />
                          </div>
                        ))}
                      </div>
                    </GlassCard>
                  </div>

                  <div className="pt-2 pb-6">
                    <button
                      onClick={() => setHasOnboarded(false)}
                      className="w-full text-center py-4 bg-[#FFFFFF] hover:bg-[#FFFFFF]/90 text-[#1A1A1A] border border-black/[0.04] rounded-[100px] h-[56px] text-xs font-bold uppercase tracking-widest cursor-pointer transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-1"
                      id="edit-profile-btn"
                    >
                      <span>Re-tune Vibe Signature</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom navigation (White, clean thin top border, 64px, labels SWIPE and PROFILE only) */}
          <nav className="h-16 bg-white border-t border-black/[0.05] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] z-20 sticky bottom-0">
            {[
              { id: 'discover', label: 'SWIPE', icon: Sparkles },
              { id: 'profile', label: 'PROFILE', icon: User }
            ].map((tab) => {
              const isActive = mobileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
                    setMobileTab(tab.id as any);
                  }}
                  className="relative flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer"
                  id={`mobile-tab-${tab.id}`}
                >
                  <div className="relative flex items-center justify-center mt-1">
                    <tab.icon className={`h-5 w-5 transition-transform duration-300 ${isActive ? 'text-[#00C896] scale-110' : 'text-[#6B7280] hover:text-[#1A1A1A]'}`} />
                  </div>

                  <span className={`text-[9.5px] font-black uppercase tracking-wider mt-1 transition-colors duration-200 ${isActive ? 'text-[#00C896]' : 'text-[#6B7280]'}`}>
                    {tab.label}
                  </span>

                  {/* Elegant active green pill indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-glow-dot"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#00C896]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

        </div>
      )}

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
        onSuccess={handlePremiumSuccess}
      />
    </TelegramFrame>
  );
}
