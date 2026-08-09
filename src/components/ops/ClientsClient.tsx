"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Copy, Link2, Plus, Search, Send } from "lucide-react";
import {
  CLIENT_DESTINATION_LABELS,
  CLIENT_DESTINATIONS,
  CLIENT_STATUS_LABELS,
  CLIENT_STATUSES,
  HANDOVER_BLOCKER_LABELS,
  handoverBlocker,
  type ClientDestination,
  type ClientRow,
  type ClientStatus,
} from "@/lib/clients";
import { toWorkspaceSlug } from "@/lib/meta/onboarding-link";

/**
 * "Qué clientes tengo, dónde trabaja cada uno y en qué punto del alta está."
 *
 * Una fila por cliente y tres acciones en el mismo lugar: crear, mandarle el
 * enlace de Embedded Signup, y entregarlo a la app donde va a operar.
 */

type Draft = {
  slug: string;
  name: string;
  destination: ClientDestination;
  destinationRef: string;
  status: ClientStatus;
  contact: string;
  notes: string;
};

const EMPTY: Draft = {
  slug: "",
  name: "",
  destination: "allok",
  destinationRef: "",
  status: "invited",
  contact: "",
  notes: "",
};

const STATUS_TONE: Record<ClientStatus, string> = {
  invited: "bg-[#fdf3e0] text-[#8a5b12]",
  connected: "bg-[#e7f0fb] text-[#1d4f8a]",
  live: "bg-[#e8f5e2] text-[#2f6b25]",
  paused: "bg-[#f1f3f6] text-[#5b6879]",
  churned: "bg-[#fbeaea] text-[#8a2b2b]",
};

const inputClass =
  "mt-1 min-h-10 w-full rounded-lg border border-[#dce3ea] bg-white px-3 text-sm text-[#172238] outline-none focus-visible:border-[#142b4b]";
const labelClass = "block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7a8797]";

export default function ClientsClient({
  initialClients,
  loadError,
}: {
  initialClients: ClientRow[];
  loadError: string | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const clients = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return initialClients;
    return initialClients.filter((client) =>
      [client.name, client.slug, client.displayPhoneNumber, client.contact, client.destinationRef]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [initialClients, query]);

  const save = async () => {
    if (!draft) return;
    setBusy("save");
    setError(null);
    setNotice(null);
    const response = await fetch("/api/ops/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: draft.slug || toWorkspaceSlug(draft.name),
        name: draft.name,
        destination: draft.destination,
        destination_ref: draft.destination === "rei_crm" ? draft.destinationRef : null,
        status: draft.status,
        contact: draft.contact,
        notes: draft.notes,
      }),
    });
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(result.error ?? "No se pudo guardar el cliente.");
      return;
    }
    setDraft(null);
    router.refresh();
  };

  const copyOnboardingLink = async (client: ClientRow) => {
    setBusy(`link:${client.slug}`);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/ops/meta/onboarding-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace: client.slug, mode: "coexistence" }),
    });
    const result = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
    setBusy(null);
    if (!response.ok || !result.url) {
      setError(result.error ?? "No se pudo generar el enlace.");
      return;
    }
    await navigator.clipboard.writeText(result.url);
    setCopied(client.slug);
    setTimeout(() => setCopied(null), 2500);
  };

  const handover = async (client: ClientRow) => {
    setBusy(`handover:${client.slug}`);
    setError(null);
    setNotice(null);
    const response = await fetch(`/api/ops/clients/${client.slug}/handover`, { method: "POST" });
    const result = (await response.json().catch(() => ({}))) as {
      error?: string;
      organization_name?: string;
    };
    setBusy(null);
    if (!response.ok) {
      setError(result.error ?? "No se pudo entregar el cliente.");
      return;
    }
    setNotice(
      `${client.name} quedó operando en ${CLIENT_DESTINATION_LABELS[client.destination]}${
        result.organization_name ? ` (${result.organization_name})` : ""
      }. Sus mensajes ya no entran a esta bandeja.`,
    );
    router.refresh();
  };

  return (
    <main className="min-h-dvh bg-[#f7f8fa] pb-8 text-[#142b4b]">
      <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Registro</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Clientes</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68778a]">
              Todo número oficial entra por el Embedded Signup de allok. Acá se ve quién es
              cliente, en qué app trabaja y qué falta para que esté operando.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDraft(draft ? null : EMPTY)}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#142b4b] px-3 text-xs font-semibold text-white transition hover:bg-[#203c60] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"
          >
            <Plus className="size-4" aria-hidden="true" /> Nuevo cliente
          </button>
        </header>

        {loadError && (
          <p role="status" className="mt-5 rounded-lg border border-[#f0d9d9] bg-[#fdf4f4] px-4 py-3 text-sm text-[#8a2b2b]">
            {loadError} Corre la migración 019_clients.sql y recarga.
          </p>
        )}
        {error && (
          <p role="alert" className="mt-5 rounded-lg border border-[#f0d9d9] bg-[#fdf4f4] px-4 py-3 text-sm text-[#8a2b2b]">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mt-5 rounded-lg border border-[#d8ead1] bg-[#f3faf0] px-4 py-3 text-sm text-[#2f6b25]">
            {notice}
          </p>
        )}

        {draft && (
          <section className="mt-6 rounded-xl border border-[#e2e7ed] bg-white p-5" aria-label="Nuevo cliente">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label>
                <span className={labelClass}>Nombre</span>
                <input
                  className={inputClass}
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      name: event.target.value,
                      slug: draft.slug || toWorkspaceSlug(event.target.value),
                    })
                  }
                  placeholder="Condominio Santorini"
                />
              </label>
              <label>
                <span className={labelClass}>Identificador</span>
                <input
                  className={`${inputClass} font-mono text-xs`}
                  value={draft.slug}
                  onChange={(event) => setDraft({ ...draft, slug: toWorkspaceSlug(event.target.value) })}
                  placeholder="condominio-santorini"
                />
              </label>
              <label>
                <span className={labelClass}>Dónde trabaja</span>
                <select
                  className={inputClass}
                  value={draft.destination}
                  onChange={(event) =>
                    setDraft({ ...draft, destination: event.target.value as ClientDestination })
                  }
                >
                  {CLIENT_DESTINATIONS.map((destination) => (
                    <option key={destination} value={destination}>
                      {CLIENT_DESTINATION_LABELS[destination]}
                    </option>
                  ))}
                </select>
              </label>
              {draft.destination === "rei_crm" && (
                <label>
                  <span className={labelClass}>organization_id en REI</span>
                  <input
                    className={`${inputClass} font-mono text-xs`}
                    value={draft.destinationRef}
                    onChange={(event) => setDraft({ ...draft, destinationRef: event.target.value.trim() })}
                    placeholder="6f2c0a3e-9d61-4a2b-8f0e-1c2d3e4f5a6b"
                  />
                </label>
              )}
              <label>
                <span className={labelClass}>Estado</span>
                <select
                  className={inputClass}
                  value={draft.status}
                  onChange={(event) => setDraft({ ...draft, status: event.target.value as ClientStatus })}
                >
                  {CLIENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {CLIENT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={labelClass}>Contacto</span>
                <input
                  className={inputClass}
                  value={draft.contact}
                  onChange={(event) => setDraft({ ...draft, contact: event.target.value })}
                  placeholder="Nombre y teléfono de quien decide"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy === "save" || !draft.name.trim()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#142b4b] px-4 text-xs font-semibold text-white transition hover:bg-[#203c60] disabled:opacity-50"
              >
                {busy === "save" ? "Guardando…" : "Guardar cliente"}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="min-h-10 rounded-lg px-3 text-xs font-semibold text-[#68778a] hover:text-[#142b4b]"
              >
                Cancelar
              </button>
            </div>
          </section>
        )}

        <section className="mt-6 overflow-hidden rounded-xl border border-[#e2e7ed] bg-white" aria-labelledby="clients-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ebf0] px-4 py-4 sm:px-5">
            <h2 id="clients-heading" className="text-sm font-semibold text-[#172238]">
              Cartera <span className="ml-1 font-normal text-[#8a96a5]">{initialClients.length}</span>
            </h2>
            <label className="flex min-h-10 w-full max-w-[300px] items-center gap-2 rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm">
              <Search className="size-4 text-[#8a96a5]" aria-hidden="true" />
              <span className="sr-only">Buscar cliente</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente…"
                className="w-full bg-transparent text-[#172238] outline-none placeholder:text-[#9aa5b2]"
              />
            </label>
          </div>

          {clients.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm leading-6 text-[#7a8797]">
              {initialClients.length
                ? "Ningún cliente coincide con la búsqueda."
                : "Todavía no hay clientes registrados. Empieza por «Nuevo cliente» y mándale el enlace."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[#e7ebf0] text-[11px] uppercase tracking-[0.1em] text-[#8a96a5]">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Cliente</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Dónde trabaja</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Número</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Estado</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => {
                    const blocker = handoverBlocker(client);
                    const delivered = Boolean(client.handedOverAt);
                    return (
                      <tr key={client.slug} className="border-b border-[#f1f4f7] last:border-b-0 align-top">
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#eef3f7] text-[#385875]">
                              <Building2 className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0">
                              <span className="block font-semibold text-[#172238]">{client.name}</span>
                              <span className="block font-mono text-[11px] text-[#8a96a5]">{client.slug}</span>
                              {client.contact && (
                                <span className="block text-xs text-[#7a8797]">{client.contact}</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="block text-[#172238]">
                            {CLIENT_DESTINATION_LABELS[client.destination]}
                          </span>
                          {client.destinationRef && (
                            <span className="block font-mono text-[11px] text-[#8a96a5]">
                              {client.destinationRef}
                            </span>
                          )}
                          {client.destination === "rei_crm" && (
                            <span className="mt-1 block text-xs text-[#7a8797]">
                              {delivered ? "Entregado · webhook redirigido" : "Sin entregar"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {client.displayPhoneNumber ? (
                            <>
                              <span className="block text-[#172238]">{client.displayPhoneNumber}</span>
                              <span className="block text-xs text-[#7a8797]">
                                {client.connectionStatus}
                                {client.numbers > 1 ? ` · ${client.numbers} números` : ""}
                              </span>
                            </>
                          ) : (
                            <span className="text-[#9aa5b2]">Sin conectar</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_TONE[client.status]}`}
                          >
                            {CLIENT_STATUS_LABELS[client.status]}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => copyOnboardingLink(client)}
                              disabled={busy === `link:${client.slug}`}
                              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#dce3ea] px-2.5 text-xs font-semibold text-[#385875] transition hover:bg-[#f1f4f7] disabled:opacity-50"
                            >
                              {copied === client.slug ? (
                                <Check className="size-3.5" aria-hidden="true" />
                              ) : (
                                <Copy className="size-3.5" aria-hidden="true" />
                              )}
                              {copied === client.slug ? "Copiado" : "Enlace"}
                            </button>
                            {client.destination === "rei_crm" && (
                              <button
                                type="button"
                                onClick={() => handover(client)}
                                disabled={Boolean(blocker) || busy === `handover:${client.slug}`}
                                title={blocker ? HANDOVER_BLOCKER_LABELS[blocker] : undefined}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#142b4b] px-2.5 text-xs font-semibold text-white transition hover:bg-[#203c60] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Send className="size-3.5" aria-hidden="true" />
                                {busy === `handover:${client.slug}`
                                  ? "Entregando…"
                                  : delivered
                                    ? "Reentregar"
                                    : "Entregar a REI"}
                              </button>
                            )}
                            {client.phoneNumberId && (
                              <a
                                href={`/ops/connections/${client.phoneNumberId}`}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-[#68778a] transition hover:text-[#142b4b]"
                              >
                                <Link2 className="size-3.5" aria-hidden="true" /> Conexión
                              </a>
                            )}
                          </div>
                          {blocker && client.destination === "rei_crm" && (
                            <p className="mt-1.5 text-[11px] text-[#8a96a5]">
                              {HANDOVER_BLOCKER_LABELS[blocker]}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
