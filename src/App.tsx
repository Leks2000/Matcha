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
  Plus,
  Globe
} from 'lucide-react';
import WebApp from '@twa-dev/sdk';
import { getCurrentUser, resetUserSwipes, onboardUser, generateFactsFromChat, compressAndResizeImage } from './lib/api';

export const TRANSLATIONS = {
  en: {
    appTitle: "Matcha Bot",
    appSub: "Vibe Matcher",
    swipe: "SWIPE",
    profile: "PROFILE",
    editHeading: "Edit Profile Details",
    displayName: "Display Name",
    age: "Age",
    bioDesc: "Bio / Description",
    voiceGreetingHeader: "🎙️ Voice Greeting (Голосовой Вайб)",
    active: "Active",
    noRecording: "No voice record. Speak for 5 sec!",
    recordAudio: "Record Audio",
    stop: "Stop ⏹️",
    saveDetails: "Save Details",
    saving: "Saving...",
    modifyFacts: "Modify My Vibe Facts",
    delete: "Delete",
    addNewFact: "Add New Custom Fact",
    confirmFacts: "Confirm Edited Facts",
    groqTitle: "Groq AI Assist Chat",
    groqDesc: "Write everything about yourself conversationally (habits, hobbies, tea choice) and our neuron engine will rewrite your 3 facts!",
    placeholderChat: "I drink matcha late at night, sleep with a podcast, lost money on dogicoins, and build interfaces...",
    writeFactsBtn: "Rewrite Facts via AI",
    analyzing: "Analyzing traits...",
    inviteFounder: "Invite a founder",
    inviteDesc: "Generate ref links and score +5 stack priority boost for both when they join.",
    growth: "GROWTH ⚡",
    copied: "Copied",
    copy: "Copy",
    energySignature: "// CONFIG ENERGY SIGNATURE",
    likedToday: "Liked Today",
    streak: "Streak",
    boostPts: "Boost Pts",
    secureSettingsHeading: "// SETTINGS SECURE",
    ambientPushes: "Ambient Pushes",
    ghostMode: "Ghost Mode",
    restartOnboarding: "Restart Onboarding",
    resetWaveHistory: "Reset Wave History",
    resetWaveDeck: "Reset Wave Deck",
    voiceBioPrompt: "Listen to Voice Bio",
    voiceBioStop: "Stop",
    scoreBadge: "Matcha Vibe Score",
    radarView: "Radar Comparison",
    vibeReasonHeader: "✨ COGNITIVE ALIGNMENT REASON",
    factsHeader: "🤖 DEEP LIFESTYLE FACTS",
    vibeRadarText: "Vibe Radar vectors compared successfully",
    translateBtn: "🌐 Translate to Russian",
    translating: "Translating...",
    translatedBy: "Translated by AI • Show original",
    originalTextBtn: "Show Original Text",
    noProfilesTitle: "Vibe Wave Ended 🌊",
    noProfilesDesc: "There are no new minds near your wave frequency today. Tap the green button below to reset your swipe data deck and replay starting from matching nodes!",
    questTitle: "// DAILY COSMIC QUEST",
    resetWaveDeckBtn: "Reset Wave Deck"
  },
  ru: {
    appTitle: "Matcha Bot",
    appSub: "Вайб Радар",
    swipe: "СВАЙП",
    profile: "ПРОФИЛЬ",
    editHeading: "Редактировать Профиль",
    displayName: "Имя (Никнейм)",
    age: "Возраст",
    bioDesc: "О себе (Био)",
    voiceGreetingHeader: "🎙️ Голосовая Визитка (Вайб Голоса)",
    active: "Активен",
    noRecording: "Нет записи. Наговорите 5 секунд вайба!",
    recordAudio: "Записать голос",
    stop: "Стоп ⏹️",
    saveDetails: "Сохранить данные",
    saving: "Сохранение...",
    modifyFacts: "Мои вайб-факты",
    delete: "Удалить",
    addNewFact: "Добавить новый факт",
    confirmFacts: "Подтвердить факты",
    groqTitle: "Ассистент Groq AI Chat",
    groqDesc: "Расскажите о себе в чате (привычки, увлечения, любимый чай), и нейросеть перепишет 3 ваших факта!",
    placeholderChat: "Я пью матчу поздно ночью, засыпаю под подкасты, потерял немного денег на догах и верстаю сайты...",
    writeFactsBtn: "Переписать факты с помощью AI",
    analyzing: "Анализируем характер...",
    inviteFounder: "Пригласить друга",
    inviteDesc: "Создайте ссылку и получите +5 очков приоритета для обоих при регистрации.",
    growth: "РОСТ ⚡",
    copied: "Скопировано",
    copy: "Копировать",
    energySignature: "// СИГНАТУРА ЭНЕРГИИ",
    likedToday: "Свайпов сегодня",
    streak: "Дни",
    boostPts: "Очки буста",
    secureSettingsHeading: "// НАСТРОЙКИ СЕКЬЮРНОСТИ",
    ambientPushes: "Пуш-уведомления",
    ghostMode: "Режим невидимки",
    restartOnboarding: "Начать онбординг заново",
    resetWaveHistory: "Сбросить историю волны",
    resetWaveDeck: "Перезагрузить Wave Deck",
    voiceBioPrompt: "Слушать аудио-визитку",
    voiceBioStop: "Стоп",
    scoreBadge: "Матча Вайб Совпадение",
    radarView: "Вайб Радар",
    vibeReasonHeader: "✨ КОГНИТИВНОЕ СОВПАДЕНИЕ",
    factsHeader: "🤖 ИНТЕРЕСНЫЕ AI ФАКТЫ",
    vibeRadarText: "Сравнение векторов вайба завершено",
    translateBtn: "🌐 Перевести на Русский",
    translating: "Переводим...",
    translatedBy: "Переведено с помощью AI • Показать оригинал",
    originalTextBtn: "Показать оригинал",
    noProfilesTitle: "Конец Волны 🌊",
    noProfilesDesc: "Сегодня больше нет свободных умов на вашей частоте. Нажмите зеленую кнопку ниже, чтобы сбросить историю и снова запустить радар матчей!",
    questTitle: "// ЕЖЕДНЕВНЫЙ КВЕСТ",
    resetWaveDeckBtn: "Перезапустить колоду"
  }
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  
  // Immersive Mobile Tabs: exactly 2 tabs ('discover' | 'profile')
  const [mobileTab, setMobileTab] = useState<'discover' | 'profile'>('discover');
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState("");

  // Automatic localized language state (X-style translator)
  const [appLanguage, setAppLanguage] = useState<'en' | 'ru'>(() => {
    try {
      const saved = localStorage.getItem('matcha_app_lang');
      if (saved === 'ru' || saved === 'en') return saved;
      
      const tgLang = WebApp.initDataUnsafe?.user?.language_code;
      if (tgLang && tgLang.toLowerCase().startsWith('ru')) return 'ru';
    } catch (e) {}
    return 'en';
  });

  const toggleAppLanguage = () => {
    try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
    setAppLanguage(prev => {
      const next = prev === 'en' ? 'ru' : 'en';
      localStorage.setItem('matcha_app_lang', next);
      return next;
    });
  };

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

  // Audio-визитка (Voice Bio) States & Helpers
  const [localVoiceBio, setLocalVoiceBio] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recSeconds, setRecSeconds] = useState(0);
  const [isLocalVoicePlaying, setIsLocalVoicePlaying] = useState(false);

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          setLocalVoiceBio(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecSeconds(0);

      const interval = setInterval(() => {
        setRecSeconds(prev => {
          if (prev >= 4) {
            clearInterval(interval);
            recorder.stop();
            setIsRecording(false);
            return 5;
          }
          return prev + 1;
        });
      }, 1000);

      (recorder as any).timerInterval = interval;
      try { WebApp.HapticFeedback.impactOccurred('medium'); } catch(e){}
    } catch (err) {
      console.error("Unable to start record microphone:", err);
      // Fallback/Warning for nested frames which don't support mic permissions
      const isIframe = window.self !== window.top;
      if (isIframe) {
        alert("Запись аудио заблокирована в превью-фрейме браузера AI Studio. Пожалуйста, откройте приложение в новой вкладке (кнопка в правом верхнем углу!), чтобы разрешить доступ к микрофону и записать свою визитку!");
      } else {
        alert("Не удалось получить доступ к микрофону. Пожалуйста, проверьте разрешения.");
      }
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      clearInterval((mediaRecorder as any).timerInterval);
      mediaRecorder.stop();
      setIsRecording(false);
      try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
    }
  };

  const deleteVoiceBio = () => {
    setLocalVoiceBio("");
    try { WebApp.HapticFeedback.notificationOccurred('warning'); } catch(e){}
  };

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

  // Initialize Telegram TMA environment params safely and register PC drag scroll
  useEffect(() => {
    try {
      WebApp.ready();
      WebApp.expand();
      WebApp.setHeaderColor('#FFFFFF');
      WebApp.setBackgroundColor('#F5F5F0');
    } catch (e) {
      console.log("Telegram TMA SDK bypass on outer desktop browser.");
    }

    // Global desktop/PC mouse drag-to-scroll implementation
    let isDown = false;
    let startX = 0;
    let startY = 0;
    let scrollLeft = 0;
    let scrollTop = 0;
    let dragTarget: HTMLElement | null = null;
    let totalDist = 0;
    let hasDraggedActive = false;

    // Helper to find closest scrollable parent
    const findScrollableParent = (el: HTMLElement | null): HTMLElement | null => {
      let current = el;
      while (current && current !== document.body && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const isScrollableY = (overflowY === 'auto' || overflowY === 'scroll') && current.scrollHeight > current.clientHeight;
        const isScrollableX = (overflowX === 'auto' || overflowX === 'scroll') && current.scrollWidth > current.clientWidth;
        
        if (isScrollableY || isScrollableX) {
          return current;
        }
        current = current.parentElement;
      }
      
      // Fallback to the main content container if dragging on root elements
      const mainScroll = document.getElementById('mobile-applet-mount')?.querySelector('.overflow-y-auto');
      if (mainScroll) return mainScroll as HTMLElement;
      return null;
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;

      // Ignore input elements, interactive fields, selections, map pins, or items that explicitly bypass dragging scroll 
      const target = e.target as HTMLElement;
      if (
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[contenteditable="true"]') ||
        target.closest('.no-drag')
      ) {
        return;
      }

      const scrollable = findScrollableParent(target);
      if (!scrollable) return;

      isDown = true;
      dragTarget = scrollable;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = scrollable.scrollLeft;
      scrollTop = scrollable.scrollTop;
      totalDist = 0;
      hasDraggedActive = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown || !dragTarget) return;

      const x = e.clientX;
      const y = e.clientY;
      const walkX = x - startX;
      const walkY = y - startY;
      
      const dist = Math.sqrt(walkX * walkX + walkY * walkY);
      totalDist = Math.max(totalDist, dist);

      if (totalDist > 5) {
        if (!hasDraggedActive) {
          hasDraggedActive = true;
          // Apply cursor grabbing style and suppress selections
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }

      if (hasDraggedActive) {
        // Drag scrolling both vertical or horizontal scroll containers seamlessly
        dragTarget.scrollTop = scrollTop - walkY;
        dragTarget.scrollLeft = scrollLeft - walkX;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDown) return;
      isDown = false;
      
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Reset variables with a small timeout so mouseup click events can be suppressed accurately
      setTimeout(() => {
        dragTarget = null;
        hasDraggedActive = false;
      }, 40);
    };

    // Cleanly suppress child click events if the mouse release follows a dragging action
    const handleCaptureClick = (e: MouseEvent) => {
      if (hasDraggedActive && totalDist > 5) {
        e.preventDefault();
        e.stopPropagation();
        hasDraggedActive = false;
        totalDist = 0;
      }
    };

    window.addEventListener('mousedown', handleMouseDown, { passive: false });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('click', handleCaptureClick, { capture: true });

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleCaptureClick, { capture: true });
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
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
          photo_url: user.photo_url || tgPhotoUrl || "",
          matcha_sparks: user.matcha_sparks ?? 15,
          voice_bio: user.voice_bio || ""
        };
        setCurrentUser(loadedUser);
        setProfileName(loadedUser.name);
        setProfileAge(loadedUser.age);
        setProfileBio(loadedUser.bio || "");
        setProfilePhotoUrl(loadedUser.photo_url || "");
        setProfileFacts(loadedUser.ai_facts || []);
        setLocalVoiceBio(loadedUser.voice_bio || "");
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
          photo_url: tgPhotoUrl || "",
          matcha_sparks: 15,
          voice_bio: ""
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

    // Direct client simulation of awarding dynamic invite boosts points & Matcha Sparks
    setInviteFeedback("+10 Sparks & +5 Priority Boost Activated!");
    setCurrentUser(prev => prev ? {
      ...prev,
      priorityPoints: (prev.priorityPoints || 0) + 5,
      matcha_sparks: (prev.matcha_sparks ?? 15) + 10
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
        photo_url: profilePhotoUrl,
        voice_bio: localVoiceBio
      });
      if (updatedUser) {
        setCurrentUser({
          ...currentUser,
          name: profileName,
          age: profileAge,
          ai_facts: profileFacts,
          bio: profileBio,
          photo_url: profilePhotoUrl,
          voice_bio: localVoiceBio
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

  const t = TRANSLATIONS[appLanguage];

  return (
    <TelegramFrame
      streakDays={currentUser.streakDays}
      isPremium={currentUser.isPremium}
      matchaSparks={currentUser.matcha_sparks ?? 15}
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
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col h-full scrollbar-thin">
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
                    appLanguage={appLanguage}
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
                  className="space-y-5 flex flex-col pb-16"
                  id="profile-screen-me"
                >
                  {/* Quick Return and Screen Title Header */}
                  <div className="flex items-center justify-between pb-1 pt-1 border-b border-black/[0.03]">
                    <button
                      onClick={() => {
                        try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
                        setMobileTab('discover');
                      }}
                      className="h-8 px-3.5 rounded-full bg-[#00C896] hover:bg-[#00B285] text-white font-extrabold text-[10.5px] uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-xs select-none active:scale-[0.97]"
                    >
                      <Sparkles className="h-3 w-3 stroke-[3] text-amber-200 fill-amber-200/20" />
                      <span>← {appLanguage === 'ru' ? "Назад к анкетам" : "Back to Discover"}</span>
                    </button>
                    <span className="text-[10px] font-black font-mono text-zinc-400 uppercase tracking-widest mr-1">
                      {appLanguage === 'ru' ? "ПРОФИЛЬ" : "MY PROFILE"}
                    </span>
                  </div>

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
                      <h3 className="text-sm font-black text-[#1A1A1A]">{t.editHeading}</h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[9.5px] font-bold text-[#6B7280] mb-1 uppercase tracking-wider">
                          {t.displayName}
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
                          {t.age}
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
                        {t.bioDesc}
                      </label>
                      <input
                        type="text"
                        value={profileBio}
                        onChange={(e) => setProfileBio(e.target.value)}
                        className="w-full h-[40px] px-3 bg-[#F5F5F0] border border-black/[0.05] rounded-xl text-[12.5px] font-bold text-[#1A1A1A] focus:outline-none focus:border-[#00C896]"
                        placeholder={appLanguage === 'ru' ? "Расскажите немного о себе..." : "Say something about yourself..."}
                      />
                    </div>

                    {/* Audio-визитка (Voice Bio) Section */}
                    <div className="space-y-2 border-t border-black/[0.04] pt-3" id="voice-bio-panel">
                      <div className="flex items-center justify-between">
                        <label className="block text-[10px] font-black text-[#6B7280] uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                          <span>{t.voiceGreetingHeader}</span>
                          {localVoiceBio && (
                            <span className="text-[9px] text-[#00C896] bg-[#00C896]/10 px-1.5 py-0.5 rounded-full uppercase font-bold">{t.active}</span>
                          )}
                        </label>
                      </div>

                      <div className="bg-[#F5F5F0] p-3 rounded-2xl flex items-center justify-between gap-3 border border-black/[0.03]">
                        {isRecording ? (
                          <div className="flex items-center gap-2.5 animate-pulse text-[#FF3B30] font-black text-[12px]">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                            <span>Запись: 0:0{recSeconds} / 0:05</span>
                          </div>
                        ) : localVoiceBio ? (
                          <div className="flex items-center gap-2">
                            {isLocalVoicePlaying ? (
                              <button
                                onClick={() => {
                                  if ((window as any).currentUserAudio) {
                                    (window as any).currentUserAudio.pause();
                                  }
                                  setIsLocalVoicePlaying(false);
                                }}
                                className="h-[32px] px-3 rounded-lg bg-[#FF3B30]/15 hover:bg-[#FF3B30]/25 text-[#FF3B30] font-extrabold text-[11px] uppercase tracking-wider transition flex items-center gap-2 cursor-pointer select-none animate-pulse"
                              >
                                <div className="flex items-center gap-[2px] h-2.5">
                                  {[1, 2, 3, 4, 5].map((bar: number) => (
                                    <motion.span
                                      key={bar}
                                      animate={{
                                        height: ["30%", "100%", "45%", "85%", "30%"]
                                      }}
                                      transition={{
                                        duration: 0.75,
                                        repeat: Infinity,
                                        repeatType: "mirror",
                                        ease: "easeInOut",
                                        delay: bar * 0.1
                                      }}
                                      className="w-[1.5px] h-full bg-[#FF3B30] rounded-full origin-center"
                                    />
                                  ))}
                                </div>
                                <span>Stop Bio</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if ((window as any).currentUserAudio) {
                                    (window as any).currentUserAudio.pause();
                                  }
                                  const audio = new Audio(localVoiceBio);
                                  (window as any).currentUserAudio = audio;
                                  setIsLocalVoicePlaying(true);
                                  audio.onended = () => {
                                    setIsLocalVoicePlaying(false);
                                  };
                                  audio.onerror = () => {
                                    setIsLocalVoicePlaying(false);
                                  };
                                  audio.play();
                                }}
                                className="h-[32px] px-3 rounded-lg bg-[#00C896]/15 hover:bg-[#00C896]/25 text-[#1A7A55] font-extrabold text-[11px] uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer"
                              >
                                ▶️ {appLanguage === 'ru' ? 'Слушать визитку' : 'Play Voice Bio'}
                              </button>
                            )}
                            <button
                              onClick={deleteVoiceBio}
                              className="h-[32px] w-[32px] rounded-lg bg-red-100/80 hover:bg-red-200/80 text-red-600 transition flex items-center justify-center text-xs cursor-pointer"
                              title="Delete voice entry"
                            >
                              🗑️
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#6B7280] font-bold">{t.noRecording}</span>
                        )}

                        <div>
                          {isRecording ? (
                            <button
                              onClick={stopVoiceRecording}
                              className="h-[32px] px-3 rounded-lg bg-red-500 text-white font-extrabold text-[10px] uppercase tracking-wider hover:opacity-95 transition cursor-pointer"
                            >
                              {t.stop}
                            </button>
                          ) : (
                            <button
                              onClick={startVoiceRecording}
                              className="h-[32px] px-3.5 rounded-xl bg-[#00C896]/15 hover:bg-[#00C896]/25 border border-[#00C896]/45 text-[#1A7A55] font-black text-[10px] uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer hover:scale-[1.03] select-none"
                            >
                              <span className="w-2 h-2 rounded-full bg-[#FF3B30] animate-pulse shrink-0" />
                              <span>{t.recordAudio}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveProfile}
                      disabled={saveStatus.includes("Saving")}
                      className="w-full h-[46px] rounded-xl bg-[#00C896] text-white font-extrabold text-xs uppercase tracking-wider hover:opacity-90 active:scale-[0.98] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saveStatus ? (saveStatus === "Profile Saved!" ? (appLanguage === "ru" ? "Профиль Сохранен!" : "Profile Saved!") : saveStatus) : t.saveDetails}</span>
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
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">{t.likedToday}</span>
                    </GlassCard>

                    <GlassCard className="p-3 text-center border border-black/[0.04]">
                      <span className="text-xl font-black text-[#1A1A1A] block font-mono">
                        {currentUser.streakDays}d
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">{t.streak}</span>
                    </GlassCard>

                    <GlassCard className="p-3 text-center border border-black/[0.04]">
                      <span className="text-xl font-black text-[#1A1A1A] block font-mono">
                        +{currentUser.priorityPoints || 0}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-extrabold uppercase mt-1 block">{t.boostPts}</span>
                    </GlassCard>
                  </div>

                  {/* Secure Settings List */}
                  <div className="space-y-2 pt-1">
                    <h4 className="text-[10px] font-bold tracking-[1.5px] uppercase text-[#1A7A55] ml-1 block">
                      {t.secureSettingsHeading}
                    </h4>

                    <GlassCard className="overflow-hidden border border-black/[0.04] rounded-2xl">
                      <div className="divide-y divide-black/[0.03]">
                        {/* Interactive App Language Swapper */}
                        <div
                          onClick={toggleAppLanguage}
                          className="h-[48px] px-4 flex items-center justify-between hover:bg-black/[0.01] cursor-pointer transition duration-150"
                        >
                          <div className="flex items-center gap-3">
                            <Globe className="h-4.5 w-4.5 text-[#00C896]" />
                            <span className="text-[13px] font-extrabold text-[#1A1A1A]">
                              {appLanguage === 'ru' ? 'Язык приложения' : 'App Language'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black uppercase text-[#1A7A55] bg-[#00C896]/10 px-2 py-0.5 rounded-md">
                              {appLanguage === 'en' ? 'EN 🇺🇸' : 'RU 🇷🇺'}
                            </span>
                            <ChevronRight className="h-4 w-4 text-zinc-300" />
                          </div>
                        </div>

                        {[
                          { id: 'notif', name: t.ambientPushes, icon: Bell },
                          { id: 'privacy', name: t.ghostMode, icon: Shield },
                          { id: 'onboard', name: t.restartOnboarding, icon: Sparkles }
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
                      className="w-full text-center py-4 bg-[#00C896] hover:bg-[#00B285] text-white rounded-[100px] h-[56px] text-xs font-black uppercase tracking-widest cursor-pointer transition active:scale-[0.98] shadow-sm flex items-center justify-center gap-1"
                      id="edit-profile-btn"
                    >
                      <span>{t.resetWaveHistory}</span>
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom navigation (White, clean thin top border, 64px, labels SWIPE and PROFILE only) */}
          <nav className="h-16 bg-white border-t border-black/[0.05] flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] z-20 sticky bottom-0">
            {[
              { id: 'discover', label: t.swipe, icon: Sparkles },
              { id: 'profile', label: t.profile, icon: User }
            ].map((tab) => {
              const isActive = mobileTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
                    setMobileTab(tab.id as any);
                  }}
                  className="relative flex flex-col items-center justify-center flex-1 h-full py-1 cursor-pointer select-none"
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
                </motion.button>
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
