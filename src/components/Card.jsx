import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useDrag } from "@use-gesture/react";

const THRESHOLD = 88;
const MAX_DRAG_X_RATIO = 0.35;
const MAX_DRAG_Y = 100;

export default function Card({
  src,
  isTop,
  ordinal,
  total,
  zIndex,
  onDecision,
  requestDecisionRef,   // <- optional ref from parent to trigger programmatic swipe
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]);

  const likeOpacity = useTransform(x, [60, 140], [0, 1]);
  const nopeOpacity = useTransform(x, [-60, -140], [0, 1]);

  // Scale + shadow intensity while dragging (subtle polish)
  const scale = useTransform(x, [-200, 0, 200], [0.96, 1, 1.06]);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const vw = typeof window !== "undefined" ? window.innerWidth : 360;
  const MAX_X = MAX_DRAG_X_RATIO * vw;

  // Imperative handler for buttons (like/nope)
  const flyOut = (dir) => {
    if (!isTop) return; // only top can be thrown
    const passLeft = dir === "nope";
    if (navigator.vibrate) {
      navigator.vibrate(passLeft ? [30, 60] : 40);
    }
    const flyX = (passLeft ? -1 : 1) * (vw * 1.2);
    const rotTarget = passLeft ? -14 : 14;

    animate(x, flyX, { duration: 0.24, ease: "easeOut" }).then(() =>
      onDecision(passLeft ? "nope" : "like")
    );
    animate(rotate, rotTarget, { duration: 0.24, ease: "easeOut" });
  };

  // Expose the imperative function to the parent for the top card
  if (requestDecisionRef && typeof requestDecisionRef === "object") {
    requestDecisionRef.current = flyOut;
  }

  // Gesture
  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx], direction: [dxDir] }) => {
      if (!isTop) return;

      if (down) {
        x.set(clamp(mx, -MAX_X, MAX_X));
        y.set(clamp(my, -MAX_DRAG_Y, MAX_DRAG_Y));
        return;
      }

      const passRight = mx > THRESHOLD || (vx > 0.5 && dxDir > 0);
      const passLeft  = mx < -THRESHOLD || (vx > 0.5 && dxDir < 0);

      if (passRight || passLeft) {
        flyOut(passLeft ? "nope" : "like");
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
        animate(y, 0, { type: "spring", stiffness: 500, damping: 30 });
        animate(rotate, 0, { type: "spring", stiffness: 500, damping: 30 });
      }
    },
    { pointer: { touch: true }, filterTaps: true }
  );

  return (
    <motion.article
      className={`card ${isTop ? "is-top" : ""}`}
      style={{
        x: isTop ? x : undefined,
        y: isTop ? y : undefined,
        rotate: isTop ? rotate : undefined,
        scale: isTop ? scale : 1,
        touchAction: isTop ? "none" : undefined,
        pointerEvents: isTop ? "auto" : "none",
        zIndex,
      }}
      {...bind()}
    >
      <motion.div className="hint like" style={{ opacity: likeOpacity }}>
        ❤ LIKE
      </motion.div>
      <motion.div className="hint dislike" style={{ opacity: nopeOpacity }}>
        ✖ NOPE
      </motion.div>

      <img src={src} alt={`Cat ${ordinal} of ${total}`} draggable="false" />

      <div className="meta">
        <span className="badge">Cat {ordinal} of {total}</span>
      </div>
    </motion.article>
  );
}
