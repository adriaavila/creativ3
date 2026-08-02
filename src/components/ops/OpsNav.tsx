"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  ContactRound,
  FlaskConical,
  Inbox,
  KanbanSquare,
  Link2,
  LogOut,
  Menu,
  X,
  type LucideIcon,
} from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";

const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/ops/inbox", label: "Bandeja", icon: Inbox },
  { href: "/ops/crm", label: "Pipeline", icon: KanbanSquare },
  { href: "/ops/contacts", label: "Contactos", icon: ContactRound },
  { href: "/ops/agents", label: "Agentes", icon: Bot },
  { href: "/ops/lab", label: "Laboratorio", icon: FlaskConical },
] as const;

function isConnectionsActive(pathname: string, view: string | null) {
  return pathname === "/ops/crm/connections" || (pathname.startsWith("/ops/crm") && view === "connections");
}

function isItemActive(pathname: string, href: string, connectionsActive: boolean) {
  return href === "/ops/crm"
    ? pathname.startsWith(href) && !connectionsActive
    : pathname === href || pathname.startsWith(`${href}/`);
}

type OpsNavProps = {
  global?: boolean;
};

export default function OpsNav({ global = false }: OpsNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const connectionsActive = isConnectionsActive(pathname, searchParams.get("view"));

  if (!global) return null;

  const renderItem = (item: (typeof items)[number]) => {
    const active = isItemActive(pathname, item.href, connectionsActive);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
          onClick={() => setMobileMenuOpen(false)}
        className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b] ${
          active
            ? "bg-[#eef3f7] text-[#142b4b]"
            : "text-[#526174] hover:bg-[#f1f4f7] hover:text-[#142b4b]"
        }`}
      >
        <Icon className={`size-[18px] shrink-0 ${active ? "text-[#385875]" : "text-[#738196]"}`} strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderConnections = () => (
    <Link
      href="/ops/crm?view=connections"
      aria-current={connectionsActive ? "page" : undefined}
      onClick={() => setMobileMenuOpen(false)}
      className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b] ${
        connectionsActive
          ? "bg-[#eef3f7] text-[#142b4b]"
          : "text-[#526174] hover:bg-[#f1f4f7] hover:text-[#142b4b]"
      }`}
    >
      <Link2 className={`size-[18px] shrink-0 ${connectionsActive ? "text-[#385875]" : "text-[#738196]"}`} strokeWidth={1.8} aria-hidden="true" />
      Conexiones
    </Link>
  );

  const renderLogout = () => (
    <form action="/api/ops/logout" method="post">
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] font-medium text-[#526174] transition-colors hover:bg-[#f1f4f7] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"
      >
        <LogOut className="size-[18px] shrink-0 text-[#738196]" strokeWidth={1.8} aria-hidden="true" />
        Salir
      </button>
    </form>
  );

  const renderBrand = (mobile = false) => (
    <Link
      href="/ops"
      aria-label="allok CRM, ir a Hoy"
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b] ${mobile ? "min-h-11" : ""}`}
    >
      <AllokLogo variant="mark" theme="light" className="size-9 shrink-0" />
      <span className="min-w-0">
        <span className="block font-display text-[19px] font-semibold tracking-[-0.04em] text-[#142b4b]">
          allok<span className="text-[#97c51e]">.</span>
        </span>
        <span className="block whitespace-nowrap text-[11px] leading-4 text-[#7a8797]">CRM · WhatsApp oficial</span>
      </span>
    </Link>
  );

  const renderProfile = () => (
    <div className="mt-5 border-t border-[#e7ebef] pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[#192b43] text-xs font-semibold text-white">
          AO
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[#c5f04a]" aria-label="En línea" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-[#1b2b40]">Operador</span>
          <span className="block truncate text-[11px] text-[#7a8797]">Operador · En línea</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r border-[#e5e9ed] bg-white px-3 py-5 md:flex" aria-label="Navegación principal">
        <div className="px-2">{renderBrand()}</div>

        <nav className="mt-8 space-y-1" aria-label="Páginas de Ops">
          {items.map(renderItem)}
        </nav>

        <div className="mt-auto">
          <div className="space-y-1">
            {renderConnections()}
            {renderLogout()}
          </div>
          {renderProfile()}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-[#e5e9ed] bg-white px-4 md:hidden">
        {renderBrand(true)}
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Cerrar navegación" : "Abrir navegación"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center rounded-[10px] text-[#526174] transition-colors hover:bg-[#f1f4f7] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"
        >
          {mobileMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </header>

      {mobileMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Cerrar navegación"
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-[#142b4b]/20 md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(292px,86vw)] flex-col border-r border-[#e5e9ed] bg-white px-3 py-5 shadow-2xl md:hidden" aria-label="Navegación móvil">
            <div className="px-2">{renderBrand(true)}</div>
            <nav className="mt-8 space-y-1" aria-label="Páginas de Ops">
              {items.map(renderItem)}
            </nav>
            <div className="mt-auto">
              <div className="space-y-1">
                {renderConnections()}
                {renderLogout()}
              </div>
              {renderProfile()}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
