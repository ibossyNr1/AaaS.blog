export function CircuitBackground() {
  return (
    <>
      {/* Circuit grid */}
      <div className="circuit-grid" aria-hidden="true" />

      {/* Animated SVG circuit paths */}
      <svg
        className="fixed top-0 left-0 w-full h-full -z-10 opacity-20 pointer-events-none"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 0 100 H 200 V 300 H 400 V 100 H 600 V 500 H 1000"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
        />
        <path
          d="M 1000 900 H 800 V 700 H 600 V 900 H 400 V 500 H 0"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "3s" }}
        />
        <path
          d="M 200 0 V 400 H 400 V 600 H 200 V 1000"
          stroke="rgb(var(--circuit-glow))"
          strokeWidth="1"
          fill="none"
          strokeDasharray="1000"
          strokeDashoffset="1000"
          className="animate-circuit-flow"
          style={{ animationDelay: "6s" }}
        />
      </svg>
    </>
  );
}
