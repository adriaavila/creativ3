import type { ReactNode } from "react";
import OpsNav from "@/components/ops/OpsNav";

export default function OpsShell({ children }: { children: ReactNode }) {
  return (
    <div className="ops-shell min-h-dvh bg-[#f7f8fa] text-[#142b4b] antialiased">
      <OpsNav global />
      <div className="min-h-dvh overflow-x-hidden pt-[68px] md:ml-[224px] md:pt-0">
        {children}
      </div>
    </div>
  );
}
