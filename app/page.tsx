"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Sticker = { id: string; emoji: string; label: string; color: string; kind: "creature" | "food" | "object" | "magic" };
type Scene = { problem: string; reaction?: string; choices?: string[] };
type Reveal = { reaction: string; nextSituation: string; points: number; verdict: string };

const STICKERS: Sticker[] = [
  { id: "frog", emoji: "ðŸ¸", label: "Frog", color: "mint", kind: "creature" },
  { id: "pizza", emoji: "ðŸ•", label: "Pizza", color: "peach", kind: "food" },
  { id: "lipstick", emoji: "ðŸ’„", label: "Lipstick", color: "pink", kind: "object" },
  { id: "skate", emoji: "ðŸ›¼", label: "Roller skate", color: "lilac", kind: "object" },
  { id: "disco", emoji: "ðŸª©", label: "Disco ball", color: "blue", kind: "magic" },
  { id: "crown", emoji: "ðŸ‘‘", label: "Crown", color: "yellow", kind: "magic" },
  { id: "magnet", emoji: "ðŸ§²", label: "Magnet", color: "peach", kind: "object" },
  { id: "headphones", emoji: "ðŸŽ§", label: "Headphones", color: "blue", kind: "object" },
  { id: "cupcake", emoji: "ðŸ§", label: "Cupcake", color: "pink", kind: "food" },
  { id: "balloon", emoji: "ðŸŽˆ", label: "Balloon", color: "yellow", kind: "object" },
  { id: "soap", emoji: "ðŸ«§", label: "Bubbles", color: "mint", kind: "magic" },
  { id: "banana", emoji: "ðŸŒ", label: "Banana", color: "yellow", kind: "food" },
  { id: "cat", emoji: "ðŸˆ", label: "Cat", color: "peach", kind: "creature" },
  { id: "alien", emoji: "ðŸ‘½", label: "Alien", color: "mint", kind: "creature" },
  { id: "duck", emoji: "ðŸ¦†", label: "Duck", color: "yellow", kind: "creature" },
  { id: "unicorn", emoji: "ðŸ¦„", label: "Unicorn", color: "lilac", kind: "creature" },
  { id: "cookie", emoji: "ðŸª", label: "Cookie", color: "peach", kind: "food" },
  { id: "pickle", emoji: "ðŸ¥’", label: "Pickle", color: "mint", kind: "food" },
  { id: "cake", emoji: "ðŸŽ‚", label: "Cake", color: "pink", kind: "food" },
  { id: "key", emoji: "ðŸ”‘", label: "Tiny key", color: "yellow", kind: "object" },
  { id: "umbrella", emoji: "â˜‚ï¸", label: "Umbrella", color: "lilac", kind: "object" },
  { id: "rocket", emoji: "ðŸš€", label: "Rocket", color: "blue", kind: "magic" },
  { id: "crystal", emoji: "ðŸ”®", label: "Crystal ball", color: "lilac", kind: "magic" },
  { id: "spark", emoji: "âœ¨", label: "Pure sparkle", color: "pink", kind: "magic" },
];

const STARTERS = [
  "A ghost has stolen the Wi-Fi and refuses to give it back.",
  "A dragon is blocking the bus, and you are already late.",
  "The moon has fallen into the neighborhood swimming pool.",
  "Every pigeon in town has suddenly been promoted to manager.",
  "Your reflection has walked out of the mirror and taken your favorite hoodie.",
];

const TITLES = [
  "Minister of Unnecessary Solutions",
  "Licensed Plot Twister",
  "CEO of Making It Worse",
  "Senior Chaos Consultant",
  "Certified Frog Negotiator",
];

const VERDICTS = ["Suspiciously brilliant", "Beautifully unnecessary", "Chaos approved", "A terrible idea. Perfect.", "Logic has left the chat"];
const CHAPTERS = ["Tiny Trouble", "Plot Thickening", "Certified Nonsense", "Legendary Chaos", "Reality Optional"];

function dealHand(turn: number) {
  const offset = (turn * 5) % STICKERS.length;
  return Array.from({ length: 9 }, (_, index) => STICKERS[(offset + index * 7) % STICKERS.length].id);
}

export default function Home() {
  const [started, setStarted] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [scene, setScene] = useState<Scene>({ problem: STARTERS[0] });
  const [history, setHistory] = useState<Scene[]>([]);
  const [turn, setTurn] = useState(1);
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [hand, setHand] = useState<string[]>(() => dealHand(1));
  const [rerolls, setRerolls] = useState(1);
  const [score, setScore] = useState(0);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicStepRef = useRef(0);
  const soundRef = useRef(true);
  const voiceRef = useRef(true);
  const narratorAudioRef = useRef<HTMLAudioElement | null>(null);
  const narratorUrlRef = useRef<string | null>(null);
  const narratorRunRef = useRef(0);
  const narratorResolveRef = useRef<(() => void) | null>(null);

  const chosen = useMemo(
    () => selected.map((id) => STICKERS.find((sticker) => sticker.id === id)!).filter(Boolean),
    [selected],
  );

  function toggleSticker(id: string) {
    if (loading) return;
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current,
    );
  }

  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);
  useEffect(() => { voiceRef.current = voiceOn; }, [voiceOn]);
  useEffect(() => () => {
    if (musicTimerRef.current) clearInterval(musicTimerRef.current);
    audioRef.current?.close();
    narratorAudioRef.current?.pause();
    if (narratorUrlRef.current) URL.revokeObjectURL(narratorUrlRef.current);
  }, []);

  function ensureAudio() {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioRef.current) audioRef.current = new AudioContextClass();
    if (audioRef.current.state === "suspended") void audioRef.current.resume();
    return audioRef.current;
  }

  function playTone(frequency = 440, duration = .13, volume = .045, delay = 0, type: OscillatorType = "sine") {
    if (!soundRef.current) return;
    const audio = ensureAudio();
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const starts = audio.currentTime + delay;
    oscillator.type = type; oscillator.frequency.setValueAtTime(frequency, starts);
    gain.gain.setValueAtTime(volume, starts); gain.gain.exponentialRampToValueAtTime(.001, starts + duration);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(starts); oscillator.stop(starts + duration + .02);
  }

  function sparkle(notes: number[]) { notes.forEach((note, index) => playTone(note, .18, .055, index * .08, index % 2 ? "triangle" : "sine")); }

  function narrationChunks(text: string) {
    const words = text.replace(/\s+/g, " ").trim().split(" ");
    const chunks: string[] = [];
    for (const word of words) {
      const last = chunks[chunks.length - 1];
      if (!last || `${last} ${word}`.length > 185) chunks.push(word);
      else chunks[chunks.length - 1] = `${last} ${word}`;
    }
    return chunks;
  }

  async function speak(text: string, mood: "host" | "excited" | "tease" = "host") {
    if (!voiceRef.current || typeof window === "undefined") return;
    const run = ++narratorRunRef.current;
    narratorResolveRef.current?.();
    narratorAudioRef.current?.pause();
    if (narratorUrlRef.current) URL.revokeObjectURL(narratorUrlRef.current);
    narratorUrlRef.current = null;
    stopMusic();
    try {
      for (const chunk of narrationChunks(text)) {
        if (!voiceRef.current || narratorRunRef.current !== run) break;
        const response = await fetch("/api/voice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: chunk, mood }) });
        if (!response.ok) break;
        const audioUrl = URL.createObjectURL(await response.blob());
        narratorUrlRef.current = audioUrl;
        const audio = new Audio(audioUrl);
        narratorAudioRef.current = audio;
        await new Promise<void>((resolve) => {
          let settled = false;
          const finish = () => {
            if (settled) return;
            settled = true;
            narratorResolveRef.current = null;
            URL.revokeObjectURL(audioUrl);
            if (narratorUrlRef.current === audioUrl) narratorUrlRef.current = null;
            resolve();
          };
          narratorResolveRef.current = finish;
          audio.onplaying = () => console.info("[Plot Twist] narrator playback started");
          audio.onended = finish;
          audio.onerror = () => {
            console.error("[Plot Twist] narrator audio could not be played", audio.error?.message || "unknown media error");
            finish();
          };
          void audio.play().catch((error) => {
            console.error("[Plot Twist] narrator playback was blocked", error instanceof Error ? error.message : "unknown error");
            finish();
          });
        });
      }
    } catch {
      // Leave the visual game playable if the optional narrator is unavailable.
    } finally {
      if (narratorRunRef.current === run) { narratorAudioRef.current = null; if (soundRef.current) startMusic(); }
    }
  }

  function startMusic() {
    ensureAudio();
    if (musicTimerRef.current) return;
    const melody = [262, 330, 392, 523, 392, 330, 294, 440];
    musicTimerRef.current = setInterval(() => {
      if (!soundRef.current) return;
      const step = musicStepRef.current++ % melody.length;
      playTone(melody[step], .22, .018, 0, "triangle");
      if (step % 2 === 0) playTone(melody[step] / 2, .12, .012, 0, "sine");
    }, 430);
  }

  function stopMusic() { if (musicTimerRef.current) clearInterval(musicTimerRef.current); musicTimerRef.current = null; }
  function beginGame() {
    ensureAudio(); setStarted(true); sparkle([392, 523, 659, 784]); setTimeout(startMusic, 280);
    setTimeout(() => speak(`Let the chaos begin! ${scene.problem} Choose three stickers. Bad ideas are highly encouraged.`, "excited"), 480);
  }
  function toggleSound() {
    const next = !soundOn; setSoundOn(next); soundRef.current = next;
    if (next) { sparkle([523, 659, 784]); startMusic(); } else stopMusic();
  }
  function toggleVoice() {
    const next = !voiceOn; setVoiceOn(next); voiceRef.current = next;
    if (!next) { narratorRunRef.current += 1; narratorResolveRef.current?.(); narratorAudioRef.current?.pause(); narratorAudioRef.current = null; if (narratorUrlRef.current) URL.revokeObjectURL(narratorUrlRef.current); narratorUrlRef.current = null; }
    else speak(`Woohoo! Voice is back! ${scene.problem}`, "excited");
  }
  function chooseSticker(id: string) {
    if (selected.includes(id)) playTone(240, .09, .035, 0, "square");
    else sparkle([360 + selected.length * 110, 460 + selected.length * 130]);
    toggleSticker(id);
  }

  function rerollHand() {
    if (!rerolls || loading) return;
    setHand(dealHand(turn + 9));
    setSelected([]); setRerolls(0); [740, 620, 510, 680].forEach((note, index) => playTone(note, .1, .04, index * .045, "sawtooth"));
    speak("Ooh, fresh chaos!", "tease");
  }

  async function twistPlot() {
    if (chosen.length !== 3) return;
    setLoading(true);
    [180, 220, 270, 330].forEach((note, index) => playTone(note, .18, .04, index * .08, "square"));
    try {
      const response = await fetch("/api/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem: scene.problem,
          stickers: chosen.map(({ emoji, label }) => `${emoji} ${label}`),
          turn,
          callbacks: history.slice(-2).map((item) => item.reaction).filter(Boolean),
        }),
      });
      const result = await response.json();
      const variety = new Set(chosen.map((item) => item.kind)).size;
      const points = 100 + variety * 25 + (turn % 5 === 0 ? 100 : 0);
      setReveal({ reaction: result.reaction, nextSituation: result.nextSituation, points, verdict: VERDICTS[(turn + variety) % VERDICTS.length] });
      setHistory((items) => [...items, { ...scene, reaction: result.reaction, choices: chosen.map((item) => item.emoji) }]);
      setScore((value) => value + points);
      sparkle(turn % 3 === 0 ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 988]);
      const stickerNames = chosen.map((item) => item.label).join(", ").replace(/, ([^,]*)$/, ", and $1");
      setTimeout(() => speak(`You chose ${stickerNames}. ${VERDICTS[(turn + variety) % VERDICTS.length]}! ${result.reaction} You earned ${points} chaos points.`, "excited"), 280);
    } catch {
      setHistory((items) => [...items, { ...scene, reaction: "The stickers unionized, solved the problem off-screen, and left one mysterious glittery receipt.", choices: chosen.map((item) => item.emoji) }]);
      setScene({ problem: "The receipt is actually a treasure map, but the X keeps moving." });
      setSelected([]);
      setTurn((value) => value + 1);
    } finally {
      setLoading(false);
    }
  }

  function continueStory() {
    if (!reveal) return;
    const nextTurn = turn + 1;
    setScene({ problem: reveal.nextSituation }); setReveal(null); setSelected([]); setTurn(nextTurn);
    setHand(dealHand(nextTurn)); setRerolls(1); sparkle([330, 440, 554]);
    setTimeout(() => speak(`Next twist! ${reveal.nextSituation} Pick your chaos.`, "host"), 260);
  }

  function restart() {
    stopMusic();
    narratorRunRef.current += 1;
    narratorResolveRef.current?.();
    narratorAudioRef.current?.pause(); narratorAudioRef.current = null;
    if (narratorUrlRef.current) URL.revokeObjectURL(narratorUrlRef.current); narratorUrlRef.current = null;
    setStarted(false);
    setFinished(false);
    setHistory([]);
    setTurn(1);
    setSelected([]);
    setScene({ problem: STARTERS[Math.floor(Math.random() * STARTERS.length)] });
    setHand(dealHand(1)); setRerolls(1); setScore(0); setReveal(null);
  }

  if (!started) {
    return (
      <main className="landing-shell">
        <nav className="topbar" aria-label="Main navigation">
          <a className="brand" href="#top" aria-label="Plot Twist home"><span className="brand-mark">P!</span> PLOT TWIST!</a>
          <div className="nav-note">made for curious humans âœ¿</div>
        </nav>

        <section className="hero" id="top">
          <div className="doodle doodle-one">âœ¦</div>
          <div className="doodle doodle-two">ã€°</div>
          <div className="hero-copy">
            <p className="eyebrow"><span>AI-POWERED</span> â€¢ HUMAN-IMAGINED</p>
            <h1>Solve anything with <em>three stickers.</em></h1>
            <p className="hero-sub">Pick the most ridiculous solution you can. Our AI has to make it work. There are no wrong answersâ€”only better plot twists.</p>
            <button className="primary jumbo" onClick={beginGame}>Start the chaos <span>â†’</span></button>
            <p className="microcopy">No login. No score. No pressure. Just play.</p>
          </div>

          <div className="hero-card" aria-label="Example game card">
            <div className="tape">YOUR FIRST PROBLEM</div>
            <span className="card-number">01</span>
            <div className="ghost" aria-hidden="true"><span>ðŸ‘»</span><i>âœ¦</i></div>
            <h2>A ghost stole your Wi-Fi.</h2>
            <div className="sample-picks"><span>ðŸ¸</span><span>ðŸ’„</span><span>ðŸ•</span></div>
            <div className="scribble">good luck explaining this â†‘</div>
          </div>
        </section>

        <section className="how-it-works" aria-labelledby="how-title">
          <div className="section-intro"><p className="eyebrow">HOW IT WORKS</p><h2 id="how-title">Your imagination drives.<br/>AI handles the consequences.</h2></div>
          <div className="steps">
            <article><b>1</b><span className="step-icon">âš¡</span><h3>Meet a problem</h3><p>Every story starts with something delightfully wrong.</p></article>
            <article><b>2</b><span className="step-icon">âœ¨</span><h3>Pick 3 stickers</h3><p>No perfect answer. Choose whatever makes you curious.</p></article>
            <article><b>3</b><span className="step-icon">â†»</span><h3>Watch chaos unfold</h3><p>AI turns your choices into the next chapterâ€”forever.</p></article>
          </div>
        </section>

        <footer><span>Built for joy, curiosity & beautifully bad ideas.</span><span>âœ¿ Technology should feel like yours.</span></footer>
      </main>
    );
  }

  if (finished) {
    const title = TITLES[history.length % TITLES.length];
    return (
      <main className="game-shell ending-shell">
        <section className="ending-card">
          <div className="confetti">âœ¦ âœ¿ â˜… âœ§ âœ¿</div>
          <p className="eyebrow">CHAOS COMPLETE</p>
          <h1>You made it weird.</h1>
          <p>You survived {history.length} plot twist{history.length === 1 ? "" : "s"}, trusted your imagination, and solved absolutely nothing in the expected way.</p>
          <div className="earned-title"><small>YOUR OFFICIAL TITLE</small><strong>{title}</strong></div>
          <button className="primary" onClick={restart}>Play a new story â†»</button>
        </section>
      </main>
    );
  }

  return (
    <main className="game-shell">
      <header className="game-header">
        <button className="brand button-brand" onClick={restart}><span className="brand-mark">P!</span> PLOT TWIST!</button>
        <div className="game-meta"><span>âœ¦ {score} CHAOS</span><span>TWIST {String(turn).padStart(2, "0")}</span><button onClick={toggleSound} aria-label={soundOn ? "Mute sounds" : "Enable sounds"}>{soundOn ? "â™« JOY" : "Ã— SOUND"}</button><button className="voice-button" onClick={toggleVoice} aria-label={voiceOn ? "Mute narrator" : "Enable narrator"}>{voiceOn ? "â— VOICE" : "â—‹ VOICE"}</button></div>
      </header>

      <div className="game-layout">
        <aside className="story-tape" aria-label="Previous plot twists">
          <p>THE STORY SO FAR</p>
          {history.length === 0 ? <div className="empty-history">Your questionable decisions will appear here.</div> : history.slice(-3).map((item, index) => (
            <div className="history-item" key={`${index}-${item.problem}`}>
              <span>{item.choices?.join(" ")}</span>
              <p>{item.reaction}</p>
            </div>
          ))}
        </aside>

        <section className="play-area" aria-live="polite">
          <div className="chapter-row"><b>CHAPTER {Math.min(5, Math.floor((turn - 1) / 3) + 1)}: {CHAPTERS[Math.min(4, Math.floor((turn - 1) / 3))]}</b><div className="chaos-track"><i style={{width:`${Math.min(100, ((turn - 1) % 3 + 1) * 33.3)}%`}} /></div></div>
          <div className="problem-card">
            <div className="problem-label">YOUR PROBLEM</div>
            <div className="problem-emoji">{turn % 3 === 0 ? "ðŸ‰" : turn % 2 === 0 ? "ðŸ¸" : "ðŸ‘»"}</div>
            <h1>{scene.problem}</h1>
            <p>Choose exactly three stickers. Bad ideas encouraged.</p>
          </div>

          <div className="selection-title"><span>PICK YOUR CHAOS</span><div><button className="reroll" onClick={rerollHand} disabled={!rerolls}>â†» NEW STICKERS</button><b>{selected.length}/3 SELECTED</b></div></div>
          <div className="sticker-grid">
            {hand.map((id) => STICKERS.find((item) => item.id === id)!).map((sticker) => {
              const active = selected.includes(sticker.id);
              return (
                <button key={sticker.id} className={`sticker ${sticker.color} ${active ? "selected" : ""}`} onPointerEnter={() => playTone(170 + sticker.label.length * 8, .045, .012)} onClick={() => chooseSticker(sticker.id)} aria-pressed={active}>
                  <span>{sticker.emoji}</span><small>{sticker.label}</small>{active && <i>âœ“</i>}
                </button>
              );
            })}
          </div>

          <button className="primary twist-button" disabled={selected.length !== 3 || loading} onClick={twistPlot}>
            {loading ? "Twisting realityâ€¦" : selected.length === 3 ? "Make it make sense â†’" : `Pick ${3 - selected.length} more`}
          </button>
          <button className="end-button" onPointerEnter={() => playTone(260, .07, .025)} onClick={() => { speak(`Final score: ${score} chaos points. You are officially ${TITLES[history.length % TITLES.length]}.`, "excited"); sparkle([523, 392, 330, 262]); stopMusic(); setFinished(true); }}>End my chaos</button>
        </section>
      </div>
      <div className="ai-badge"><span>âœ¦</span><div><b>AI CHAOS ENGINE</b><small>Human choices lead every story</small></div></div>
      {reveal && <div className="reveal-backdrop" role="dialog" aria-modal="true" aria-labelledby="reveal-title">
        <section className="reveal-card">
          <div className="reveal-burst">{chosen.map((item) => item.emoji).join(" + ")}</div>
          <p className="eyebrow">THE VERDICT</p>
          <h2 id="reveal-title">{reveal.verdict}</h2>
          <p className="reaction-copy">{reveal.reaction}</p>
          <div className="points-pop">+{reveal.points} CHAOS</div>
          {turn % 3 === 0 && <div className="unlock">ðŸ”“ NEW CHAPTER UNLOCKED</div>}
          <button className="primary" onPointerEnter={() => playTone(880, .06, .025)} onClick={continueStory}>Keep the story going â†’</button>
          <button className="end-button" onPointerEnter={() => playTone(260, .07, .025)} onClick={() => { speak(`Final score: ${score} chaos points. You are officially ${TITLES[history.length % TITLES.length]}.`, "excited"); sparkle([523, 392, 330, 262]); stopMusic(); setFinished(true); }}>That is enough chaos for me</button>
        </section>
      </div>}
    </main>
  );
}

