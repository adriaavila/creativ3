export function SvgUnderline() {
  return (
    <svg
      viewBox="0 0 300 30"
      fill="none"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        left: "-4%",
        bottom: "-12%",
        width: "108%",
        height: "45%",
        color: "var(--terracotta)",
        overflow: "visible",
      }}
    >
      <path
        d="M2 22 Q 75 8, 150 16 T 298 14"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        className="svg-underline-path"
      />
    </svg>
  );
}
