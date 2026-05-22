import { supabase } from './supabase';

export interface SupabaseUser {
  id: string;
  telegram_id: number;
  username: string;
  name: string;
  role: string;
  tags: string[];
  ai_facts?: string[];
  ref_code?: string;
  referred_by?: string;
  created_at?: string;
  age?: number;
  bio?: string;
  photo_url?: string;
  matcha_sparks?: number;
  voice_bio?: string;
}

// LocalStorage Fallback database helpers
const getLocalUsers = (): SupabaseUser[] => {
  const data = localStorage.getItem('matcha_local_users');
  if (!data) {
    const list = SEED_PROFILES.map((p) => ({
      id: `seeded_${p.telegram_id}`,
      ...p,
      matcha_sparks: 15,
      voice_bio: undefined
    }));
    localStorage.setItem('matcha_local_users', JSON.stringify(list));
    return list;
  }
  return JSON.parse(data);
};

const saveLocalUsers = (users: any[]) => {
  localStorage.setItem('matcha_local_users', JSON.stringify(users));
};

const getLocalSwipes = (): { swiper_id: string; swiped_id: string; direction: string }[] => {
  const data = localStorage.getItem('matcha_local_swipes');
  return data ? JSON.parse(data) : [];
};

const saveLocalSwipes = (swipes: any[]) => {
  localStorage.setItem('matcha_local_swipes', JSON.stringify(swipes));
};

// Telegram Bot real push notifications helper 
export const triggerTelegramBotNotification = async (chatId: string | number, text: string) => {
  const token = (import.meta as any).env.VITE_TELEGRAM_BOT_TOKEN || 'your_fallback_token_here';
  if (!token || token.includes('your_fallback')) {
    console.warn("TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_BOT_TOKEN not configured in settings. Simulating Telegram push notification alert locally.");
    return false;
  }
  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: Number(chatId),
        text: text,
        parse_mode: 'HTML'
      })
    });
    return response.ok;
  } catch (err) {
    console.error("Failed to trigger live telegram bot push:", err);
    return false;
  }
};

// 1. Get current user by telegram_id
export const getCurrentUser = async (telegramId: number): Promise<SupabaseUser | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching current user from Supabase:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.warn("Supabase load failed. Falling back to high-fidelity LocalStorage schema database...", err);
    const localUsers = getLocalUsers();
    const found = localUsers.find(u => Number(u.telegram_id) === Number(telegramId));
    if (found) return found;
    return null;
  }
};

// 2. Onboard or update user profile
export const onboardUser = async (userData: {
  telegram_id: number;
  username: string;
  name: string;
  age: number;
  role: string;
  tags: string[];
  ai_facts: string[];
  bio?: string;
  photo_url?: string;
  matcha_sparks?: number;
  voice_bio?: string;
}): Promise<SupabaseUser | null> => {
  const refCode = `REF_${userData.telegram_id}`;
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ ...userData, ref_code: refCode }, { onConflict: 'telegram_id' })
      .select()
      .single();

    if (error) {
      console.error("Error onboarding user in Supabase:", error);
      throw error;
    }
    return data;
  } catch (err) {
    console.warn("Supabase save failed. Storing in LocalStorage fallback DB...", err);
    const localUsers = getLocalUsers();
    const existingIdx = localUsers.findIndex(u => Number(u.telegram_id) === Number(userData.telegram_id));
    
    const localUser: SupabaseUser = {
      id: existingIdx >= 0 ? localUsers[existingIdx].id : `user_${userData.telegram_id}`,
      telegram_id: userData.telegram_id,
      username: userData.username,
      name: userData.name,
      age: userData.age,
      role: userData.role,
      tags: userData.tags,
      ai_facts: userData.ai_facts,
      bio: userData.bio || "",
      photo_url: userData.photo_url || "",
      ref_code: refCode,
      matcha_sparks: userData.matcha_sparks ?? (existingIdx >= 0 ? (localUsers[existingIdx].matcha_sparks ?? 15) : 15),
      voice_bio: userData.voice_bio ?? (existingIdx >= 0 ? localUsers[existingIdx].voice_bio : undefined),
    };

    if (existingIdx >= 0) {
      localUsers[existingIdx] = localUser;
    } else {
      localUsers.push(localUser);
    }
    saveLocalUsers(localUsers);
    return localUser;
  }
};

// Seed mock profiles if the database does not have enough users
const SEED_PROFILES = [
  {
    telegram_id: 9991,
    username: "elena_tma",
    name: "Elena",
    age: 21,
    role: "Visual Creator",
    tags: ["Photography", "Weird Humor", "Coffee", "Techno & Clubbing"],
    ai_facts: [
      "has a folder of 4,000 cat memes",
      "convinced that lavender tea cures low battery",
      "physically cannot sleep without a podcast on"
    ],
    bio: "Exploring aesthetics, underground music, and drinking too much matchalatte.",
    photo_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=300&auto=format&fit=crop"
  },
  {
    telegram_id: 9992,
    username: "maksim_sound",
    name: "Maksim",
    age: 24,
    role: "Street DJ",
    tags: ["Late Night Walks", "Street Food", "Gaming", "Weird Humor"],
    ai_facts: [
      "believes shawarma is a sacred food group",
      "buys expensive vinyl records instead of groceries",
      "never replies to texts in under 12 hours"
    ],
    bio: "Chasing sunsets, beatdrops, and the perfect late night vibe. Tap for DJ mixes.",
    photo_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=300&auto=format&fit=crop"
  },
  {
    telegram_id: 9993,
    username: "sofia_vibe",
    name: "Sofia",
    age: 22,
    role: "Digital Nomad",
    tags: ["House Music", "Deep Talks", "Spontaneous Trips", "Yoga & Zen"],
    ai_facts: [
      "books flights randomly when feeling slightly bored",
      "knows exactly 4 card tricks but does them constantly",
      "thinks email signatures are incredibly passive-aggressive"
    ],
    bio: "Living out of a backpack and looking for creative spirits to explore with.",
    photo_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop"
  },
  {
    telegram_id: 9994,
    username: "kirill_hype",
    name: "Kirill",
    age: 25,
    role: "Meme Curator",
    tags: ["Crypto", "Shitposting", "Late Night Walks", "Tech & Gadgets"],
    ai_facts: [
      "terminally online and speaks mostly in sarcasm",
      "lost 80% on dogcoins and bought back in anyway",
      "has custom stickers for every friend group situation"
    ],
    bio: "Shitposting because therapy is too expensive. Hit me up for bad advice.",
    photo_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=300&auto=format&fit=crop"
  },
  {
    telegram_id: 9995,
    username: "tanya_chill",
    name: "Tanya",
    age: 23,
    role: "Specialist",
    tags: ["Aesthetics & Art", "Weird Humor", "Deep Talks", "Movie Marathons"],
    ai_facts: [
      "has watched Interstellar over fifteen times",
      "creates oddly specific Spotify playlists for dog walking",
      "is deeply afraid of voice messages longer than 30s"
    ],
    bio: "Let's grab a matcha and discuss if aliens actually like our pop music.",
    photo_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=300&auto=format&fit=crop"
  }
];

const checkAndSeedProfiles = async (currentUserId: string) => {
  try {
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not('id', 'eq', currentUserId);
    
    if (!error && (count === null || count === 0)) {
      console.log("No other candidates found in Supabase. Auto-seeding 5 mock candidates...");
      for (const profile of SEED_PROFILES) {
        await supabase.from('users').upsert(
          { 
            ...profile,
            ref_code: `REF_${profile.telegram_id}`
          }, 
          { onConflict: 'telegram_id' }
        );
      }
    }
  } catch (err) {
    console.error("Failed to check or seed profiles:", err);
  }
};

// 3. Get profile cards matching current tags and not swiped yet
export const getProfiles = async (
  currentUserId: string, 
  currentTags: string[]
): Promise<SupabaseUser[]> => {
  try {
    // Attempt auto-seed if needed
    try {
      await checkAndSeedProfiles(currentUserId);
    } catch(e) {}

    // Get swiped user IDs
    const { data: swiped, error: swipeError } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', currentUserId);

    if (swipeError) {
      throw swipeError;
    }

    const swipedIds = swiped?.map(s => s.swiped_id) || [];
    swipedIds.push(currentUserId);

    let query = supabase
      .from('users')
      .select('*');

    // Filter out users in swipedIds
    if (swipedIds.length > 0) {
      // Create comma separated string for "in" filter e.g. "(uuid1,uuid2)"
      const formattedIds = swipedIds.map(id => `${id}`).join(',');
      query = query.not('id', 'in', `(${formattedIds})`);
    }

    const { data: users, error: usersError } = await query;
    if (usersError || !users) {
      throw usersError || new Error("No users found");
    }

    // Client-side scoring for exact intersection and sorting (as requested by the algorithm)
    const scored = users.map(user => {
      const intersection = (user.tags || []).filter((t: string) => currentTags.includes(t));
      return {
        user,
        score: intersection.length,
        created_at: user.created_at ? new Date(user.created_at).getTime() : 0
      };
    });

    // Sort by tag intersection count DESC, then created_at DESC
    scored.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.created_at - a.created_at;
    });

    return scored.map(item => item.user);
  } catch (err) {
    console.warn("getProfiles Supabase error caught. Loading LocalStorage candidate deck fallback...", err);
    const localUsers = getLocalUsers();
    const localSwipes = getLocalSwipes();

    const swipedTargetIds = localSwipes
      .filter(s => s.swiper_id === currentUserId)
      .map(s => s.swiped_id);

    // Filter out self and swiped candidates
    const matchables = localUsers.filter(u => u.id !== currentUserId && !swipedTargetIds.includes(u.id));

    // Score based on tag overlaps
    const scored = matchables.map(user => {
      const userTagsNorm = (user.tags || []).map(t => t.toLowerCase().trim());
      const currentTagsNorm = currentTags.map(t => t.toLowerCase().trim());
      const intersection = userTagsNorm.filter(t => currentTagsNorm.includes(t));
      return {
        user,
        score: intersection.length
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(item => item.user);
  }
};

// 4. Record a swipe (like or pass)
export const recordSwipe = async (
  swiperId: string,
  swipedId: string, 
  direction: 'like' | 'pass'
): Promise<{ match: boolean }> => {
  try {
    const { error } = await supabase.from('swipes').insert({
      swiper_id: swiperId,
      swiped_id: swipedId,
      direction
    });

    if (error) {
      throw error;
    }

    if (direction === 'like') {
      // Check if candidate swiped right on swiper as well
      const { data: mutual, error: checkError } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', swipedId)
        .eq('swiped_id', swiperId)
        .eq('direction', 'like')
        .maybeSingle();

      if (checkError) throw checkError;

      if (mutual) {
        // Create match entry
        await supabase.from('matches').insert({
          user_a: swiperId,
          user_b: swipedId
        });

        // Trigger Telegram live notifications
        try {
          const { data: userA } = await supabase.from('users').select('telegram_id, name').eq('id', swiperId).maybeSingle();
          const { data: userB } = await supabase.from('users').select('telegram_id, name').eq('id', swipedId).maybeSingle();
          if (userA && userB) {
            const msgA = `🔔 <b>Matcha Vibe Alert!</b>\n\nВы только что совпали по вайб-радару с пользователем <b>${userB.name}</b>! Скорее заходи поболтать.`;
            const msgB = `🔔 <b>Matcha Vibe Alert!</b>\n\nВы только что совпали по вайб-радару с пользователем <b>${userA.name}</b>! Скорее заходи поболтать.`;
            await triggerTelegramBotNotification(userA.telegram_id, msgA);
            await triggerTelegramBotNotification(userB.telegram_id, msgB);
          }
        } catch (botErr) {
          console.error("Live notification alerts trigger erred:", botErr);
        }

        return { match: true };
      }
    }

    return { match: false };
  } catch (err) {
    console.warn("recordSwipe Supabase write failed. Running LocalStorage fallback transaction...", err);
    const localSwipes = getLocalSwipes();
    localSwipes.push({ swiper_id: swiperId, swiped_id: swipedId, direction });
    saveLocalSwipes(localSwipes);

    if (direction === 'like') {
      const mutual = localSwipes.find(s => s.swiper_id === swipedId && s.swiped_id === swiperId && s.direction === 'like');
      if (mutual) {
        // Trigger live simulated notifications locally if telegram_id is available
        const localUsers = getLocalUsers();
        const userA = localUsers.find(u => u.id === swiperId);
        const userB = localUsers.find(u => u.id === swipedId);
        if (userA && userB) {
          const msgA = `🔔 <b>Matcha Vibe Alert!</b>\n\nВы совпали по вайб-радару с <b>${userB.name}</b>! Пообщайтесь в Telegram прямо сейчас.`;
          const msgB = `🔔 <b>Matcha Vibe Alert!</b>\n\nВы совпали по вайб-радару с <b>${userA.name}</b>! Пообщайтесь в Telegram прямо сейчас.`;
          await triggerTelegramBotNotification(userA.telegram_id, msgA);
          await triggerTelegramBotNotification(userB.telegram_id, msgB);
        }
        return { match: true };
      }
    }

    return { match: false };
  }
};

// 5. Generate AI facts for user onboarding
export const generateAiFacts = async (
  role: string, 
  tags: string[]
): Promise<string[]> => {
  const fallback = [
    "regularly stays up until 3AM exploring things",
    "can drink matcha or coffee at any time of day",
    "prefers texting with memes over actual language"
  ];

  const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GROQ_API_KEY is not defined. Using offline fallback facts.");
    return fallback;
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{
            role: 'user',
            content: `User is a ${role}, interested in: ${tags.join(', ')}.
Generate exactly 3 short punchy relatable lifestyle facts in friendly internet culture tone (do not focus too much on developers, keep it universally fun for youth/founders).
Each fact max 8 words. Return ONLY a JSON array of 3 strings.
Example: ["can drink matcha at 2AM", "usually walks around listening to synthwave", "has custom stickers for every friend group"]`
          }],
          temperature: 0.9,
          response_format: { type: "json_object" }
        })
      }
    );

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      const resultObj = JSON.parse(text);
      if (Array.isArray(resultObj)) {
        return resultObj.slice(0, 3);
      } else if (resultObj && typeof resultObj === 'object') {
        const firstKeyVal = Object.values(resultObj)[0];
        if (Array.isArray(firstKeyVal)) {
          return firstKeyVal.slice(0, 3);
        }
      }
    }
    return fallback;
  } catch (err) {
    console.error("Failed to generate AI facts via Groq:", err);
    return fallback;
  }
};

// 5b. Generate AI facts from user chat input
export const generateFactsFromChat = async (
  userDescription: string
): Promise<string[]> => {
  const fallback = [
    "prefers casual talks over long voice messages",
    "knows exactly when a meme format dies",
    "always ready for spontaneous matchas"
  ];

  const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GROQ_API_KEY is not defined.");
    return fallback;
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{
            role: 'user',
            content: `The user describes themselves conversational: "${userDescription}".
Generate exactly 3 short, punchy facts in a fun, internet culture, modern tone based on this description. 
Each fact max 8 words. Return ONLY a JSON array of 3 strings.
Example: ["thinks tea is warm leaf juice", "has watched Interstellar over fifteen times", "always says 'good vibes' ironicaly"]`
          }],
          temperature: 0.85,
          response_format: { type: "json_object" }
        })
      }
    );

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      const resultObj = JSON.parse(text);
      if (Array.isArray(resultObj)) {
        return resultObj.slice(0, 3);
      } else if (resultObj && typeof resultObj === 'object') {
        const firstKeyVal = Object.values(resultObj)[0];
        if (Array.isArray(firstKeyVal)) {
          return firstKeyVal.slice(0, 3);
        }
      }
    }
    return fallback;
  } catch (err) {
    console.error("Failed to generate facts via conversational chat:", err);
    return fallback;
  }
};

export interface ExtractedOnboardingData {
  name: string;
  age: number;
  role: string;
  tags: string[];
  ai_facts: string[];
}

// 5c. Extractor for conversational onboarding
export const parseOnboardingFromChat = async (
  userDescription: string
): Promise<ExtractedOnboardingData | null> => {
  const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GROQ_API_KEY is not defined.");
    return null;
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are an expert profile extractor. You extract student/freelancer status, hobbies, age, name, and compile 3 lifestyle facts.`
            },
            {
              role: 'user',
              content: `The user wrote a casual description about themselves: "${userDescription}".
Extract their name (default to "Jason" if not clear), age (default to 22 if not clear, must be a number), a single short role or status (e.g. Student, Working, Indie Hacker, Creator, default to "Explorer" if not clear, max 3 words), exactly 4 relevant tags based on their text (short single words, lowercase, e.g. ["matcha", "coding", "techno", "gaming"]), and exactly 3 punchy lifestyle facts in friendly youth internet culture tone.
Return strictly a JSON object with keys: "name", "age", "role", "tags", "ai_facts". Do not include other keys or markdown format.`
            }
          ],
          temperature: 0.75,
          response_format: { type: "json_object" }
        })
      }
    );

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      return {
        name: parsed.name || "Jason",
        age: parseInt(parsed.age) || 22,
        role: parsed.role || "Explorer",
        tags: Array.isArray(parsed.tags) ? parsed.tags : ["Matcha", "Tech", "Exploring"],
        ai_facts: Array.isArray(parsed.ai_facts) ? parsed.ai_facts.slice(0, 3) : [
          "likes custom matchas late",
          "thinks late talks are therapeutic",
          "always ready to build side projects"
        ]
      };
    }
    return null;
  } catch (err) {
    console.error("Error in parseOnboardingFromChat:", err);
    return null;
  }
};

// 6. Generate single sentence connection vibe reason
export const getVibeReason = async (
  myTags: string[], 
  theirTags: string[]
): Promise<string> => {
  const offlinePhrases = [
    "both probably debugged code during a dinner date",
    "mutual coffee obsession and unhealthy terminal usage",
    "same 3AM founder brain damage detected",
    "will argue endlessly about Tailwind versus semantic CSS",
    "both live or die by their espresso shot countdown",
  ];

  const apiKey = (import.meta as any).env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return offlinePhrases[Math.floor(Math.random() * offlinePhrases.length)];
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST', 
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{
            role: 'user',
            content: `Tags A: ${myTags.join(', ')}. Tags B: ${theirTags.join(', ')}.
ONE casual funny sentence why they vibe. Max 12 words. 
No hashtags. Internet humor. Return plain text only.`
          }],
          temperature: 1.0
        })
      }
    );
    const data = await response.json();
    return data?.choices?.[0]?.message?.content?.trim() || offlinePhrases[0];
  } catch (err) {
    console.error("Failed to generate vibe reason via Groq:", err);
    return offlinePhrases[Math.floor(Math.random() * offlinePhrases.length)];
  }
};

// 7. Debug helper helper to reset swipes in Supabase for current user
export const resetUserSwipes = async (currentUserId: string): Promise<void> => {
  try {
    await supabase.from('swipes').delete().eq('swiper_id', currentUserId);
  } catch (err) {
    console.error("Error resetting swipes in Supabase:", err);
  }
};

// 8. Compress and Resize Image Utility (Canvas based resize with 0.7 JPEG compression)
export const compressAndResizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Compress to high quality JPEG with 0.70 compression which is extremely tiny (<10KB) !
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.70);
        resolve(compressedBase64);
      };
      img.onerror = (err) => {
        reject(err);
      };
    };
    reader.onerror = (err) => {
      reject(err);
    };
  });
};
