import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCoachTour } from '../../context/CoachTourContext';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const TIP_W = 320;
const TIP_H = 200;
const MARGIN = 16;
const GAP = 14;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

/** Keep the full tip card inside the viewport, never under a large target. */
function placeTip(rect: Rect, preferred: string | undefined): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const maxLeft = vw - TIP_W - MARGIN;
  const maxTop = vh - TIP_H - MARGIN;

  const candidates: Array<{ top: number; left: number; score: number }> = [];

  const push = (top: number, left: number, score: number) => {
    candidates.push({
      top: clamp(top, MARGIN, Math.max(MARGIN, maxTop)),
      left: clamp(left, MARGIN, Math.max(MARGIN, maxLeft)),
      score,
    });
  };

  // Preferred sides first
  const order =
    preferred === 'right'
      ? (['right', 'left', 'bottom', 'top'] as const)
      : preferred === 'left'
        ? (['left', 'right', 'bottom', 'top'] as const)
        : preferred === 'top'
          ? (['top', 'bottom', 'right', 'left'] as const)
          : (['bottom', 'top', 'right', 'left'] as const);

  for (const side of order) {
    if (side === 'right') {
      push(rect.top + rect.height / 2 - TIP_H / 2, rect.left + rect.width + GAP, 4);
    } else if (side === 'left') {
      push(rect.top + rect.height / 2 - TIP_H / 2, rect.left - TIP_W - GAP, 4);
    } else if (side === 'top') {
      push(rect.top - TIP_H - GAP, rect.left + rect.width / 2 - TIP_W / 2, 3);
    } else {
      push(rect.top + rect.height + GAP, rect.left + rect.width / 2 - TIP_W / 2, 3);
    }
  }

  // Safe fallbacks when the target is huge (filters board, etc.)
  push(MARGIN, vw - TIP_W - MARGIN, 1);
  push(vh - TIP_H - MARGIN, vw - TIP_W - MARGIN, 1);
  push(MARGIN, MARGIN, 0);

  // Prefer placements that don't overlap the highlighted rect
  let best = candidates[0];
  for (const c of candidates) {
    const tip = { top: c.top, left: c.left, width: TIP_W, height: TIP_H };
    const overlaps =
      tip.left < rect.left + rect.width &&
      tip.left + tip.width > rect.left &&
      tip.top < rect.top + rect.height &&
      tip.top + tip.height > rect.top;
    const score = c.score + (overlaps ? -5 : 2);
    if (!best || score > best.score) best = { ...c, score };
  }

  return { top: best.top, left: best.left, transform: 'none' };
}

export default function CoachSpotlight() {
  const { active, current, index, steps, phase, next, prev, skip } = useCoachTour();
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!active || !current) {
      setRect(null);
      return;
    }

    const measure = () => {
      // Do NOT raise the target's z-index — that lets large sections cover the tip.
      document.querySelectorAll('[data-coach-id].coach-target-active').forEach((n) => {
        n.classList.remove('coach-target-active');
      });
      const el = document.querySelector(`[data-coach-id="${current.target}"]`) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      el.classList.add('coach-target-active');
      const r = el.getBoundingClientRect();
      const pad = 8;
      setRect({
        top: r.top - pad,
        left: r.left - pad,
        width: r.width + pad * 2,
        height: r.height + pad * 2,
      });
    };

    measure();
    const t = window.setTimeout(measure, 120);
    const t2 = window.setTimeout(measure, 450);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(t2);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
      document.querySelectorAll('[data-coach-id].coach-target-active').forEach((n) => {
        n.classList.remove('coach-target-active');
      });
    };
  }, [active, current, index, phase]);

  const tipStyle = useMemo(() => {
    if (!rect || !current) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as React.CSSProperties;
    }
    return placeTip(rect, current.placement);
  }, [rect, current]);

  return createPortal(
    <>
      <AnimatePresence>
        {phase === 'thinking' && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="coach-thinking-glow"
            aria-hidden
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'redirecting' && (
          <motion.div
            key="redirect"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="coach-redirect-glow"
            aria-hidden
          >
            <motion.div
              className="coach-redirect-bar"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            />
            <p className="coach-redirect-label">Taking you there…</p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && current && phase === 'highlighting' && (
          <motion.div
            key={`spot-${index}-${current.target}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="coach-spotlight-root"
          >
            <div className="coach-spotlight-dim" aria-hidden />
            {rect && (
              <div
                className="coach-spotlight-ring"
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: Math.min(rect.height, window.innerHeight - 24),
                }}
              />
            )}

            <motion.div
              className="coach-spotlight-tip"
              style={tipStyle}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    Step {index + 1} of {steps.length}
                  </p>
                  <h3 className="text-[17px] font-semibold tracking-[-0.02em] text-ink mt-1">
                    {current.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={skip}
                  className="p-1.5 rounded-full hover:bg-soft text-muted"
                  aria-label="End tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[14px] text-muted leading-relaxed">{current.body}</p>
              <div className="flex items-center justify-between gap-2 mt-4">
                <button
                  type="button"
                  onClick={prev}
                  disabled={index === 0}
                  className="inline-flex items-center gap-1 px-3 py-2 text-[13px] font-medium rounded-full border border-line disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex items-center gap-1 px-4 py-2 text-[13px] font-medium rounded-full bg-ink text-white hover:bg-black"
                >
                  {index + 1 >= steps.length ? 'Done' : 'Next'}
                  {index + 1 < steps.length && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>,
    document.body,
  );
}
