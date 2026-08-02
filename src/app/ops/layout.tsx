import type { ReactNode } from "react";
import OpsShell from "@/components/ops/OpsShell";
import OpsRealtimeProvider from "@/components/ops/OpsRealtimeProvider";

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <OpsRealtimeProvider>
      <OpsShell>{children}</OpsShell>
    </OpsRealtimeProvider>
  );
}
