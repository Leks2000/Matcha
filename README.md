# Matcha Bot 🍵 - Vibe Matcher Telegram Mini App
> A highly polished, fast-paced, and interactive WebApp designed for Telegram. Designed with a custom matcha green theme, haptic response, cognitive alignment comparisons, and dynamic lifestyle facts.

---

## ⭐️ Project Highlights & Features
1. **Matcha Design Language**: Clean typography, light high-contrast layout using soft whites, charcoal grays, and energetic matcha green accents (`#00C896` / `#1A7A55`).
2. **X-Style Live Translation**: Users can manually translate cards (English ↔ Russian) with a beautiful toggle button just like on X (Twitter). Uses custom pre-defined mappings for core character accounts, falling back to a lightweight, rules-based offline lexicon.
3. **PC Drag Scroll Navigation**: Enhanced convenience on desktop browsers. The "Filter by Role" header responds to both touch swipes *and* standard click-and-drag mouse events.
4. **Interactive Daily Cosmic Quests**: Dynamic quest banner trackers in the main dashboard view with progress bars, completing and awarding +5⚡ prioritization boosts.
5. **Vibe Audio Player & Voice Bios**: Adaptive voice-messaging support where cards play real synthetic speech bios or actual recordings. Dynamic music-equalizer bars animate in real-time when audio is playing.

---

## 📊 Comprehensive Audit: Pros & Cons

### ➕ Strengths (Плюсы)
* **High-Fidelity UI/UX**: The application strictly avoids default template looks. The use of fluid Framer Motion cards, hand-crafted sliders, and tactile responsive active button states gives a very premium feel.
* **Flawless Desktop Adaptability**: Adding mouse-based drag scroll actions to the role filter capsules bridges mobile-first layouts to high-usability PC workflows.
* **No Telemetry / Low Clutter**: The layout avoids mock logs and low-value technical clutter. It stays entirely functional, humble, and clean.
* **Telegram Integration**: Uses native `twa-dev/sdk` for contextual language extraction (automatically matches Russian/English based on TG settings), and manages lightweight haptics for swipes and filter tabs.

### ➖ Areas for Improvement (Минусы / Точки роста)
* **State Complexity**: With multiple interactive systems (Radar view, Daily Quests, Groq Chat prompts, translation, and localized translation keys), splitting state management into React Context or a lightweight state store (e.g., Zustand) could keep `App.tsx` and `DashboardView.tsx` cleaner as the codebase balloons.
* **Offline Fallbacks vs AI Translation**: While custom offline presets cover seeded profiles instantly, general user bios fall back to a programmatic dictionary look-up if no Groq/OpenAI key is in the environment. Moving all real-time translation completely to an API route proxy is recommended for production.

---

## 🛠 Setup & Commands
```bash
# To install initial dependencies
npm install

# To launch in dev mode on local port 3000
npm run dev

# To compile full client-side bundle
npm run build
```
