import type { ReactNode } from "react";
import OpsShell from "@/components/ops/OpsShell";

export default function OpsLayout({ children }: { children: ReactNode }) {
  return <OpsShell>{children}</OpsShell>;
}
