import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
  console.log("Gemini API Client initialized successfully.");
} else {
  console.log("No GEMINI_API_KEY found, running in intelligent offline fallback mode.");
}

// Users table mockup representation 
const MOCK_PROFILES = [
  {
    id: "elena_codes",
    telegram_id: "elena_101",
    username: "elena_codes",
    name: "Elena",
    age: 24,
    role: "Builder / Developer",
    tags: ["Late Night Coding", "AI & Automation", "Coffee"],
    ai_facts: [
      "probably has 12 unfinished side projects",
      "sends voice messages at 2AM about bugs",
      "survives exclusively on coffee and sheer willpower"
    ],
    created_at: "2026-05-18T08:00:00Z"
  },
  {
    id: "sarah_design",
    telegram_id: "sarah_102",
    username: "sarah_design",
    name: "Sarah",
    age: 25,
    role: "Creator / Designer",
    tags: ["Design", "Content Creation", "Deep Talks"],
    ai_facts: [
      "aggressively redesigns every application they use",
      "has a folder with 100 unused vector illustrations",
      "thinks Comic Sans is a crime against humanity"
    ],
    created_at: "2026-05-19T09:12:00Z"
  },
  {
    id: "meme_lord",
    telegram_id: "meme_103",
    username: "memelord_99",
    name: "Meme Lord",
    age: 21,
    role: "Just exploring",
    tags: ["Shitposting", "Gaming", "Crypto"],
    ai_facts: [
      "terminally online and extremely proud of it",
      "replies exclusively in highly specific meme templates",
      "thinks in systems, talks in shitposts"
    ],
    created_at: "2026-05-20T23:14:00Z"
  },
  {
    id: "alex_hacks",
    telegram_id: "alex_104",
    username: "alex_hacks",
    name: "Alex",
    age: 26,
    role: "Founder / Entrepreneur",
    tags: ["Startups", "Indie Hacking", "AI & Automation"],
    ai_facts: [
      "pitches a new SaaS idea during lunch",
      "built a browser extension to avoid talking to people",
      "launches on Product Hunt every other Tuesday"
    ],
    created_at: "2026-05-21T04:20:00Z"
  },
  {
    id: "dmitry_crypto",
    telegram_id: "vit_105",
    username: "dmitry_crypto",
    name: "Dmitry",
    age: 23,
    role: "Builder / Developer",
    tags: ["Crypto", "Late Night Coding", "Deep Talks"],
    ai_facts: [
      "runs a node on a raspberry pi in their closet",
      "has lost and found private keys five separate times",
      "speaks fluent solidity but struggles with human language"
    ],
    created_at: "2026-05-21T12:00:00Z"
  }
];

// Current user state
let currentUserMock = {
  id: "jason_builds",
  telegram_id: "jason_777",
  username: "jason_builds",
  name: "Jason",
  age: 24,
  role: "Builder / Developer",
  tags: ["AI & Automation", "Indie Hacking", "Coffee"],
  ai_facts: [
    "writes typescript faster than their shadow",
    "buys domains they will definitely never use",
    "reads API documentation for fun at bedtime"
  ],
  created_at: "2026-05-22T00:00:00Z",
  streakDays: 14,
  matchesToday: 8,
  isPremium: true,
  priorityPoints: 0,
  swipeHistory: {} as Record<string, 'left' | 'right' | 'like' | 'pass'>
};

// Matches Mockups table
let matchesTable = [
  { user_a: "jason_builds", user_b: "alex_hacks", a_liked: true, b_liked: true, matched_at: "2h ago" },
  { user_a: "jason_builds", user_b: "sarah_design", a_liked: true, b_liked: true, matched_at: "1h ago" }
];

// Offline fallback vibe reasons
const offlinePhrases = [
  "both probably debugged code during a dinner date",
  "mutual coffee obsession and unhealthy terminal usage",
  "same 3AM founder brain damage detected",
  "will argue endlessly about Tailwind versus semantic CSS",
  "both live or die by their espresso shot countdown",
  "dangerous mutual coding hyperfocus detected",
  "same terminally online vibe compilation detected",
  "will definitely launch a memecoin before lunch"
];

// Simple in-memory cache for the generated single casual sentence vibe reasons 
const VIBE_REASON_CACHE: Record<string, string> = {};

// API: Get current user profile Info
app.get("/api/user/me", (req, res) => {
  res.json(currentUserMock);
});

// API: Generate AI Facts for profile onboarding
app.post("/api/user/generate-facts", async (req, res) => {
  const { role, tags } = req.body;
  if (!role || !tags || !Array.isArray(tags)) {
    return res.status(400).json({ error: "Missing role or tags parameters" });
  }

  const fallbackFacts = [
    "probably has 12 unfinished side projects",
    "sends voice messages at 2AM about ideas",
    "thinks in systems, talks in deep memes",
    "lives on double espressos and pure vibe coding",
    "buys domains they will absolutely never build on",
    "aggressively debugs code in their dreams at night"
  ];

  const getFallbacks = () => {
    const shuffled = [...fallbackFacts].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  if (ai) {
    try {
      const prompt = `User is a ${role}, interested in: ${tags.join(", ")}.
Generate exactly 3 short punchy facts about them in internet culture tone. Each fact max 8 words.
Format structure: JSON array of 3 strings. Do not wrap in markdown tags.

Examples:
- "probably has 12 unfinished side projects"
- "sends voice messages at 2AM"
- "thinks in systems, talks in memes"`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING
            },
            description: "Exactly 3 distinct casual, funny strings in internet culture tone"
          }
        }
      });

      if (response.text) {
        const text = response.text.trim();
        const cleanedText = text.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        const result = JSON.parse(cleanedText);
        if (Array.isArray(result) && result.length >= 3) {
          return res.json({ success: true, ai_facts: result.slice(0, 3) });
        }
      }
    } catch (err) {
      console.error("Gemini user profile facts generator failed:", err);
    }
  }

  res.json({ success: true, ai_facts: getFallbacks() });
});

// API: Update user onboarding profile
app.post("/api/user/onboard", (req, res) => {
  const { name, role, tags, ai_facts } = req.body;
  
  currentUserMock.name = name || currentUserMock.name;
  currentUserMock.role = role || currentUserMock.role;
  currentUserMock.tags = Array.isArray(tags) ? tags : currentUserMock.tags;
  currentUserMock.ai_facts = Array.isArray(ai_facts) ? ai_facts : currentUserMock.ai_facts;
  currentUserMock.swipeHistory = {}; // reset swipes for fresh profile walkthrough

  res.json({ success: true, user: currentUserMock });
});

// API: Referral Growth Trigger -> +5 Priority Points to each user
app.post("/api/user/refer", (req, res) => {
  const { referrerId } = req.body;
  currentUserMock.priorityPoints = (currentUserMock.priorityPoints || 0) + 5;
  console.log(`Referral activated for user ${currentUserMock.id} via start=REF_${referrerId}. Awarded +5 Priority points.`);
  res.json({ success: true, priorityPoints: currentUserMock.priorityPoints });
});

// API: Toggle Premium Subscription 
app.post("/api/user/premium", (req, res) => {
  currentUserMock.isPremium = !currentUserMock.isPremium;
  res.json({ success: true, isPremium: currentUserMock.isPremium });
});

// API: Get matchable profiles sorted by tag intersection and creation date
app.get("/api/profiles", (req, res) => {
  const swipedIds = Object.keys(currentUserMock.swipeHistory);
  
  // Filter candidates who are not swiped on and not the current user
  const candidates = MOCK_PROFILES.filter(p => p.id !== currentUserMock.id && !swipedIds.includes(p.id));

  // Rate and sort based on tag intersection count
  const currentTags = currentUserMock.tags || [];
  const scored = candidates.map(p => {
    const intersection = p.tags.filter(t => currentTags.includes(t));
    const score = intersection.length;
    return { profile: p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.profile.created_at).getTime() - new Date(a.profile.created_at).getTime();
  });

  res.json(scored.map(s => s.profile));
});

// API: Perform AI Matchmaking Analysis (exactly ONE sentence vibe reasons, with caching)
app.post("/api/match/analyze", async (req, res) => {
  const { targetId } = req.body;
  const target = MOCK_PROFILES.find(p => p.id === targetId);
  if (!target) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const cacheKey = `${currentUserMock.id}_${target.id}`;
  if (VIBE_REASON_CACHE[cacheKey]) {
    return res.json({
      targetId: target.id,
      vibeReason: VIBE_REASON_CACHE[cacheKey],
      vibeScore: 9.2
    });
  }

  if (ai) {
    try {
      const prompt = `Given person A tags: ${currentUserMock.tags.join(", ")} and person B tags: ${target.tags.join(", ")}, write ONE casual funny sentence about why they'd vibe. Max 12 words. No hashtags. Internet humor tone. 

      Examples:
      - both probably debugged code during a dinner date
      - mutual rust obsession and unhealthy caffeine dependency
      - same 3AM founder brain damage detected`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reason: { type: Type.STRING, description: "A casual funny sentence, max 12 words" }
            },
            required: ["reason"]
          }
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text.trim());
        const finalReason = result.reason || offlinePhrases[Math.floor(Math.random() * offlinePhrases.length)];
        VIBE_REASON_CACHE[cacheKey] = finalReason;
        return res.json({
          targetId: target.id,
          vibeReason: finalReason,
          vibeScore: 9.5
        });
      }
    } catch (err) {
      console.error("Gemini Vibe sentence analysis failed, fallback activated:", err);
    }
  }

  // Pick a suitable fallback from phrases list
  let phrase = offlinePhrases[Math.floor(Math.random() * offlinePhrases.length)];
  if (target.id === "elena_codes") phrase = "mutual coffee obsession and unhealthy terminal usage";
  if (target.id === "meme_lord") phrase = "same 3AM founder brain damage detected";
  if (target.id === "sarah_design") phrase = "will argue endlessly about Tailwind versus semantic CSS";

  VIBE_REASON_CACHE[cacheKey] = phrase;
  res.json({
    targetId: target.id,
    vibeReason: phrase,
    vibeScore: 8.8
  });
});

// API: Swipe card action (Mutual match simulations immediately output Telegram API logs)
app.post("/api/match/swipe", (req, res) => {
  const { targetId, direction } = req.body;
  if (!targetId || !direction) {
    return res.status(400).json({ error: "Missing swipe parameters" });
  }

  currentUserMock.swipeHistory[targetId] = direction;

  let isMutualMatch = false;
  if (direction === "right" || direction === "like") {
    isMutualMatch = true; // Simulating mutual vibe matches instantly in mock mode
    
    // Register match record
    matchesTable.push({
      user_a: currentUserMock.id,
      user_b: targetId,
      a_liked: true,
      b_liked: true,
      matched_at: new Date().toISOString()
    });

    currentUserMock.matchesToday += 1;

    // Simulate Telegram Bot API sending message logs to both users
    const matchedUser = MOCK_PROFILES.find(p => p.id === targetId);
    if (matchedUser) {
      console.log(`[TELEGRAM BOT SIMULATOR] sendMessage to @${currentUserMock.username}: "⚡ vibe match! @${matchedUser.username} liked you back. say hi."`);
      console.log(`[TELEGRAM BOT SIMULATOR] sendMessage to @${matchedUser.username}: "⚡ vibe match! @${currentUserMock.username} liked you back. say hi."`);
    }
  }

  res.json({ success: true, match: isMutualMatch });
});

// API: Get matches list (Simplified to show mutual matches in the deck simulation)
app.get("/api/matches", (req, res) => {
  const mutuals = matchesTable.filter(m => m.a_liked && m.b_liked);
  const result = mutuals.map(m => {
    const targetId = m.user_a === currentUserMock.id ? m.user_b : m.user_a;
    const profile = MOCK_PROFILES.find(p => p.id === targetId);
    return {
      user: profile || { id: targetId, name: "Collaborator", username: "unknown", tags: [], ai_facts: [] },
      matched_at: m.matched_at
    };
  });
  res.json(result);
});

// API: Reset all active swipes and simulations
app.post("/api/debug/reset", (req, res) => {
  currentUserMock.swipeHistory = {};
  currentUserMock.matchesToday = 8;
  currentUserMock.priorityPoints = 0;
  matchesTable = [
    { user_a: "jason_builds", user_b: "alex_hacks", a_liked: true, b_liked: true, matched_at: "2h ago" },
    { user_a: "jason_builds", user_b: "sarah_design", a_liked: true, b_liked: true, matched_at: "1h ago" }
  ];
  res.json({ success: true, message: "Deck and settings successfully re-initialized." });
});

// Configure Vite middleware or serve static content
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Matcha server running on port ${PORT}`);
  });
}

startServer();
