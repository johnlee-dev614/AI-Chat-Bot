import { useMemo } from "react";

// Seeded PRNG so lights are consistent across renders
function prng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 15), s | 1);
    s ^= s + Math.imul(s ^ (s >>> 7), s | 61);
    return ((s ^ (s >>> 14)) >>> 0) / 4294967296;
  };
}

interface BulbData {
  xPct: number;
  droopY: number;
  animName: string;
  duration: number;
  delay: number;
  glowRadius: number;
  color: string;
}

interface StringData {
  yPct: number;
  xStartPct: number;
  xEndPct: number;
  bulbCount: number;
  sag: number;
  swayDuration: number;
  swayDelay: number;
  bulbs: BulbData[];
}

const STRING_CONFIGS = [
  { yPct: 8,  xStart: -4,  xEnd: 104, count: 11, sag: 7,  swayDur: 10, swayDelay: 0   },
  { yPct: 26, xStart:  6,  xEnd:  94, count:  9, sag: 10, swayDur: 13, swayDelay: 1.8 },
  { yPct: 46, xStart: -6,  xEnd: 106, count: 13, sag:  6, swayDur:  9, swayDelay: 0.9 },
];

// Warm golden bulb colours — subtle variety so it doesn't look uniform
const BULB_COLORS = [
  { core: "#ffe480", mid: "#ffb733", outer: "255, 160, 30" },
  { core: "#fff0a0", mid: "#ffd060", outer: "255, 190, 60" },
  { core: "#ffd060", mid: "#ffa020", outer: "255, 130, 20" },
];

function buildStrings(): StringData[] {
  const rand = prng(0xdeadbeef);
  return STRING_CONFIGS.map((cfg) => {
    const bulbs: BulbData[] = [];
    for (let i = 0; i < cfg.count; i++) {
      const t = i / (cfg.count - 1);
      const xPct = cfg.xStart + (cfg.xEnd - cfg.xStart) * t;
      // Catenary droop: dips most in the middle
      const droopY = cfg.sag * Math.sin(t * Math.PI);
      // ~30 % of bulbs get the rare-flicker animation
      const flickers = rand() > 0.68;
      const animName = flickers ? "sl-flicker" : "sl-pulse";
      const duration = 3.5 + rand() * 4.5; // 3.5 – 8 s
      const delay    = rand() * 6;         // 0 – 6 s offset
      const glowRadius = 9 + rand() * 10;  // 9 – 19 px
      const color = BULB_COLORS[Math.floor(rand() * BULB_COLORS.length)];
      bulbs.push({ xPct, droopY, animName, duration, delay, glowRadius, color: JSON.stringify(color) });
    }
    return {
      yPct: cfg.yPct,
      xStartPct: cfg.xStart,
      xEndPct: cfg.xEnd,
      bulbCount: cfg.count,
      sag: cfg.sag,
      swayDuration: cfg.swayDur,
      swayDelay: cfg.swayDelay,
      bulbs,
    };
  });
}

export function StringLights() {
  const strings = useMemo(() => buildStrings(), []);

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes sl-pulse {
          0%, 100% { opacity: 0.50; }
          50%       { opacity: 0.82; }
        }
        @keyframes sl-flicker {
          0%,  17%, 19%, 21%, 23%, 52%, 56%, 100% { opacity: 0.52; }
          18%, 20%                                 { opacity: 0.06; }
          22%                                      { opacity: 0.35; }
          53%, 55%                                 { opacity: 0.12; }
          54%                                      { opacity: 0.48; }
        }
        @keyframes sl-sway {
          0%,  100% { transform: translateX(0px) translateY(0px); }
          25%        { transform: translateX(2.5px) translateY(1px); }
          75%        { transform: translateX(-1.8px) translateY(-0.6px); }
        }
      `}</style>

      {/* Overlay container — sits behind hero text */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "hidden",
          opacity: 0.9,
        }}
      >
        {strings.map((str, si) => (
          <div
            key={si}
            style={{
              position: "absolute",
              top: `${str.yPct}%`,
              left: 0,
              right: 0,
              height: `${str.sag + 24}px`,
              animation: `sl-sway ${str.swayDuration}s ${str.swayDelay}s ease-in-out infinite`,
            }}
          >
            {/* Wire — very faint catenary curve */}
            <svg
              viewBox={`0 0 1000 ${str.sag + 12}`}
              preserveAspectRatio="none"
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: `${str.sag + 12}px` }}
            >
              <path
                d={`M ${(str.xStartPct / 100) * 1000} 2 Q 500 ${str.sag + 4} ${(str.xEndPct / 100) * 1000} 2`}
                fill="none"
                stroke="rgba(255, 190, 80, 0.10)"
                strokeWidth="0.7"
              />
            </svg>

            {/* Bulbs */}
            {str.bulbs.map((bulb, bi) => {
              const col = JSON.parse(bulb.color) as (typeof BULB_COLORS)[0];
              return (
                <div
                  key={bi}
                  style={{
                    position: "absolute",
                    left: `${bulb.xPct}%`,
                    top: `${bulb.droopY}px`,
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle at 35% 35%, ${col.core} 0%, ${col.mid} 55%, transparent 100%)`,
                    boxShadow: [
                      `0 0 ${bulb.glowRadius * 0.5}px ${bulb.glowRadius * 0.25}px rgba(${col.outer}, 0.65)`,
                      `0 0 ${bulb.glowRadius}px ${bulb.glowRadius * 0.4}px rgba(${col.outer}, 0.30)`,
                      `0 0 ${bulb.glowRadius * 2}px ${bulb.glowRadius * 0.8}px rgba(${col.outer}, 0.10)`,
                    ].join(", "),
                    filter: "blur(0.4px)",
                    animation: `${bulb.animName} ${bulb.duration}s ${bulb.delay}s ease-in-out infinite`,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
