"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  Bot,
  FlaskConical,
  Handshake,
  KanbanSquare,
  Link2,
  LogOut,
  Menu,
  TrendingUp,
  X,
  type LucideIcon,
} from "lucide-react";
import AllokLogo from "@/components/brand/AllokLogo";

type NavItem = { href: string; label: string; icon: LucideIcon };

const salesItems: NavItem[] = [
  { href: "/ops", label: "Hoy", icon: Handshake },
  { href: "/ops/crm", label: "Pipeline", icon: KanbanSquare },
] as const;

const moreItems: NavItem[] = [
  { href: "/ops/growth", label: "Growth", icon: TrendingUp },
  { href: "/ops/agents", label: "Eve Agents", icon: Bot },
  { href: "/ops/lab", label: "Observabilidad", icon: FlaskConical },
] as const;

function isItemActive(pathname: string, href: string, connectionsActive: boolean) {
  if (href === "/ops") return pathname === href;
  if (href === "/ops/crm") return pathname.startsWith(href) && !connectionsActive;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type OpsNavProps = {
  global?: boolean;
};

export default function OpsNav({ global = false }: OpsNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const connectionsActive = pathname === "/ops/crm/connections" || (pathname.startsWith("/ops/crm") && searchParams.get("view") === "connections");

  if (!global) return null;

  const renderItem = (item: NavItem) => {
    const active = isItemActive(pathname, item.href, connectionsActive);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)] ${
          active
            ? "bg-[var(--ground-3)] text-[var(--ink)]"
            : "text-[var(--ink-60)] hover:bg-[var(--ground-3)] hover:text-[var(--ink)]"
        }`}
      >
        <Icon className={`size-[18px] shrink-0 ${active ? "text-[var(--ink-60)]" : "text-[var(--ink-60)]"}`} strokeWidth={1.8} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  const renderNavigation = () => (
    <>
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-60)]">Ventas</p>
      <div className="space-y-1">
        {salesItems.map(renderItem)}
        <Link href="/ops/crm?view=connections" aria-current={connectionsActive ? "page" : undefined} onClick={() => setMobileMenuOpen(false)} className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 text-[14px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)] ${connectionsActive ? "bg-[var(--ground-3)] text-[var(--ink)]" : "text-[var(--ink-60)] hover:bg-[var(--ground-3)] hover:text-[var(--ink)]"}`}><Link2 className={`size-[18px] shrink-0 ${connectionsActive ? "text-[var(--ink-60)]" : "text-[var(--ink-60)]"}`} strokeWidth={1.8} /> Conexiones</Link>
      </div>
      <div className="my-5 border-t border-[var(--hairline)]" />
      <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ink-60)]">Más</p>
      <div className="space-y-1">{moreItems.map(renderItem)}</div>
    </>
  );

  const renderLogout = () => (
    <form action="/api/ops/logout" method="post">
      <button
        type="submit"
        className="flex min-h-11 w-full items-center gap-3 rounded-[10px] px-3 text-left text-[14px] font-medium text-[var(--ink-60)] transition-colors hover:bg-[var(--ground-3)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]"
      >
        <LogOut className="size-[18px] shrink-0 text-[var(--ink-60)]" strokeWidth={1.8} aria-hidden="true" />
        Salir
      </button>
    </form>
  );

  const renderBrand = (mobile = false) => (
    <Link
      href="/ops"
      aria-label="allok Ops, ir a Hoy"
      onClick={() => setMobileMenuOpen(false)}
      className={`flex items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)] ${mobile ? "min-h-11" : ""}`}
    >
      <AllokLogo variant="mark" state="activo" size={36} className="shrink-0" />
      <span className="min-w-0">
        <span className="block font-display text-[19px] font-semibold tracking-[-0.04em] text-[var(--ink)]">
          allok
        </span>
        <span className="block whitespace-nowrap text-[11px] leading-4 text-[var(--ink-60)]">Ventas · Hoy</span>
      </span>
    </Link>
  );

  const renderProfile = () => (
    <div className="mt-5 border-t border-[var(--hairline)] pt-4">
      <div className="flex items-center gap-3 px-1">
        <span className="on-ink relative flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--ink-fill)] text-xs font-semibold text-white">
          AO
          <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-[var(--st-activo)]" aria-label="En línea" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-semibold text-[var(--ink)]">Operador</span>
          <span className="block truncate text-[11px] text-[var(--ink-60)]">Operador · En línea</span>
        </span>
      </div>
    </div>
  );

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[224px] flex-col border-r border-[var(--hairline)] bg-white px-3 py-5 md:flex" aria-label="Navegación principal">
        <div className="px-2">{renderBrand()}</div>

        <nav className="mt-8 space-y-1" aria-label="Páginas de Ops">
          {renderNavigation()}
        </nav>

        <div className="mt-auto">
          <div className="space-y-1">
            {renderLogout()}
          </div>
          {renderProfile()}
        </div>
      </aside>

      <header className="fixed inset-x-0 top-0 z-40 flex h-[68px] items-center justify-between border-b border-[var(--hairline)] bg-white px-4 md:hidden">
        {renderBrand(true)}
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Cerrar navegación" : "Abrir navegación"}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="flex size-11 items-center justify-center rounded-[10px] text-[var(--ink-60)] transition-colors hover:bg-[var(--ground-3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rule)]"
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
            className="fixed inset-0 z-40 bg-[var(--scrim)] md:hidden"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(292px,86vw)] flex-col border-r border-[var(--hairline)] bg-white px-3 py-5 shadow-2xl md:hidden" aria-label="Navegación móvil">
            <div className="px-2">{renderBrand(true)}</div>
            <nav className="mt-8 space-y-1" aria-label="Páginas de Ops">
              {renderNavigation()}
            </nav>
            <div className="mt-auto">
              <div className="space-y-1">
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
