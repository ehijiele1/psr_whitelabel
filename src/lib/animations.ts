import type { Variants, Transition } from "framer-motion"

// ── Framer Motion variants (keep for gesture/layout/complex animations) ──────

export const pageTransition: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export const pageTransitionConfig: Transition = {
  duration: 0.3,
  ease: "easeInOut",
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export const cardHover = {
  whileHover: { y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.08)" },
  transition: { type: "spring" as const, stiffness: 300, damping: 20 },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: "easeOut" } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15, ease: "easeIn" } },
}

export const slideInRight: Variants = {
  hidden: { x: 100, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 200, damping: 25 } },
  exit: { x: 100, opacity: 0, transition: { duration: 0.2 } },
}

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
}

// ── CSS-class animation utilities ─────────────────────────────────────────────
// Use these for simple one-shot entrance effects instead of framer-motion.
// The corresponding keyframes are defined in globals.css and automatically
// respect prefers-reduced-motion.
//
// Usage:
//   <div className={cssAnim.slideUp}>...</div>
//   <li className={`${cssAnim.slideUp} ${cssAnim.stagger(index)}`}>...</li>

export const cssAnim = {
  fadeIn:       "animate-fade-in",
  slideUp:      "animate-slide-up",
  slideInRight: "animate-slide-in-right",
  scaleIn:      "animate-scale-in",
  /** Returns a CSS stagger-delay class for list items (capped at 5 steps). */
  stagger: (index: number) =>
    index === 0 ? "" : `stagger-${Math.min(index, 5)}` as const,
} as const
