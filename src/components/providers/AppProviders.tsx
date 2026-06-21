"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { usePathname } from "next/navigation";

export default function AppProviders({
  children,
  clerkPublishableKey,
}: {
  children: React.ReactNode;
  clerkPublishableKey?: string;
}) {
  const pathname = usePathname();
  const content = children;
  const needsClerk = pathname.startsWith("/ops") || pathname.startsWith("/sign-in");
  if (!clerkPublishableKey || !needsClerk) return content;

  return (
    <ClerkProvider publishableKey={clerkPublishableKey} appearance={{ theme: shadcn }}>
      {content}
    </ClerkProvider>
  );
}
