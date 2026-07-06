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
        <rect width="64" height="64" rx="16" fill="#f5f3ec" />
        <g
          stroke="#1f2a1d"
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M46 19 A16 16 0 1 0 46 45" />
          <path d="M21 27 L28 39 L32 32 L36 39 L43 27" />
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
          <path d="M46 19 A16 16 0 1 0 46 45" />
          <path d="M21 27 L28 39 L32 32 L36 39 L43 27" />
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
        <rect x="2" y="6" width="44" height="44" rx="11" fill="#f5f3ec" />
        <g
          stroke="#1f2a1d"
          strokeWidth="5.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(2,6) scale(0.6875)"
        >
          <path d="M46 19 A16 16 0 1 0 46 45" />
          <path d="M21 27 L28 39 L32 32 L36 39 L43 27" />
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
        <rect width="48" height="48" y="4" rx="12" fill="#f5f3ec" />
        <g
          stroke="#1f2a1d"
          strokeWidth="4.1"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(0,4) scale(0.75)"
        >
          <path d="M46 19 A16 16 0 1 0 46 45" />
          <path d="M21 27 L28 39 L32 32 L36 39 L43 27" />
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
