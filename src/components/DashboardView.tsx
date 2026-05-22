import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Sparkles, Heart, X, MessageSquare } from 'lucide-react';
import { UserProfile, CurrentUser } from '../types';
import WebApp from '@twa-dev/sdk';
import { getProfiles, recordSwipe, getVibeReason, resetUserSwipes, triggerTelegramBotNotification } from '../lib/api';
import VibeRadar from './VibeRadar';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onOpenPremium: () => void;
  onUpdateCurrentUser: (user: CurrentUser) => void;
}

export default function DashboardView({
  currentUser,
  onOpenPremium,
  onUpdateCurrentUser
}: DashboardViewProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vibeReasonText, setVibeReasonText] = useState("");
  const [vibeScore, setVibeScore] = useState<number | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any | null>(null);
  const [typewriterText, setTypewriterText] = useState("");

  // AI Supermatch states
  const [isSuperMatching, setIsSuperMatching] = useState(false);
  const [superMatchedProfile, setSuperMatchedProfile] = useState<any | null>(null);
  const [superMatchVibeReason, setSuperMatchVibeReason] = useState("");
  
  // Immersive top filter select and dual-mode layout for cards (facts vs visual radar chart)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [cardMode, setCardMode] = useState<'facts' | 'radar'>('facts');

  const cardWrapperRef = useRef<HTMLDivElement>(null);

  // Framer Motion gesture physics
  const dragX = useMotionValue(0);
  const rotateValue = useTransform(dragX, [-200, 200], [-12, 12]);
  const opacityValue = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const dragXAbs = useTransform(dragX, x => Math.abs(x));
  const scaleValue = useTransform(dragXAbs, [0, 200], [1, 1.05]);

  // Candidate Play voice handler (base64 or dynamic high-fidelity Web Speech Synthesis representation)
  const handlePlayCandidateVoice = (profile: any, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel previous sound
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if ((window as any).currentPlayingAudio) {
      (window as any).currentPlayingAudio.pause();
    }

    if (profile.voice_bio) {
      const audio = new Audio(profile.voice_bio);
      audio.play();
      (window as any).currentPlayingAudio = audio;
    } else {
      if ('speechSynthesis' in window) {
        let text = "";
        if (profile.telegram_id === 9991) {
          text = "Hi, I am Elena. I am a visual creator exploring underground techno music and aesthetics. Let's grab a matcha latte!";
        } else if (profile.telegram_id === 9992) {
          text = "Hey guys, Maksim. I'm a street DJ chasing beautiful sunset beats and perfect late night street-food vibes. Check out my vinyl mix.";
        } else if (profile.telegram_id === 9993) {
          text = "Ola, Sofia of digital nomad life here! living out of a backpack and looking for creative spirits to explore with. Spontaneous trips are my thing.";
        } else if (profile.telegram_id === 9994) {
          text = "Yo. Kirill. I shitpost and curate custom stickers. Terminally online, Crypto enthusiast on extreme high speeds. Let's make some noise.";
        } else if (profile.telegram_id === 9995) {
          text = "Hello, Tanya, specialist in art and movies. Let's grab a matcha and discuss if aliens actually like our pop music!";
        } else {
          text = `Hey! I am ${profile.name}, age ${profile.age || 22}, working as a ${profile.role || 'Explorer'}. I am interested in ${(profile.tags || []).join(', ')}. Let's match vibes!`;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const engVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural')) ||
                         voices.find(v => v.lang.startsWith('en')) ||
                         voices[0];
        if (engVoice) {
          utterance.voice = engVoice;
        }
        utterance.rate = 1.0;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Speech synthesis is not supported on this device.");
      }
    }
    
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch (err) {}
  };

  // AI Cosmic super-match trigger (deducts 5 sparks & targets peak overlap tags)
  const handleTriggerAiSuperMatch = async () => {
    const currentSparks = currentUser.matcha_sparks ?? 15;
    if (currentSparks < 5) {
      alert("Недостаточно Matcha Sparks! ⚡ Перейдите во вкладку PROFILE и используйте реферальную ссылку (Invite a founder) для начисления +10 Sparks за каждого приглашенного!");
      return;
    }

    if (profiles.length === 0) {
      alert("No active profiles loaded in wave simulator yet!");
      return;
    }

    setIsSuperMatching(true);
    try { WebApp.HapticFeedback.notificationOccurred('warning'); } catch(e){}

    let bestProfile = profiles[0];
    let maxOverlap = -1;

    for (const p of profiles) {
      const overlap = (p.tags || []).filter((t: string) => currentUser.tags.includes(t)).length;
      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        bestProfile = p;
      }
    }

    // Spend 5 Sparks & invoke callback trigger
    const updatedSparks = currentSparks - 5;
    onUpdateCurrentUser({
      ...currentUser,
      matcha_sparks: updatedSparks
    });

    const snippet = await getVibeReason(currentUser.tags, bestProfile.tags);
    setSuperMatchVibeReason(snippet || "absolutely pristine cosmic spectrum tag alignment on all developer channels.");
    setSuperMatchedProfile(bestProfile);

    // Trigger Telegram Bot push alert to this matched candidate in background
    await triggerTelegramBotNotification(
      bestProfile.telegram_id,
      `⚡ <b>AI Cosmic Supermatch!</b> ⚡\nSomeone super-matched with you on the vibe radar! Open the bot to review metadata: @${currentUser.username || 'matcha_user'}`
    );

    try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
    setIsSuperMatching(false);
  };

  // Fetch matchable cards
  const fetchDeck = async () => {
    try {
      const dataDeck = await getProfiles(currentUser.id, currentUser.tags);
      setProfiles(dataDeck);
    } catch (err) {
      console.error("Failed to load swipe profiles:", err);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchDeck();
    }
  }, [currentUser?.id]);

  // Reset card mode facts/radar on card swipe
  useEffect(() => {
    setCardMode('facts');
  }, [currentIndex]);

  // Handle server-seed selection or offline match filters based on the selected role capsule 
  const getFilteredProfiles = () => {
    if (selectedRoleFilter === 'All') return profiles;
    return profiles.filter(profile => {
      const role = (profile.role || '').toLowerCase();
      if (selectedRoleFilter === 'Developers') {
        return role.includes('dev') || role.includes('engineer') || role.includes('coder') || role.includes('programmer') || role.includes('tech');
      }
      if (selectedRoleFilter === 'Designers') {
        return role.includes('design') || role.includes('artist') || role.includes('creative') || role.includes('visual') || role.includes('ui') || role.includes('ux');
      }
      if (selectedRoleFilter === 'Founders') {
        return role.includes('found') || role.includes('hacker') || role.includes('indie') || role.includes('maker') || role.includes('owner') || role.includes('co-');
      }
      if (selectedRoleFilter === 'Creators') {
        return role.includes('creator') || role.includes('dj') || role.includes('curator') || role.includes('specialist') || role.includes('writer') || role.includes('nomad');
      }
      return false;
    });
  };

  const filteredProfiles = getFilteredProfiles();
  const activeProfile = filteredProfiles[currentIndex];

  // Request the AI Single Sentence humorous connection info (cached per target on client/server)
  useEffect(() => {
    if (!activeProfile) {
      setVibeReasonText("");
      setVibeScore(null);
      setTypewriterText("");
      return;
    }

    let isSubscribed = true;
    let typeInterval: any = null;

    const fetchSnippet = async () => {
      setIsAnalysisLoading(true);
      setVibeReasonText("");
      setTypewriterText("");
      try {
        const vibeReason = await getVibeReason(currentUser.tags, activeProfile.tags);

        if (!isSubscribed) return;

        const resultText = vibeReason || "mutual caffeine and startup obsession is highly probable.";
        setVibeReasonText(resultText);

        // Calculate a meaningful visual score based on tag overlap
        const intersection = (activeProfile.tags || []).filter((t: string) => currentUser.tags.includes(t));
        const calculatedScore = Math.min(6.5 + (intersection.length * 1.1) + Math.random() * 0.4, 9.9);
        setVibeScore(calculatedScore);

        // Run typewriter on the single humorous vibe reason sentence on the card 
        let currentLetterIdx = 0;
        typeInterval = setInterval(() => {
          if (!isSubscribed) return;
          setTypewriterText(resultText.slice(0, currentLetterIdx + 1));
          currentLetterIdx++;
          if (currentLetterIdx >= resultText.length) {
            clearInterval(typeInterval);
          }
        }, 15);

      } catch (err) {
        console.error("Vibe analysis retrieval failed:", err);
        if (isSubscribed) {
          const fallback = "mutual caffeine and startup obsession is highly probable.";
          setVibeReasonText(fallback);
          setTypewriterText(fallback);
          setVibeScore(8.8);
        }
      } finally {
        if (isSubscribed) {
          setIsAnalysisLoading(false);
        }
      }
    };

    fetchSnippet();

    return () => {
      isSubscribed = false;
      if (typeInterval) clearInterval(typeInterval);
    };
  }, [currentIndex, activeProfile, currentUser?.tags]);

  // Execute card reactions
  const executeSwipeWithHaptics = async (direction: 'left' | 'right') => {
    if (!activeProfile) return;

    // Trigger haptic rumble
    try {
      if (direction === 'right') {
        WebApp.HapticFeedback.impactOccurred('medium');
      } else {
        WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (e) {
      // Ignored outside TG mini app environment
    }

    try {
      const apiDirection = direction === 'right' ? 'like' : 'pass';
      const res = await recordSwipe(currentUser.id, activeProfile.id, apiDirection);

      if (direction === 'right' && res.match) {
        try {
          WebApp.HapticFeedback.notificationOccurred('success');
        } catch (e) {}

        // Set matched user -> Triggers "it's a vibe ⚡" modal overlay that auto-closes after 1.5 seconds 
        setMatchedUser(activeProfile);
        
        onUpdateCurrentUser({
          ...currentUser,
          matchesToday: currentUser.matchesToday + 1
        });
      }
    } catch (err) {
      console.error("Failed recording reaction:", err);
    }

    setCurrentIndex(prev => prev + 1);
    dragX.set(0); // reset position
  };

  // Redirection is handled explicitly in the Match Overlay with the new Send Telegram Write action button

  const handleResetDeck = async () => {
    try {
      await resetUserSwipes(currentUser.id);
      setCurrentIndex(0);
      await fetchDeck();
    } catch (err) {
      console.error("Failed to reset wave simulation:", err);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-between items-center w-full h-full relative" id="swipe-view-container">
      
      {/* Role Filter Selector */}
      <div className="w-full px-4 pt-3 pb-1 flex flex-col gap-1.5 shrink-0 z-30 select-none border-b border-black/[0.03] bg-white/45 backdrop-blur-xs" id="role-filter-section">
        <div className="flex items-center justify-between pb-1">
          <span className="text-[8px] font-black text-[#1A7A55] uppercase tracking-widest font-mono pl-1">
            // Filter by Role / Фильтр ролей
          </span>
          <button
            onClick={handleTriggerAiSuperMatch}
            disabled={isSuperMatching}
            className="text-[9.5px] font-black text-[#D19200] hover:text-[#B37B00] flex items-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 uppercase tracking-wider py-0.5 select-none"
            title="Spend 5 sparks to trigger AI Supermatch pairing"
          >
            {isSuperMatching ? (
              <div className="w-3 h-3 rounded-full border-2 border-[#D19200] border-t-transparent animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-[#D19200] fill-amber-300/10 animate-[pulse_1.5s_infinite] stroke-[2.5]" />
                <span>AI Super-Match (5⚡)</span>
              </>
            )}
          </button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
          {['All', 'Developers', 'Designers', 'Founders', 'Creators'].map((roleOpt) => {
            const isSel = selectedRoleFilter === roleOpt;
            return (
              <motion.button
                key={roleOpt}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
                  setSelectedRoleFilter(roleOpt);
                  setCurrentIndex(0); // reset active card to 0 for this filtered deck
                }}
                className={`flex-none px-4 h-[32px] rounded-full text-[11px] font-extrabold uppercase tracking-wide border select-none cursor-pointer flex items-center justify-center relative transition-colors duration-200 ${
                  isSel
                    ? 'text-white border-transparent bg-[#1A7A55]/10'
                    : 'bg-white text-[#1A1A1A] border-black/[0.05] hover:border-black/[0.1] shadow-2xs'
                }`}
              >
                {isSel && (
                  <motion.div
                    layoutId="active-role-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 26 }}
                    className="absolute inset-0 bg-[#1A7A55] rounded-full z-0"
                  />
                )}
                <span className="relative z-10 leading-none">{roleOpt}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 82% height container with drag Ref bounds constraints wrapper attached */}
      <div 
        ref={cardWrapperRef}
        className="flex-grow w-full max-w-[390px] relative flex items-center justify-center pt-2 select-none overflow-hidden pb-4"
        id="drag-constraints-wrapper"
      >
        <AnimatePresence mode="popLayout">
          {currentIndex < filteredProfiles.length ? (
            (() => {
              const activeProfile = filteredProfiles[currentIndex];
              const nextProfile = filteredProfiles[currentIndex + 1];

              return (
                <div className="relative w-full h-[500px] sm:h-[520px] max-w-[360px] flex items-center justify-center">
                  
                  {/* NEXT PROFILE (Background Card - Static, pointer-events-none, z-10) */}
                  {nextProfile && (
                    <div
                      key={nextProfile.id}
                      className="absolute w-full h-full rounded-[32px] bg-gradient-to-br from-[#E2EFE6] to-[#CBE5D6] border border-black/[0.04] shadow-xs flex flex-col justify-between overflow-hidden scale-95 translate-y-3.5 opacity-60 pointer-events-none z-10"
                    >
                      <div className="w-full h-full flex flex-col justify-between pointer-events-none select-none">
                        <div className="relative h-[38%] flex flex-col justify-end items-center pb-2">
                          <div className="relative w-24 h-24 rounded-full bg-white border-2 border-white overflow-hidden shadow-sm flex items-center justify-center font-extrabold text-4xl text-[#1A1A1A]">
                            {nextProfile.photo_url ? (
                              <img src={nextProfile.photo_url} alt={nextProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              nextProfile.name.charAt(0)
                            )}
                          </div>
                        </div>

                        <div className="px-5 text-center flex flex-col justify-center pb-1">
                          <h2 className="text-[26px] font-extrabold tracking-tight text-[#1A1A1A] leading-tight">
                            <span>{nextProfile.name}</span>
                            <span className="text-[#1A1A1A]/40 font-medium ml-1.5">/{nextProfile.age || 22}</span>
                          </h2>
                          <p className="text-[14px] text-[#1A1A1A]/70 font-bold mt-1">
                            @{nextProfile.username} • <span className="text-[#1A7A55] font-extrabold">{nextProfile.role}</span>
                          </p>
                        </div>

                        <div className="px-3 pb-3 shrink-0">
                          <div className="bg-white/80 rounded-[24px] p-3.5 flex flex-col h-[235px] justify-between shadow-xs border border-transparent" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE PROFILE (Foreground Card - Draggable, z-20) */}
                  {activeProfile && (
                    <motion.div
                      key={activeProfile.id}
                      style={{ x: dragX, rotate: rotateValue, opacity: opacityValue, scale: scaleValue, touchAction: 'none' }}
                      drag="x"
                      dragConstraints={cardWrapperRef}
                      dragElastic={0.15}
                      onDragEnd={(e, info) => {
                        if (info.velocity.x > 380 || info.offset.x > 110) {
                          executeSwipeWithHaptics('right');
                        } else if (info.velocity.x < -380 || info.offset.x < -110) {
                          executeSwipeWithHaptics('left');
                        }
                      }}
                      className="absolute w-full h-full rounded-[32px] bg-gradient-to-br from-[#C8E6D4] to-[#A8D5B8] border border-black/[0.04] shadow-[0_16px_40px_rgba(26,122,85,0.06)] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing z-20"
                      initial={{ scale: 0.95, y: 10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                      exit={{
                        x: dragX.get() > 0 ? 380 : -380,
                        opacity: 0,
                        rotate: dragX.get() > 0 ? 12 : -12,
                        scale: 0.9,
                        transition: { duration: 0.22, ease: "easeOut" }
                      }}
                      id={`swipe-card-${activeProfile.id}`}
                    >
                      <div className="w-full h-full flex flex-col justify-between pointer-events-none select-none">
                        
                        {/* AVATAR & GRADIENT SECTION */}
                        <div className="relative h-[38%] flex flex-col justify-end items-center pb-2">
                          <div className="relative">
                            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/[0.02] to-transparent rounded-full shadow-xs pointer-events-none" />
                            <div className="relative w-24 h-24 rounded-full bg-white border-2 border-white flex items-center justify-center text-4xl font-extrabold text-[#1A1A1A] tracking-tighter shadow-md overflow-hidden shrink-0">
                              {activeProfile.photo_url ? (
                                <img src={activeProfile.photo_url} alt={activeProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                activeProfile.name.charAt(0)
                              )}
                              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#00C896] border-2 border-white animate-pulse" />
                            </div>
                          </div>
                        </div>

                        {/* IDENTITY SUMMARY */}
                        <div className="px-5 text-center flex flex-col justify-center pb-1">
                          <h2 className="text-[26px] font-extrabold tracking-tight text-[#1A1A1A] leading-tight flex items-center justify-center gap-1.5">
                            <span>{activeProfile.name}</span>
                            <span className="text-[#1A1A1A]/50 font-medium">/{activeProfile.age || 22}</span>
                            <button
                              type="button"
                              onClick={(e) => handlePlayCandidateVoice(activeProfile, e)}
                              className="w-7 h-7 rounded-full bg-[#1A7A55]/10 hover:bg-[#1A7A55]/20 active:scale-95 transition flex items-center justify-center cursor-pointer pointer-events-auto shrink-0 relative"
                              title="Listen to Voice Bio"
                            >
                              <span className="text-[12px]">🎙️</span>
                              <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                            </button>
                          </h2>
                          <p className="text-[14px] text-[#1A1A1A]/70 font-bold mt-1">
                            @{activeProfile.username || 'user'} • <span className="text-[#1A7A55] font-extrabold">{activeProfile.role}</span>
                          </p>
                        </div>

                        {/* WHITE BOTTOM EXPANSION HOOD */}
                        <div className="px-3 pb-3 shrink-0">
                          <div className="bg-white rounded-[24px] p-3.5 flex flex-col h-[235px] justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] border border-black/[0.01]">
                            
                            {/* Card Tab Selectors */}
                            <div className="flex items-center justify-between border-b border-black/[0.04] pb-1.5 mb-1 pointer-events-auto">
                              <span className="text-[9px] font-black text-[#1A7A55]/80 uppercase tracking-widest font-mono">
                                // Profile Code Info
                              </span>
                              <div className="flex bg-[#F5F5F0] p-0.5 rounded-lg border border-black/[0.02]">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCardMode('facts'); }}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md transition cursor-pointer ${cardMode === 'facts' ? 'bg-[#1A7A55]' : 'text-[#6B7280]'}`}
                                  style={{ color: cardMode === 'facts' ? '#FFFFFF' : undefined }}
                                >
                                  Facts
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setCardMode('radar'); }}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md transition cursor-pointer ${cardMode === 'radar' ? 'bg-[#1A7A55]' : 'text-[#6B7280]'}`}
                                  style={{ color: cardMode === 'radar' ? '#FFFFFF' : undefined }}
                                >
                                  Radar 🌀
                                </button>
                              </div>
                            </div>

                            {cardMode === 'facts' ? (
                              <div className="flex-grow flex flex-col justify-center">
                                {/* Tags system representing the schema */}
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                  {(activeProfile.tags || []).slice(0, 4).map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="bg-[#E8F5EE] text-[#1A7A55] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Render their 3 AI-generated facts if present */}
                                {activeProfile.ai_facts && activeProfile.ai_facts.length > 0 && (
                                  <div className="space-y-0.5 mt-0.5 pb-0.5 text-left border-y border-black/[0.03] py-1">
                                    {activeProfile.ai_facts.map((fact: string, fIdx: number) => (
                                      <div key={fIdx} className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#1A1A1A]/80 leading-tight">
                                        <span className="text-[#00C896] text-[9px] shrink-0 font-mono">⚡</span>
                                        <span className="truncate">{fact}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex-grow flex items-center justify-center py-0.5">
                                <VibeRadar
                                  currentUserTags={currentUser.tags}
                                  candidateTags={activeProfile.tags}
                                  currentUserName={currentUser.name}
                                  candidateName={activeProfile.name}
                                />
                              </div>
                            )}

                            {/* Redesigned AI connection phrase exactly below tags */}
                            <div className="bg-[#F5F5F0] border border-black/[0.01] rounded-2xl p-2.5 text-left shrink-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[8px] font-extrabold text-[#1A7A55] font-mono uppercase tracking-widest">
                                  // AI VIBE REASON
                                </span>
                                <span className="text-[8px] text-white font-mono font-bold bg-[#1A1A1A] px-1 py-0.2 rounded shrink-0">
                                  {vibeScore ? `${Math.round(vibeScore * 10)}% VIBE` : "ANALYZING..."}
                                </span>
                              </div>

                              {isAnalysisLoading ? (
                                <div className="space-y-1 py-1">
                                  <div className="h-1.5 bg-black/[0.04] rounded-full w-full animate-pulse" />
                                  <div className="h-1.5 bg-black/[0.04] rounded-full w-4/5 animate-pulse" />
                                </div>
                              ) : (
                                <p className="text-[11px] leading-snug text-[#1A1A1A] font-extrabold italic tracking-tight">
                                  "{typewriterText || vibeReasonText}"
                                </p>
                              )}
                            </div>

                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}

                </div>
              );
            })()
          ) : (
            /* Empty walkstage matching the matcha tea styling */
            <div className="absolute w-[350px] h-[500px] rounded-[32px] bg-white border border-black/[0.05] flex flex-col items-center justify-center p-6 text-center space-y-6 shadow-[0_12px_36px_rgba(0,0,0,0.01)]">
              <div className="relative">
                <span className="absolute inset-0 rounded-full bg-[#E8F5EE] blur-xl animate-pulse" />
                <div className="relative w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55] shadow-xs">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-extrabold text-[#1A1A1A] text-lg font-display tracking-tight">No More Waves Today</h4>
                <p className="text-xs text-[#6B7280] max-w-[220px] mx-auto leading-relaxed font-semibold">
                  You have toured all active builders matching your vibe frequency.
                </p>
              </div>

              <button
                onClick={handleResetDeck}
                className="px-6 h-[48px] rounded-[100px] border border-black/[0.1] bg-[#1A1A1A] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
                id="reset-swipe-deck-btn"
              >
                <span>Reset Wave Deck</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons (✕ ♥ 💬) strictly вынесены за пределы draggable div */}
      {currentIndex < filteredProfiles.length && (
        <div className="flex items-center justify-center gap-5 pb-5 shrink-0" id="swipe-controls-tray">
          {/* Dislike ✕ button: bg #FFFFFF, border 1.5px solid #E0E0E0, icon тёмный #1A1A1A, height/width 56px */}
          <button
            onClick={() => executeSwipeWithHaptics('left')}
            className="w-[56px] h-[56px] rounded-full bg-white border-[1.5px] border-[#E0E0E0] text-[#1A1A1A] flex items-center justify-center transition active:scale-95 hover:bg-neutral-50 shadow-sm cursor-pointer"
            title="Next vibe energy"
            id="swipe-reject-btn"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>

          {/* Vibe Like ♥ central button: slightly bigger: width/height 72px, bg #00C896, white icon */}
          <button
            onClick={() => executeSwipeWithHaptics('right')}
            className="w-[72px] h-[72px] rounded-full bg-[#00C896] text-white flex items-center justify-center transition active:scale-95 hover:opacity-95 shadow-[0_4px_16px_rgba(0,200,150,0.25)] cursor-pointer"
            title="Let's match!"
            id="swipe-accept-btn"
          >
            <Heart className="h-7 w-7 fill-white text-white stroke-[2]" />
          </button>

          {/* Send Instant Vibe 💬 button: bg #FFFFFF, border 1.5px solid #E0E0E0, icon тёмный #1A1A1A, height/width 56px */}
          <button
            onClick={() => executeSwipeWithHaptics('right')}
            className="w-[56px] h-[56px] rounded-full bg-white border-[1.5px] border-[#E0E0E0] text-[#1A1A1A] flex items-center justify-center transition active:scale-95 hover:bg-neutral-50 shadow-sm cursor-pointer"
            title="Bridge message dialogue"
            id="swipe-chat-prompt"
          >
            <MessageSquare className="h-5 w-5 stroke-[2]" />
          </button>
        </div>
      )}

      {/* MUTUAL MATCH ENERGETIC CELEBRATION OVERLAY */}
      <AnimatePresence>
        {matchedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#F5F5F0]/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
            id="match-vibe-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[#E8F5EE] rounded-[32px] p-8 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="pt-2">
                <span className="text-[11px] font-extrabold text-[#1A7A55] tracking-widest bg-[#E8F5EE] px-4 py-2 rounded-full uppercase block mx-auto w-fit font-mono">
                  IT'S A VIBE ⚡
                </span>
                
                <h2 className="text-3xl font-black tracking-tighter text-[#1A1A1A] mt-5 font-display leading-tight font-display">
                  mutual vibe detected!
                </h2>
                
                <p className="text-[12.5px] text-[#1A7A55]/80 font-bold mt-2 leading-relaxed">
                  You and <span className="font-extrabold text-[#1A1A1A]">@{matchedUser.username || matchedUser.id}</span> swiped each other! Talk directly on Telegram.
                </p>
              </div>

              {/* Connected heads */}
              <div className="flex items-center justify-center -space-x-4 py-3">
                <div className="relative w-18 h-18 rounded-full bg-[#1A1A1A] text-[#00C896] flex items-center justify-center text-2xl font-black border-4 border-white shadow-md overflow-hidden">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                <div className="relative w-18 h-18 rounded-full bg-[#00C896] text-[#1A1A1A] flex items-center justify-center text-2xl font-black border-4 border-white shadow-md overflow-hidden">
                  {matchedUser.photo_url ? (
                    <img src={matchedUser.photo_url} alt={matchedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    matchedUser.name.charAt(0)
                  )}
                </div>
              </div>

              {/* Action buttons inside overlay */}
              <div className="flex flex-col gap-2 w-full pt-2">
                <button
                  onClick={() => {
                    const domain = matchedUser.username || matchedUser.id;
                    const tgLink = `https://t.me/${domain}`;
                    try {
                      WebApp.openTelegramLink(tgLink);
                    } catch (e) {
                      window.open(tgLink, '_blank');
                    }
                  }}
                  className="w-full h-[48px] rounded-xl bg-[#00C896] hover:opacity-95 text-[#1A1A1A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-[0.98]"
                  id="send-telegram-write-btn"
                >
                  <MessageSquare className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>Send Telegram Write 💬</span>
                </button>

                <button
                  onClick={() => setMatchedUser(null)}
                  className="w-full h-[42px] rounded-xl border border-black/[0.08] text-neutral-600 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition active:scale-[0.98]"
                  id="keep-swiping-btn"
                >
                  <span>Keep Swiping ⚡</span>
                </button>
              </div>

              <p className="text-[9.5px] text-[#6B7280] font-mono leading-tight">
                @{currentUser.username || 'user'} & @{matchedUser.username || 'user'} • Matcha Social
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI CELESTIAL COSMIC SUPER-MATCH OVERLAY */}
      <AnimatePresence>
        {superMatchedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#1A1A1A]/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
            id="supermatch-vibe-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-zinc-900 border border-amber-500/30 rounded-[32px] p-7 max-w-sm w-full text-center space-y-5 shadow-[0_24px_50px_rgba(209,146,0,0.2)] relative overflow-hidden text-white"
            >
              {/* Pulsing visual halo */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none" />

              <div>
                <span className="text-[10px] font-black text-[#D19200] tracking-[0.2em] bg-amber-500/20 px-3.5 py-1.5 rounded-full uppercase block mx-auto w-fit font-mono animate-pulse">
                  ⚡ AI Cosmic Match ⚡
                </span>
                
                <h2 className="text-2xl font-black tracking-tight text-white mt-5 leading-none">
                  Ultimate Vibe Fusion!
                </h2>
                
                <p className="text-[11px] text-zinc-300 font-medium mt-2 leading-relaxed px-2">
                  Our neural engine calculated peak compatibility based on overlapping tags and profile data between you and <span className="text-[#00C896] font-extrabold">@{superMatchedProfile.username || 'user'}</span>.
                </p>
              </div>

              {/* Connected overlapping visual representation */}
              <div className="flex items-center justify-center -space-x-4 py-2 relative">
                <div className="absolute w-24 h-24 rounded-full bg-amber-500/15 animate-ping opacity-60 pointer-events-none" />
                
                <div className="relative w-16 h-16 rounded-full bg-[#1A1A1A] text-[#00C896] flex items-center justify-center text-xl font-black border-2 border-amber-500 shadow-md overflow-hidden shrink-0">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0)
                  )}
                </div>
                
                <div className="relative w-16 h-16 rounded-full bg-[#00C896] text-[#1A1A1A] flex items-center justify-center text-xl font-black border-2 border-amber-500 shadow-md overflow-hidden shrink-0">
                  {superMatchedProfile.photo_url ? (
                    <img src={superMatchedProfile.photo_url} alt={superMatchedProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    superMatchedProfile.name.charAt(0)
                  )}
                </div>
              </div>

              {/* AI deep-level compatibility statement */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-left font-sans space-y-1">
                <span className="text-[8px] font-bold text-amber-500 font-mono uppercase tracking-widest block">
                  // COGNITIVE COMPATIBILITY METRIC
                </span>
                <p className="text-[11px] leading-relaxed text-zinc-100 italic tracking-tight font-medium">
                  "{superMatchVibeReason}"
                </p>
              </div>

              {/* Action buttons inside super-match dialog */}
              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  onClick={() => {
                    const domain = superMatchedProfile.username || superMatchedProfile.id;
                    const tgLink = `https://t.me/${domain}`;
                    try {
                      WebApp.openTelegramLink(tgLink);
                    } catch (e) {
                      window.open(tgLink, '_blank');
                    }
                  }}
                  className="w-full h-[48px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-95 text-[#1A1A1A] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-[0.98]"
                  id="supermatch-send-tg-btn"
                >
                  <MessageSquare className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>Send Telegram Write 💬</span>
                </button>

                <button
                  onClick={() => setSuperMatchedProfile(null)}
                  className="w-full h-[40px] rounded-xl bg-transparent border border-white/10 hover:bg-white/5 text-zinc-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition active:scale-[0.98]"
                  id="supermatch-close-btn"
                >
                  <span>Close Overlay</span>
                </button>
              </div>

              <p className="text-[9px] text-zinc-500 font-mono leading-none">
                {currentUser.name} & {superMatchedProfile.name} • Deep AI Matcher
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
