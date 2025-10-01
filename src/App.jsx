import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./components/Card.jsx";
import Summary from "./components/Summary.jsx";
import { progressiveLoadCats, sizeForContainer } from "./utils/cats.js";

const FALLBACK_COUNT = 10; // show 10 cats

export default function App() {
  const stackRef = useRef(null);
  const topCardApiRef = useRef(null); // imperative control to animate top card on button press

  const [phase, setPhase] = useState("loading"); // loading | playing | summary
  const [cats, setCats] = useState([]);
  const [gone, setGone] = useState(0);           // pop from tail
  const [liked, setLiked] = useState([]);
  const [count] = useState(FALLBACK_COUNT);

  // Load images
  useEffect(() => {
    let cancelled = false;
    async function boot() {
      setPhase("loading");
      setGone(0);
      setLiked([]);
      setCats([]);

      await new Promise((r) => setTimeout(r, 0));
      const { w, h } = sizeForContainer(stackRef.current);

      const urls = await progressiveLoadCats(0, count, w, h);
      if (cancelled) return;

      setCats(urls);
      setPhase("playing");
    }
    boot();
    return () => { cancelled = true; };
  }, [count]);

  // If all cards are gone, show summary
  useEffect(() => {
    if (phase !== "playing") return;
    if (gone >= cats.length && cats.length > 0) setPhase("summary");
  }, [gone, cats.length, phase]);

  // Scroll to top when summary appears
  useEffect(() => {
    if (phase === "summary") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase]);

  // Remaining (remove from END)
  const remaining = useMemo(
    () => cats.slice(0, Math.max(0, cats.length - gone)),
    [cats, gone]
  );

  // Decision after animation completes (called by Card)
  const handleDecision = (decision, url) => {
    if (decision === "like") setLiked((prev) => [...prev, url]);
    setGone((g) => g + 1); // pop from tail
  };

  // Button handlers call into the top card's imperative API (animate out)
  const likeTop = () => topCardApiRef.current?.("like");
  const nopeTop = () => topCardApiRef.current?.("nope");

  // Optional: keyboard support for desktop (← dislike, → like)
  useEffect(() => {
    if (phase !== "playing" || remaining.length === 0) return;
    const onKey = (e) => {
      if (e.key === "ArrowRight") { e.preventDefault(); likeTop(); }
      if (e.key === "ArrowLeft")  { e.preventDefault(); nopeTop(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, remaining.length]);

  const reset = () => window.location.reload();

  return (
    <div className="page">
      <header className="app-header">
        <div className="branding">
          <span className="logo">🐾</span>
          <h1>Paws & Preferences</h1>
        </div>
        <button className="ghost" onClick={reset}>Reset</button>
      </header>

      <main className="container">
        {/* Hide the stack in summary to avoid extra top space */}
        {phase !== "summary" && (
          <section ref={stackRef} className="stack" aria-live="polite" aria-atomic="true">
            {phase === "loading" && <p style={{ color: "#fff" }}>Fetching cats…</p>}

            {phase === "playing" && remaining.length === 0 && (
              <p style={{ color: "#fff" }}>No cats loaded.</p>
            )}

            {phase === "playing" &&
              remaining.map((url, i, arr) => {
                const isTop = i === arr.length - 1;      // last one is top
                const ordinal = i + 1;                   // for label only
                const zIndex = 100 + i;

                return (
                  <Card
                    key={`${url}-${isTop}`}              // remount when top flips
                    src={url}
                    isTop={isTop}
                    ordinal={ordinal}
                    total={count}
                    zIndex={zIndex}
                    onDecision={(d) => handleDecision(d, url)}
                    // Give the top card an imperative control ref
                    requestDecisionRef={isTop ? topCardApiRef : undefined}
                  />
                );
              })
            }
          </section>
        )}

        {/* Buttons for non-swipe users */}
        {phase === "playing" && remaining.length > 0 && (
          <section className="controls" aria-hidden="false">
            <button
              className="ctrl dislike"
              aria-label="Dislike"
              onClick={nopeTop}
              type="button"
            >
              ✖
            </button>
            <button
              className="ctrl like"
              aria-label="Like"
              onClick={likeTop}
              type="button"
            >
              ❤
            </button>
          </section>
        )}

        {phase === "summary" && (
          <Summary liked={liked} total={count} onReswipe={reset} />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Cats from <a href="https://cataas.com" target="_blank" rel="noreferrer">Cataas</a>. Find your purrfect match!
        </p>
      </footer>
    </div>
  );
}
