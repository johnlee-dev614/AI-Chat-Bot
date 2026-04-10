import { useMemo } from "react";
import { motion } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulbData {
  x: number;
  y: number;
  r: number;
  color: string;
  opacity: number;
  flickerDelay: number;
  flickerDuration: number;
  swayOffset: number;
}

interface StrandData {
  wirePath: string;
  bulbs: BulbData[];
  swayDelay: number;
  swayDuration: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// Quadratic bezier point at t ∈ [0,1]
function bezierPoint(
  x1: number, y1: number,
  cx: number, cy: number,
  x2: number, y2: number,
  t: number,
): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * x1 + 2 * mt * t * cx + t * t * x2,
    mt * mt * y1 + 2 * mt * t * cy + t * t * y2,
  ];
}

// Seed-based pseudo-random (deterministic — no hydration mismatch)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Warm golden palette — slightly varied per bulb
const COLORS = [
  "rgba(255, 220, 100, VAL)",
  "rgba(255, 200, 80,  VAL)",
  "rgba(255, 230, 130, VAL)",
  "rgba(255, 190, 70,  VAL)",
  "rgba(255, 215, 110, VAL)",
];

// ── Strand generator ──────────────────────────────────────────────────────────

function generateStrand(
  x1: number, y1: number,
  x2: number, y2: number,
  sagY: number,           // control point Y (creates the catenary droop)
  sagX: number,           // control point X (usually midpoint)
  bulbCount: number,
  seed: number,
): StrandData {
  const rng = seededRandom(seed);

  // SVG quadratic bezier wire path
  const wirePath = `M ${x1} ${y1} Q ${sagX} ${sagY} ${x2} ${y2}`;

  // Place bulbs evenly along the bezier
  const bulbs: BulbData[] = [];
  for (let i = 0; i < bulbCount; i++) {
    const t = i / (bulbCount - 1);
    const [bx, by] = bezierPoint(x1, y1, sagX, sagY, x2, y2, t);

    const colorTemplate = COLORS[Math.floor(rng() * COLORS.length)];
    const opacity = 0.35 + rng() * 0.30; // 0.35–0.65 range
    const color = colorTemplate.replace("VAL", String(opacity.toFixed(2)));

    bulbs.push({
      x: bx,
      y: by,
      r: 2.5 + rng() * 1.8,          // 2.5–4.3px radius
      color,
      opacity,
      flickerDelay: rng() * 4,        // 0–4s delay
      flickerDuration: 2.5 + rng() * 2.5, // 2.5–5s cycle
      swayOffset: rng() * 3 - 1.5,   // ±1.5px random sway
    });
  }

  return {
    wirePath,
    bulbs,
    swayDelay: rng() * 2,
    swayDuration: 5 + rng() * 4,     // 5–9s sway cycle
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function StringLights() {
  const W = 1440; // reference width — scales via viewBox
  const H = 460;  // height of the SVG canvas within the hero

  const strands = useMemo<StrandData[]>(() => [
    // Strand A — full width, deeper sag, runs across upper area
    generateStrand(-30, 30, W + 30, 20, 155, W * 0.52, 18, 1),
    // Strand B — slightly lower start, shallower
    generateStrand(-60, 70, W * 0.72, 55, 185, W * 0.35, 14, 2),
    // Strand C — right-biased strand, more intimate droop
    generateStrand(W * 0.28, 45, W + 40, 65, 200, W * 0.66, 14, 3),
    // Strand D — very top, barely drooping, wide
    generateStrand(-20, 8, W + 20, 5, 90, W * 0.48, 22, 4),
    // Strand E — tighter, mid-section, cozy cluster
    generateStrand(W * 0.05, 110, W * 0.95, 100, 240, W * 0.5, 16, 5),
  ], []);

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes sl-flicker {
          0%, 100% { opacity: var(--sl-lo); }
          18%       { opacity: var(--sl-hi); }
          22%       { opacity: var(--sl-lo); }
          45%       { opacity: var(--sl-hi); }
          55%       { opacity: var(--sl-mid); }
          72%       { opacity: var(--sl-hi); }
          80%       { opacity: var(--sl-lo); }
          88%       { opacity: var(--sl-hi); }
        }
        @keyframes sl-sway {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(var(--sl-sway, 3px)); }
        }
      `}</style>

      {/* The SVG — positioned absolutely within the hero section */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 pointer-events-none z-0 overflow-hidden"
        style={{ height: `${H}px` }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMax meet"
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <defs>
            {/* Tight bright core glow */}
            <filter id="sl-glow-tight" x="-200%" y="-200%" width="500%" height="500%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Wide soft halo glow */}
            <filter id="sl-glow-wide" x="-600%" y="-600%" width="1300%" height="1300%">
              <feGaussianBlur stdDeviation="18" result="halo" />
            </filter>

            {/* Combined: inner core + outer halo */}
            <filter id="sl-glow-bulb" x="-500%" y="-500%" width="1100%" height="1100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="core" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="halo" />
              <feMerge>
                <feMergeNode in="halo" />
                <feMergeNode in="core" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Wire line filter — very subtle */}
            <filter id="sl-wire-blur">
              <feGaussianBlur stdDeviation="0.4" />
            </filter>
          </defs>

          {strands.map((strand, si) => (
            <motion.g
              key={si}
              initial={false}
              animate={{ y: [0, 3, 0, -2, 0] }}
              transition={{
                duration: strand.swayDuration,
                delay: strand.swayDelay,
                repeat: Infinity,
                ease: "easeInOut",
                repeatType: "mirror",
              }}
            >
              {/* Wire */}
              <path
                d={strand.wirePath}
                fill="none"
                stroke="rgba(180, 140, 60, 0.18)"
                strokeWidth="0.7"
                filter="url(#sl-wire-blur)"
              />

              {/* Bulbs */}
              {strand.bulbs.map((b, bi) => (
                <g key={bi}>
                  {/* Outer wide halo */}
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r * 3.5}
                    fill={b.color.replace(/[\d.]+\)$/, "0.18)")}
                    filter="url(#sl-glow-wide)"
                    style={{
                      animation: `sl-flicker ${b.flickerDuration}s ${b.flickerDelay}s infinite ease-in-out`,
                      "--sl-lo": "0.4",
                      "--sl-mid": "0.7",
                      "--sl-hi": "1.0",
                    } as React.CSSProperties}
                  />
                  {/* Inner glow bulb */}
                  <circle
                    cx={b.x}
                    cy={b.y}
                    r={b.r}
                    fill={b.color}
                    filter="url(#sl-glow-bulb)"
                    style={{
                      animation: `sl-flicker ${b.flickerDuration}s ${b.flickerDelay}s infinite ease-in-out`,
                      "--sl-lo": "0.55",
                      "--sl-mid": "0.8",
                      "--sl-hi": "1.0",
                    } as React.CSSProperties}
                  />
                </g>
              ))}
            </motion.g>
          ))}
        </svg>

        {/* Bottom fade — ensures lights dissolve into the dark background smoothly */}
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            height: "180px",
            background: "linear-gradient(to bottom, transparent 0%, hsl(var(--background)) 100%)",
          }}
        />
      </div>
    </>
  );
}
