import { useMemo } from "react";

// Seeded PRNG — same result on every render
function prng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Coordinate system ────────────────────────────────────────────────────────
// viewBox: 0 0 1000 600
//   x 0–1000  →  full width of the section
//   y 0–600   →  full height of the section
//
// Hero text occupies roughly:
//   x: 150–850  (centered within max-w-5xl on a ~1280 px viewport)
//   y: 200–480  (after pt-52 top padding, badge → heading → p → CTA)
//
// All bulbs are placed OUTSIDE that box — above (y < 150) or on
// the far left/right wings (x < 220 or x > 780) only.
// ─────────────────────────────────────────────────────────────────────────────

interface StringCfg {
  /** quadratic bezier: start, control, end — all in viewBox units */
  p0: [number, number];
  p1: [number, number]; // control point
  p2: [number, number];
  count: number;
  swayDur: number;
  swayDelay: number;
}

const STRINGS: StringCfg[] = [
  // ── Top framing arcs — hang above all text ────────────────────────────────
  // Wide primary arc: left edge → right edge, dips to ~y=100 at center
  { p0: [-40, 20],  p1: [500, 120], p2: [1040, 20],  count: 15, swayDur: 11, swayDelay: 0   },
  // Second arc, slightly higher and fewer bulbs
  { p0: [-30,  4],  p1: [500,  75], p2: [1030,  4],  count: 11, swayDur: 14, swayDelay: 1.6 },

  // ── Upper-corner drapes — angled down from top corners ───────────────────
  // Left: from top-left into the left 28% of the frame
  { p0: [-40, 25],  p1: [120, 145], p2: [280, 135], count: 8, swayDur: 10, swayDelay: 0.8 },
  // Right: mirror
  { p0: [720, 135], p1: [880, 145], p2: [1040, 25], count: 8, swayDur: 10, swayDelay: 2.2 },

  // ── Lower-corner accents — below the CTA button ───────────────────────────
  // Left lower (y ≈ 490–560, below text block which ends ~480)
  { p0: [-30, 490], p1: [120, 555], p2: [220, 540], count: 6, swayDur:  9, swayDelay: 1.4 },
  // Right lower mirror
  { p0: [780, 540], p1: [880, 555], p2: [1030, 490], count: 6, swayDur:  9, swayDelay: 0.5 },
];

// Warm golden palette
const PALETTES = [
  { core: "#fff2a0", mid: "#ffc44d", outer: "255, 185, 50" },
  { core: "#ffe680", mid: "#ffaa30", outer: "255, 150, 30" },
  { core: "#fff0b0", mid: "#ffd060", outer: "255, 200, 60" },
];

interface Bulb {
  x: number;
  y: number;
  r: number;
  outerR: number;
  palIdx: number;
  baseOpacity: number;
  dur: number;
  delay: number;
  flicker: boolean;
}

function evalBezier(t: number, p0: [number, number], p1: [number, number], p2: [number, number]): [number, number] {
  const mt = 1 - t;
  return [
    mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
    mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1],
  ];
}

function buildBulbs(strings: StringCfg[]): { cfg: StringCfg; bulbs: Bulb[] }[] {
  const rand = prng(0xfeedface);
  return strings.map((cfg) => {
    const bulbs: Bulb[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const t = cfg.count === 1 ? 0.5 : i / (cfg.count - 1);
      const [x, y] = evalBezier(t, cfg.p0, cfg.p1, cfg.p2);
      bulbs.push({
        x,
        y,
        r: 3.5 + rand() * 2,
        outerR: 10 + rand() * 12,
        palIdx: Math.floor(rand() * PALETTES.length),
        baseOpacity: 0.40 + rand() * 0.30,
        dur: 3.5 + rand() * 5,
        delay: rand() * 7,
        flicker: rand() > 0.72,
      });
    }
    return { cfg, bulbs };
  });
}

export function StringLights() {
  const data = useMemo(() => buildBulbs(STRINGS), []);

  return (
    <>
      <style>{`
        @keyframes sl-pulse {
          0%, 100% { opacity: 0.50; }
          50%       { opacity: 0.82; }
        }
        @keyframes sl-flicker {
          0%,  16%, 18%, 20%, 51%, 55%, 100% { opacity: 0.52; }
          17%, 19%                             { opacity: 0.04; }
          52%, 54%                             { opacity: 0.20; }
        }
        @keyframes sl-sway {
          0%,  100% { transform: translateX(0px)    translateY(0px); }
          30%        { transform: translateX(2.5px)  translateY(1px); }
          70%        { transform: translateX(-1.8px) translateY(-0.7px); }
        }
      `}</style>

      {/*
        Single SVG overlay covering the hero section.
        viewBox 0 0 1000 600 — strings are laid out to avoid the text zone
        (roughly x 150–850, y 200–480).
      */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1,
          overflow: "visible",
          opacity: 0.92,
        }}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Soft diffuse glow — large, blurry ring around each bulb */}
          <filter id="sl-outer-glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
            </feMerge>
          </filter>
          {/* Tight inner glow — keeps the core crisp-ish */}
          <filter id="sl-inner-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {data.map(({ cfg, bulbs }, si) => {
          const [wx0, wy0] = cfg.p0;
          const [wx1, wy1] = cfg.p1;
          const [wx2, wy2] = cfg.p2;

          return (
            <g
              key={si}
              style={{
                animation: `sl-sway ${cfg.swayDur}s ${cfg.swayDelay}s ease-in-out infinite`,
                transformOrigin: `${(wx0 + wx2) / 2}px ${(wy0 + wy2) / 2}px`,
                transformBox: "fill-box",
              }}
            >
              {/* Wire — very faint catenary curve */}
              <path
                d={`M ${wx0} ${wy0} Q ${wx1} ${wy1} ${wx2} ${wy2}`}
                fill="none"
                stroke="rgba(255, 195, 80, 0.09)"
                strokeWidth="0.7"
              />

              {/* Bulbs */}
              {bulbs.map((b, bi) => {
                const pal = PALETTES[b.palIdx];
                const anim = b.flicker ? "sl-flicker" : "sl-pulse";
                const animVal = `${anim} ${b.dur}s ${b.delay}s ease-in-out infinite`;

                return (
                  <g key={bi}>
                    {/* Wide diffuse outer glow */}
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={b.outerR}
                      fill={`rgba(${pal.outer}, ${(b.baseOpacity * 0.45).toFixed(2)})`}
                      filter="url(#sl-outer-glow)"
                      style={{ animation: animVal }}
                    />
                    {/* Mid halo */}
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={b.r * 2.2}
                      fill={`rgba(${pal.outer}, ${(b.baseOpacity * 0.6).toFixed(2)})`}
                      filter="url(#sl-inner-glow)"
                      style={{ animation: animVal }}
                    />
                    {/* Bright inner core */}
                    <circle
                      cx={b.x}
                      cy={b.y}
                      r={b.r}
                      fill={pal.core}
                      style={{ animation: animVal }}
                    />
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </>
  );
}
