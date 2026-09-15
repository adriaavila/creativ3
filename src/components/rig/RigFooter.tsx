import Link from "next/link";
import { CONTACT_EMAIL } from "@/lib/contact";
import { SpinningText } from "@/components/ui/spinning-text";
import SkyPlate from "./SkyPlate";

/**
 * The page ends in sky. Everything above is carbon on paper; the last plate
 * is where the grid opens up and the weather comes through.
 */
export default function RigFooter() {
  return (
    <footer className="border-t-2 border-[var(--rule-hard)]">
      <SkyPlate className="relative px-5 py-16 sm:px-10 sm:py-24">
        {/* The one stamp on the page — a rotating seal, sized to actually be
            read. Hidden below lg, where it would collide with the address. */}
        <div className="sky-over !absolute right-32 top-1/2 hidden -translate-y-1/2 xl:block">
          <SpinningText
            radius={6.4}
            duration={26}
            className="text-[13px] font-medium tracking-[0.02em] text-[var(--sky-lit-dusk)]"
          >
            {"open for work · one build at a time · "}
          </SpinningText>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--sky-lit-dusk)]"
          />
        </div>
        <div className="sky-over grid gap-10 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div>
            <p className="mono opacity-75">Open for one build at a time</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="macro mt-4 block !text-[clamp(1.5rem,4.6vw,3.5rem)] !tracking-[-0.03em] hover:text-[var(--sky-lit-dusk)]"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <div className="mono grid gap-2 opacity-80">
            <Link href="/" className="hover:opacity-100">allok ↗</Link>
            <Link href="/agencia" className="hover:opacity-100">Agencia ↗</Link>
            <Link href="/rei" className="hover:opacity-100">REI ↗</Link>
            <Link href="/vocero" className="hover:opacity-100">Vocero ↗</Link>
            <Link href="/portfolio" className="hover:opacity-100">Portafolio ↗</Link>
            <Link href="/work" className="hover:opacity-100">Work ↗</Link>
            <Link href="/lab" className="hover:opacity-100">Lab ↗</Link>
            <a href="https://github.com/adriaavila" className="hover:opacity-100">GitHub ↗</a>
            <span className="mt-4 text-[var(--sky-lit-dusk)]">© {new Date().getFullYear()} · Rev 2.6</span>
          </div>
        </div>
      </SkyPlate>
    </footer>
  );
}
