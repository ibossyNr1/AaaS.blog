"use client";

import { useEffect, useRef } from "react";

const LABELED_RINGS = [
  { name: "brand",    size: 820, r: 390, duration: 50, reverse: false, color: "cyan",  dotSize: 8, fontSize: 11 },
  { name: "context",  size: 620, r: 290, duration: 38, reverse: true,  color: "red",   dotSize: 7, fontSize: 10 },
  { name: "industry", size: 440, r: 200, duration: 28, reverse: false, color: "cyan",  dotSize: 5, fontSize: 9 },
  { name: "strategy", size: 290, r: 130, duration: 20, reverse: true,  color: "red",   dotSize: 4, fontSize: 8 },
];

const GHOST_RINGS = [
  { size: 880, r: 435, duration: 70, reverse: true,  style: "solid" as const },
  { size: 740, r: 365, duration: 55, reverse: false, style: "dashed" as const },
  { size: 530, r: 260, duration: 42, reverse: true,  style: "solid" as const },
  { size: 360, r: 175, duration: 32, reverse: false, style: "dashed" as const },
  { size: 210, r: 100, duration: 24, reverse: true,  style: "solid" as const },
];

interface OrbitalBackgroundProps {
  planetScale?: number;
  /** Hide ghost rings, gravity threads, outer boundary — keep labeled orbit text */
  minimal?: boolean;
  /** Offset from center as percentage, e.g. { x: 25, y: 10 } shifts 25% right, 10% down */
  offset?: { x: number; y: number };
}

export function OrbitalBackground({ planetScale = 1, minimal = false, offset }: OrbitalBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nebulaRef = useRef<HTMLDivElement>(null);
  const starRef = useRef<HTMLDivElement>(null);
  const flareRef = useRef<{
    core: HTMLDivElement | null;
    streak: HTMLDivElement | null;
    starburst: HTMLDivElement | null;
    ring: HTMLDivElement | null;
    ghost: HTMLDivElement | null;
    far: HTMLDivElement | null;
  }>({ core: null, streak: null, starburst: null, ring: null, ghost: null, far: null });

  useEffect(() => {
    const starField = starRef.current;
    if (!starField || starField.children.length > 0) return;
    for (let i = 0; i < 120; i++) {
      const star = document.createElement("div");
      const size = Math.random() < 0.85 ? Math.random() * 1.5 + 0.5 : Math.random() * 2.5 + 1.5;
      const baseOp = Math.random() * 0.4 + 0.1;
      Object.assign(star.style, {
        position: "absolute",
        borderRadius: "50%",
        background: "rgb(var(--text))",
        width: `${size}px`,
        height: `${size}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        opacity: `${baseOp}`,
        boxShadow: `0 0 ${size * 2}px rgb(var(--text) / ${baseOp * 0.3})`,
        animation: `twinkle ${Math.random() * 4 + 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 5}s`,
      });
      starField.appendChild(star);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const cx = (e.clientX / vw - 0.5) * 2;
      const cy = (e.clientY / vh - 0.5) * 2;

      if (containerRef.current) containerRef.current.style.transform = `translate(${cx * -30}px, ${cy * -30}px)`;
      if (nebulaRef.current) nebulaRef.current.style.transform = `translate(${cx * -16}px, ${cy * -16}px)`;
      if (starRef.current) starRef.current.style.transform = `translate(${cx * -6}px, ${cy * -6}px)`;

      const { core, streak, starburst, ring, ghost, far } = flareRef.current;
      if (!core) return;

      const mx = e.clientX;
      const my = e.clientY;
      // Planet center accounts for offset prop
      const planetX = vw / 2 + (offset ? (offset.x / 100) * 900 : 0);
      const planetY = vh / 2 + (offset ? (offset.y / 100) * 900 : 0);
      const dx = mx - planetX;
      const dy = my - planetY;

      // Core: 30% from planet toward mouse
      const coreX = planetX + dx * 0.3;
      const coreY = planetY + dy * 0.3;
      core.style.left = `${coreX}px`;
      core.style.top = `${coreY}px`;
      starburst!.style.left = `${coreX}px`;
      starburst!.style.top = `${coreY}px`;

      // Streak at midpoint
      streak!.style.left = `${planetX + dx * 0.5}px`;
      streak!.style.top = `${planetY + dy * 0.5}px`;

      // Far flare beyond mouse (1.3x)
      far!.style.left = `${planetX + dx * 1.3}px`;
      far!.style.top = `${planetY + dy * 1.3}px`;

      // Ring mirrored through planet center
      ring!.style.left = `${planetX - dx * 0.35}px`;
      ring!.style.top = `${planetY - dy * 0.35}px`;

      // Ghost further mirrored
      ghost!.style.left = `${planetX - dx * 0.6}px`;
      ghost!.style.top = `${planetY - dy * 0.6}px`;

      // Intensity based on distance from planet center (normalized)
      const normDx = (mx - planetX) / (vw / 2);
      const normDy = (my - planetY) / (vh / 2);
      const dist = Math.min(Math.sqrt(normDx * normDx + normDy * normDy) * 1.2, 1);
      core.style.opacity = `${dist * 0.7}`;
      starburst!.style.opacity = `${dist * 0.5}`;
      streak!.style.opacity = `${dist * 0.5}`;
      far!.style.opacity = `${dist * 0.6}`;
      ring!.style.opacity = `${dist * 0.4}`;
      ghost!.style.opacity = `${dist * 0.35}`;

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      streak!.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
    };

    document.addEventListener("mousemove", handleMouseMove);
    return () => document.removeEventListener("mousemove", handleMouseMove);
  }, [offset]);

  const dotColor = (c: string) =>
    c === "cyan" ? "rgb(var(--circuit-glow))" : c === "red" ? "rgb(var(--accent-red))" : "rgb(var(--text))";

  const dotGlow = (c: string) =>
    c === "cyan"
      ? "0 0 10px rgb(var(--circuit-glow)), 0 0 25px var(--circuit-dim)"
      : c === "red"
        ? "0 0 8px rgb(var(--accent-red)), 0 0 22px var(--accent-red-dim)"
        : "0 0 8px rgb(var(--text)), 0 0 20px var(--circuit-dim)";

  const labelColor = (c: string) =>
    c === "cyan" ? "rgb(var(--circuit-glow) / 0.5)" : c === "red" ? "rgb(var(--accent-red) / 0.5)" : "rgb(var(--circuit-glow) / 0.6)";

  const ringStroke = (c: string) =>
    c === "cyan" ? "rgb(var(--circuit-glow) / 0.06)" : c === "red" ? "rgb(var(--accent-red) / 0.05)" : "rgb(var(--circuit-glow) / 0.07)";

  const ghostStroke = (i: number) =>
    i === 1 ? "rgb(var(--circuit-glow) / 0.03)" : "rgb(var(--accent-red) / 0.025)";

  return (
    <>
      {/* Star field */}
      <div ref={starRef} className="orbital-star-field fixed inset-0 z-0 pointer-events-none transition-transform duration-200 ease-out" />

      {/* Nebula */}
      <div ref={nebulaRef} className="orbital-nebula fixed inset-0 z-[1] pointer-events-none overflow-hidden transition-transform duration-[180ms] ease-out">
        <div className="absolute w-[65vw] h-[65vw] top-[5%] left-[-15%] rounded-full blur-[80px] opacity-70 animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--circuit-glow) / 0.18), transparent 70%)" }} />
        <div className="absolute w-[55vw] h-[55vw] bottom-[-10%] right-[-15%] rounded-full blur-[80px] opacity-60 animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--accent-red) / 0.14), transparent 65%)", animationDelay: "-8s", animationDuration: "30s" }} />
        <div className="absolute w-[40vw] h-[40vw] top-[25%] right-[5%] rounded-full blur-[80px] opacity-[0.55] animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--circuit-glow) / 0.12), transparent 60%)", animationDelay: "-14s", animationDuration: "22s" }} />
        <div className="absolute w-[45vw] h-[45vw] bottom-[10%] left-[10%] rounded-full blur-[80px] opacity-50 animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--accent-red) / 0.1), transparent 60%)", animationDelay: "-5s", animationDuration: "28s" }} />
        {/* Pastel nebula blobs — visible especially in light mode */}
        <div className="absolute w-[50vw] h-[50vw] top-[-5%] right-[-10%] rounded-full blur-[100px] opacity-40 animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--pastel-lavender) / 0.15), transparent 65%)", animationDelay: "-10s", animationDuration: "35s" }} />
        <div className="absolute w-[40vw] h-[40vw] bottom-[5%] left-[20%] rounded-full blur-[100px] opacity-[0.35] animate-aura-drift" style={{ background: "radial-gradient(circle, rgb(var(--pastel-mint) / 0.12), transparent 65%)", animationDelay: "-15s", animationDuration: "28s" }} />
      </div>

      {/* Lens flare — dark mode only, elements along center-to-mouse axis */}
      <div className="orbital-flare fixed inset-0 pointer-events-none z-[15] mix-blend-screen">
        <div ref={(el) => { flareRef.current.far = el; }} className="absolute w-[200px] h-[200px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06), rgba(0,243,255,0.03) 40%, transparent 70%)" }} />
        <div ref={(el) => { flareRef.current.starburst = el; }} className="absolute w-[160px] h-[160px] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "linear-gradient(0deg,transparent 45%,rgba(255,255,255,0.04) 49%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.04) 51%,transparent 55%),linear-gradient(90deg,transparent 45%,rgba(255,255,255,0.04) 49%,rgba(255,255,255,0.06) 50%,rgba(255,255,255,0.04) 51%,transparent 55%),linear-gradient(45deg,transparent 45%,rgba(0,243,255,0.03) 49%,rgba(0,243,255,0.04) 50%,rgba(0,243,255,0.03) 51%,transparent 55%),linear-gradient(-45deg,transparent 45%,rgba(0,243,255,0.03) 49%,rgba(0,243,255,0.04) 50%,rgba(0,243,255,0.03) 51%,transparent 55%)" }} />
        <div ref={(el) => { flareRef.current.core = el; }} className="absolute w-[80px] h-[80px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.12), rgba(0,243,255,0.06) 40%, transparent 70%)" }} />
        <div ref={(el) => { flareRef.current.streak = el; }} className="absolute w-[400px] h-[1.5px] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "linear-gradient(90deg, transparent 5%, rgba(0,243,255,0.1), rgba(255,255,255,0.06), rgba(244,63,108,0.08), transparent 95%)" }} />
        <div ref={(el) => { flareRef.current.ring = el; }} className="absolute w-[50px] h-[50px] rounded-full border border-circuit/[0.07] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(circle, rgba(0,243,255,0.02), transparent 70%)" }} />
        <div ref={(el) => { flareRef.current.ghost = el; }} className="absolute w-[35px] h-[35px] rounded-full -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-300" style={{ background: "radial-gradient(circle, rgba(244,63,108,0.05), transparent 70%)" }} />
      </div>

      {/* Orbital system */}
      <div ref={containerRef} className="fixed inset-0 z-[2] flex items-center justify-center transition-transform duration-150 ease-out pointer-events-none">
        <div
          className="relative w-[900px] h-[900px] flex items-center justify-center"
          style={offset ? { transform: `translate(${offset.x}%, ${offset.y}%)` } : undefined}
        >

          {!minimal && (
            <>
              {/* Static outer boundary */}
              <svg className="absolute w-full h-full" viewBox="0 0 900 900" aria-hidden="true">
                <circle cx="450" cy="450" r="445" stroke="var(--border)" fill="none" strokeWidth="1" />
              </svg>

              {/* Ghost rings */}
              {GHOST_RINGS.map((g, i) => (
                <div
                  key={`ghost-${i}`}
                  className="absolute rounded-full animate-orbit pointer-events-none"
                  style={{ width: g.size, height: g.size, animationDuration: `${g.duration}s`, animationDirection: g.reverse ? "reverse" : "normal" }}
                >
                  <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${g.size} ${g.size}`}>
                    <circle
                      cx={g.size / 2}
                      cy={g.size / 2}
                      r={g.r}
                      fill="none"
                      strokeWidth={g.style === "solid" ? "0.5" : "1"}
                      strokeDasharray={g.style === "dashed" ? (i === 1 ? "4 12" : "3 10") : undefined}
                      stroke={
                        g.style === "solid"
                          ? "var(--border)"
                          : ghostStroke(i)
                      }
                    />
                  </svg>
                </div>
              ))}

              {/* Gravity threads */}
              <svg className="absolute w-[900px] h-[900px] pointer-events-none z-[5]" viewBox="0 0 900 900" aria-hidden="true">
                {[
                  { x1: 450, y1: 40, cls: "cyan", delay: 0 },
                  { x1: 450, y1: 860, cls: "red", delay: 1 },
                  { x1: 140, y1: 450, cls: "cyan", delay: 2 },
                  { x1: 760, y1: 450, cls: "red", delay: 3 },
                  { x1: 450, y1: 365, cls: "white", delay: 0.5 },
                ].map((t, i) => (
                  <line
                    key={i}
                    x1={t.x1}
                    y1={t.y1}
                    x2="450"
                    y2="450"
                    strokeWidth="0.5"
                    fill="none"
                    stroke={
                      t.cls === "cyan" ? "rgb(var(--circuit-glow) / 0.12)" : t.cls === "red" ? "rgb(var(--accent-red) / 0.1)" : "rgb(var(--text) / 0.08)"
                    }
                    className="opacity-0 animate-[thread-pulse_4s_ease-in-out_infinite]"
                    style={{ animationDelay: `${t.delay}s` }}
                  />
                ))}
              </svg>
            </>
          )}

          {LABELED_RINGS.map((ring, ringIdx) => (
            <div
              key={ring.name}
              className="absolute rounded-full animate-orbit"
              style={{
                width: ring.size,
                height: ring.size,
                animationDuration: `${ring.duration}s`,
                animationDirection: ring.reverse ? "reverse" : "normal",
                animationDelay: `-${ring.duration * (0.15 + ringIdx * 0.12)}s`,
              }}
            >
              <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${ring.size} ${ring.size}`}>
                <circle
                  cx={ring.size / 2}
                  cy={ring.size / 2}
                  r={ring.r}
                  fill="none"
                  strokeDasharray="8 6"
                  strokeWidth="1"
                  stroke={ringStroke(ring.color)}
                />
              </svg>

              {/* Dot + label — counter-rotate entire group to stay horizontal */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-[counter-orbit]"
                style={{
                  animationDuration: `${ring.duration}s`,
                  animationDirection: ring.reverse ? "reverse" : "normal",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: `-${ring.duration * (0.15 + ringIdx * 0.12)}s`,
                }}
              >
                <span
                  className="font-mono uppercase whitespace-nowrap mb-2"
                  style={{
                    fontSize: ring.fontSize,
                    letterSpacing: ring.name === "AaaS" ? "0.4em" : "0.3em",
                    color: labelColor(ring.color),
                  }}
                >
                  {ring.name}
                </span>
                <div
                  className="rounded-full shrink-0 animate-[blink-star_ease-in-out_infinite]"
                  style={{
                    width: ring.dotSize,
                    height: ring.dotSize,
                    background: dotColor(ring.color),
                    boxShadow: dotGlow(ring.color),
                    animationDuration: ring.color === "white" ? "1.2s" : `${1.5 + Math.random() * 0.5}s`,
                  }}
                />
              </div>

              {/* Secondary dot */}
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rounded-full animate-[blink-star_ease-in-out_infinite]"
                style={{
                  width: Math.max(ring.dotSize - 3, 2),
                  height: Math.max(ring.dotSize - 3, 2),
                  background:
                    ring.color === "cyan"
                      ? "rgb(var(--circuit-glow) / 0.3)"
                      : ring.color === "red"
                        ? "rgb(var(--accent-red) / 0.3)"
                        : "rgb(var(--text) / 0.3)",
                  animationDuration: `${2.5 + Math.random()}s`,
                }}
              />
            </div>
          ))}

          {/* Central planet */}
          <div
            className="relative w-24 h-24 rounded-full z-10 flex items-center justify-center animate-orb-pulse"
            style={{ transform: `scale(${planetScale})`, transition: "transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)" }}
          >
            {/* Signal rings — expanding radar pulses from center */}
            {[0, 1, 2].map((i) => (
              <div
                key={`signal-${i}`}
                className="absolute inset-0 rounded-full animate-[signal-ring_4s_ease-out_infinite]"
                style={{
                  border: "1px solid rgb(var(--circuit-glow) / 0.25)",
                  animationDelay: `${i * 1.33}s`,
                }}
              />
            ))}
            {/* Halo */}
            <div
              className="absolute -inset-[35px] rounded-full pointer-events-none animate-[halo-pulse_5s_ease-in-out_infinite]"
              style={{ background: "radial-gradient(circle, rgb(var(--circuit-glow) / 0.04) 0%, transparent 70%)" }}
            />
            {/* Atmosphere */}
            <div className="absolute -inset-2 rounded-full border border-circuit/10 animate-[atmosphere-pulse_4s_ease-in-out_infinite]" />
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-full animate-[glow-ring-pulse_4s_ease-in-out_infinite]"
              style={{ border: "1.5px solid rgb(var(--circuit-glow) / 0.2)" }}
            />
            {/* Spinning conic ring */}
            <div
              className="absolute -inset-[3px] rounded-full animate-orbit"
              style={{
                animationDuration: "10s",
                border: "1px solid transparent",
                background: "conic-gradient(from 0deg, transparent, rgb(var(--circuit-glow) / 0.18), transparent 40%, rgb(var(--accent-red) / 0.14), transparent 70%) border-box",
                WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
            />
            {/* Surface */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden border border-circuit/25"
              style={{
                background: "radial-gradient(circle at 30% 25%, rgb(var(--basalt-bright)) 0%, rgb(var(--basalt-surface)) 35%, rgb(var(--basalt-deep)) 100%)",
                boxShadow: "inset -8px -4px 16px rgba(0,0,0,0.3), inset 6px 6px 12px rgb(var(--text) / 0.02)",
              }}
            >
              {/* Specular */}
              <div
                className="absolute top-[6%] left-[12%] w-[50%] h-[40%] rounded-full"
                style={{ background: "radial-gradient(ellipse at 40% 35%, rgb(var(--text) / 0.14) 0%, rgb(var(--text) / 0.04) 40%, transparent 70%)" }}
              />
              {/* Rim light */}
              <div
                className="absolute top-[8%] right-[2%] w-[25%] h-[65%] rounded-full blur-[5px]"
                style={{ background: "radial-gradient(ellipse, rgb(var(--circuit-glow) / 0.14) 0%, transparent 70%)" }}
              />
              {/* Red accent */}
              <div
                className="absolute top-[22%] right-[20%] w-4 h-3 rounded-full blur-[3px]"
                style={{ background: "radial-gradient(ellipse, rgb(var(--accent-red) / 0.4), transparent 70%)" }}
              />
              {/* Surface band */}
              <div
                className="absolute top-[55%] left-[10%] w-[80%] h-[8%] rounded-full blur-[2px]"
                style={{ background: "linear-gradient(90deg, transparent, rgb(var(--circuit-glow) / 0.04), rgb(var(--text) / 0.02), transparent)" }}
              />
            </div>
            {/* Core beacon — bright blinking star */}
            <div
              className="w-[5px] h-[5px] rounded-full z-[2] animate-[beacon-star_2s_ease-in-out_infinite]"
              style={{
                background: "rgb(var(--circuit-glow))",
                boxShadow: "0 0 6px rgb(var(--circuit-glow)), 0 0 15px rgb(var(--circuit-glow) / 0.6), 0 0 30px rgb(var(--circuit-glow) / 0.3)",
              }}
            />
            {/* AaaS label — anchored above planet, counter-rotates to stay readable */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[beacon-star_3s_ease-in-out_infinite]"
              style={{ animationDelay: "-1s" }}
            >
              <span
                className="font-mono uppercase whitespace-nowrap text-[9px] tracking-[0.5em]"
                style={{
                  color: "rgb(var(--circuit-glow) / 0.8)",
                  textShadow: "0 0 8px rgb(var(--circuit-glow) / 0.4), 0 0 20px rgb(var(--circuit-glow) / 0.2)",
                }}
              >
                AaaS
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
