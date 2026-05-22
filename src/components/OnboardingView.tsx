import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, User, Check, RefreshCw, Zap, MessageSquare, Plus, Trash2, ArrowLeft, ArrowUpRight, Camera, Upload } from 'lucide-react';

import { generateAiFacts, onboardUser, parseOnboardingFromChat, compressAndResizeImage } from '../lib/api';
import WebApp from '@twa-dev/sdk';

interface OnboardingViewProps {
  telegramId: number;
  telegramUsername: string;
  onComplete: (onboardedUser: any) => void;
}

const AVAILABLE_ROLES = [
  "Student (Студент)",
  "Working (Работаю)",
  "Indie Specialist (Инди)",
  "Creator / Designer",
  "Founder / Builder",
  "Just exploring (Ищу себя)"
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

export default function OnboardingView({ telegramId, telegramUsername, onComplete }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("Jason");
  const [age, setAge] = useState<number>(22);
  const [role, setRole] = useState("Student (Студент)");
  const [customRoleText, setCustomRoleText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["AI & Automation", "Indie Hacking", "Coffee"]);
  const [customTagsPool, setCustomTagsPool] = useState<string[]>([]);
  const [manualTagInput, setManualTagInput] = useState("");
  
  const [aiFacts, setAiFacts] = useState<string[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile image upload states
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadLoading, setUploadLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Pull TG avatar url automatically as default if it exists
  useEffect(() => {
    try {
      const tgPhoto = WebApp.initDataUnsafe?.user?.photo_url || "";
      if (tgPhoto) {
        setPhotoUrl(tgPhoto);
      }
    } catch (e) {
      console.log("Error finding TG photo_url:", e);
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadLoading(true);
    try {
      const base64 = await compressAndResizeImage(file);
      setPhotoUrl(base64);
      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadLoading(true);
      try {
        const base64 = await compressAndResizeImage(file);
        setPhotoUrl(base64);
        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
      } catch (err) {
        console.error(err);
      } finally {
        setUploadLoading(false);
      }
    }
  };

  // AI-Onboarding Chat state
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatError, setAiChatError] = useState("");

  // Trigger Groq facts generation when transitioning to Step 3
  const generateFacts = async () => {
    setFactsLoading(true);
    try {
      const activeRole = customRoleText.trim() ? customRoleText : role;
      const facts = await generateAiFacts(activeRole, selectedTags);
      setAiFacts(facts);
    } catch (err) {
      console.error(err);
      setAiFacts([
        "regularly stays up until 3AM exploring things",
        "can drink matcha at any hour of day",
        "prefers texting with memes over actual language"
      ]);
    } finally {
      setFactsLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3 && aiFacts.length === 0) {
      generateFacts();
    }
  }, [step]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        if (prev.length >= 6) return prev; // tags range comfort
        return [...prev, tag];
      }
    });
  };

  const handleAddCustomTag = () => {
    const cleaned = manualTagInput.trim();
    if (!cleaned) return;
    
    // Add to pool and select it automatically
    if (!customTagsPool.includes(cleaned) && !AVAILABLE_INTERESTS.includes(cleaned)) {
      setCustomTagsPool(prev => [...prev, cleaned]);
    }
    
    if (!selectedTags.includes(cleaned)) {
      if (selectedTags.length < 6) {
        setSelectedTags(prev => [...prev, cleaned]);
      }
    }
    setManualTagInput("");
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
  };

  const handleRemoveCustomTag = (tag: string) => {
    setCustomTagsPool(prev => prev.filter(t => t !== tag));
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleTransitionToFacts = () => {
    if (selectedTags.length < 2) return;
    setStep(3);
  };

  // Chat-Onboarding NLP parser
  const handleAiChatSubmit = async () => {
    const promptText = aiChatInput.trim();
    if (!promptText) return;

    setAiChatLoading(true);
    setAiChatError("");
    try {
      const parsedData = await parseOnboardingFromChat(promptText);
      if (parsedData) {
        setName(parsedData.name || "Jason");
        setAge(parsedData.age || 22);
        
        // Match or set custom role
        if (AVAILABLE_ROLES.includes(parsedData.role)) {
          setRole(parsedData.role);
          setCustomRoleText("");
        } else {
          setRole("");
          setCustomRoleText(parsedData.role);
        }

        // Set tags
        setSelectedTags(parsedData.tags || []);
        // Also put custom tags in custom tag list to let them render and customize
        const customAdded = (parsedData.tags || []).filter(t => !AVAILABLE_INTERESTS.includes(t));
        setCustomTagsPool(customAdded);

        // Populate generated facts instantly
        setAiFacts(parsedData.ai_facts && parsedData.ai_facts.length === 3 ? parsedData.ai_facts : []);

        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        
        // Go straight to step 3 to view generated profile card facts representing them
        setStep(3);
      } else {
        setAiChatError("Could not extract details. Try again with more words!");
      }
    } catch (e) {
      console.error(e);
      setAiChatError("Groq AI API is heavily loaded. Try entering details manually!");
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    const finalRole = customRoleText.trim() ? customRoleText : role;
    try {
      const user = await onboardUser({
        telegram_id: telegramId,
        username: telegramUsername,
        name,
        age,
        role: finalRole,
        tags: selectedTags,
        ai_facts: aiFacts,
        photo_url: photoUrl
      });
      if (user) {
        setTimeout(() => {
          onComplete({
            ...user,
            age: age,
            streakDays: 14,
            matchesToday: 8,
            isPremium: false,
            priorityPoints: 0
          });
          setIsLoading(false);
        }, 600);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error(err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow w-full max-w-sm mx-auto flex flex-col justify-between px-5 py-6 select-none bg-[#F5F5F0]" id="onboarding-root">
      
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-5 flex flex-col h-full justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-[#1A7A55]">
                  <Sparkles className="h-4.5 w-4.5 text-[#00C896]" />
                  <span className="text-[11px] font-black uppercase tracking-wider">
                    Profile Setup • 1 of 2
                  </span>
                </div>
                
                {/* AI Toggle link Button */}
                <button
                  type="button"
                  onClick={() => setIsAiMode(!isAiMode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A] hover:bg-zinc-800 text-[#00C896] text-[10px] font-bold uppercase tracking-wider cursor-pointer transition active:scale-95 shadow-sm"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isAiMode ? "Manual Forms" : "⚡ AI Auto-Fill"}</span>
                </button>
              </div>

              {isAiMode ? (
                /* AI Mini-Chat Onboarding Mode */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white border border-[#E8F5EE] p-5 rounded-[28px] space-y-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight flex items-center gap-1.5">
                      <span>Instant AI Profiler</span>
                      <span className="text-[10px] font-mono text-white font-extrabold bg-[#00C896] px-1.5 py-0.2 rounded shrink-0">Llama3</span>
                    </h2>
                    <p className="text-[12.5px] text-[#6B7280] leading-snug font-medium">
                      Write raw details about yourself below (your name, age, core study/job fields, lifestyle habits, matcha preference, etc.) and we'll extract everything!
                    </p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      rows={5}
                      className="w-full p-3.5 bg-[#F5F5F0] border border-black/[0.05] rounded-2.5xl text-xs font-semibold text-[#1a1a1a] placeholder-[#A0A0A0] focus:outline-none focus:border-[#00C896] focus:bg-white transition resize-none leading-relaxed"
                      placeholder="e.g. Alina, 21. Study design in Berlin, love vinyl records, electronic music, and drinking cold green matcha, sleeping late..."
                    />

                    {aiChatError && (
                      <p className="text-[11px] text-rose-500 font-extrabold flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{aiChatError}</span>
                      </p>
                    )}

                    <div className="bg-[#E8F5EE]/50 border border-transparent p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#1A7A55] tracking-wider uppercase mb-1">
                        💡 Suggestion Try:
                      </p>
                      <button
                        type="button"
                        onClick={() => setAiChatInput("Hi, I'm Alina, 20. I study media marketing, obsessed with iced coconut matches, post weird retro visual memes, and lose tracks at local rave parties.")}
                        className="text-left text-[11px] text-zinc-600 font-medium hover:text-black italic"
                      >
                        "Hi, I'm Alina, 20. I study media marketing, obsessed with iced coconut matches..." ➜
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={aiChatLoading || !aiChatInput.trim()}
                      onClick={handleAiChatSubmit}
                      className={`w-full h-[50px] rounded-[100px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        aiChatInput.trim() && !aiChatLoading
                          ? 'bg-[#1A1A1A] text-white hover:opacity-95 shadow-sm'
                          : 'bg-black/[0.04] border border-transparent text-[#9E9E9E] cursor-not-allowed'
                      }`}
                    >
                      {aiChatLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      <span>{aiChatLoading ? "Extracting profile..." : "Generate My Profile"}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Standard Manual Mode */
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                      Let's design.
                    </h1>
                    <p className="text-[13.5px] text-[#6B7280] font-semibold mt-1">
                      Setup your builder identity parameters to align vibe deck.
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Minimalist Clickable Avatar Container */}
                    <div className="flex flex-col items-center justify-center py-2 space-y-2">
                      <div className="relative w-24 h-24 cursor-pointer group">
                        <input 
                          type="file" 
                          id="avatar-onboard-upload-direct"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label htmlFor="avatar-onboard-upload-direct" className="cursor-pointer block w-full h-full select-none">
                          <div className="absolute inset-0 rounded-full bg-[#00C896]/20 opacity-0 group-hover:opacity-100 blur-md transition duration-200" />
                          <div className="relative w-full h-full rounded-full bg-white text-[#1A1A1A] border-2 border-[#1A7A55]/10 hover:border-[#00C896] flex items-center justify-center font-extrabold text-3xl shadow-sm overflow-hidden transition">
                            {uploadLoading ? (
                              <div className="w-6 h-6 rounded-full border-2 border-[#00C896] border-t-transparent animate-spin" />
                            ) : photoUrl ? (
                              <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Camera className="w-7 h-7 text-[#1A7A55]" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase transition tracking-wider">
                              <Camera className="w-4.5 h-4.5 mb-0.5 text-[#00C896]" />
                              <span>Upload</span>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-[#6B7280] font-semibold">
                          Tap avatar to update picture
                        </p>
                        <p className="text-[9px] text-[#A0A0A0] font-medium leading-none">
                          Auto-compression included
                        </p>
                      </div>
                    </div>

                    {/* Name & Age Inputs Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-[#1A7A55] mb-1.5 uppercase tracking-wider">
                          Name (Human Name)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400">
                            <User className="h-4 w-4" />
                          </span>
                          <input
                            type="text"
                            id="name-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full h-[52px] pl-10 pr-4 bg-white border border-black/[0.06] rounded-2xl text-[14px] font-bold text-[#1A1A1A] focus:outline-none focus:border-[#00C896] shadow-xs"
                            placeholder="Alina"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-[#1A7A55] mb-1.5 uppercase tracking-wider text-center">
                          Age
                        </label>
                        <input
                          type="number"
                          id="age-input"
                          value={age}
                          onChange={(e) => setAge(Math.max(16, parseInt(e.target.value) || 22))}
                          className="w-full h-[52px] px-2 bg-white border border-black/[0.06] rounded-2xl text-[14px] font-bold text-[#1A1A1A] text-center focus:outline-none focus:border-[#00C896] shadow-xs"
                          placeholder="22"
                          min="16"
                          max="99"
                        />
                      </div>
                    </div>

                    {/* Pre-defined and Custom Role block */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-[#1A7A55] uppercase tracking-wider">
                        My Core Role
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {AVAILABLE_ROLES.map((r) => {
                          const isSelected = role === r && !customRoleText.trim();
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setRole(r);
                                setCustomRoleText("");
                              }}
                              className={`text-left px-4 py-2.5 rounded-2xl border text-[12px] font-black transition cursor-pointer min-h-[50px] flex items-center leading-tight ${
                                isSelected
                                  ? 'bg-[#E8F5EE] border-[#00C896] text-[#1A7A55]'
                                  : 'bg-white border-black/[0.04] text-[#1A1A1A] hover:bg-white/[0.6]'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>

                      {/* Manual custom role text entry field */}
                      <div className="pt-1">
                        <label className="block text-[9.5px] font-mono text-[#6B7280] mb-1 uppercase tracking-wider">
                          Or write completely custom role / hobby
                        </label>
                        <input
                          type="text"
                          value={customRoleText}
                          onChange={(e) => {
                            setCustomRoleText(e.target.value);
                            setRole(""); // clear selection to select this custom typed variant
                          }}
                          className={`w-full h-[46px] px-3.5 bg-white border rounded-xl text-xs font-bold focus:outline-none focus:border-[#00C896] ${
                            customRoleText.trim() ? 'border-[#00C896] bg-[#E8F5EE]/20' : 'border-black/[0.05]'
                          }`}
                          placeholder="e.g. Retro Photographer, Matcha Enthusiast..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standard step continue button (Only in manual mode) */}
            {!isAiMode && (
              <div className="pt-2">
                <button
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || (!role && !customRoleText.trim())}
                  className="w-full h-[54px] rounded-[100px] bg-[#00C896] text-[#1A1A1A] font-extrabold uppercase tracking-wider text-xs hover:opacity-95 transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  id="continue-onboard-btn"
                >
                  <span>Select My Tags</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="space-y-5 flex flex-col h-full justify-between"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 pt-2 text-[#1A7A55]">
                <Sparkles className="h-4.5 w-4.5 text-[#00C896]" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  Vibe Calibration • 2 of 2
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                  Match vibes.
                </h1>
                <p className="text-[13.5px] text-[#6B7280] font-semibold mt-1">
                  Choose or write up to 6 custom tags matching your current vibe metrics.
                </p>
              </div>

              {/* Custom Tag Manual Adder Input Component (Requested Plashka) */}
              <div className="bg-white border border-black/[0.04] p-3 rounded-2xl flex items-center gap-2 shadow-xs">
                <input
                  type="text"
                  value={manualTagInput}
                  onChange={(e) => setManualTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  className="flex-1 bg-transparent px-2 text-xs font-bold text-[#1A1A1A] outline-none placeholder-[#A0A0A0]"
                  placeholder="Type physical/meta tag (e.g. matcha, vinyl)..."
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="w-8 h-8 rounded-xl bg-[#00C896] text-[#1A1A1A] flex items-center justify-center active:scale-90 transition cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tag Selection list */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 max-h-[170px] overflow-y-auto pr-1">
                  {AVAILABLE_INTERESTS.map((interest) => {
                    const isSelected = selectedTags.includes(interest);
                    return (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => handleTagToggle(interest)}
                        className={`px-3.5 h-[36px] rounded-full border text-[11px] font-bold flex items-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#E8F5EE] border-[#00C896] text-[#1A7A55] font-black'
                            : 'bg-white border-black/[0.04] text-[#1A1A1A] hover:bg-white/[0.6]'
                        }`}
                      >
                        <span>{interest}</span>
                        {isSelected && <Check className="h-3 w-3 text-[#1A7A55] stroke-[4px]" />}
                      </button>
                    );
                  })}
                </div>

                {/* Custom User-Added Tags Row (if any) */}
                {customTagsPool.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-[#1A7A55] uppercase tracking-wider block">
                      // My Custom Added Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {customTagsPool.map((customTag) => {
                        const isSelected = selectedTags.includes(customTag);
                        return (
                          <div 
                            key={customTag}
                            className={`pl-3 pr-1 h-[34px] rounded-full border text-[11.5px] font-bold flex items-center gap-1 transition ${
                              isSelected
                                ? 'bg-[#EAF6F0] border-[#00C896] text-[#1A7A55]'
                                : 'bg-white border-neutral-100 text-zinc-400'
                            }`}
                          >
                            <span onClick={() => handleTagToggle(customTag)} className="cursor-pointer font-black">
                              {customTag}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveCustomTag(customTag)}
                              className="w-6 h-6 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-[#1A1A1A] flex items-center justify-center transition"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2.5 pt-4">
              <button
                onClick={handleTransitionToFacts}
                disabled={selectedTags.length < 2 || selectedTags.length > 7}
                className={`w-full h-[54px] rounded-[100px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                  selectedTags.length >= 2 && selectedTags.length <= 7
                    ? 'bg-[#00C896] text-[#1A1A1A] hover:opacity-95 shadow-sm'
                    : 'bg-black/[0.04] border border-transparent text-[#9E9E9E] cursor-not-allowed'
                }`}
                id="generate-deck-btn"
              >
                <span>Generate Vibe Deck</span>
                <Sparkles className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] transition py-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Go back and edit info</span>
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
                  <div className="relative w-16 h-16 flex items-center justify-center text-[#1A7A55]">
                    <Sparkles className="h-8 w-8 animate-spin text-[#00C896]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-[#1A1A1A] font-display">
                    building your vibe profile...
                  </h3>
                  <p className="text-xs text-[#6B7280] max-w-[240px] mx-auto leading-relaxed">
                    Tuning internet culture frequency index with Groq Llama-3 AI Engine...
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 pt-2 text-[#1A7A55]">
                    <Zap className="h-4.5 w-4.5 fill-[#00C896] text-[#00C896]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Vibe signature generated
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                      your ai profile
                    </h1>
                    <p className="text-[13.5px] text-[#6B7280] mt-1 font-semibold leading-relaxed">
                      These short facts describe your unique builder energy based on tags & role:
                    </p>
                  </div>

                  {/* Facts container */}
                  <div className="bg-white border border-black/[0.04] p-5 rounded-3xl space-y-3.5 shadow-sm">
                    {aiFacts.map((fact, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <span className="text-[12.5px] font-mono text-[#00C896] font-extrabold shrink-0 mt-0.5">
                          {index + 1}.
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
                    className="w-full h-[54px] rounded-[100px] bg-[#00C896] text-[#1A1A1A] font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-xs hover:opacity-95 transition active:scale-[0.98] cursor-pointer"
                    id="confirm-vibe-btn"
                  >
                    <span>Confirm & Continue</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={generateFacts}
                      className="h-[46px] rounded-[100px] border border-black/[0.08] bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-black/[0.02] transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Regenerate</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="h-[46px] rounded-[100px] bg-transparent text-[#6B7280] text-xs font-bold uppercase tracking-wider hover:text-[#1A1A1A] transition cursor-pointer"
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
