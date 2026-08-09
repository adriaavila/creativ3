"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Locale, Messages } from "@/lib/i18n";
import QualificationFlow from "./QualificationFlow";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type QualificationDialogContextValue = {
  open: () => void;
};

const QualificationDialogContext = createContext<QualificationDialogContextValue | null>(null);

export function useQualificationDialog() {
  const ctx = useContext(QualificationDialogContext);
  if (!ctx) {
    throw new Error("useQualificationDialog must be used within QualificationDialogProvider");
  }
  return ctx;
}

export default function QualificationDialogProvider({
  locale,
  qualify,
  children,
}: {
  locale: Locale;
  qualify: Messages["qualify"];
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const value = useMemo(() => ({ open }), [open]);

  return (
    <QualificationDialogContext.Provider value={value}>
      {children}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-xl p-0">
          <DialogTitle className="sr-only">{qualify.title}</DialogTitle>
          <QualificationFlow locale={locale} qualify={qualify} onDone={() => setIsOpen(false)} />
        </DialogContent>
      </Dialog>
    </QualificationDialogContext.Provider>
  );
}
