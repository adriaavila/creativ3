"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  CircleAlert,
  Copy,
  Database,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
} from "lucide-react";
import type { WhatsAppConnectionView } from "@/lib/whatsapp-connections-db";

const ACTIVE_STATUSES = new Set(["connected", "subscribed", "coexistence_sync_requested"]);

export default function ClientsClient({
  initialConnections,
  loadError,
}: {
  initialConnections: WhatsAppConnectionView[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const clients = new Set(initialConnections.map((connection) => connection.client).filter(Boolean));
    return {
      onboardings: initialConnections.length,
      clients: clients.size,
      operational: initialConnections.filter((connection) => ACTIVE_STATUSES.has(connection.status)).length,
      tokens: initialConnections.filter((connection) => connection.businessTokenStored).length,
    };
  }, [initialConnections]);

  const connections = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialConnections;
    return initialConnections.filter((connection) =>
      [
        connection.client,
        connection.verifiedName,
        connection.displayPhoneNumber,
        connection.wabaId,
        connection.phoneNumberId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [initialConnections, query]);

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError(null);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopyError("No se pudo copiar. Selecciona el identificador manualmente.");
    }
  }

  return (
    <main className="min-h-dvh bg-[#f3f6f8] pb-12 text-[#142b4b]">
      <header className="border-b border-[#28415d] bg-[#10243d] text-white">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-end justify-between gap-6 px-4 pb-14 pt-9 sm:px-7 lg:px-10 lg:pb-16 lg:pt-12">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c5f04a]">
              Operaciones · Meta inventory
            </p>
            <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Clientes onboardeados
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/60 sm:text-[15px]">
              Una vista técnica de cada alta completada. El CRM opera aparte; aquí quedan
              los identificadores que Ops necesita para conectar Meta y enviar mensajes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.06] px-4 text-xs font-semibold text-white transition hover:border-white/30 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c5f04a]"
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Actualizar datos
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-4 sm:px-7 lg:px-10">
        <section
          className="relative -mt-7 grid overflow-hidden rounded-xl border border-[#dce4ea] bg-white shadow-[0_16px_42px_rgba(16,36,61,0.08)] sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Resumen de clientes onboardeados"
        >
          <SummaryMetric icon={Database} label="Onboardings" value={summary.onboardings} detail="filas guardadas" />
          <SummaryMetric icon={Smartphone} label="Clientes" value={summary.clients} detail="workspaces únicos" />
          <SummaryMetric icon={CheckCircle2} label="Operativos" value={summary.operational} detail="conexiones activas" />
          <SummaryMetric icon={KeyRound} label="Tokens listos" value={summary.tokens} detail="cifrados en servidor" />
        </section>

        <section className="mt-8" aria-labelledby="inventory-title">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7c8b9b]">
                Fuente: whatsapp_connections
              </p>
              <h2 id="inventory-title" className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#172238]">
                Inventario de credenciales
              </h2>
            </div>
            <label className="flex min-h-11 w-full max-w-[360px] items-center gap-2 rounded-lg border border-[#d7e0e7] bg-white px-3 text-sm shadow-sm">
              <Search className="size-4 shrink-0 text-[#8391a0]" aria-hidden="true" />
              <span className="sr-only">Buscar cliente o identificador</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente, WABA o número…"
                className="w-full bg-transparent text-[#172238] outline-none placeholder:text-[#9aa5b2]"
              />
            </label>
          </div>

          {loadError && (
            <p className="mt-5 rounded-xl border border-[#efcccc] bg-[#fff6f5] px-4 py-3 text-sm text-[#963c37]" role="alert">
              No se pudo cargar el inventario: {loadError}
            </p>
          )}
          {copyError && (
            <p className="mt-5 rounded-xl border border-[#eadcb7] bg-[#fffaf0] px-4 py-3 text-sm text-[#795d1f]" role="status">
              {copyError}
            </p>
          )}

          {connections.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-[#ccd6df] bg-white px-6 py-16 text-center">
              <Smartphone className="mx-auto size-7 text-[#8d9aa7]" aria-hidden="true" />
              <p className="mt-4 text-sm font-semibold text-[#526174]">
                {initialConnections.length ? "Ningún onboarding coincide con la búsqueda." : "Todavía no hay clientes onboardeados."}
              </p>
              <p className="mt-1 text-xs text-[#8a96a5]">
                Una conexión exitosa aparecerá aquí automáticamente.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {connections.map((connection, index) => (
                <ConnectionCard
                  key={`${connection.wabaId}:${connection.phoneNumberId}`}
                  connection={connection}
                  index={index}
                  copied={copied}
                  onCopy={copyValue}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="border-b border-[#e5ebf0] p-5 last:border-b-0 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7a8797]">{label}</p>
        <Icon className="size-4 text-[#4d6985]" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-[-0.04em] text-[#172238]">{value}</p>
      <p className="mt-1 text-[11px] text-[#8a96a5]">{detail}</p>
    </article>
  );
}

function ConnectionCard({
  connection,
  index,
  copied,
  onCopy,
}: {
  connection: WhatsAppConnectionView;
  index: number;
  copied: string | null;
  onCopy: (key: string, value: string) => Promise<void>;
}) {
  const active = ACTIVE_STATUSES.has(connection.status);
  const copyKey = (field: string) => `${connection.phoneNumberId}:${field}`;

  return (
    <article className="overflow-hidden rounded-xl border border-[#dbe3e9] bg-white shadow-[0_7px_24px_rgba(20,43,75,0.045)]">
      <div className="flex flex-wrap items-start justify-between gap-5 border-b border-[#e8edf1] px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#10243d] font-mono text-[11px] font-semibold text-[#c5f04a]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold text-[#172238]">
              {connection.verifiedName ?? connection.client ?? "Cliente sin nombre"}
            </h3>
            <p className="mt-1 font-mono text-xs text-[#758495]">
              {connection.displayPhoneNumber ?? "Número visible no disponible"}
            </p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold ${active ? "bg-[#edf7df] text-[#4e7123]" : "bg-[#fff3df] text-[#8a5d19]"}`}>
          <span className={`size-1.5 rounded-full ${active ? "bg-[#89b72d]" : "bg-[#d49b42]"}`} aria-hidden="true" />
          {connectionStatusLabel(connection.status)}
        </span>
      </div>

      <dl className="grid sm:grid-cols-2 xl:grid-cols-4">
        <CredentialField
          label="client"
          value={connection.client ?? "Sin asignar"}
          description="Dueño de la conexión"
          copyKey={copyKey("client")}
          copied={copied}
          onCopy={connection.client ? onCopy : undefined}
        />
        <CredentialField
          label="waba_id"
          value={connection.wabaId}
          description="Suscripción de webhooks"
          copyKey={copyKey("waba")}
          copied={copied}
          onCopy={onCopy}
        />
        <CredentialField
          label="phone_number_id"
          value={connection.phoneNumberId}
          description="Envío de mensajes"
          copyKey={copyKey("phone")}
          copied={copied}
          onCopy={onCopy}
        />
        <div className="border-b border-[#e8edf1] bg-[#f8fafb] p-5 last:border-b-0 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0">
          <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6f7f90]">
            business_token
          </dt>
          <dd className={`mt-3 flex items-center gap-2 text-sm font-semibold ${connection.businessTokenStored ? "text-[#3f682a]" : "text-[#9a493f]"}`}>
            {connection.businessTokenStored ? <ShieldCheck className="size-4" aria-hidden="true" /> : <CircleAlert className="size-4" aria-hidden="true" />}
            {connection.businessTokenStored ? "Cifrado y disponible" : "No disponible"}
          </dd>
          <p className="mt-2 text-[11px] leading-4 text-[#8a96a5]">
            {connection.businessTokenStored ? "Solo se descifra en el servidor" : "Requiere reconectar el número"}
          </p>
        </div>
      </dl>

      <footer className="flex flex-wrap items-center justify-between gap-4 bg-[#fbfcfd] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-[#7a8797]">
          <span className="font-semibold text-[#526174]">
            {connection.connectionMode === "META_COEXISTENCE" ? "Coexistencia" : "Cloud API"}
          </span>
          <span>Onboarding {formatDate(connection.connectedAt)}</span>
          <span>Última sync {formatDate(connection.lastSyncedAt)}</span>
        </div>
        <Link
          href={`/ops/connections/${encodeURIComponent(connection.phoneNumberId)}`}
          className="inline-flex min-h-9 items-center rounded-lg border border-[#d6e0e7] bg-white px-3 text-xs font-semibold text-[#385875] transition hover:border-[#9aabba] hover:text-[#142b4b]"
        >
          Ver conexión
        </Link>
      </footer>
    </article>
  );
}

function CredentialField({
  label,
  value,
  description,
  copyKey,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  description: string;
  copyKey: string;
  copied: string | null;
  onCopy?: (key: string, value: string) => Promise<void>;
}) {
  const wasCopied = copied === copyKey;
  return (
    <div className="group relative border-b border-[#e8edf1] p-5 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0">
      <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.13em] text-[#6f7f90]">{label}</dt>
      <dd className="mt-3 break-all pr-8 font-mono text-[13px] font-semibold leading-5 text-[#20364f]">{value}</dd>
      <p className="mt-2 text-[11px] text-[#8a96a5]">{description}</p>
      {onCopy && (
        <button
          type="button"
          onClick={() => void onCopy(copyKey, value)}
          aria-label={`Copiar ${label}`}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-md text-[#7f8d9b] transition hover:bg-[#eef3f7] hover:text-[#20364f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#385875]"
        >
          {wasCopied ? <Check className="size-3.5 text-[#61852a]" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}

function connectionStatusLabel(status: string) {
  if (ACTIVE_STATUSES.has(status)) return "Operativo";
  if (status === "deauthorized") return "Desautorizado";
  if (status.startsWith("pending_")) return "Configurando";
  if (status.includes("action_required") || status.includes("unverified")) return "Requiere atención";
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "no disponible";
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Caracas",
  }).format(new Date(value));
}
