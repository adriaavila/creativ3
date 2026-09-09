import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A rectangular window cut into the paper grid. The sky never bleeds past
 * one of these — it is contained by the grid, which is what keeps the page
 * industrial rather than atmospheric. Deliberately diffuse: soft glows over
 * a dawn→dusk ramp, panned by `--sky-t`. No radius, ever.
 */
export default function SkyPlate({
  label,
  className,
  children,
}: {
  label?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn("sky-plate", className)}>
      {label ? (
        <span className="sky-over mono !absolute left-5 top-1/2 -translate-y-1/2 opacity-90">{label}</span>
      ) : null}
      {children}
    </div>
  );
}
