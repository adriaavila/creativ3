import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The one soft object on a page of hard edges: round, translucent, lit from
 * inside. It reads as a lens onto the sky behind the paper, which is the
 * only argument for radius and blur existing here at all — so there is
 * exactly one per page and it is always the primary action.
 */
export default function Lens({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("lens", className)}>
      <span>
        {children}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}
