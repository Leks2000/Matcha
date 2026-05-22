import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, User, Check, RefreshCw, Zap, Plus, Trash2, ArrowLeft, Camera } from 'lucide-react';

import { generateAiFacts, onboardUser, parseOnboardingFromChat, compressAndResizeImage } from '../lib/api';
import WebApp from '@twa-dev/sdk';

interface OnboardingViewProps {
  telegramId: number;
  telegramUsername: string;
  onComplete: (onboardedUser: any) => void;
  appLanguage?: 'en' | 'ru';
}

const TRANSLATIONS_ONBOARD = {
  en: {
    step1Of2: "Profile Setup • 1 of 2",
    step2Of2: "Vibe Calibration • 2 of 2",
    manual: "📝 MANUAL",
    aiAutoFill: "⚡ AI AUTO-FILL",
    instantProfiler: "Instant AI Profiler",
    profilerDesc: "Write raw details about yourself below (your name, age, core study/job fields, lifestyle habits, matcha preference, etc.) and we'll extract everything!",
    suggestionLabel: "💡 Suggestion Try:",
    suggestionText: "Hi, I'm Alina, 20. I study media marketing, obsessed with iced coconut matches, post weird retro visual memes, and lose tracks at local rave parties.",
    generateProfile: "Generate My Profile",
    extracting: "Extracting profile...",
    letDesign: "Let's design.",
    setupIdentity: "Setup your builder identity parameters to align vibe deck.",
    tapAvatar: "Tap avatar to update picture",
    autoCompress: "Auto-compression included",
    nameLabel: "Name (Human Name)",
    ageLabel: "Age",
    coreRole: "My Core Role",
    customRoleDesc: "Or write custom role / hobby",
    selectTags: "Select My Tags",
    matchVibes: "Match vibes.",
    vibeMetricsDesc: "Choose or write up to 6 custom tags matching your current vibe metrics.",
    tagPlaceholder: "Type physical/meta tag (e.g. matcha, vinyl)...",
    generateVibeDeck: "Generate Vibe Deck",
    goBackEdit: "Go back and edit info",
    buildingVibe: "building your vibe profile...",
    tuningIndex: "Tuning internet culture frequency index with Gemini AI Engine...",
    vibeSignatureGen: "Vibe signature generated",
    yourAiProfile: "your ai profile",
    factsDesc: "These short facts describe your unique builder energy based on tags & role:",
    confirmContinue: "Confirm & Continue",
    regenerate: "Regenerate",
    skip: "Skip",
    uploadBtn: "Upload",
    customTagsHeader: "// My Custom Added Tags",
    roles: [
      "Student",
      "Working Professional",
      "Indie Specialist",
      "Creator / Designer",
      "Founder / Builder",
      "Just exploring"
    ],
    interests: [
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
    ]
  },
  ru: {
    step1Of2: "Настройка профиля • 1 из 2",
    step2Of2: "Калибровка вайба • 2 из 2",
    manual: "📝 ВРУЧНУЮ",
    aiAutoFill: "⚡ AI ЗАПОЛНЕНИЕ",
    instantProfiler: "Мгновенный AI Профиль",
    profilerDesc: "Расскажите в свободной форме о себе ниже (ваше имя, возраст, сфера учебы/работы, привычки, любимая матча и др.), и мы выделим все самое важное!",
    suggestionLabel: "💡 Попробуйте пример:",
    suggestionText: "Привет, я Алина, мне 20 лет. Учусь медиа-маркетингу, обожаю кокосовый матча-латте, пощу странные ретро-визуальные мемы и танцую на рейвах.",
    generateProfile: "Создать мой профиль",
    extracting: "Извлекаем данные...",
    letDesign: "Давайте сделаем стиль.",
    setupIdentity: "Настройте параметры вашей личности для поиска людей на одной волне.",
    tapAvatar: "Нажмите на аватар для загрузки",
    autoCompress: "Авто-сжатие включено",
    nameLabel: "Ваше имя",
    ageLabel: "Возраст",
    coreRole: "Основная роль",
    customRoleDesc: "Или напишите увлечение / роль сами",
    selectTags: "Выбрать теги",
    matchVibes: "Матчим вайб.",
    vibeMetricsDesc: "Выберите или впишите до 6 тегов, подходящих под ваше настроение.",
    tagPlaceholder: "Впишите тег (например: матча, винил, код)...",
    generateVibeDeck: "Создать колоду вайба",
    goBackEdit: "Вернуться назад",
    buildingVibe: "строим ваш вайб-профиль...",
    tuningIndex: "Настраиваем индекс интернет-культуры с помощью нейросети...",
    vibeSignatureGen: "Вайб-сигнатура создана",
    yourAiProfile: "ваш AI профиль",
    factsDesc: "Эти короткие факты описывают вашу уникальную энергию на основе тегов и роли:",
    confirmContinue: "Подтвердить и продолжить",
    regenerate: "Пересоздать",
    skip: "Пропустить",
    uploadBtn: "Загрузить",
    customTagsHeader: "// Мои добавленные теги",
    roles: [
      "Студент",
      "Специалист в компании",
      "Инди-разработчик / Фрилансер",
      "Креатор / Дизайнер",
      "Сооснователь / Создатель",
      "В поиске себя"
    ],
    interests: [
      "ИИ и Автоматизация",
      "Фриланс / Инди",
      "Дизайн / Арт",
      "Создание контента",
      "Стартапы",
      "Гейминг",
      "Крипта",
      "Музыка",
      "Мемы / Юмор",
      "Код по ночам",
      "Матча / Кофе",
      "Разговоры по душам"
    ]
  }
};

const getInstantLocalFacts = (role: string, tags: string[], lang: 'en' | 'ru'): string[] => {
  if (lang === 'ru') {
    return [
      `Осознанно выбирает увлечения из списка: ${tags.slice(0, 3).join(', ')}`,
      `Позиционирует себя как ${role || 'создатель'} на цифровых радарах`,
      `Уверен, что атмосфера Matcha — лучший катализатор для продуктивного дня`
    ];
  }
  return [
    `Curates vibe node dynamics using tag values: ${tags.slice(0, 3).join(', ')}`,
    `Frequents digital clusters as a resident ${role || 'builder'} node`,
    `Believes cold matcha is the premium energy converter for daily sprints`
  ];
};

export default function OnboardingView({ telegramId, telegramUsername, onComplete, appLanguage }: OnboardingViewProps) {
  const lang = appLanguage === 'ru' ? 'ru' : 'en';
  const t = TRANSLATIONS_ONBOARD[lang];

  const [step, setStep] = useState(1);
  const [name, setName] = useState("Alex");
  const [age, setAge] = useState<number>(22);
  const [role, setRole] = useState(t.roles[0]);
  const [customRoleText, setCustomRoleText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([t.interests[0], t.interests[1], t.interests[10]]);
  const [customTagsPool, setCustomTagsPool] = useState<string[]>([]);
  const [manualTagInput, setManualTagInput] = useState("");
  
  const [aiFacts, setAiFacts] = useState<string[]>([]);
  const [factsLoading, setFactsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Profile image upload states
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [uploadLoading, setUploadLoading] = useState(false);

  const [isAiMode, setIsAiMode] = useState(false);
  const [aiChatInput, setAiChatInput] = useState("");
  const [aiChatLoading, setAiChatLoading] = useState(false);
  const [aiChatError, setAiChatError] = useState("");

  // Sync state if roles/interests change language
  useEffect(() => {
    setRole(t.roles[0]);
    setSelectedTags([t.interests[0], t.interests[1], t.interests[10]]);
  }, [appLanguage]);

  // Pull TG details automatically as default if they exist
  useEffect(() => {
    try {
      const tgUser = WebApp.initDataUnsafe?.user;
      if (tgUser) {
        if (tgUser.first_name) {
          setName(tgUser.first_name + (tgUser.last_name ? " " + tgUser.last_name : ""));
        } else if (tgUser.username) {
          setName(tgUser.username);
        }
        if (tgUser.photo_url) {
          setPhotoUrl(tgUser.photo_url);
        }
      }
    } catch (e) {
      console.log("Error finding TG user details:", e);
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

  const handleTagToggle = (tagItem: string) => {
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
    setSelectedTags(prev => {
      if (prev.includes(tagItem)) {
        return prev.filter(x => x !== tagItem);
      } else {
        if (prev.length >= 7) return prev; // max 7
        return [...prev, tagItem];
      }
    });
  };

  const handleAddCustomTag = () => {
    const clean = manualTagInput.trim();
    if (!clean) return;
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
    if (!customTagsPool.includes(clean)) {
      setCustomTagsPool(prev => [...prev, clean]);
    }
    if (selectedTags.length < 7 && !selectedTags.includes(clean)) {
      setSelectedTags(prev => [...prev, clean]);
    }
    setManualTagInput("");
  };

  const handleRemoveCustomTag = (tagItem: string) => {
    try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
    setCustomTagsPool(prev => prev.filter(x => x !== tagItem));
    setSelectedTags(prev => prev.filter(x => x !== tagItem));
  };

  // Conversational AI Onboarding extractor handler
  const handleAiChatSubmit = async () => {
    if (!aiChatInput.trim()) return;
    setAiChatLoading(true);
    setAiChatError("");
    try {
      WebApp.HapticFeedback.impactOccurred('heavy');
    } catch (e) {}

    try {
      const parsedData = await parseOnboardingFromChat(aiChatInput);
      if (parsedData) {
        if (parsedData.name) {
          setName(parsedData.name);
        }
        if (parsedData.age && typeof parsedData.age === 'number') {
          setAge(parsedData.age);
        }
        if (parsedData.role) {
          // If custom, assign to state
          const matchedRole = t.roles.find(r => r.toLowerCase().includes(parsedData.role.toLowerCase()));
          if (matchedRole) {
            setRole(matchedRole);
          } else {
            setCustomRoleText(parsedData.role);
            setRole("");
          }
        }
        if (parsedData.tags && Array.isArray(parsedData.tags)) {
          setSelectedTags(parsedData.tags.slice(0, 6));
        }

        // Generate immediate AI facts based on what we parsed
        const generated = await generateAiFacts(parsedData.role || 'Creator', parsedData.tags || ['Design']);
        if (generated && generated.length > 0) {
          setAiFacts(generated);
        } else {
          setAiFacts(getInstantLocalFacts(parsedData.role || 'Creator', parsedData.tags || ['Design'], lang));
        }

        // Go straight to step 3 to let user confirm extracted results
        setStep(3);
      } else {
        setAiChatError(lang === 'ru' ? "Не удалось распознать данные. Пожалуйста, попробуйте сформулировать иначе." : "Could not process facts. Please provide more details about your name, age, and interests.");
      }
    } catch (err) {
      console.warn("Llama chatbot parsing errored out, matching offline rules:", err);
      // Failover safely
      setAiFacts(getInstantLocalFacts('Developer', ['AI', 'Tech'], lang));
      setStep(3);
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleTransitionToFacts = async () => {
    setStep(3);
    setFactsLoading(true);
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}

    const activeRole = customRoleText.trim() || role;
    try {
      const generated = await generateAiFacts(activeRole, selectedTags);
      if (generated && generated.length > 0) {
        setAiFacts(generated);
      } else {
        setAiFacts(getInstantLocalFacts(activeRole, selectedTags, lang));
      }
    } catch (err) {
      console.error(err);
      setAiFacts(getInstantLocalFacts(activeRole, selectedTags, lang));
    } finally {
      setFactsLoading(false);
    }
  };

  const generateFacts = async () => {
    setFactsLoading(true);
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
    const activeRole = customRoleText.trim() || role;
    try {
      const generated = await generateAiFacts(activeRole, selectedTags);
      if (generated && generated.length > 0) {
        setAiFacts(generated);
      } else {
        setAiFacts(getInstantLocalFacts(activeRole, selectedTags, lang));
      }
    } catch (err) {
      console.error(err);
      setAiFacts(getInstantLocalFacts(activeRole, selectedTags, lang));
    } finally {
      setFactsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}

    const finalRole = customRoleText.trim() || role || "Matcha Vibe Explorer";
    const finalUserObject = {
      telegram_id: telegramId,
      username: telegramUsername || `matcha_user_${telegramId}`,
      name: name,
      age: age,
      role: finalRole,
      tags: selectedTags,
      ai_facts: aiFacts.length > 0 ? aiFacts : getInstantLocalFacts(finalRole, selectedTags, lang),
      bio: `${finalRole}. Interested in: ${selectedTags.slice(0, 3).join(', ')}.`,
      photo_url: photoUrl,
      streakDays: 14,
      matchesToday: 8,
      isPremium: false,
      priorityPoints: 0,
      matcha_sparks: 15,
      voice_bio: ""
    };

    onboardUser(finalUserObject).then((res) => {
      onComplete({
        ...finalUserObject,
        id: res?.id || `simulated_id_${telegramId}`,
      });
    }).catch((err) => {
      console.warn("Background onboarding sync caught error, continued offline beautifully:", err);
      onComplete({
        ...finalUserObject,
        id: `simulated_id_${telegramId}`,
      });
    });
  };

  return (
    <div className="flex-grow w-full max-w-sm mx-auto flex flex-col justify-between px-5 py-6 bg-[#F5F5F0] overflow-y-auto scrollbar-none h-full" id="onboarding-root">
      
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
                    {t.step1Of2}
                  </span>
                </div>
                
                {/* AI Toggle Link Segmented Switch */}
                <div className="bg-black/[0.04] p-0.5 rounded-full flex items-center select-none" id="ai-toggle-segmented">
                  <button
                    type="button"
                    onClick={() => setIsAiMode(false)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1 cursor-pointer select-none ${
                      !isAiMode 
                        ? 'bg-white text-[#1A7A55] shadow-2xs' 
                        : 'text-[#6B7280] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>{t.manual}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAiMode(true)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer select-none ${
                      isAiMode 
                        ? 'bg-[#00c89c]/20 text-[#0f553a] border border-[#00c89c]/40 shadow-2xs' 
                        : 'text-[#6B7280] hover:text-[#1A1A1A]'
                    }`}
                  >
                    <span>{t.aiAutoFill}</span>
                  </button>
                </div>
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
                      <span>{t.instantProfiler}</span>
                      <span className="text-[10px] font-mono text-white font-extrabold bg-[#00C896] px-1.5 py-0.2 rounded shrink-0">Llama3</span>
                    </h2>
                    <p className="text-[12.5px] text-[#6B7280] leading-snug font-medium">
                      {t.profilerDesc}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <textarea
                      value={aiChatInput}
                      onChange={(e) => setAiChatInput(e.target.value)}
                      rows={5}
                      className="w-full p-3.5 bg-[#F5F5F0] border border-black/[0.05] rounded-2.5xl text-xs font-semibold text-[#1a1a1a] placeholder-[#A0A0A0] focus:outline-none focus:border-[#00C896] focus:bg-white transition resize-none leading-relaxed"
                      placeholder={lang === 'ru' ? "Например: Алина, 21. Учусь UI дизайну, обожаю виниловые пластинки, техно, пью банановый матча латте..." : "e.g. Alina, 21. Study design in Berlin, love vinyl records, electronic music, and drinking cold green matcha, sleeping late..."}
                    />

                    {aiChatError && (
                      <p className="text-[11px] text-rose-500 font-extrabold flex items-center gap-1">
                        <span>⚠️</span>
                        <span>{aiChatError}</span>
                      </p>
                    )}

                    <div className="bg-[#E8F5EE]/50 border border-transparent p-3 rounded-2xl">
                      <p className="text-[10px] font-bold text-[#1A7A55] tracking-wider uppercase mb-1">
                        {t.suggestionLabel}
                      </p>
                      <button
                        type="button"
                        onClick={() => setAiChatInput(t.suggestionText)}
                        className="text-left text-[11px] text-zinc-600 font-medium hover:text-black italic leading-normal"
                      >
                        "{t.suggestionText.slice(0, 75)}..." ➜
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={aiChatLoading || !aiChatInput.trim()}
                      onClick={handleAiChatSubmit}
                      className={`w-full h-[50px] rounded-[100px] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                        aiChatInput.trim() && !aiChatLoading
                          ? 'bg-[#00C896] text-white hover:opacity-95 shadow-sm'
                          : 'bg-black/[0.04] border border-transparent text-[#9E9E9E] cursor-not-allowed'
                      }`}
                    >
                      {aiChatLoading ? (
                        <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      <span>{aiChatLoading ? t.extracting : t.generateProfile}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                /* Standard Manual Mode */
                <div className="space-y-4">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                      {t.letDesign}
                    </h1>
                    <p className="text-[13.5px] text-[#6B7280] font-semibold mt-1 leading-normal">
                      {t.setupIdentity}
                    </p>
                  </div>

                  <div className="space-y-4 pt-1">
                    {/* Minimalist Clickable Avatar Container */}
                    <div className="flex flex-col items-center justify-center py-1 space-y-2">
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
                              <span>{t.uploadBtn}</span>
                            </div>
                          </div>
                        </label>
                      </div>
                      <div className="text-center select-none">
                        <p className="text-[10.5px] text-[#6B7280] font-bold">
                          {t.tapAvatar}
                        </p>
                        <p className="text-[9px] text-[#A0A0A0] font-medium mt-0.5 leading-none">
                          {t.autoCompress}
                        </p>
                      </div>
                    </div>

                    {/* Name & Age Inputs Row */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-black text-[#1A7A55] mb-1.5 uppercase tracking-wider">
                          {t.nameLabel}
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
                            placeholder="Alex"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-[#1A7A55] mb-1.5 uppercase tracking-wider text-center">
                          {t.ageLabel}
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
                        {t.coreRole}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {t.roles.map((r) => {
                          const isSelected = role === r && !customRoleText.trim();
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setRole(r);
                                setCustomRoleText("");
                              }}
                              className={`text-left px-3 py-2 rounded-2xl border text-[11px] font-black transition cursor-pointer min-h-[46px] flex items-center leading-tight ${
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
                          {t.customRoleDesc}
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
                          placeholder="e.g. Designer, Software Maker, Matcha Lover..."
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
                  className="w-full h-[54px] rounded-[100px] bg-[#00C896] text-white font-extrabold uppercase tracking-wider text-xs hover:opacity-95 transition active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  id="continue-onboard-btn"
                >
                  <span>{t.selectTags}</span>
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
                  {t.step2Of2}
                </span>
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                  {t.matchVibes}
                </h1>
                <p className="text-[13.5px] text-[#6B7280] font-semibold mt-1">
                  {t.vibeMetricsDesc}
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
                  placeholder={t.tagPlaceholder}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="w-8 h-8 rounded-xl bg-[#00C896] text-white flex items-center justify-center active:scale-90 transition cursor-pointer shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Tag Selection list */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                  {t.interests.map((interest) => {
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
                      {t.customTagsHeader}
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
                    ? 'bg-[#00C896] text-white hover:opacity-95 shadow-sm'
                    : 'bg-black/[0.04] border border-transparent text-[#9E9E9E] cursor-not-allowed'
                }`}
                id="generate-deck-btn"
              >
                <span>{t.generateVibeDeck}</span>
                <Sparkles className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setStep(1)}
                className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] transition py-1 cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.goBackEdit}</span>
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
                    {t.buildingVibe}
                  </h3>
                  <p className="text-xs text-[#6B7280] max-w-[240px] mx-auto leading-relaxed">
                    {t.tuningIndex}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 flex-grow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-1.5 pt-2 text-[#1A7A55]">
                    <Zap className="h-4.5 w-4.5 fill-[#00C896] text-[#00C896]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      {t.vibeSignatureGen}
                    </span>
                  </div>

                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] font-display">
                      {t.yourAiProfile}
                    </h1>
                    <p className="text-[13.5px] text-[#6B7280] mt-1 font-semibold leading-relaxed">
                      {t.factsDesc}
                    </p>
                  </div>

                  {/* Facts container */}
                  <div className="bg-white border border-black/[0.04] p-5 rounded-3xl space-y-3.5 shadow-sm">
                    {aiFacts.map((fact, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <span className="text-[12.5px] font-mono text-[#00C896] font-extrabold shrink-0 mt-0.5 animate-pulse">
                          {index + 1}.
                        </span>
                        <p className="text-[13px] text-[#1A1A1A] font-extrabold leading-tight">
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
                    className="w-full h-[54px] rounded-[100px] bg-[#00C896] text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-sm hover:opacity-95 transition active:scale-[0.98] cursor-pointer"
                    id="confirm-vibe-btn"
                  >
                    <span>{t.confirmContinue}</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={generateFacts}
                      className="h-[46px] rounded-[100px] border border-black/[0.08] bg-white text-[#1A1A1A] font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-black/[0.02] transition cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>{t.regenerate}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="h-[46px] rounded-[100px] bg-transparent text-[#6B7280] text-xs font-bold uppercase tracking-wider hover:text-[#1A1A1A] transition cursor-pointer"
                    >
                      <span>{t.skip}</span>
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
