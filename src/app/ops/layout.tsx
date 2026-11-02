import type { ReactNode } from "react";
import OpsShell from "@/components/ops/OpsShell";

// Ops is behind a login and shows live data: it renders on every request.
export const dynamic = "force-dynamic";

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <OpsShell>{children}</OpsShell>;
}
