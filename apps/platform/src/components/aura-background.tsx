"use client";

export function AuraBackground() {
  return (
    <div className="fixed inset-0 -z-[2] overflow-hidden pointer-events-none">
      {/* Aura blob 1 — accent red, top-left */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "60vw",
          height: "60vw",
          maxWidth: 900,
          maxHeight: 900,
          top: "-15%",
          left: "-10%",
          background: "radial-gradient(circle, rgb(var(--accent-red)) 0%, transparent 70%)",
          opacity: 0.06,
          filter: "blur(80px)",
          animation: "aura-drift 20s infinite alternate var(--liquid-ease)",
        }}
      />
      {/* Aura blob 2 — circuit cyan, bottom-right */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "50vw",
          height: "50vw",
          maxWidth: 750,
          maxHeight: 750,
          bottom: "-10%",
          right: "-10%",
          background: "radial-gradient(circle, rgb(var(--circuit-glow)) 0%, transparent 70%)",
          opacity: 0.05,
          filter: "blur(80px)",
          animation: "aura-drift 25s infinite alternate var(--liquid-ease)",
          animationDelay: "-8s",
        }}
      />
      {/* Aura blob 3 — subtle red, center */}
      <div
        className="absolute rounded-full will-change-transform"
        style={{
          width: "40vw",
          height: "40vw",
          maxWidth: 600,
          maxHeight: 600,
          top: "40%",
          left: "30%",
          background: "radial-gradient(circle, rgb(var(--accent-red)) 0%, transparent 70%)",
          opacity: 0.03,
          filter: "blur(80px)",
          animation: "aura-drift 18s infinite alternate var(--liquid-ease)",
          animationDelay: "-4s",
        }}
      />
    </div>
  );
}
