"use client";

export default function FloatingOrbs() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
    >
      {/* Primary orb — top-left cobalto */}
      <div
        className="absolute rounded-full"
        style={{
          width: 700,
          height: 700,
          top: "-200px",
          left: "-200px",
          background: "radial-gradient(circle, rgba(42,110,160,0.18) 0%, transparent 70%)",
          animation: "orb-drift-a 22s ease-in-out infinite, pulse-glow 8s ease-in-out infinite",
          filter: "blur(60px)",
        }}
      />

      {/* Secondary orb — bottom-right lima */}
      <div
        className="absolute rounded-full"
        style={{
          width: 600,
          height: 600,
          bottom: "-150px",
          right: "-100px",
          background: "radial-gradient(circle, rgba(168,201,127,0.08) 0%, transparent 70%)",
          animation: "orb-drift-b 28s ease-in-out infinite, pulse-glow 10s ease-in-out infinite 2s",
          filter: "blur(80px)",
        }}
      />

      {/* Tertiary orb — center cobalto dim */}
      <div
        className="absolute rounded-full"
        style={{
          width: 500,
          height: 500,
          top: "40%",
          left: "40%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(42,110,160,0.08) 0%, transparent 70%)",
          animation: "orb-drift-c 35s linear infinite",
          filter: "blur(90px)",
        }}
      />

      {/* Accent orb — top-right guayoyo warm */}
      <div
        className="absolute rounded-full"
        style={{
          width: 400,
          height: 400,
          top: "10%",
          right: "5%",
          background: "radial-gradient(circle, rgba(200,148,100,0.06) 0%, transparent 70%)",
          animation: "orb-drift-b 18s ease-in-out infinite 5s",
          filter: "blur(70px)",
        }}
      />
    </div>
  );
}
