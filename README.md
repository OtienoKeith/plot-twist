# Plot Twist! ✦

> Pick three ridiculous stickers. AI turns them into an endless, joyful story where imagination—not perfection—wins.

[![Play Plot Twist](https://img.shields.io/badge/PLAY_NOW-Cloudflare_Workers-ff45a5?style=for-the-badge)](https://plot-twist.otienomkeith.workers.dev/)
[![No login](https://img.shields.io/badge/NO_LOGIN-Just_Play-cdff3e?style=for-the-badge)](https://plot-twist.otienomkeith.workers.dev/)

![Plot Twist gameplay artwork](./public/og-v2.png)

## Play it

**Live app:** [plot-twist.otienomkeith.workers.dev](https://plot-twist.otienomkeith.workers.dev/)

**Gameplay video:** [Watch the MP4 demo](./demo/plot-twist-gameplay.mp4)

No account, installation, or personal data is required. Open the link and start playing.

## What is Plot Twist?

Plot Twist! is an endless AI-powered comedy game. Each round gives the player an absurd problem. The player chooses exactly three stickers, and the AI must turn all three choices into a funny solution that creates the next chapter.

There are no wrong answers. The human supplies the imagination; AI handles the consequences.

## Why we made it

Many wellness products feel like another assignment: track a habit, complete a checklist, or optimize yourself. Plot Twist! creates a different kind of wellness moment—a pressure-free invitation to play, laugh, and be imaginative.

The experience supports the CS Girlies mission by making technology feel approachable, expressive, inclusive, and owned by the person using it. Players do not need technical expertise, an account, or a perfect answer to participate.

## Features

- **Endless connected stories** generated from the player's choices
- **Three-sticker problem solving** with dozens of surprising combinations
- **Expressive AI narration** that reads the stickers, verdict, and complete story
- **Chaos points, chapters, rerolls, and story history** for replayable game structure
- **Joyful audio design** with music, interaction sounds, and independent sound controls
- **Instant access** with no sign-in or personal data collection
- **Responsive interface** designed for desktop and mobile play
- **Resilient fallback stories** so the game remains playable if generation is temporarily unavailable

## How it works

1. The player receives an absurd problem.
2. They select three sticker cards.
3. A protected server route sends the problem and stickers to Groq.
4. Llama 3.1 8B Instant creates a structured consequence and the next connected problem.
5. Groq Orpheus generates expressive narration using the Hannah voice.
6. The new problem becomes the next round, creating an endless story loop.

API keys stay on the server and are never sent to the browser.

## Built with

- React 19
- TypeScript
- Vinext and Vite
- Cloudflare Workers
- Groq Llama 3.1 8B Instant
- Groq Orpheus text-to-speech
- Web Audio API
- CSS animations and responsive layouts

## Run locally

### Requirements

- Node.js 22.13 or newer
- A Groq API key for live AI generation and narration

```bash
git clone https://github.com/OtienoKeith/plot-twist.git
cd plot-twist
npm install
```

Create `.env.local`:

```env
GROQ_API_KEY=your_groq_api_key
```

Start the development server:

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Build and deploy

```bash
npm run build
npx wrangler deploy --config dist/server/wrangler.json --name plot-twist
```

Store the Groq key as a protected Cloudflare secret:

```bash
npx wrangler secret put GROQ_API_KEY --name plot-twist
```

## Privacy and accessibility

Plot Twist! does not require registration and does not collect player profiles. Music and narration can be controlled separately. The interface uses semantic controls, visible focus states, high-contrast colors, and touch-friendly targets.

## What's next

- More sticker packs and themed story worlds
- Multiple narrator personalities
- Reduced-motion and expanded accessibility settings
- Local story saving without an account
- Shareable illustrated endings
- Cooperative play on one device
- Multilingual stories and narration

## Links

- [Live Cloudflare deployment](https://plot-twist.otienomkeith.workers.dev/)
- [Source code](https://github.com/OtienoKeith/plot-twist)

Built for joy, curiosity, and beautifully bad ideas. ✿
