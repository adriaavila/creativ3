"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { CONTACT_EMAIL } from "@/lib/contact";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/lab", label: "Lab" },
];

/** Nav as a masthead rule, not a floating pill. Nothing here is rounded. */
export default function RigHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="border-b-2 border-[var(--rule-hard)]">
      {/* Scroll position is also what drives the sky; this is the same
          number, drawn. */}
      <ScrollProgress className="h-[3px] bg-[var(--hazard)] bg-none" />
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-10">
        <Link href="/" className="mono font-medium tracking-[0.14em]">
          Adrián Ávila Molina<span className="ml-2 text-[var(--carbon-3)]">®</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-6 sm:gap-8">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "mono border-b-2 pb-0.5 transition-colors",
                  active
                    ? "border-[var(--carbon)] text-[var(--carbon)]"
                    : "border-transparent text-[var(--carbon-2)] hover:text-[var(--carbon)]",
                )}
              >
                {item.label}
              </Link>
            );
          })}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="mono text-[var(--hazard)] underline-offset-4 hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
        </nav>
      </div>
    </header>
  );
}
