import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, User, Check, RefreshCw, Zap } from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { generateAiFacts, onboardUser } from '../lib/api';

interface OnboardingViewProps {
  onComplete: (onboardedUser: any) => void;
}

const AVAILABLE_ROLES = [
  "Builder / Developer",
  "Creator / Designer",
  "Founder / Entrepreneur",
  "Just exploring"
];

const AVAILABLE_INTERESTS = [
  "AI & Automation",
  "Indie Hacking",
  "Design",
  "Content Creation",
  "Startups",
  "Gaming",
  "Crypto",
  "Music",
  "Shitposting",
  "Late Night Coding",
  "Coffee",
  "Deep Talks"
];

export default function OnboardingView({ onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Jason");
  const [role, setRole] = useState("Builder / Developer");
  const [selectedTags, setSelectedTags] = useState<string[]>(["AI & Automation", "Indie Hacking", "Coffee"]);
  const [aiFacts, setAiFacts] = useState<string[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger Gemini facts generation when transitioning to Step 3
  const generateFacts = async () => {
    setFactsLoading(true);
    try {
      const facts = await generateAiFacts(role, selectedTags);
      if (facts && facts.length) {
        setAiFacts(facts);
      } else {
        setAiFacts([
          "probably has 12 unfinished side projects",
          "sends voice messages at 2AM about code",
          "survives solely on caffeine and pure hope"
        ]);
      }
    } catch (err) {
      console.error(err);
      setAiFacts([
        "probably has 12 unfinished side projects",
        "sends voice messages at 2AM about code",
        "survives solely on caffeine and pure hope"
      ]);
    } finally {
      setFactsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3) {
      generateFacts();
    }
  }, [step]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        if (prev.length >= 5) return prev; // max 5 tags limit
        return [...prev, tag];
      }
    });
  };

  const handleTransitionToFacts = () => {
    if (selectedTags.length < 3 || selectedTags.length > 5) return;
    setStep(3);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const tgUser = WebApp.initDataUnsafe?.user;
      if (!tgUser?.id || !tgUser?.username) throw new Error('Telegram user unavailable');
      const user = await onboardUser({
        telegram_id: tgUser.id,
        username: tgUser.username,
        name,
        role,
        tags: selectedTags,
        ai_facts: aiFacts
      });
      if (user) {
        setTimeout(() => {
          onComplete(user);
          setIsLoading(false);
        }, 600);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow w-full max-w-sm mx-auto flex flex-col justify-between px-5 py-6 select-none bg-[#F0F0EB]" id="onboarding-root">
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6 flex flex-col h-full justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <span className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A7A55]">
                  Step 1 of 2
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] font-display">
                  matcha tma
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
                  What is your name and what are you building?
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    First Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280]">
                      <User className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      id="name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-[52px] pl-10 pr-4 bg-white border border-black/[0.08] rounded-2xl text-[14px] font-bold text-[#1A1A1A] focus:outline-none focus:border-[#00C896] shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                      placeholder="Jason"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6B7280] mb-1.5 uppercase tracking-wider">
                    My Core Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_ROLES.map((r) => {
                      const isSelected = role === r;
                      return (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`text-left px-4 py-3 rounded-2xl border text-[13px] font-extrabold transition cursor-pointer min-h-[58px] flex items-center ${
                            isSelected
                              ? 'bg-[#E8F5EE] border-[#00C896] text-[#1A7A55]'
                              : 'bg-white border-black/[0.06] text-[#1A1A1A] hover:bg-white/[0.6]'
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="w-full h-[56px] rounded-[100px] bg-[#00C896] text-[#1A1A1A] font-bold uppercase tracking-wider text-[13px] hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,200,150,0.15)] cursor-pointer"
                id="continue-onboard-btn"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6 flex flex-col h-full justify-between"
          >
            <div className="space-y-5">
              <div className="flex items-center gap-2 pt-2">
                <span className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A7A55]">
                  Step 2 of 2
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1A1A] font-display">
                  Select tags.
                </h1>
                <p className="text-[14px] text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
                  Choose 3 to 5 tags to calibrate matchmaking priority.
                </p>
              </div>

              {/* Tag Selection grid */}
              <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {AVAILABLE_INTERESTS.map((interest) => {
                  const isSelected = selectedTags.includes(interest);
                  return (
                    <button
                      key={interest}
                      onClick={() => handleTagToggle(interest)}
                      className={`px-3 py-3 rounded-2xl border text-left text-[12px] font-bold flex items-center justify-between transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#E8F5EE] border-[#00C896] text-[#1A7A55]'
                          : 'bg-white border-black/[0.06] text-[#1A1A1A] hover:bg-white/[0.6]'
                      }`}
                    >
                      <span className="truncate pr-1">{interest}</span>
                      {isSelected && <Check className="h-4 w-4 text-[#1A7A55] stroke-[3px] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                onClick={handleTransitionToFacts}
                disabled={selectedTags.length < 3 || selectedTags.length > 5}
                className={`w-full h-[56px] rounded-[100px] font-bold uppercase tracking-wider text-[13px] flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedTags.length >= 3 && selectedTags.length <= 5
                    ? 'bg-[#00C896] text-[#1A1A1A] hover:opacity-95 shadow-[0_4px_12px_rgba(0,200,150,0.15)]'
                    : 'bg-black/[0.05] border border-black/[0.04] text-[#6B7280] cursor-not-allowed'
                }`}
                id="generate-deck-btn"
              >
                <span>Generate Vibe Deck</span>
                <Sparkles className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] transition py-1 cursor-pointer"
              >
                Go back
              </button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-6 flex flex-col h-full justify-between"
          >
            {factsLoading ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-6 min-h-[350px]">
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-[#00C896]/10 blur-xl animate-pulse w-20 h-20" />
                  <div className="relative w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                    <Sparkles className="h-8 w-8 animate-spin text-[#00C896]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#1A1A1A] font-display">
                    building your vibe profile...
                  </h3>
                  <p className="text-xs text-[#6B7280] max-w-[240px] mx-auto leading-relaxed">
                    Tuning internet culture frequency index with Gemini 3.5 Flash...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 flex-grow flex flex-col justify-between">
                <div className="space-y-5">
                  <div className="flex items-center gap-2 pt-2">
                    <span className="w-8 h-8 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[#1A7A55]">
                      <Zap className="h-4 w-4 fill-[#00C896] text-[#00C896]" />
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#1A7A55]">
                      Vibe signature generated
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                      your ai profile
                    </h1>
                    <p className="text-[14px] text-[#6B7280] mt-1.5 leading-relaxed font-semibold">
                      These short facts describe your unique builder energy based on tags & role:
                    </p>
                  </div>

                  {/* Facts container */}
                  <div className="bg-white border border-black/[0.04] p-5 rounded-3xl space-y-3.5 shadow-sm">
                    {aiFacts.map((fact, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#E8F5EE] flex items-center justify-center text-[11px] font-bold text-[#1A7A55] shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-[13.5px] text-[#1A1A1A] font-bold leading-tight">
                          {fact}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full h-[56px] rounded-[100px] bg-[#00C896] text-[#1A1A1A] font-extrabold uppercase tracking-wider text-[13px] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,200,150,0.15)] hover:opacity-95 transition active:scale-[0.98] cursor-pointer"
                    id="confirm-vibe-btn"
                  >
                    <span>Confirm & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={generateFacts}
                      className="h-[48px] rounded-[100px] border border-black/[0.08] bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-black/[0.02] transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      onClick={handleSubmit}
                      className="h-[48px] rounded-[100px] bg-transparent text-[#6B7280] text-xs font-bold uppercase tracking-wider hover:text-[#1A1A1A] transition cursor-pointer"
                    >
                      <span>Skip</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
