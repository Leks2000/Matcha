export interface UserProfile {
  id: string;
  telegram_id: string | number;
  username: string;
  name: string;
  age: number;
  role: string;
  tags: string[];
  created_at?: string;
  vibeScore?: number;
  ai_facts?: string[];
  bio?: string;
  photo_url?: string;
  matcha_sparks?: number;
  voice_bio?: string; // base64 encoded audio or data-url
}

export interface MatchRecord {
  user_a: string;
  user_b: string;
  a_liked: boolean;
  b_liked: boolean;
  matched_at: string;
}

export interface CurrentUser {
  id: string;
  telegram_id: string | number;
  username: string;
  name: string;
  age: number;
  role: string;
  tags: string[];
  created_at?: string;
  streakDays: number;
  matchesToday: number;
  isPremium: boolean;
  priorityPoints?: number; // growth priority boost points
  ai_facts?: string[];
  bio?: string;
  photo_url?: string;
  matcha_sparks?: number;
  voice_bio?: string; // base64 encoded audio or data-url
  ghost_mode?: boolean;
  ambient_pushes?: boolean;
}

export interface SwipeAction {
  targetId: string;
  direction: 'left' | 'right';
  timestamp: string;
}
