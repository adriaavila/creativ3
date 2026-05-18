type Props = {
  className?: string;
  variant?: "mark" | "mark-bare" | "wordmark" | "lockup" | "lockup-bare";
};

export default function CreativvLogo({ className, variant = "lockup" }: Props) {
  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="creativv"
      >
        <rect width="64" height="64" rx="14" fill="currentColor" />
        <g
          stroke="#f5f3ec"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M47 21 A16 16 0 1 0 47 43" />
          <path d="M22 27 L29 40 L36 27" />
          <path d="M34 27 L41 40 L48 27" opacity="0.55" />
        </g>
      </svg>
    );
  }

  if (variant === "mark-bare") {
    return (
      <svg
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="creativv"
      >
        <g
          stroke="currentColor"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M47 19 A18 18 0 1 0 47 45" />
          <path d="M19 26 L28 42 L37 26" />
          <path d="M33 26 L42 42 L51 26" opacity="0.45" />
        </g>
      </svg>
    );
  }

  if (variant === "wordmark") {
    return (
      <svg
        viewBox="0 0 220 44"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="creativv"
      >
        <text
          x="0"
          y="33"
          fontFamily="var(--font-inter), Inter, Helvetica, Arial, sans-serif"
          fontSize="34"
          fontWeight="600"
          letterSpacing="-1.3"
          fill="currentColor"
        >
          creativv
        </text>
        <circle cx="208" cy="11" r="3.2" fill="currentColor" />
      </svg>
    );
  }

  if (variant === "lockup-bare") {
    return (
      <svg
        viewBox="0 0 260 56"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        role="img"
        aria-label="creativv"
      >
        <g
          stroke="currentColor"
          strokeWidth="3.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(2,4)"
        >
          <path d="M40 14 A14 14 0 1 0 40 34" />
          <path d="M11 20 L18 33 L25 20" />
          <path d="M22 20 L29 33 L36 20" opacity="0.45" />
        </g>
        <text
          x="62"
          y="37"
          fontFamily="var(--font-inter), Inter, Helvetica, Arial, sans-serif"
          fontSize="32"
          fontWeight="600"
          letterSpacing="-1.2"
          fill="currentColor"
        >
          creativv
        </text>
        <circle cx="248" cy="14" r="2.8" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 260 56"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="creativv"
    >
      <g>
        <rect width="48" height="48" y="4" rx="11" fill="currentColor" />
        <g
          stroke="#f5f3ec"
          strokeWidth="3.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0,4)"
        >
          <path d="M35 16 A12 12 0 1 0 35 32" />
          <path d="M17 21 L22 31 L27 21" />
          <path d="M25.5 21 L30.5 31 L35.5 21" opacity="0.55" />
        </g>
      </g>
      <text
        x="62"
        y="37"
        fontFamily="var(--font-inter), Inter, Helvetica, Arial, sans-serif"
        fontSize="32"
        fontWeight="600"
        letterSpacing="-1.2"
        fill="currentColor"
      >
        creativv
      </text>
      <circle cx="248" cy="14" r="2.8" fill="currentColor" />
    </svg>
  );
}
