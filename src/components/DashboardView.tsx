import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { Sparkles, Heart, X, MessageSquare } from 'lucide-react';
import { UserProfile, CurrentUser } from '../types';
import WebApp from '@twa-dev/sdk';
import { getProfiles, recordSwipe, getVibeReason, resetUserSwipes, triggerTelegramBotNotification, translateProfile } from '../lib/api';
import VibeRadar from './VibeRadar';
import { GlassCard } from './GlassCard';

interface DashboardViewProps {
  currentUser: CurrentUser;
  onOpenPremium: () => void;
  onUpdateCurrentUser: (user: CurrentUser) => void;
  appLanguage: 'en' | 'ru';
}

const TUTORIAL_PROFILES = [
  {
    id: "tut_1",
    telegram_id: 11111,
    name: "Artem",
    age: 23,
    role: "Vibe Matcher Creator",
    bio: "Hey there! I'm your interactive trainer. Let's listen to my play sound context first. Tab the audio button above my name!",
    voice_bio: "",
    tags: ["AI Builder", "Design", "Vibe Coding"],
    ai_facts: [
      "Designed the entire Matcha bot UI structure from scratch.",
      "Prefers cold matcha over double espresso anytime.",
      "Terminal-online, extreme high focus, always building."
    ],
    photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop"
  },
  {
    id: "tut_2",
    telegram_id: 22222,
    name: "Alisa",
    age: 21,
    role: "Web3 Designer",
    bio: "Incredible! Now let's try direct contact. Swift me to the right or click the speech bubble chat button below to open Telegram chat.",
    voice_bio: "",
    tags: ["NFTs", "Framer", "Product Craft"],
    ai_facts: [
      "Built 20+ token-gated digital art collections.",
      "Dreams of living in a glass cabin in Norway.",
      "Never codes without a playlist of lo-fi beats."
    ],
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=150&auto=format&fit=crop"
  },
  {
    id: "tut_3",
    telegram_id: 33333,
    name: "Yaroslav",
    age: 22,
    role: "Indie Hacker",
    bio: "Congratulations, you are fantastic! Lastly, let's learn how to send a reciprocal Like. Swipe UP or tap the ❤️ button to complete training!",
    voice_bio: "",
    tags: ["SaaS", "Micro-SaaS", "Tailwind Master"],
    ai_facts: [
      "Shipped 4 micro-services in the last 2 months.",
      "Prefers mountain biking over any tech meetups.",
      "Uses SpeechSynthesis to debug code structure aloud."
    ],
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=150&auto=format&fit=crop"
  }
];

export default function DashboardView({
  currentUser,
  onOpenPremium,
  onUpdateCurrentUser,
  appLanguage
}: DashboardViewProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [vibeReasonText, setVibeReasonText] = useState("");
  const [vibeScore, setVibeScore] = useState<number | null>(null);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [matchedUser, setMatchedUser] = useState<any | null>(null);
  const [typewriterText, setTypewriterText] = useState("");

  // Interactive Live Training/Tutorial flow - Starts automatically on first session
  const [isTutorialActive, setIsTutorialActive] = useState(() => {
    return localStorage.getItem('matcha_tutorial_interactive_completed_v4') !== 'true';
  });
  const [tutorialStep, setTutorialStep] = useState(0);

  // AI Supermatch states
  const [isSuperMatching, setIsSuperMatching] = useState(false);
  const [superMatchedProfile, setSuperMatchedProfile] = useState<any | null>(null);
  const [superMatchVibeReason, setSuperMatchVibeReason] = useState("");
  const [showEmptyDeckNotice, setShowEmptyDeckNotice] = useState(false);
  
  // Immersive top filter select and dual-mode layout for cards (facts vs visual radar chart)
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('All');
  const [cardMode, setCardMode] = useState<'facts' | 'radar'>('facts');

  // Integrated X-style profile translation state
  const [translatedProfile, setTranslatedProfile] = useState<{
    id: string;
    role: string;
    bio: string;
    tags: string[];
    ai_facts: string[];
    lang: 'en' | 'ru';
  } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const cardWrapperRef = useRef<HTMLDivElement>(null);
  const lastSwipeTimeRef = useRef<number>(0);

  // Mouse drag scrolling state for PC / Desktop ease of use
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [isDragScrollingHeader, setIsDragScrollingHeader] = useState(false);
  const [dragScrollStartX, setDragScrollStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const startHeaderDragScroll = (e: React.MouseEvent) => {
    const el = filterScrollRef.current;
    if (!el) return;
    setIsDragScrollingHeader(true);
    setDragScrollStartX(e.pageX - el.offsetLeft);
    setDragScrollLeft(el.scrollLeft);
  };

  const stopHeaderDragScroll = () => {
    setIsDragScrollingHeader(false);
  };

  const executeHeaderDragScroll = (e: React.MouseEvent) => {
    if (!isDragScrollingHeader) return;
    e.preventDefault();
    const el = filterScrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragScrollStartX) * 1.5; // Drag speed multi
    el.scrollLeft = dragScrollLeft - walk;
  };

  // Framer Motion gesture physics
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const rotateValue = useTransform(dragX, [-200, 200], [-12, 12]);
  const opacityValue = useTransform(dragX, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5]);
  const dragXAbs = useTransform(dragX, x => Math.abs(x));
  const scaleValue = useTransform(dragXAbs, [0, 200], [1, 1.05]);

  // Track currently playing audio profile ID
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Show Quest banner state (can be dismissed to avoid overlapping card deck)
  const [showQuestBanner, setShowQuestBanner] = useState<boolean>(() => {
    return localStorage.getItem('matcha_show_quest_banner') !== 'false';
  });

  // Smooth slide-in toast notification state
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Interactive Tutorial Guide modal helper (Unused static pop-up bypassed, interactive training starts directly)
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Proactive automatic tutorial help triggers
  useEffect(() => {
    const hasSeen = localStorage.getItem('matcha_has_seen_tutorial_v4');
    if (!hasSeen) {
      setIsTutorialActive(true);
      setTutorialStep(0);
      setCurrentIndex(0);
      localStorage.setItem('matcha_has_seen_tutorial_v4', 'true');
    }
  }, []);

  const showToast = (message: string) => {
    setToastNotification(message);
    try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
    setTimeout(() => {
      setToastNotification(null);
    }, 3500);
  };

  // Daily Cosmic Quest state model
  const [activeQuest, setActiveQuest] = useState<{
    id: string;
    title: string;
    description: string;
    targetCount: number;
    currentCount: number;
    completed: boolean;
    rewardClaimed: boolean;
  } | null>(null);

  // Initialize and load daily quest
  useEffect(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const savedQuestStr = localStorage.getItem('matcha_daily_quest');

    if (savedQuestStr) {
      try {
        const saved = JSON.parse(savedQuestStr);
        if (saved.date === todayStr) {
          setActiveQuest(saved.quest);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved daily quest", e);
      }
    }

    const QUESTS_POOL = [
      { id: 'radar', title: 'Radar Explorer 🌀', description: 'Switch to Radar view on top of any card to compare tag vectors', targetCount: 1 },
      { id: 'vibe_voice', title: 'Sonic Resonator 🎙️', description: 'Listen to any match candidate’s recorded voice bio', targetCount: 1 },
      { id: 'swipe_wave', title: 'Cosmic Swiper 🌊', description: 'Evaluate and react to at least 3 profiles in the finder deck', targetCount: 3 },
      { id: 'filter_role', title: 'Role Dispatcher 👥', description: 'Toggle through 2 different filter categories in the finder tab', targetCount: 2 }
    ];

    const day = new Date().getDate();
    const picked = QUESTS_POOL[day % QUESTS_POOL.length];

    const initialQuest = {
      id: picked.id,
      title: picked.title,
      description: picked.description,
      targetCount: picked.targetCount,
      currentCount: 0,
      completed: false,
      rewardClaimed: false
    };

    localStorage.setItem('matcha_daily_quest', JSON.stringify({
      date: todayStr,
      quest: initialQuest
    }));
    setActiveQuest(initialQuest);
  }, []);

  // Update Quest Progress helper
  const updateQuestProgress = (actionId: string, increment = 1) => {
    setActiveQuest((prev) => {
      if (!prev || prev.completed || prev.rewardClaimed) return prev;
      if (prev.id !== actionId) return prev;

      const newCount = Math.min(prev.currentCount + increment, prev.targetCount);
      const isCompleted = newCount >= prev.targetCount;

      const updated = {
        ...prev,
        currentCount: newCount,
        completed: isCompleted
      };

      if (isCompleted) {
        showToast(appLanguage === 'ru'
          ? `🌟 Квест "${prev.title}" выполнен! Нажмите, чтобы забрать +5 Sparks!`
          : `🌟 Cosmic Quest "${prev.title}" completed! Claim your +5 Sparks!`);
      }

      const todayStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('matcha_daily_quest', JSON.stringify({
        date: todayStr,
        quest: updated
      }));

      return updated;
    });
  };

  // Claim Quest Reward
  const claimQuestReward = () => {
    if (!activeQuest || !activeQuest.completed || activeQuest.rewardClaimed) return;

    const updated = {
      ...activeQuest,
      rewardClaimed: true
    };

    setActiveQuest(updated);

    const todayStr = new Date().toISOString().slice(0, 10);
    localStorage.setItem('matcha_daily_quest', JSON.stringify({
      date: todayStr,
      quest: updated
    }));

    // Award +5 Sparks to current user
    const currentSparks = currentUser.matcha_sparks ?? 0;
    onUpdateCurrentUser({
      ...currentUser,
      matcha_sparks: currentSparks + 5
    });

    showToast(appLanguage === 'ru'
      ? "🎉 +5 Sparks успешно начислено! Отличная калибровка!"
      : "🎉 +5 Sparks successfully credited to your energy index!");
  };

  // Cleanup speak on card index change
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if ((window as any).currentPlayingAudio) {
      (window as any).currentPlayingAudio.pause();
    }
    setPlayingAudioId(null);
  }, [currentIndex]);

  // Cleanup voice on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if ((window as any).currentPlayingAudio) {
        (window as any).currentPlayingAudio.pause();
      }
    };
  }, []);

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

    setPlayingAudioId(profile.id);

    if (profile.voice_bio) {
      const audio = new Audio(profile.voice_bio);
      audio.onended = () => {
        setPlayingAudioId(null);
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
      };
      audio.play();
      (window as any).currentPlayingAudio = audio;
    } else {
      if ('speechSynthesis' in window) {
        let text = "";
        const isRussian = appLanguage === 'ru';
        
        if (profile.telegram_id === 11111) {
          text = isRussian
            ? "Привет! Я Артем, твой гид по вайбам. Отличный запуск! Теперь проведи пальцем влево или нажми на крестик, чтобы пропустить меня."
            : "Hey! I am Artem, your vibe walkthrough guide. Excellent audio test! Now swipe me left or click the cross button below to skip.";
        } else if (profile.telegram_id === 22222) {
          text = isRussian
            ? "Привет, я Алиса! Замечательно. Теперь попробуй свайпнуть меня вправо или нажать на иконку чата для быстрого контакта."
            : "Hey, I'm Alisa! Brilliant. Now let's try direct contact. Swipe me to the right or click the speech bubble chat button below.";
        } else if (profile.telegram_id === 33333) {
          text = isRussian
            ? "Привет, я Ярослав. Поздравляю! Свайпни меня вверх или нажми на сердечко, чтобы отправить когнитивный лайк."
            : "Hi, I am Yaroslav. Congratulations! Now swipe me up or click the central heart button to send a mutual vibe like.";
        } else if (profile.telegram_id === 9991) {
          text = isRussian
            ? "Привет, я Елена. Я визуальный творец, исследую андеграунд техно-музыку и эстетику. Давай выпьем по матча латте!"
            : "Hi, I am Elena. I am a visual creator exploring underground techno music and aesthetics. Let's grab a matcha latte!";
        } else if (profile.telegram_id === 9992) {
          text = isRussian
            ? "Привет народ, я Максим. Я уличный диджей, ловлю биты заката и идеальный вайб ночной уличной еды. Зацени мой виниловый микс."
            : "Hey guys, Maksim. I'm a street DJ chasing beautiful sunset beats and perfect late night street-food vibes. Check out my vinyl mix.";
        } else if (profile.telegram_id === 9991 || profile.telegram_id === 9993) {
          text = isRussian
            ? "Привет, София из жизни цифровых кочевников на связи! Живу с рюкзаком и ищу творческих людей для совместных исследований. Спонтанные поездки — моя фишка."
            : "Ola, Sofia of digital nomad life here! living out of a backpack and looking for creative spirits to explore with. Spontaneous trips are my thing.";
        } else if (profile.telegram_id === 9994) {
          text = isRussian
            ? "Йо. Кирилл. Я занимаюсь щитпостингом и создаю кастомные стикеры. Постоянно онлайн, криптоэнтузиаст на запредельных скоростях. Давай наделаем шума!"
            : "Yo. Kirill. I shitpost and curate custom stickers. Terminally online, Crypto enthusiast on extreme high speeds. Let's make some noise.";
        } else if (profile.telegram_id === 9995) {
          text = isRussian
            ? "Привет, Таня, эксперт в искусстве и кино. Давай выпьем матчу и обсудим, действительно ли пришельцам нравится наша поп-музыка!"
            : "Hello, Tanya, specialist in art and movies. Let's grab a matcha and discuss if aliens actually like our pop music!";
        } else {
          text = isRussian
            ? `Привет! Меня зовут ${profile.name}, мне ${profile.age || 22}, я работаю как ${profile.role || 'Исследователь'}. Мои интересы: ${(profile.tags || []).join(', ')}. Давай настроимся на общую частоту!`
            : `Hey! I am ${profile.name}, age ${profile.age || 22}, working as a ${profile.role || 'Explorer'}. I am interested in ${(profile.tags || []).join(', ')}. Let's match vibes!`;
        }

        if (isTutorialActive && tutorialStep === 0) {
          setTutorialStep(1);
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
          setPlayingAudioId(null);
        };
        utterance.onerror = () => {
          setPlayingAudioId(null);
        };

        const voices = window.speechSynthesis.getVoices();
        const targetLangPrefix = isRussian ? 'ru' : 'en';
        const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(targetLangPrefix));
        
        // Define human gender context of our target avatars
        let isFemale = false;
        if (profile.telegram_id === 22222 || profile.telegram_id === 9991 || profile.telegram_id === 9993 || profile.telegram_id === 9995) {
          isFemale = true;
        } else if (profile.name && ['elena', 'alisa', 'sofia', 'tanya', 'diana', 'alice', 'sofia'].includes(profile.name.toLowerCase())) {
          isFemale = true;
        }

        let selectedVoice = null;
        if (langVoices.length > 0) {
          if (isRussian) {
            if (isFemale) {
              selectedVoice = langVoices.find(v => v.name.includes('Milena') || v.name.includes('Katya') || v.name.includes('Tatyana') || v.name.toLowerCase().includes('female'));
            } else {
              selectedVoice = langVoices.find(v => v.name.includes('Pavel') || v.name.includes('Yuri') || v.name.includes('Aleksandr') || v.name.toLowerCase().includes('male'));
            }
          } else {
            if (isFemale) {
              selectedVoice = langVoices.find(v => v.name.includes('Samantha') || v.name.includes('Zira') || v.name.includes('Susan') || v.name.toLowerCase().includes('female') || v.name.includes('Google US English'));
            } else {
              selectedVoice = langVoices.find(v => v.name.includes('Daniel') || v.name.includes('Alex') || v.name.includes('David') || v.name.toLowerCase().includes('male'));
            }
          }
          if (!selectedVoice) {
            selectedVoice = langVoices.find(v => v.name.toLowerCase().includes('natural') || v.name.toLowerCase().includes('google')) || langVoices[0];
          }
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        utterance.rate = 0.95; // Premium clear, well-articulated, and elegant speed pacing
        utterance.pitch = isFemale ? 1.05 : 0.95; // Warm organic tones adapted to the respective gender character
        window.speechSynthesis.speak(utterance);
      } else {
        alert("Speech synthesis is not supported on this device.");
        setPlayingAudioId(null);
      }
    }
    
    // Add quest progress
    updateQuestProgress('vibe_voice');

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
      setShowEmptyDeckNotice(true);
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

  // Translate vertical trackpad/wheel scroll on header into horizontal scroll for premium desktop experience
  useEffect(() => {
    const el = filterScrollRef.current;
    if (!el) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      } else if (e.deltaX !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaX;
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Handle server-seed selection or offline match filters based on the selected role capsule 
  const getFilteredProfiles = () => {
    if (isTutorialActive) return TUTORIAL_PROFILES;
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
      if (selectedRoleFilter === 'Product Managers') {
        return role.includes('product') || role.includes('pm') || role.includes('manager') || role.includes('lead');
      }
      if (selectedRoleFilter === 'Marketers') {
        return role.includes('market') || role.includes('smm') || role.includes('growth') || role.includes('pr') || role.includes('seo') || role.includes('acquisition');
      }
      if (selectedRoleFilter === 'AI Specialists') {
        return role.includes('ai') || role.includes('ml') || role.includes('prompt') || role.includes('model') || role.includes('neural') || role.includes('gpt') || role.includes('llama');
      }
      if (selectedRoleFilter === 'Investors') {
        return role.includes('invest') || role.includes('vc') || role.includes('angel') || role.includes('capital') || role.includes('fund');
      }
      if (selectedRoleFilter === 'BizDev & Sales') {
        return role.includes('sale') || role.includes('bizdev') || role.includes('representative') || role.includes('partnership') || role.includes('deal') || role.includes('account') || role.includes('business dev');
      }
      if (selectedRoleFilter === 'Operations & QA') {
        return role.includes('ops') || role.includes('operations') || role.includes('qa') || role.includes('testing') || role.includes('tester') || role.includes('support') || role.includes('hr') || role.includes('recruiter');
      }
      if (selectedRoleFilter === 'Students & Interns') {
        return role.includes('student') || role.includes('intern') || role.includes('university') || role.includes('research') || role.includes('learn');
      }
      return false;
    });
  };

  const filteredProfiles = getFilteredProfiles();
  const activeProfile = filteredProfiles[currentIndex];

  // Keyboard arrow keys and spacebar shortcut navigation for premium desktop experience
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid interference when the user is focused on textual input elements
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        executeSwipeWithHaptics('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        executeSwipeWithHaptics('right');
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Space' || e.key === ' ') {
        e.preventDefault();
        setCardMode(prev => prev === 'facts' ? 'radar' : 'facts');
        try { WebApp.HapticFeedback.impactOccurred('light'); } catch (err) {}
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentIndex, activeProfile, filteredProfiles, currentUser]);

  // Support mouse wheel vertical/horizontal gestures to swipe left/right on active profile card
  useEffect(() => {
    const el = cardWrapperRef.current;
    if (!el) return;
    
    let cumulativeDeltaX = 0;
    let cumulativeDeltaY = 0;
    let debounceTimer: any = null;

    const handleCardWheel = (e: WheelEvent) => {
      const now = Date.now();
      if (now - lastSwipeTimeRef.current < 850) {
        // Cooldown filter: prevent scrolling into multiple items immediately
        e.preventDefault();
        return;
      }

      // Horizontal swipe (Trackpad or fancy mouse)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (Math.abs(e.deltaX) > 4) {
          e.preventDefault();
          cumulativeDeltaX += e.deltaX;

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            cumulativeDeltaX = 0;
          }, 200);

          if (cumulativeDeltaX > 100) {
            lastSwipeTimeRef.current = Date.now();
            executeSwipeWithHaptics('right'); // Swipe Right (Like)
            cumulativeDeltaX = 0;
          } else if (cumulativeDeltaX < -100) {
            lastSwipeTimeRef.current = Date.now();
            executeSwipeWithHaptics('left'); // Swipe Left (Pass)
            cumulativeDeltaX = 0;
          }
        }
      } 
      // Vertical swipe adaptor for PC (standard mouse wheel / trackpads scroll)
      else if (Math.abs(e.deltaY) > 5) {
        e.preventDefault();
        cumulativeDeltaY += e.deltaY;

        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          cumulativeDeltaY = 0;
        }, 200);

        if (cumulativeDeltaY > 80) {
          lastSwipeTimeRef.current = Date.now();
          executeSwipeWithHaptics('right'); // Scroll Down -> LIKE ⚡
          cumulativeDeltaY = 0;
        } else if (cumulativeDeltaY < -80) {
          lastSwipeTimeRef.current = Date.now();
          executeSwipeWithHaptics('left'); // Scroll Up -> PASS ❌
          cumulativeDeltaY = 0;
        }
      }
    };
    
    el.addEventListener('wheel', handleCardWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleCardWheel);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [currentIndex, activeProfile, filteredProfiles, currentUser]);

  // Automatically translate active profile if language matches requirements
  useEffect(() => {
    setCardMode('facts');
    setTranslatedProfile(null);
    setIsTranslating(false);

    if (!activeProfile) return;

    let active = true;
    const autoTranslate = async () => {
      setIsTranslating(true);
      try {
        const trans = await translateProfile(
          {
            username: activeProfile.username,
            role: activeProfile.role,
            bio: activeProfile.bio,
            tags: activeProfile.tags,
            ai_facts: activeProfile.ai_facts
          },
          appLanguage
        );
        if (active) {
          setTranslatedProfile({
            id: activeProfile.id || activeProfile.telegram_id?.toString(),
            role: trans.role,
            bio: trans.bio,
            tags: trans.tags,
            ai_facts: trans.ai_facts,
            lang: appLanguage
          });
        }
      } catch (err) {
        console.error("Auto translation failed:", err);
      } finally {
        if (active) {
          setIsTranslating(false);
        }
      }
    };

    autoTranslate();

    return () => {
      active = false;
    };
  }, [currentIndex, activeProfile, appLanguage]);

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
  const executeSwipeWithHaptics = async (direction: 'left' | 'right' | 'up') => {
    if (!activeProfile) return;

    if (isTutorialActive) {
      if (tutorialStep === 0) {
        showToast(appLanguage === 'ru'
          ? "Пожалуйста, сначала прослушайте аудио-визитку!"
          : "Please listen to the voice bio first!");
        animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
        animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
        return;
      }
      if (tutorialStep === 1) {
        if (direction !== 'left') {
          showToast(appLanguage === 'ru'
            ? "Неверно! Попробуйте провести влево или нажать ❌."
            : "Oops! Try swiping left or clicking ❌ to skip.");
          animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
          animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
          return;
        }
        try { WebApp.HapticFeedback.impactOccurred('light'); } catch (e) {}
        setTutorialStep(2);
        setCurrentIndex(1);
        dragX.set(0);
        dragY.set(0);
        showToast(appLanguage === 'ru'
          ? "Отлично! Карта пропущена. Переходим к шагу 3."
          : "Superb! Card skipped. Let's move to step 3.");
        return;
      }
      if (tutorialStep === 2) {
        if (direction !== 'right') {
          showToast(appLanguage === 'ru'
            ? "Неверно! Попробуйте провести вправо или нажать 💬."
            : "Oops! Try swiping right or clicking 💬 to chat.");
          animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
          animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
          return;
        }
        try { WebApp.HapticFeedback.impactOccurred('medium'); } catch (e) {}
        setTutorialStep(3);
        setCurrentIndex(2);
        dragX.set(0);
        dragY.set(0);
        showToast(appLanguage === 'ru'
          ? "Прекрасно! Прямой контакт освоен. Финальный шаг!"
          : "Fantastic! Direct contact mastered. Final step!");
        return;
      }
      if (tutorialStep === 3) {
        if (direction !== 'up') {
          showToast(appLanguage === 'ru'
            ? "Неверно! Попробуйте провести вверх или нажать ❤️."
            : "Oops! Try swiping up or clicking ❤️ to Like.");
          animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
          animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
          return;
        }
        try { WebApp.HapticFeedback.notificationOccurred('success'); } catch (e) {}
        setIsTutorialActive(false);
        localStorage.setItem('matcha_tutorial_interactive_completed_v4', 'true');
        
        setMatchedUser({
          id: "tut_success",
          name: "Matcha Team 🍵",
          role: "Ultimate Matcha Guide",
          photo_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop",
          isTutorialFinished: true
        });
        
        onUpdateCurrentUser({
          ...currentUser,
          priorityPoints: (currentUser.priorityPoints || 0) + 5,
          matcha_sparks: (currentUser.matcha_sparks ?? 15) + 5
        });
        return;
      }
      return;
    }

    // Spend exactly 1 Matcha Spark for executing any real swipe gesture
    const currentSparks = currentUser.matcha_sparks ?? 15;
    if (currentSparks <= 0) {
      showToast(appLanguage === 'ru' 
        ? "Недостаточно Matcha Sparks! Пополните баланс кнопкой [+] вверху или пригласите друга ⚡" 
        : "Out of Matcha Sparks! Recharge with [+] top booster or invite tech friends ⚡");
      try { WebApp.HapticFeedback.notificationOccurred('error'); } catch (e) {}
      animate(dragX, 0, { type: "spring", stiffness: 300, damping: 25 });
      animate(dragY, 0, { type: "spring", stiffness: 300, damping: 25 });
      return;
    }

    const nextSparks = Math.max(0, currentSparks - 1);
    onUpdateCurrentUser({
      ...currentUser,
      matcha_sparks: nextSparks
    });

    // Update quest progress
    updateQuestProgress('swipe_wave');

    // Trigger haptic rumble
    try {
       if (direction === 'up') {
         WebApp.HapticFeedback.notificationOccurred('success');
       } else if (direction === 'right') {
         WebApp.HapticFeedback.impactOccurred('medium');
       } else {
         WebApp.HapticFeedback.impactOccurred('light');
       }
    } catch (e) {
      // Ignored outside TG mini app environment
    }

    try {
      if (direction === 'left') {
        await recordSwipe(currentUser.id, activeProfile.id, 'pass');
      } else if (direction === 'up') {
        const res = await recordSwipe(currentUser.id, activeProfile.id, 'like');
        if (res.match) {
          try {
            WebApp.HapticFeedback.notificationOccurred('success');
          } catch (e) {}

          // Set matched user -> Triggers overlay
          setMatchedUser(activeProfile);
          
          onUpdateCurrentUser({
            ...currentUser,
            matchesToday: currentUser.matchesToday + 1
          });
        } else {
          showToast(appLanguage === 'ru'
            ? `💖 Вы поставили лайк ${activeProfile.name}! Векторы сошлись.`
            : `💖 You liked ${activeProfile.name}! Vibe vectors aligned.`);
        }
      } else if (direction === 'right') {
        // Swipe Right immediately clicks Like/Match AND redirects to write to them!
        await recordSwipe(currentUser.id, activeProfile.id, 'like');
        
        const domain = activeProfile.username || activeProfile.id;
        const tgLink = `https://t.me/${domain}`;
        showToast(appLanguage === 'ru'
          ? `💬 Открываем профиль/чат с @${domain}...`
          : `💬 Connecting with @${domain}...`);
        
        setTimeout(() => {
          try {
            WebApp.openTelegramLink(tgLink);
          } catch(e) {
            window.open(tgLink, '_blank');
          }
        }, 800);
      }
    } catch (err) {
      console.error("Failed recording reaction:", err);
    }

    setCurrentIndex(prev => prev + 1);
    dragX.set(0); // reset position
    dragY.set(0); // reset position
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
    <div className="flex-grow flex flex-col justify-between items-center w-full h-full relative font-sans" id="swipe-view-container">
      
      {/* Beautiful automatic dark screen spotlight overlay when interactive tutorial is active */}
      {isTutorialActive && (
        <div 
          className="fixed inset-0 bg-black/65 z-25 pointer-events-auto backdrop-blur-[1.5px] transition-all duration-300"
          id="tutorial-spotlight-backdrop"
        />
      )}
      
      {/* Absolute Slide-in/Fade-out Toast Notification Overlay (Top Z-50) */}
      <AnimatePresence>
        {toastNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 12, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="absolute top-1 px-4 py-2 bg-[#1A7A55] text-white rounded-xl shadow-xl z-50 text-[11px] font-extrabold flex items-center gap-2 max-w-[90%] pointer-events-none select-none text-center"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300/20 shrink-0" />
            <span>{toastNotification}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Filter Selector */}
      <div className="w-full px-4 pt-2.5 pb-1 flex flex-col gap-1.5 shrink-0 z-30 select-none border-b border-black/[0.03] bg-white text-neutral-800" id="role-filter-section">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-[#1A7A55] uppercase tracking-widest font-mono pl-1">
                {appLanguage === 'ru' ? '// Фильтр ролей' : '// Filter by Role'}
              </span>
              {currentUser.ghost_mode && (
                <span className="text-[8px] font-black text-[#00C896] bg-[#00C896]/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 select-none animate-pulse" title="You are hidden from discoveries">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00C896]" />
                  {appLanguage === 'ru' ? 'РЕЖИМ НЕВИДИМКИ 👻' : 'GHOST ACTIVE 👻'}
                </span>
              )}
            </div>
          </div>
            {!showQuestBanner && activeQuest && (
              <button
                onClick={() => {
                  try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
                  setShowQuestBanner(true);
                  localStorage.removeItem('matcha_show_quest_banner');
                }}
                className="text-[8px] font-black uppercase text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-sm hover:bg-amber-500/20 transition cursor-pointer"
              >
                {appLanguage === 'ru' ? 'Показать квест 💫' : 'Show quest 💫'}
              </button>
            )}
          <button
            onClick={handleTriggerAiSuperMatch}
            disabled={isSuperMatching}
            className="bg-[#00C896] hover:bg-[#00B285] text-white px-3.5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all duration-300 hover:scale-[1.03] active:scale-95 shadow-xs border-none cursor-pointer select-none"
            title="Spend 5 sparks to trigger AI Supermatch pairing"
          >
            {isSuperMatching ? (
              <div className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300/30 animate-[pulse_1.5s_infinite] stroke-[2.5]" />
                <span>AI Super-Match (5⚡)</span>
              </>
            )}
          </button>
        </div>
        <div 
          ref={filterScrollRef}
          onMouseDown={startHeaderDragScroll}
          onMouseLeave={stopHeaderDragScroll}
          onMouseUp={stopHeaderDragScroll}
          onMouseMove={executeHeaderDragScroll}
          className={`flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth select-none ${
            isDragScrollingHeader ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {['All', 'Developers', 'Designers', 'Founders', 'Creators', 'Product Managers', 'Marketers', 'AI Specialists', 'Investors', 'BizDev & Sales', 'Operations & QA', 'Students & Interns'].map((roleOpt) => {
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
                  updateQuestProgress('filter_role');
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

      {/* Daily Cosmic Quest interactive panel */}
      {activeQuest && showQuestBanner && (
        <div className="w-full px-4 pt-1.5 pb-0.5 shrink-0 z-20" id="daily-quest-banner">
          <div className={`rounded-2xl p-3 border transition-all duration-300 relative ${
            activeQuest.rewardClaimed
              ? 'bg-zinc-100/60 border-black/[0.03] text-[#1A1A1A]/40'
              : activeQuest.completed
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 shadow-sm animate-pulse'
              : 'bg-[#00C896]/5 border-[#00C896]/15 text-[#1A7A55]'
          }`}>
            {/* Close Button to avoid card overlapping */}
            <button
              onClick={() => {
                try { WebApp.HapticFeedback.impactOccurred('light'); } catch(e){}
                setShowQuestBanner(false);
                localStorage.setItem('matcha_show_quest_banner', 'false');
              }}
              className="absolute top-2 right-2 w-5 h-5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] text-zinc-400 hover:text-zinc-600 flex items-center justify-center transition cursor-pointer"
              title="Dismiss banner"
            >
              <X className="w-3 h-3" />
            </button>

            <div className="flex items-center justify-between gap-1 pr-5">
              <div className="flex items-center gap-2">
                <span className="text-[14px]">
                  {activeQuest.rewardClaimed ? "✅" : activeQuest.completed ? "🎁" : "💫"}
                </span>
                <div className="text-left font-sans leading-snug">
                  <span className="text-[8px] font-black uppercase tracking-widest font-mono opacity-80 block text-[#1A7A55]">
                    {appLanguage === 'ru' ? '// ЕЖЕДНЕВНЫЙ КВЕСТ' : '// DAILY COSMIC QUEST'}
                  </span>
                  <span className="text-[11.5px] font-black leading-tight block">
                    {activeQuest.title}: {activeQuest.description}
                  </span>
                </div>
              </div>
              
              <div className="shrink-0 flex items-center">
                {activeQuest.rewardClaimed ? (
                  <span className="text-[9px] font-mono font-black tracking-wider uppercase bg-zinc-200 text-[#1A1A1A]/70 px-2 py-1 rounded-lg">
                    Claimed +5⚡
                  </span>
                ) : activeQuest.completed ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={claimQuestReward}
                    className="px-2.5 h-7 rounded-xl bg-amber-500 text-[#1A1A1A] text-[9.5px] font-black uppercase tracking-wider shadow-md hover:bg-amber-600 transition cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <span>CLAIM +5⚡</span>
                  </motion.button>
                ) : (
                  <span className="text-[10px] font-mono font-black bg-white/60 text-[#1A7A55] border border-[#00C896]/10 px-2 py-0.5 rounded-md">
                    {activeQuest.currentCount}/{activeQuest.targetCount}
                  </span>
                )}
              </div>
            </div>
            
            {/* Actionable mini progress tracker */}
            {!activeQuest.rewardClaimed && (
              <div className="w-full h-1 bg-black/[0.05] rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${activeQuest.completed ? 'bg-amber-500' : 'bg-[#00C896]'}`}
                  style={{ width: `${(activeQuest.currentCount / activeQuest.targetCount) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 82% height container with drag Ref bounds constraints wrapper attached */}
      <div 
        ref={cardWrapperRef}
        className="flex-grow w-full max-w-[390px] relative flex items-center justify-center pt-2 select-none overflow-hidden pb-4"
        id="drag-constraints-wrapper"
      >
        <AnimatePresence mode="popLayout">
          {currentUser.matcha_sparks === 0 && !isTutorialActive ? (
            <div className="relative w-full h-[450px] md:h-[465px] lg:h-[510px] max-w-[350px] flex items-center justify-center transition-all duration-300">
              <GlassCard className="absolute w-full h-full rounded-[32px] bg-white border border-black/[0.04] p-6 flex flex-col justify-between items-center text-center shadow-lg z-30">
                <div className="space-y-4 pt-12">
                  <span className="text-4xl block animate-bounce">⚡</span>
                  <div className="space-y-2">
                    <h3 className="text-lg font-black text-[#1A1A1A] uppercase tracking-tight">
                      {appLanguage === 'ru' ? "Энергия Разряжена!" : "Sparks Depleted!"}
                    </h3>
                    <p className="text-[12px] text-zinc-500 font-bold leading-normal px-2">
                      {appLanguage === 'ru' 
                        ? "Каждый свайп требует 1 Sparks. Быстро восполните запас бесплатно или завершите квесты!"
                        : "Each vibe swipe consumes 1 Spark. Fast recharge your reactor core for free below or finish daily quests."}
                    </p>
                  </div>
                </div>

                <div className="w-full space-y-3 pb-8 text-center flex flex-col items-center">
                  <button
                    onClick={() => {
                      onUpdateCurrentUser({
                        ...currentUser,
                        matcha_sparks: 15
                      });
                      try { WebApp.HapticFeedback.notificationOccurred('success'); } catch(e){}
                      showToast(appLanguage === 'ru' 
                        ? "🔋 Реактор запущен! Зачислено +15 Sparks!" 
                        : "🔋 Core charged! Added +15 Matcha Sparks!");
                    }}
                    className="w-full h-[48px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-black text-xs uppercase tracking-widest cursor-pointer transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    🔋 {appLanguage === 'ru' ? "БЫСТРАЯ ЗАРЯДКА +15 Sparks" : "FAST RECHARGE +15 SPARKS"}
                  </button>
                  <p className="text-[9px] text-[#1A7A55]/70 font-mono uppercase tracking-widest">
                    {appLanguage === 'ru' ? "// ЛИМИТЫ ОБНОВЛЯЮТСЯ МГНОВЕННО" : "// CORE FLUX CAPACITY UPDATES LIVE"}
                  </p>
                </div>
              </GlassCard>
            </div>
          ) : currentIndex < filteredProfiles.length ? (
            (() => {
              const activeProfile = filteredProfiles[currentIndex];
              const nextProfile = filteredProfiles[currentIndex + 1];

              return (
                <div className="relative w-full h-[450px] md:h-[465px] lg:h-[510px] max-w-[350px] flex items-center justify-center transition-all duration-300">
                  
                  {/* NEXT PROFILE (Background Card - Static, pointer-events-none, z-10) */}
                  {nextProfile && (
                    <div
                      key={nextProfile.id}
                      className="absolute w-full h-full rounded-[32px] bg-gradient-to-br from-[#E2EFE6] to-[#CBE5D6] border border-black/[0.04] shadow-xs flex flex-col justify-between overflow-hidden scale-95 translate-y-3.5 opacity-60 pointer-events-none z-10 animate-pulse"
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
                          <h2 className="text-[26px] font-extrabold tracking-tight text-[#1A1A1A] leading-tight flex items-center justify-center">
                            <span>{nextProfile.name}</span>
                            <span className="text-[#1A1A1A]/40 font-medium ml-1.5">/{nextProfile.age || 22}</span>
                          </h2>
                          <p className="text-[14px] text-[#1A1A1A]/70 font-bold mt-1">
                            @{nextProfile.username} • <span className="text-[#1A7A55] font-extrabold">{nextProfile.role}</span>
                          </p>
                        </div>

                        <div className="px-3 pb-3 shrink-0">
                          <div className="bg-white/80 rounded-[24px] p-3 flex flex-col h-[190px] md:h-[205px] lg:h-[230px] justify-between shadow-xs border border-transparent" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE PROFILE (Foreground Card - Draggable, z-20) */}
                  {activeProfile && (
                    <motion.div
                      key={activeProfile.id}
                      style={{ x: dragX, y: dragY, rotate: rotateValue, opacity: opacityValue, scale: scaleValue, touchAction: 'none' }}
                      drag={true}
                      dragConstraints={cardWrapperRef}
                      dragElastic={0.18}
                      onDragEnd={(e, info) => {
                        const absX = Math.abs(info.offset.x);
                        const absY = Math.abs(info.offset.y);
                        
                        let swipeDetected = false;
                        if (absY > absX && (info.velocity.y < -120 || info.offset.y < -40)) {
                          executeSwipeWithHaptics('up');
                          swipeDetected = true;
                        } else if (info.velocity.x > 120 || info.offset.x > 40) {
                          executeSwipeWithHaptics('right');
                          swipeDetected = true;
                        } else if (info.velocity.x < -120 || info.offset.x < -40) {
                          executeSwipeWithHaptics('left');
                          swipeDetected = true;
                        }

                        if (!swipeDetected) {
                          animate(dragX, 0, { type: "spring", stiffness: 350, damping: 22 });
                          animate(dragY, 0, { type: "spring", stiffness: 350, damping: 22 });
                        }
                      }}
                      className={`absolute w-full h-full rounded-[32px] bg-gradient-to-br from-[#C8E6D4] to-[#A8D5B8] border border-black/[0.04] shadow-[0_16px_40px_rgba(26,122,85,0.06)] flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing transition-all ${isTutorialActive ? 'z-30 ring-[5px] ring-[#00C896] ring-offset-2 shadow-[0_0_50px_rgba(0,198,150,0.65)] animate-[pulse_1.8s_infinite]' : 'z-20'}`}
                      initial={{ scale: 0.95, y: 10, opacity: 0 }}
                      animate={{ scale: 1, y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }}
                      exit={() => {
                        const currentX = dragX.get();
                        const currentY = dragY.get();
                        if (Math.abs(currentY) > Math.abs(currentX) && currentY < 0) {
                          return {
                            y: -420,
                            opacity: 0,
                            scale: 0.9,
                            transition: { duration: 0.22, ease: "easeOut" }
                          };
                        }
                        return {
                          x: currentX > 0 ? 380 : -380,
                          opacity: 0,
                          rotate: currentX > 0 ? 12 : -12,
                          scale: 0.9,
                          transition: { duration: 0.22, ease: "easeOut" }
                        };
                      }}
                      id={`swipe-card-${activeProfile.id}`}
                    >
                      {/* Interactive Gesture Swipe Overlay Indicator - zero dimming to let the card text shine */}
                      {isTutorialActive && (
                        <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] pointer-events-none z-40 flex flex-col items-center justify-center p-6 text-center select-none rounded-[32px]">
                          {tutorialStep === 1 && (
                            <motion.div 
                              initial={{ x: 40, opacity: 0.3 }}
                              animate={{ x: [-30, -65, -30], opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              className="text-rose-500 flex flex-col items-center gap-3 drop-shadow-[0_4px_12px_rgba(239,68,68,0.7)]"
                            >
                              <span className="text-8xl font-black leading-none font-sans">←</span>
                              <span className="text-[12px] font-extrabold uppercase tracking-widest font-mono bg-rose-600 text-white px-3 py-1 rounded-full shadow-md">
                                {appLanguage === 'ru' ? 'ПРОВЕДИТЕ ВЛЕВО' : 'SWIPE LEFT'}
                              </span>
                            </motion.div>
                          )}
                          {tutorialStep === 2 && (
                            <motion.div 
                              initial={{ x: -40, opacity: 0.3 }}
                              animate={{ x: [30, 65, 30], opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              className="text-amber-500 flex flex-col items-center gap-3 drop-shadow-[0_4px_12px_rgba(245,158,11,0.7)]"
                            >
                              <span className="text-8xl font-black leading-none font-sans">→</span>
                              <span className="text-[12px] font-extrabold uppercase tracking-widest font-mono bg-amber-500 text-white px-3 py-1 rounded-full shadow-md">
                                {appLanguage === 'ru' ? 'ПРОВЕДИТЕ ВПРАВО' : 'SWIPE RIGHT'}
                              </span>
                            </motion.div>
                          )}
                          {tutorialStep === 3 && (
                            <motion.div 
                              initial={{ y: 40, opacity: 0.3 }}
                              animate={{ y: [-30, -65, -30], opacity: [0.6, 1, 0.6] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                              className="text-emerald-400 flex flex-col items-center gap-3 drop-shadow-[0_4px_12px_rgba(16,185,129,0.7)]"
                            >
                              <span className="text-8xl font-black leading-none font-sans">↑</span>
                              <span className="text-[12px] font-extrabold uppercase tracking-widest font-mono bg-[#00C896] text-white px-3 py-1 rounded-full shadow-md">
                                {appLanguage === 'ru' ? 'ПРОВЕДИТЕ ВВЕРХ' : 'SWIPE UP'}
                              </span>
                            </motion.div>
                          )}
                        </div>
                      )}

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
                            {playingAudioId === activeProfile.id ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                                  if ((window as any).currentPlayingAudio) (window as any).currentPlayingAudio.pause();
                                  setPlayingAudioId(null);
                                }}
                                className="h-7 px-2.5 rounded-full bg-[#00C896]/15 hover:bg-[#00C896]/25 text-[#1A7A55] border border-[#00C896]/40 transition flex items-center justify-center gap-1.5 cursor-pointer pointer-events-auto shrink-0 select-none animate-pulse"
                                title="Stop Voice Bio"
                              >
                                <div className="flex items-center gap-[2.5px] h-3">
                                  {[1, 2, 3, 4, 5].map((bar) => (
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
                                      className="w-[1.5px] h-full bg-[#1A7A55] rounded-full origin-center"
                                    />
                                  ))}
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-wider">Stop</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => handlePlayCandidateVoice(activeProfile, e)}
                                className={`w-7 h-7 rounded-full bg-[#1A7A55]/10 hover:bg-[#1A7A55]/20 active:scale-95 transition flex items-center justify-center cursor-pointer pointer-events-auto shrink-0 relative ${isTutorialActive && tutorialStep === 0 ? 'ring-4 ring-[#00C896] animate-pulse scale-110 z-30 bg-emerald-500/20' : ''}`}
                                title="Listen to Voice Bio"
                              >
                                <span className="text-[12px]">🎙️</span>
                                <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
                                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                </span>
                              </button>
                            )}
                          </h2>
                          <p className="text-[14px] text-[#1A1A1A]/70 font-bold mt-1">
                            @{activeProfile.username || 'user'} • <span className="text-[#1A7A55] font-extrabold">{translatedProfile ? translatedProfile.role : activeProfile.role}</span>
                          </p>
                          {/* Streamlined Live Translation Indicator */}
                          {isTranslating && (
                            <div className="flex justify-center mt-1">
                              <span className="text-[9.5px] font-black uppercase tracking-wider text-[#1A7A55]/60 flex items-center gap-1">
                                <span className="w-2.5 h-2.5 rounded-full border-2 border-[#1A7A55]/40 border-t-transparent animate-spin inline-block" />
                                <span>{appLanguage === 'ru' ? 'Переводим...' : 'Translating...'}</span>
                              </span>
                            </div>
                          )}
                        </div>

                        {/* WHITE BOTTOM EXPANSION HOOD */}
                        <div className="px-3 pb-3 shrink-0">
                          <div className="bg-white rounded-[24px] p-3 flex flex-col h-[190px] md:h-[205px] lg:h-[230px] justify-between shadow-[0_2px_12px_rgba(0,0,0,0.01)] border border-black/[0.01]">
                            
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
                                  onClick={(e) => { e.stopPropagation(); setCardMode('radar'); updateQuestProgress('radar'); }}
                                  className={`px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-md transition cursor-pointer ${cardMode === 'radar' ? 'bg-[#1A7A55]' : 'text-[#6B7280]'}`}
                                  style={{ color: cardMode === 'radar' ? '#FFFFFF' : undefined }}
                                >
                                  Radar 🌀
                                </button>
                              </div>
                            </div>

                            {cardMode === 'facts' ? (
                              <div className="flex-grow flex flex-col justify-center">
                                {/* Biography / Description quote */}
                                {(translatedProfile ? translatedProfile.bio : activeProfile.bio) && (
                                  <p className="text-[11px] text-[#1A1A1A]/85 font-black mb-1.5 italic leading-tight text-center max-h-12 overflow-y-auto w-full">
                                    "{translatedProfile ? translatedProfile.bio : activeProfile.bio}"
                                  </p>
                                )}

                                {/* Tags system representing the schema */}
                                <div className="flex flex-wrap gap-1 mb-1.5 justify-center">
                                  {(translatedProfile ? translatedProfile.tags : (activeProfile.tags || [])).slice(0, 4).map((tag: string) => (
                                    <span
                                      key={tag}
                                      className="bg-[#E8F5EE] text-[#1A7A55] font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {/* Render their 3 AI-generated facts if present */}
                                {(translatedProfile ? translatedProfile.ai_facts : activeProfile.ai_facts) && (translatedProfile ? translatedProfile.ai_facts : activeProfile.ai_facts).length > 0 && (
                                  <div className="space-y-0.5 mt-0.5 pb-0.5 text-left border-y border-black/[0.03] py-1">
                                    {(translatedProfile ? translatedProfile.ai_facts : activeProfile.ai_facts).slice(0, 3).map((fact: string, fIdx: number) => (
                                      <div key={fIdx} className="flex items-start gap-1.5 text-[10.5px] font-bold text-[#1A1A1A]/85 leading-tight">
                                        <span className="text-[#00C896] text-[9px] shrink-0 font-mono mt-0.5">⚡</span>
                                        <span className="line-clamp-2 break-words flex-1 pr-1">{fact}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {translatedProfile && (
                                  <span className="text-[8px] text-[#1A7A55]/75 font-mono font-extrabold mt-1 text-center block uppercase tracking-wider scale-[0.95]">
                                    ⚡ Translated with Matcha AI
                                  </span>
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
                <div className="relative w-16 h-16 rounded-full flex items-center justify-center text-[#00C896]">
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
                className="px-6 h-[48px] rounded-[100px] bg-[#00C896] hover:bg-[#00B083] text-white text-xs font-black uppercase tracking-wider active:scale-95 transition-all duration-300 cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:scale-[1.02] select-none border-none"
                id="reset-swipe-deck-btn"
              >
                <span>Reset Wave Deck</span>
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Trainer Guide bubble for the Interactive walkthrough mode */}
      {isTutorialActive && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[92%] mx-auto bg-white border border-[#00C896]/45 p-4 rounded-2xl shadow-[0_8px_24px_rgba(0,200,150,0.12)] flex items-start gap-3.5 mb-3 select-none z-[31] relative"
        >
          <div className="w-10 h-10 rounded-full bg-[#00C896]/15 flex items-center justify-center text-xl shrink-0 border border-[#00C896]/20">
            🍵
          </div>
          <div className="text-left flex-1 leading-snug space-y-1">
            <p className="text-[10px] font-black uppercase text-[#1A7A55] tracking-widest font-mono">
              {appLanguage === 'ru' ? '// ШАГ ОБУЧЕНИЯ:' : '// TRAINING STEP:'} {tutorialStep + 1} / 4
            </p>
            <p className="text-[12.5px] font-black text-[#1A1A1A]">
              {tutorialStep === 0 && (appLanguage === 'ru' 
                ? 'Прослушайте аудио-визитку Артема. Нажмите на мерцающую кнопку 🎙️ на его карточке!'
                : "Listen to Artem's voice bio. Click the pulsing 🎙️ recorder button on his card!")}
              {tutorialStep === 1 && (appLanguage === 'ru' 
                ? 'Отлично! Теперь проведите карту ВЛЕВО (или нажмите ✕) чтобы пропустить её.'
                : 'Excellent! Now swipe the card LEFT (or click ✕) to decline / pass.')}
              {tutorialStep === 2 && (appLanguage === 'ru' 
                ? 'Супер! Теперь проведите карту ВПРАВО (или нажмите 💬) для перехода в чат к Алисе.'
                : 'Superb! Now swipe the card RIGHT (or click 💬) to transition into active chat with Alisa.')}
              {tutorialStep === 3 && (appLanguage === 'ru' 
                ? 'Финальный шаг! Проведите карту ВВЕРХ (или нажмите ❤️) чтобы отправить Ярославу лайк!'
                : 'Final step! Swipe the card UP (or click ❤️) to send Yaroslav a mutual vibe like!')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Action buttons (✕ ♥ 💬) elevated in z-index to stay above backdrop spotlight overlay during tutorial */}
      {currentIndex < filteredProfiles.length && (
        <div className={`flex items-center justify-center gap-5 pb-5 shrink-0 relative transition-all ${isTutorialActive ? 'z-30 pointer-events-auto' : 'z-10'}`} id="swipe-controls-tray">
          {/* Dislike ✕ button: bg #FFFFFF, border 1.5px solid #E0E0E0, icon тёмный #1A1A1A, height/width 56px */}
          <button
            onClick={() => executeSwipeWithHaptics('left')}
            className={`w-[56px] h-[56px] rounded-full bg-white border-[1.5px] border-[#E0E0E0] text-[#1A1A1A] flex items-center justify-center transition active:scale-95 hover:bg-neutral-50 shadow-sm cursor-pointer ${isTutorialActive && tutorialStep === 1 ? 'ring-4 ring-rose-500 ring-offset-2 animate-bounce scale-110 z-30' : ''}`}
            title="Next vibe energy (Pass left)"
            id="swipe-reject-btn"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </button>

          {/* Vibe Like ♥ central button (Like Up): slightly bigger: width/height 72px, bg-[#00C896], white icon */}
          <button
            onClick={() => executeSwipeWithHaptics('up')}
            className={`w-[72px] h-[72px] rounded-full bg-[#00C896] text-white flex items-center justify-center transition active:scale-95 hover:opacity-95 shadow-[0_4px_16px_rgba(0,200,150,0.25)] cursor-pointer ${isTutorialActive && tutorialStep === 3 ? 'ring-4 ring-[#00C896] ring-offset-2 animate-bounce scale-110 z-30' : ''}`}
            title="Like (Swipe up)"
            id="swipe-accept-btn"
          >
            <Heart className="h-7 w-7 fill-white text-white stroke-[2]" />
          </button>

          {/* Send Instant Vibe / Chat 💬 button (Swipe Right): bg #FFFFFF, border 1.5px solid #E0E0E0, icon тёмный #1A1A1A, height/width 56px */}
          <button
            onClick={() => executeSwipeWithHaptics('right')}
            className={`w-[56px] h-[56px] rounded-full bg-white border-[1.5px] border-[#E0E0E0] text-[#1A1A1A] flex items-center justify-center transition active:scale-95 hover:bg-neutral-50 shadow-sm cursor-pointer ${isTutorialActive && tutorialStep === 2 ? 'ring-4 ring-amber-500 ring-offset-2 animate-bounce scale-110 z-30' : ''}`}
            title="Open chat / profile (Swipe right)"
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
            className="fixed inset-0 z-50 bg-[#F5F5F0]/98 backdrop-blur-md flex items-center justify-center p-4 select-none"
            id="match-vibe-overlay"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border-2 border-[#00C896]/20 rounded-[36px] p-7 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden"
            >
              <div className="pt-2">
                <span className="text-[10px] font-black text-[#1A7A55] tracking-widest bg-[#00C896]/10 px-4 py-2 rounded-full uppercase block mx-auto w-fit font-mono animate-bounce">
                  {matchedUser.isTutorialFinished 
                    ? (appLanguage === 'ru' ? 'ОБУЧЕНИЕ ЗАВЕРШЕНО! 🏆' : 'TRAINING COMPLETE! 🏆')
                    : (appLanguage === 'ru' ? 'ЕСТЬ КОНТАКТ! ⚡' : 'IT\'S A VIBE ⚡')}
                </span>
                
                <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mt-5 leading-none">
                  {matchedUser.isTutorialFinished
                    ? (appLanguage === 'ru' ? 'Вы великолепны!' : 'You are amazing!')
                    : (appLanguage === 'ru' ? 'Вайб совпал!' : 'Mutual Vibe Detected!')}
                </h2>
                
                <p className="text-[12.5px] text-[#1A7A55]/90 font-bold mt-2 leading-relaxed font-sans">
                  {matchedUser.isTutorialFinished
                    ? (appLanguage === 'ru'
                       ? "Вы успешно освоили жесты свайпов и управление! За прохождение зачислено +5 Энергии и +5 Буста."
                       : "You have successfully mastered swipe gestures and audio playback guides! Added +5 Sparks and +5 priorityPoints to your profile.")
                    : (appLanguage === 'ru' 
                       ? `Вы и @${matchedUser.username || matchedUser.id} лайкнули друг друга! Напишите напрямую.` 
                       : `You and @${matchedUser.username || matchedUser.id} swiped each other! Talk directly on Telegram.`)}
                </p>
              </div>

              {/* Connected heads with a pulsing heart vector overlay */}
              <div className="flex items-center justify-center -space-x-5 py-3 relative">
                <div className="absolute w-12 h-12 rounded-full bg-red-500/20 blur-xl animate-ping" />
                <div className="relative w-18 h-18 rounded-full bg-[#1A1A1A] text-[#00C896] flex items-center justify-center text-xl font-black border-4 border-white shadow-md overflow-hidden">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-sans text-lg">{currentUser.name.charAt(0)}</span>
                  )}
                </div>
                <div className="relative w-18 h-18 rounded-full bg-[#00C896] text-[#1A1A1A] flex items-center justify-center text-xl font-black border-4 border-white shadow-md overflow-hidden z-10">
                  {matchedUser.photo_url ? (
                    <img src={matchedUser.photo_url} alt={matchedUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-sans text-lg">{matchedUser.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              {/* Action buttons inside overlay */}
              <div className="flex flex-col gap-2 w-full pt-1">
                {matchedUser.isTutorialFinished ? (
                  <button
                    onClick={() => setMatchedUser(null)}
                    className="w-full h-[48px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-[0.98]"
                  >
                    <span>{appLanguage === 'ru' ? 'ВОЙТИ В ДЕК АНКЕТ 🍵' : 'ENTER MAIN DECK 🍵'}</span>
                  </button>
                ) : (
                  <>
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
                      className="w-full h-[48px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-[0.98]"
                      id="send-telegram-write-btn"
                    >
                      <MessageSquare className="h-4.5 w-4.5 stroke-[2.5]" />
                      <span>{appLanguage === 'ru' ? 'Написать в Telegram 💬' : 'Send Telegram Write 💬'}</span>
                    </button>

                    <button
                      onClick={() => setMatchedUser(null)}
                      className="w-full h-[42px] rounded-xl border border-black/[0.08] text-neutral-600 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition active:scale-[0.98]"
                      id="keep-swiping-btn"
                    >
                      <span>{appLanguage === 'ru' ? 'Искать дальше ⚡' : 'Keep Swiping ⚡'}</span>
                    </button>
                  </>
                )}
              </div>

              <p className="text-[9.5px] text-[#6B7280] font-mono leading-tight">
                @{currentUser.username || 'user'} & @{matchedUser.username || 'user'} • Matcha Social
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI CELESTIAL COSMIC SUPER-MATCH OVERLAY - BRAND REDESIGNED */}
      <AnimatePresence>
        {superMatchedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#104030]/98 backdrop-blur-md flex items-center justify-center p-4 select-none"
            id="supermatch-vibe-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white border-2 border-[#D19200]/20 rounded-[36px] p-7 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden text-neutral-800"
            >
              {/* Pulsing subtle ambient halo */}
              <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-[#00C896]/10 to-transparent pointer-events-none" />

              <div>
                <span className="text-[9.5px] font-black text-[#D19200] tracking-[0.2em] bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full uppercase block mx-auto w-fit font-mono animate-pulse">
                  ⚡ AI Cosmic Match ⚡
                </span>
                
                <h2 className="text-2xl font-black tracking-tight text-[#1A1A1A] mt-5 leading-none font-display">
                  {appLanguage === 'ru' ? 'Полное Слияние Вайбов!' : 'Ultimate Vibe Fusion!'}
                </h2>
                
                <p className="text-[12.5px] text-[#1A7A55] font-bold mt-2 leading-relaxed px-1">
                  {appLanguage === 'ru' 
                    ? `Наш нейросетевой фильтр рассчитал пиковую когнитивную совместимость ваших интересов с @${superMatchedProfile.username || 'user'}:`
                    : `Our neural engine calculated peak compatibility based on overlapping tags and profile data between you and @${superMatchedProfile.username || 'user'}:`}
                </p>
              </div>

              {/* Overlapping premium head visualizer */}
              <div className="flex items-center justify-center -space-x-4 py-2 relative">
                <div className="absolute w-20 h-20 rounded-full bg-[#00C896]/15 animate-ping opacity-60 pointer-events-none" />
                
                <div className="relative w-16 h-16 rounded-full bg-[#1A1A1A] text-[#00C896] flex items-center justify-center text-lg font-black border-4 border-white shadow-md overflow-hidden shrink-0">
                  {currentUser.photo_url ? (
                    <img src={currentUser.photo_url} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-sans text-[#00C896]">{currentUser.name.charAt(0)}</span>
                  )}
                </div>
                
                <div className="relative w-16 h-16 rounded-full bg-[#00C896] text-[#1A1A1A] flex items-center justify-center text-lg font-black border-4 border-white shadow-md overflow-hidden shrink-0 z-10">
                  {superMatchedProfile.photo_url ? (
                    <img src={superMatchedProfile.photo_url} alt={superMatchedProfile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-sans text-neutral-800">{superMatchedProfile.name.charAt(0)}</span>
                  )}
                </div>
              </div>

              {/* AI compatibility metrics in warm Matcha sand color base */}
              <div className="bg-[#F5F5F0] border border-black/[0.04] rounded-2xl p-4 text-left font-sans space-y-1">
                <span className="text-[8px] font-bold text-[#1A7A55] font-mono uppercase tracking-widest block">
                  {appLanguage === 'ru' ? '// МЕТРИКА КОГНИТИВНОГО СХОДСТВА' : '// COGNITIVE COMPATIBILITY METRIC'}
                </span>
                <p className="text-[12px] leading-relaxed text-[#1A1A1A]/95 italic tracking-tight font-extrabold">
                  "{superMatchVibeReason || (appLanguage === 'ru' ? 'Превосходная сочетаемость интересов и стиля кода.' : 'Outstanding alignment on core lifestyle vectors.')}"
                </p>
              </div>

              {/* Action buttons inside supermatch dialog */}
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
                  className="w-full h-[48px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md cursor-pointer transition active:scale-[0.98]"
                  id="supermatch-send-tg-btn"
                >
                  <MessageSquare className="h-4.5 w-4.5 stroke-[2.5]" />
                  <span>{appLanguage === 'ru' ? 'Написать в Telegram 💬' : 'Send Telegram Write 💬'}</span>
                </button>

                <button
                  onClick={() => setSuperMatchedProfile(null)}
                  className="w-full h-[40px] rounded-xl bg-transparent border border-black/[0.08] text-neutral-500 hover:bg-neutral-50 font-bold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition duration-150"
                  id="supermatch-close-btn"
                >
                  <span>{appLanguage === 'ru' ? 'Закрыть окно' : 'Close Overlay'}</span>
                </button>
              </div>

              <p className="text-[9px] text-zinc-400 font-mono leading-none">
                {currentUser.name} & {superMatchedProfile.name} • Deep AI Matcher
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPREHENSIVE WALKTHROUGH TUTORIAL GUIDE MODAL */}
      <AnimatePresence>
        {showTutorialModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#F5F5F0] border border-[#00C896]/20 rounded-[32px] p-6 max-w-sm w-full space-y-4 shadow-2xl relative overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setShowTutorialModal(false)}
                className="absolute right-4 top-4 hover:bg-black/[0.05] p-1.5 rounded-full text-neutral-500 hover:text-black transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-[9px] font-black text-[#1A7A55] tracking-widest bg-[#00C896]/10 px-3 py-1.5 rounded-full uppercase block mx-auto w-fit font-mono">
                  {appLanguage === 'ru' ? 'РУКОВОДСТВО ПОЛЬЗОВАТЕЛЯ 📖' : 'MATCHA WALKTHROUGH 📖'}
                </span>
                <h2 className="text-2xl font-black text-[#1A1A1A] font-display mt-3 leading-tight">
                  {appLanguage === 'ru' ? 'Как пользоваться?' : 'How to use Matcha?'}
                </h2>
                <p className="text-[11.5px] text-neutral-500 font-medium leading-normal mt-1">
                  {appLanguage === 'ru' 
                    ? 'Простые свайпы и действия для поиска идеального окружения:' 
                    : 'Simple gestures and actions to find your ultimate vibe crowd:'}
                </p>
              </div>

              <div className="space-y-3.5 pt-2 text-left">
                {/* Swipe Left gesture */}
                <div className="flex gap-3.5 items-start bg-white p-3.5 rounded-2xl border border-black/[0.02]">
                  <div className="w-9 h-9 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-full flex items-center justify-center text-sm font-black shrink-0 border border-neutral-200">
                    ❌
                  </div>
                  <div className="space-y-0.5 leading-tight">
                    <p className="text-[12.5px] font-extrabold text-[#1A1A1A]">
                      {appLanguage === 'ru' ? '👈 Свайп Влево / Кнопка [ ❌ ]' : '👈 Swipe Left / Button [ ❌ ]'}
                    </p>
                    <p className="text-[11px] text-zinc-500 font-bold leading-tight">
                      {appLanguage === 'ru' 
                        ? 'Пропустить анкету и перейти дальше. Никакого негатива!' 
                        : 'Pass or skip profile. Move safely to the next mind node.'}
                    </p>
                  </div>
                </div>

                {/* Swipe Up gesture */}
                <div className="flex gap-3.5 items-start bg-[#E8F5EE]/40 p-3.5 rounded-2xl border border-[#00C896]/10">
                  <div className="w-9 h-9 bg-[#00C896] text-white rounded-full flex items-center justify-center text-sm font-black shrink-0">
                    ❤️
                  </div>
                  <div className="space-y-0.5 leading-tight">
                    <p className="text-[12.5px] font-extrabold text-[#1A7A55]">
                      {appLanguage === 'ru' ? '👆 Свайп Вверх / Кнопка [ ❤️ ]' : '👆 Swipe Up / Button [ ❤️ ]'}
                    </p>
                    <p className="text-[11px] text-[#1A7A55]/90 font-bold leading-tight">
                      {appLanguage === 'ru' 
                        ? 'Поставить когнитивный лайк. Если симпатия взаимна, откроется экран "Вайб совпал!"'
                        : 'Vibe Like. A mutual swipe-up triggers the instant "Vibe Match!" overlay.'}
                    </p>
                  </div>
                </div>

                {/* Swipe Right gesture */}
                <div className="flex gap-3.5 items-start bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/10">
                  <div className="w-9 h-9 bg-[#F5F5F0] hover:bg-black/[0.01] border border-black/[0.1] text-zinc-700 rounded-full flex items-center justify-center text-sm font-black shrink-0">
                    💬
                  </div>
                  <div className="space-y-0.5 leading-tight">
                    <p className="text-[12.5px] font-extrabold text-amber-600">
                      {appLanguage === 'ru' ? '👉 Свайп Вправо / Кнопка [ 💬 ]' : '👉 Swipe Right / Button [ 💬 ]'}
                    </p>
                    <p className="text-[11px] text-amber-700/80 font-bold leading-tight">
                      {appLanguage === 'ru' 
                        ? 'Мгновенный контакт! Автоматически ставит лайк и сразу открывает диалог прямо в Telegram.'
                        : 'Instant Direct Chat! Automatically likes them and redirects you to write to them on Telegram.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsTutorialActive(true);
                    setTutorialStep(0);
                    setCurrentIndex(0);
                    setShowTutorialModal(false);
                    showToast(appLanguage === 'ru' 
                      ? "Тренажер запущен! Прослушайте приветствие Артема 🎙" 
                      : "Training bot connected! Click the 🎙 near Artem to listen first!");
                  }}
                  className="w-full h-[48px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition select-none"
                >
                  {appLanguage === 'ru' ? 'НАЧАТЬ ТРЕНИРОВКУ 🚀' : 'START INTERACTIVE WORKOUT 🚀'}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTutorialModal(false)}
                  className="w-full h-[40px] rounded-xl border border-black/[0.1] text-neutral-600 hover:bg-black/[0.02] font-semibold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition select-none"
                >
                  {appLanguage === 'ru' ? 'Пропустить ⚡' : 'Skip Workout ⚡'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Empty Deck / No Active Candidates Informative Modal overlay */}
      <AnimatePresence>
        {showEmptyDeckNotice && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-[#E8F5EE] rounded-[28px] p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
            >
              <button 
                onClick={() => setShowEmptyDeckNotice(false)}
                className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 transition cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="relative">
                <div className="relative w-12 h-12 rounded-full flex items-center justify-center text-[#00C896] mx-auto">
                  <Sparkles className="h-6 w-6 stroke-[2]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="font-extrabold text-[#1A1A1A] text-[17px] leading-tight tracking-tight font-display">
                  {appLanguage === 'ru' ? 'Все анкеты просмотрены! ⚡' : 'All Vibe Waves Reviewed! ⚡'}
                </h3>
                <p className="text-[12px] text-neutral-500 font-bold leading-relaxed px-1">
                  {appLanguage === 'ru' 
                    ? 'Вы просмотрели всю актуальную колоду. Нажмите на кнопку "Сбросить и начать заново" ниже, чтобы перезагрузить анкеты и запустить AI Matcher по новой!' 
                    : 'You have swiped through all available cards. Click the button below to reload and activate the AI Supermatch filters!'}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowEmptyDeckNotice(false);
                  handleResetDeck();
                }}
                className="w-full h-[46px] rounded-xl bg-[#00C896] hover:bg-[#00B285] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center cursor-pointer transition duration-200 border-none shadow-sm"
              >
                {appLanguage === 'ru' ? 'Сбросить и начать заново 🌊' : 'Reset Deck & Replay 🌊'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
