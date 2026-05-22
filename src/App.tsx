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
  ChevronRight,
  Flame,
  Check,
  Send,
  Save,
  MessageSquare,
  Edit3,
  Camera,
  Upload,
  Plus
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { getCurrentUser, resetUserSwipes, onboardUser, generateFactsFromChat, compressAndResizeImage } from './lib/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  
  // Immersive Mobile Tabs: exactly 2 tabs ('discover' | 'profile')
  const [mobileTab, setMobileTab] = useState<'discover' | 'profile'>('discover');
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");

  // Top-level editable profile states
  const [profileName, setProfileName] = useState("");
  const [profileAge, setProfileAge] = useState<number>(22);
  const [profileBio, setProfileBio] = useState("");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [profileFacts, setProfileFacts] = useState<string[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");

  // Physical file upload states for Profile view
  const [profileUploadLoading, setProfileUploadLoading] = useState(false);
  const [profileDragActive, setProfileDragActive] = useState(false);

  const handleProfileFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileUploadLoading(true);
    try {
      const base64 = await compressAndResizeImage(file);
      setProfilePhotoUrl(base64);
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
    } catch (err) {
      console.error(err);
    } finally {
      setProfileUploadLoading(false);
    }
  };

  const handleProfileDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setProfileDragActive(true);
    } else if (e.type === "dragleave") {
      setProfileDragActive(false);
    }
  };

  const handleProfileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProfileDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setProfileUploadLoading(true);
      try {
        const base64 = await compressAndResizeImage(file);
        setProfilePhotoUrl(base64);
        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      } catch (err) {
        console.error(err);
      } finally {
        setProfileUploadLoading(false);
      }
    }
  };

  // Initialize Telegram TMA environment params safely
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#FFFFFF');
      WebApp.setBackgroundColor('#F5F5F0');
    } catch (e) {
      console.log("Telegram TMA SDK bypass on outer desktop browser.");
    }
  }, []);

  const fetchCurrentUserAndConfig = async () => {
    try {
      const tgUser = WebApp.initDataUnsafe?.user;
      const tgId = tgUser?.id || 242424;
      const tgUsername = tgUser?.username || "test_user";
      const tgFirstName = tgUser?.first_name || "Jason";
      const tgPhotoUrl = tgUser?.photo_url || "";

      const user = await getCurrentUser(tgId);
      if (user) {
        const loadedUser: CurrentUser = {
          id: user.id,
          telegram_id: user.telegram_id,
          username: user.username || tgUsername,
          name: user.name || tgFirstName,
          role: user.role || "Builder / Developer",
          tags: user.tags || [],
          ai_facts: user.ai_facts || [],
          streakDays: 14,
          matchesToday: 8,
          isPremium: false,
          priorityPoints: 0,
          age: user.age || 22,
          bio: user.bio || "Exploring matcha vibes and meeting cool young creators.",
          photo_url: user.photo_url || tgPhotoUrl || ""
        };
        setCurrentUser(loadedUser);
        setProfileName(loadedUser.name);
        setProfileAge(loadedUser.age);
        setProfileBio(loadedUser.bio || "");
        setProfilePhotoUrl(loadedUser.photo_url || "");
        setProfileFacts(loadedUser.ai_facts || []);
        setHasOnboarded(true);
      } else {
        // Build dynamic empty/starter user structure so onboarding works properly
        const starterUser: CurrentUser = {
          id: "",
          telegram_id: tgId,
          username: tgUsername,
          name: tgFirstName,
          role: "Builder / Developer",
          tags: ["AI & Automation", "Indie Hacking", "Coffee"],
          ai_facts: [],
          streakDays: 14,
          matchesToday: 0,
          isPremium: false,
          priorityPoints: 0,
          age: 22,
          bio: "Exploring matcha vibes and meeting cool young creators.",
          photo_url: tgPhotoUrl || ""
        };
        setCurrentUser(starterUser);
        setProfileName(starterUser.name);
        setProfileAge(starterUser.age);
        setProfileBio(starterUser.bio || "");
        setProfilePhotoUrl(starterUser.photo_url || "");
          setProfileFacts([]);
        setHasOnboarded(false);
      }
    } catch (err) {
      console.error("Configuration loading failed:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUserAndConfig();
  }, []);

  const handleOnboardingComplete = (onboardedUser: CurrentUser) => {
    setCurrentUser(onboardedUser);
    setProfileName(onboardedUser.name);
    setProfileAge(onboardedUser.age);
    setProfileBio(onboardedUser.bio || "");
    setProfilePhotoUrl(onboardedUser.photo_url || "");
    setProfileFacts(onboardedUser.ai_facts || []);
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
      if (currentUser?.id) {
        await resetUserSwipes(currentUser.id);
      }
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
    const refUrl = `t.me/matchabot?start=REF_${currentUser.telegram_id}`;
    
    // Copy the real link safely to clipboard
    try {
      await navigator.clipboard.writeText(refUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }

    // Direct client simulation of awarding dynamic invite boosts points
    setInviteFeedback("+5 Priority Boost Activated!");
    setCurrentUser(prev => prev ? {
      ...prev,
      priorityPoints: (prev.priorityPoints || 0) + 5
    } : null);
    setTimeout(() => setInviteFeedback(""), 3000);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    setSaveStatus("Saving...");
    try {
      const updatedUser = await onboardUser({
        telegram_id: currentUser.telegram_id,
        username: currentUser.username,
        name: profileName,
        age: profileAge,
        role: currentUser.role,
        tags: currentUser.tags,
        ai_facts: profileFacts,
        bio: profileBio,
        photo_url: profilePhotoUrl
      });
      if (updatedUser) {
        setCurrentUser({
          ...currentUser,
          name: profileName,
          age: profileAge,
          ai_facts: profileFacts,
          bio: profileBio,
          photo_url: profilePhotoUrl
        });
        setSaveStatus("Profile Saved!");
        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
        setTimeout(() => setSaveStatus(""), 2200);
      } else {
        setSaveStatus("Failed to save.");
      }
    } catch (err) {
      console.error(err);
      setSaveStatus("Error saving.");
    }
  };

  const handleAiFactsChat = async () => {
    if (!currentUser || !chatInput.trim()) return;
    setChatLoading(true);
    try {
      const parsedFacts = await generateFactsFromChat(chatInput);
      setProfileFacts(parsedFacts);
      
      const updatedUser = await onboardUser({
        telegram_id: currentUser.telegram_id,
        username: currentUser.username,
        name: profileName,
        age: profileAge,
        role: currentUser.role,
        tags: currentUser.tags,
        ai_facts: parsedFacts,
        bio: profileBio,
        photo_url: profilePhotoUrl
      });
      if (updatedUser) {
        setCurrentUser({
          ...currentUser,
          ai_facts: parsedFacts
        });
        setChatInput("");
        setSaveStatus("AI facts updated!");
        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
        setTimeout(() => setSaveStatus(""), 2200);
      }
    } catch (err) {
      console.error("AI Conversational fact parsing failed:", err);
    } finally {
      setChatLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center text-center px-4 font-mono">
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
      streakDays={currentUser.streakDays}
      isPremium={currentUser.isPremium}
    >
      {!hasOnboarded ? (
        <OnboardingView 
          telegramId={currentUser.telegram_id} 
          telegramUsername={currentUser.username} 
          onComplete={handleOnboardingComplete} 
        />
      ) : (
        <div className="flex-1 flex flex-col justify-between h-full bg-[#F5F5F0] overflow-hidden relative" id="mobile-applet-mount">
          
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
                    <div className="relative w-24 h-24 mx-auto cursor-pointer group">
                      <input 
                        type="file" 
                        id="profile-picture-upload-direct"
                        accept="image/*"
                        onChange={handleProfileFileChange}
                        className="hidden"
                      />
                      <label htmlFor="profile-picture-upload-direct" className="cursor-pointer block w-full h-full select-none">
                        <div className="absolute inset-0 rounded-full bg-[#00C896]/20 opacity-0 group-hover:opacity-100 blur-md transition duration-200" />
                        <div className="relative w-full h-full rounded-full bg-white text-[#1A1A1A] border-2 border-[#1A7A55]/10 hover:border-[#00C896] flex items-center justify-center font-extrabold text-3xl shadow-sm overflow-hidden transition">
                          {profilePhotoUrl ? (
                            <img src={profilePhotoUrl} alt={profileName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            profileName.charAt(0)
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase transition tracking-wider">
                            <Camera className="w-4.5 h-4.5 mb-0.5 text-[#00C896]" />
                            <span>Upload</span>
                          </div>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <h2 className="text-[26px] font-black text-[#1A1A1A] leading-none tracking-tight flex items-center justify-center gap-1.5">
                        <span>{profileName}</span>
                        <span className="text-black/40 font-bold text-lg">/{profileAge}</span>
                      </h2>
                      <p className="text-[13px] text-[#1A7A55] font-extrabold">
                        @{currentUser.username} • <span className="uppercase">{currentUser.role}</span>
                      </p>
                    </div>
                  </div>

                  {/* Profile Edit Fields Container */}
                  <div className="bg-white border border-black/[0.04] p-5 rounded-[28px] space-y-4 shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-[#1A7A55]">
                      <User className="h-4 w-4" />
                      <h3 className="text-sm font-black text-[#1A1A1A]">Edit Profile Details</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9.5px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">
                          Display Name
                        </label>
                        <input
                          type="text"
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="w-full h-[40px] px-3 bg-[#F5F5F0] border border-black/[0.05] rounded-xl text-[12.5px] font-bold text-[#1A1A1A] focus:outline-none focus:border-[#00C896]"
                        />
                      </div>

                      <div>
                        <label className="block text-[9.5px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">
                          Age
                        </label>
                        <input
                          type="number"
                          value={profileAge}
                          onChange={(e) => setProfileAge(Math.max(16, parseInt(e.target.value) || 22))}
                          className="w-full h-[40px] px-2 bg-[#F5F5F0] border border-black/[0.05] rounded-xl text-[12.5px] font-bold text-[#1A1A1A] text-center focus:outline-none focus:border-[#00C896]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9.5px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">
                        Bio / Description
                      </label>
                      <input
                        type="text"
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full h-[40px] px-3 bg-[#F5F5F0] border border-black/[0.05] rounded-xl text-[12.5px] font-bold text-[#1A1A1A] focus:outline-none focus:border-[#00C896]"
                        placeholder="Say something about yourself..."
                      />
                    </div>

                    {/* Drag and drop profile view photo selector */}
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-bold text-[#6B7280] uppercase tracking-wider">
                        Avatar Profile Picture
                      </label>
                      
                      <div 
                        onDragEnter={handleProfileDrag}
                        onDragOver={handleProfileDrag}
                        onDragLeave={handleProfileDrag}
                        onDrop={handleProfileDrop}
                        className={`relative rounded-2xl border border-dashed p-3 text-center flex items-center justify-center gap-2 cursor-pointer transition select-none ${
                          profileDragActive 
                            ? "border-[#00C896] bg-[#E8F5EE]/40" 
                            : "border-black/[0.1] hover:border-[#00C896]/50 bg-[#F5F5F0]"
                        }`}
                      >
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleProfileFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        
                        <div className="flex items-center gap-3 select-none pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white border border-black/[0.04] flex items-center justify-center overflow-hidden shrink-0">
                            {profileUploadLoading ? (
                              <div className="w-4 h-4 rounded-full border-2 border-[#00C896] border-t-transparent animate-spin" />
                            ) : profilePhotoUrl ? (
                              <img src={profilePhotoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Camera className="w-4 h-4 text-[#1A7A55]" />
                            )}
                          </div>
                          <div className="text-left leading-tight">
                            <span className="text-[11.5px] font-bold text-[#1A1A1A] flex items-center gap-1">
                              <Upload className="w-3 h-3 text-[#00C896]" />
                              Choose physical file (Картинка с диска/папки)
                            </span>
                            <span className="text-[9px] text-[#6B7280] font-medium block">
                              Auto quality-preserving compression activated
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Or write custom absolute web url optionally */}
                      <input
                        type="text"
                        value={profilePhotoUrl}
                        onChange={(e) => setProfilePhotoUrl(e.target.value)}
                        className="w-full h-[36px] px-3 bg-[#F5F5F0] border border-black/[0.04] rounded-xl text-[10px] font-mono text-[#1A1A1A] focus:outline-none focus:border-[#00C896]"
                        placeholder="Or customize direct URL..."
                      />
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={saveStatus.includes("Saving")}
                      className="w-full h-[46px] rounded-xl bg-[#00C896] text-[#1A1A1A] font-extrabold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveStatus || "Save Details"}</span>
                    </button>
                  </div>

                  {/* Interactive Vibe Facts Customizer (as requested) */}
                  <div className="bg-white border border-black/[0.04] p-5 rounded-[28px] space-y-3.5 shadow-xs">
                    <div className="flex items-center gap-1.5 mb-1 text-[#1A7A55]">
                      <Edit3 className="h-4 w-4" />
                      <h3 className="text-sm font-black text-[#1A1A1A]">Modify My Vibe Facts</h3>
                    </div>

                    <div className="space-y-3">
                      {profileFacts.map((fact, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="block text-[9px] font-mono text-[#1A7A55] uppercase tracking-wider">
                              Fact #{idx + 1}
                            </label>
                            {profileFacts.length > 1 && (
                              <button
                                onClick={() => {
                                  const updated = profileFacts.filter((_, i) => i !== idx);
                                  setProfileFacts(updated);
                                }}
                                className="text-[9px] font-bold text-rose-500 hover:text-rose-600 transition tracking-wide uppercase"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={fact}
                            onChange={(e) => {
                              const updated = [...profileFacts];
                              updated[idx] = e.target.value;
                              setProfileFacts(updated);
                            }}
                            className="w-full h-[38px] px-3 bg-[#F5F5F0] border border-black/[0.04] rounded-xl text-[12px] font-extrabold text-[#1A1A1A] focus:outline-none focus:border-[#00C896]"
                            placeholder={`Description for fact #${idx + 1}...`}
                          />
                        </div>
                      ))}

                      <button
                        onClick={() => setProfileFacts([...profileFacts, ""])}
                        className="w-full h-[34px] border border-dashed border-[#00C896]/30 text-[#1A7A55] hover:border-[#00C896] bg-[#F5F5F0] rounded-xl text-[10px] font-bold uppercase tracking-wider transition duration-150 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Custom Fact</span>
                      </button>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      className="w-full h-[40px] rounded-xl border border-black/[0.08] text-xs font-bold uppercase tracking-wider hover:bg-black/[0.02] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Check className="h-4 w-4 text-[#1A7A55]" />
                      <span>Confirm Edited Facts</span>
                    </button>
                  </div>

                  {/* AI Conversational Facts Assistant (Chat and neuron-update facts) */}
                  <div className="bg-[#1A1A1A] text-white p-5 rounded-[28px] space-y-3.5 shadow-md relative overflow-hidden">
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-[#00C896]/10 blur-xl rounded-full" />
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="p-1 bg-[#00C896]/20 text-[#00C896] rounded-lg">
                          <MessageSquare className="h-4 w-4" />
                        </span>
                        <h3 className="text-sm font-black tracking-tight text-white">Groq AI Assist Chat</h3>
                      </div>
                      <p className="text-[10.5px] text-zinc-400 leading-normal font-medium">
                        Write everything about yourself conversationally (habits, hobbies, tea choice) and our neuron engine will rewrite your 3 facts!
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full min-h-[72px] p-3 bg-white/[0.08] border border-white/[0.08] rounded-xl text-[12px] text-white placeholder-zinc-500 focus:outline-none focus:border-[#00C896] resize-none"
                        placeholder="I drink matcha late at night, sleep with a podcast, lost money on dogicoins, and build interfaces..."
                      />
                      
                      <button
                        onClick={handleAiFactsChat}
                        disabled={chatLoading || !chatInput.trim()}
                        className={`w-full h-[38px] rounded-xl font-bold uppercase tracking-wider text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          chatInput.trim()
                            ? 'bg-[#00C896] text-[#1A1A1A] hover:opacity-95'
                            : 'bg-white/[0.05] text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {chatLoading ? (
                          <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>{chatLoading ? "Analyzing traits..." : "Rewrite Facts via AI"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Growth Block: "Invite a founder" - realign position */}
                  <div 
                    onClick={handleInviteAndRefer}
                    className="bg-gradient-to-br from-[#C8E6D4] to-[#A8D5B8] rounded-[24px] p-5 shadow-xs border border-transparent space-y-3 cursor-pointer hover:opacity-95 transition relative overflow-hidden"
                    id="invite-generator-card"
                  >
                    <div className="absolute right-3.5 top-3.5 bg-white/40 text-[#1A7A55] font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full">
                      GROWTH ⚡
                    </div>

                    <div className="space-y-0.5">
                      <h3 className="text-[15px] font-black text-[#1A1A1A] tracking-tight">
                        Invite a founder
                      </h3>
                      <p className="text-[11px] text-[#1A7A55] font-extrabold leading-tight">
                        Generate ref links and score +5 stack priority boost for both when they join.
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3 bg-white/70 py-2.5 px-4 rounded-xl border border-black/[0.02]">
                      <span className="text-[10.5px] font-mono text-[#1A1A1A]/70 font-bold truncate max-w-[170px]">
                        t.me/matchabot?start=REF_{currentUser.telegram_id}
                      </span>
                      <button className="text-[10.5px] font-extrabold text-[#1A7A55] uppercase shrink-0 flex items-center gap-1">
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
                          { id: 'onboard', name: 'Restart Onboarding', icon: Sparkles }
                        ].map((item) => (
                          <div
                            key={item.id}
                            onClick={() => {
                              try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
                              if (item.id === 'onboard') {
                                setHasOnboarded(false);
                              }
                            }}
                            className="h-[48px] px-4 flex items-center justify-between hover:bg-black/[0.01] cursor-pointer transition duration-150"
                          >
                            <div className="flex items-center gap-3">
                              <item.icon className="h-4.5 w-4.5 text-[#6B7280]" />
                              <span className="text-[13px] font-extrabold text-[#1A1A1A]">
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
                      onClick={handleResetDemo}
                      className="w-full text-center py-4 bg-[#00C896] hover:bg-[#00B285] text-[#1A1A1A] rounded-[100px] h-[56px] text-xs font-black uppercase tracking-widest cursor-pointer transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-1"
                      id="edit-profile-btn"
                    >
                      <span>Reset Wave History</span>
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
