/**
 * Motion tokens (model damping/response ala Apple) + helper kecil.
 * Prefer Reanimated springs; reduced-motion pakai opacity duration pendek.
 */
export type SpringPreset = {
  /** Damping ratio: 1 = critically damped; <1 overshoot */
  damping: number;
  /** Response dalam detik (kecepatan settle, bukan fixed duration) */
  response: number;
};

export const motion = {
  spring: {
    snappy: { damping: 1, response: 0.28 } satisfies SpringPreset,
    default: { damping: 1, response: 0.38 } satisfies SpringPreset,
    gentle: { damping: 1, response: 0.5 } satisfies SpringPreset,
    momentum: { damping: 0.8, response: 0.35 } satisfies SpringPreset,
  },
  press: {
    scale: 0.97,
    opacity: 0.85,
  },
  duration: {
    /** ms — reduced-motion / opacity paths */
    instant: 0,
    fast: 120,
    ui: 200,
  },
  rubberBand: {
    constant: 0.55,
  },
  /** Apple scroll-style projection deceleration */
  decelerationRate: 0.998,
} as const;

export type MotionTokens = typeof motion;

/**
 * Map Apple-style spring ke config Reanimated (approx).
 * stiffness ≈ (2π / response)^2 * mass; dampingRatio = damping.
 */
export function springConfig(preset: SpringPreset, mass = 1) {
  const stiffness = Math.pow((2 * Math.PI) / preset.response, 2) * mass;
  const damping = 2 * Math.sqrt(stiffness * mass) * preset.damping;
  return {
    mass,
    stiffness,
    damping,
    overshootClamping: preset.damping >= 1,
  };
}

/** Jarak proyeksi (px) dari velocity (px/s) — exponential decay Apple. */
export function projectVelocity(
  velocityPxPerSec: number,
  decelerationRate = motion.decelerationRate
): number {
  return (
    (velocityPxPerSec / 1000) * (decelerationRate / (1 - decelerationRate))
  );
}

/** Progressive resistance melewati bound (rubber-band). */
export function rubberband(
  overshoot: number,
  dimension: number,
  constant = motion.rubberBand.constant
): number {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}
