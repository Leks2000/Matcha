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
}

// 1. Get current user by telegram_id
export const getCurrentUser = async (telegramId: number): Promise<SupabaseUser | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramId)
      .maybeSingle();
    
    if (error) {
      console.error("Error fetching current user:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error in getCurrentUser:", err);
    return null;
  }
};

// 2. Onboard or update user profile
export const onboardUser = async (userData: {
  telegram_id: number;
  username: string;
  name: string;
  role: string;
  tags: string[];
  ai_facts: string[];
}): Promise<SupabaseUser | null> => {
  const refCode = `REF_${userData.telegram_id}`;
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert({ ...userData, ref_code: refCode }, { onConflict: 'telegram_id' })
      .select()
      .single();

    if (error) {
      console.error("Error onboarding user:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Error in onboardUser:", err);
    return null;
  }
};

// Seed mock profiles if the database does not have enough users (to make the app immediately testable)
const SEED_PROFILES = [
  {
    telegram_id: 9991,
    username: "elena_codes",
    name: "Elena",
    role: "Builder / Developer",
    tags: ["Late Night Coding", "AI & Automation", "Coffee"],
    ai_facts: [
      "probably has 12 unfinished side projects",
      "sends voice messages at 2AM about bugs",
      "survives exclusively on coffee and sheer willpower"
    ]
  },
  {
    telegram_id: 9992,
    username: "sarah_design",
    name: "Sarah",
    role: "Creator / Designer",
    tags: ["Design", "Content Creation", "Deep Talks"],
    ai_facts: [
      "aggressively redesigns every application they use",
      "has a folder with 100 unused vector illustrations",
      "thinks Comic Sans is a crime against humanity"
    ]
  },
  {
    telegram_id: 9993,
    username: "memelord_99",
    name: "Meme Lord",
    role: "Just exploring",
    tags: ["Shitposting", "Gaming", "Crypto"],
    ai_facts: [
      "terminally online and extremely proud of it",
      "replies exclusively in highly specific meme templates",
      "thinks in systems, talks in shitposts"
    ]
  },
  {
    telegram_id: 9994,
    username: "alex_hacks",
    name: "Alex",
    role: "Founder / Entrepreneur",
    tags: ["Startups", "Indie Hacking", "AI & Automation"],
    ai_facts: [
      "pitches a new SaaS idea during lunch",
      "built a browser extension to avoid talking to people",
      "launches on Product Hunt every other Tuesday"
    ]
  },
  {
    telegram_id: 9995,
    username: "dmitry_crypto",
    name: "Dmitry",
    role: "Builder / Developer",
    tags: ["Crypto", "Late Night Coding", "Deep Talks"],
    ai_facts: [
      "runs a node on a raspberry pi in their closet",
      "has lost and found private keys five separate times",
      "speaks fluent solidity but struggles with human language"
    ]
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
    await checkAndSeedProfiles(currentUserId);

    // Get swiped user IDs
    const { data: swiped, error: swipeError } = await supabase
      .from('swipes')
      .select('swiped_id')
      .eq('swiper_id', currentUserId);

    if (swipeError) {
      console.error("Error fetching swipes:", swipeError);
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
      console.error("Error fetching matchable users:", usersError);
      return [];
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
    console.error("Error in getProfiles:", err);
    return [];
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
      console.error("Error inserting swipe:", error);
      return { match: false };
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

      if (checkError) {
        console.error("Error checking mutual swipe:", checkError);
      }

      if (mutual) {
        // Create match entry
        await supabase.from('matches').insert({
          user_a: swiperId,
          user_b: swipedId
        });

        // Trigger Edge Function for notifications
        try {
          await supabase.functions.invoke('notify-match', {
            body: {
              userAId: swiperId,
              userBId: swipedId
            }
          });
        } catch (efErr) {
          console.error("Edge function trigger caught:", efErr);
        }

        return { match: true };
      }
    }

    return { match: false };
  } catch (err) {
    console.error("Error in recordSwipe:", err);
    return { match: false };
  }
};

// 5. Generate AI facts for user onboarding
export const generateAiFacts = async (
  role: string, 
  tags: string[]
): Promise<string[]> => {
  const fallback = [
    "probably has 12 unfinished side projects",
    "sends voice messages at 2AM about ideas",
    "thinks in systems, talks in memes"
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
Generate exactly 3 short punchy facts in internet culture tone. 
Each fact max 8 words. Return ONLY a JSON array of 3 strings.
Example: ["probably has 12 unfinished side projects", "sends voice messages at 2AM", "thinks in systems, talks in memes"]`
          }],
          temperature: 0.9,
          response_format: { type: "json_object" }
        })
      }
    );

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (text) {
      // Find JSON block if any or parse directly
      const resultObj = JSON.parse(text);
      // Groq with json_object might wrap list inside a key
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
