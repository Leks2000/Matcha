import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Sparkles, Heart, X, MessageSquare } from 'lucide-react';
import { UserProfile, CurrentUser } from '../types';
import WebApp from '@twa-dev/sdk';
import { getProfiles, recordSwipe, getVibeReason, resetUserSwipes } from '../lib/api';

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

  const cardWrapperRef = useRef<HTMLDivElement>(null);

  // Framer Motion gesture physics
  const dragX = useMotionValue(0);
  const rotateValue = useTransform(dragX, [-200, 200], [-12, 12]);
  const opacityValue = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const dragXAbs = useTransform(dragX, x => Math.abs(x));
  const scaleValue = useTransform(dragXAbs, [0, 200], [1, 1.05]);

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

  const activeProfile = profiles[currentIndex];

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

  // Deep-link redirect to Telegram domain upon mutual match event and close celebration after 2s
  useEffect(() => {
    if (matchedUser) {
      const timer = setTimeout(() => {
        try {
          window.open(`tg://resolve?domain=${matchedUser.username || matchedUser.id}`, '_self');
        } catch (e) {
          console.error("Deep link trigger caught:", e);
        }
        setMatchedUser(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [matchedUser]);

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
      
      {/* 82% height container with drag Ref bounds constraints wrapper attached */}
      <div 
        ref={cardWrapperRef}
        className="flex-grow w-full max-w-[390px] relative flex items-center justify-center pt-2 select-none overflow-hidden pb-4"
        id="drag-constraints-wrapper"
      >
        <AnimatePresence>
          {currentIndex < profiles.length ? (
            profiles.map((profile, index) => {
              if (index < currentIndex || index > currentIndex + 1) return null;
              const isMain = index === currentIndex;

              return (
                <motion.div
                  key={profile.id}
                  style={isMain ? { x: dragX, rotate: rotateValue, opacity: opacityValue, scale: scaleValue, touchAction: 'none' } : { touchAction: 'none' }}
                  drag={isMain ? "x" : false}
                  dragConstraints={cardWrapperRef}
                  dragElastic={0.08}
                  onDragEnd={(e, info) => {
                    // if velocity.x > 400 or offset.x > 120 -> right swipe!
                    if (info.velocity.x > 400 || info.offset.x > 120) {
                      executeSwipeWithHaptics('right');
                    } else if (info.velocity.x < -400 || info.offset.x < -120) {
                      executeSwipeWithHaptics('left');
                    }
                  }}
                  className={`absolute w-full h-[500px] sm:h-[520px] max-w-[360px] rounded-[32px] bg-gradient-to-br from-[#C8E6D4] to-[#A8D5B8] border border-black/[0.04] shadow-[0_12px_44px_rgba(0,0,0,0.08)] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing ${
                    isMain ? 'z-30' : 'z-20 scale-95 translate-y-3 opacity-60 pointer-events-none'
                  }`}
                  initial={isMain ? { y: 25, opacity: 0 } : {}}
                  animate={isMain ? { y: 0, opacity: 1, transition: { type: "spring", stiffness: 280, damping: 24 } } : {}}
                  exit={{
                    x: dragX.get() > 0 ? 380 : -380,
                    opacity: 0,
                    rotate: dragX.get() > 0 ? 12 : -12,
                    scale: 0.9,
                    transition: { duration: 0.25, ease: "easeOut" }
                  }}
                  id={`swipe-card-${profile.id}`}
                >
                  {/* Strict spec block: pointer-events: none on all nested card elements except top buttons if any */}
                  <div className="w-full h-full flex flex-col justify-between pointer-events-none select-none">
                    
                    {/* AVATAR & GRADIENT SECTION */}
                    <div className="relative h-[38%] flex flex-col justify-end items-center pb-2">
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-white/40 blur-md animate-pulse" />
                        <div className="relative w-24 h-24 rounded-full bg-white border-2 border-white flex items-center justify-center text-4xl font-extrabold text-[#1A1A1A] tracking-tighter shadow-md">
                          {profile.name.charAt(0)}
                          <span className="absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full bg-[#00C896] border-2 border-white animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* IDENTITY SUMMARY */}
                    <div className="px-5 text-center flex flex-col justify-center pb-1">
                      <h2 className="text-[26px] font-extrabold tracking-tight text-[#1A1A1A] leading-tight flex items-center justify-center gap-1.5">
                        <span>{profile.name}</span>
                        <span className="text-[#1A1A1A]/50 font-medium">/{profile.age}</span>
                      </h2>
                      <p className="text-[14px] text-[#1A1A1A]/70 font-bold mt-1">
                        @{profile.username} • <span className="text-[#1A7A55] font-extrabold">{profile.role}</span>
                      </p>
                    </div>

                    {/* WHITE BOTTOM EXPANSION HOOD */}
                    <div className="px-3 pb-3 shrink-0">
                      <div className="bg-white rounded-[24px] p-3.5 flex flex-col h-[235px] justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] border border-black/[0.01]">
                        
                        {/* Tags system representing the schema */}
                        <div>
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {profile.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-[#E8F5EE] text-[#1A7A55] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Render their 3 AI-generated facts if present */}
                          {profile.ai_facts && profile.ai_facts.length > 0 && (
                            <div className="space-y-0.5 mt-1 pb-1 text-left border-y border-black/[0.03] py-1">
                              {profile.ai_facts.map((fact, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#1A1A1A]/80 leading-tight">
                                  <span className="text-[#00C896] text-[9px] shrink-0 font-mono">⚡</span>
                                  <span className="truncate">{fact}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Redesigned AI connection phrase exactly below tags */}
                        <div className="bg-[#F5F5F0] border border-black/[0.01] rounded-2xl p-2.5 text-left">
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
              );
            })
          ) : (
            /* Empty walkstage */
            <div className="absolute w-[350px] h-[500px] rounded-[32px] bg-white border border-black/[0.04] flex flex-col items-center justify-center p-6 text-center space-y-5 shadow-sm">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                  <Sparkles className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-[#1A1A1A] text-lg font-display">No More Waves Today</h4>
                <p className="text-xs text-[#6B7280] max-w-[220px] mx-auto leading-relaxed">
                  You have toured all active builders matching your vibe frequency.
                </p>
              </div>

              <button
                onClick={handleResetDeck}
                className="px-6 py-3.5 bg-[#1A1A1A] text-white rounded-3xl text-[12px] font-bold uppercase tracking-wider hover:opacity-95 active:scale-95 transition cursor-pointer shadow-md"
                id="reset-swipe-deck-btn"
              >
                Reset Wave Deck
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons (✕ ♥ 💬) strictly вынесены за пределы draggable div */}
      {currentIndex < profiles.length && (
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
            className="fixed inset-0 z-50 bg-[#F0F0EB]/95 backdrop-blur-md flex items-center justify-center p-4 select-none"
            id="match-vibe-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white border border-[#E8F5EE] rounded-[32px] p-8 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="pt-2">
                <span className="text-[11px] font-extrabold text-[#1A7A55] tracking-widest bg-[#E8F5EE] px-4 py-2 rounded-full uppercase block mx-auto w-fit">
                  IT'S A VIBE ⚡
                </span>
                
                <h2 className="text-3xl font-black tracking-tighter text-[#1A1A1A] mt-5 font-display leading-tight">
                  mutual vibe detected!
                </h2>
                
                <p className="text-[14px] text-[#1A7A55] font-extrabold mt-4 animate-pulse">
                  sending you both to Telegram...
                </p>
              </div>

              {/* Connected heads */}
              <div className="flex items-center justify-center -space-x-4 py-3">
                <div className="w-16 h-16 rounded-full bg-[#1A1A1A] text-[#00C896] flex items-center justify-center text-xl font-black border-4 border-white shadow-md">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="w-16 h-16 rounded-full bg-[#00C896] text-[#1A1A1A] flex items-center justify-center text-xl font-black border-4 border-white shadow-md">
                  {matchedUser.name.charAt(0)}
                </div>
              </div>

              <p className="text-[11px] text-[#6B7280] font-bold">
                @username1 and @username2 detected by Matcha Bot.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
