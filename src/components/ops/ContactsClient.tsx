"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, ContactRound, MessageCircle, Search } from "lucide-react";
import type { GrowthLead } from "@/lib/growth-types";
import type { WaConversation } from "@/lib/whatsapp-inbox-db";
import { formatWhatsAppPhone, normalizeWhatsAppId } from "@/lib/phone";

type ContactsClientProps = {
  initialLeads: GrowthLead[];
  initialConversations: WaConversation[];
};

type Contact = {
  key: string;
  name: string;
  phone: string | null;
  lead: GrowthLead | null;
  conversation: WaConversation | null;
};

const STATUS_LABELS: Record<GrowthLead["status"], string> = {
  new: "Nuevo",
  researched: "Investigado",
  drafted: "Borrador",
  approved: "Aprobado",
  contacted: "Contactado",
  replied: "Respondió",
  meeting_booked: "Cita",
  won: "Ganado",
  lost: "Perdido",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts.slice(0, 2).map((part) => Array.from(part)[0]).join("").toUpperCase() : "WA";
}

function statusLabel(status: GrowthLead["status"] | null) {
  return status ? STATUS_LABELS[status] : "Sin lead";
}

function contactPhone(conversation: WaConversation) {
  return formatWhatsAppPhone(conversation.contactPhone) ?? formatWhatsAppPhone(conversation.contactWaId);
}

function buildContacts(leads: GrowthLead[], conversations: WaConversation[]) {
  const contacts = new Map<string, Contact>();

  for (const lead of leads) {
    const phone = formatWhatsAppPhone(lead.businessPhone);
    const key = normalizeWhatsAppId(lead.businessPhone ?? "") || `lead:${lead.id}`;
    contacts.set(key, { key, name: lead.businessName, phone, lead, conversation: null });
  }

  for (const conversation of conversations) {
    const phone = contactPhone(conversation);
    const key = normalizeWhatsAppId(phone ?? "") || `conversation:${conversation.id}`;
    const existing = contacts.get(key);
    contacts.set(key, {
      key,
      name: conversation.contactName || existing?.name || phone || "Contacto de WhatsApp",
      phone: phone || existing?.phone || null,
      lead: existing?.lead ?? null,
      conversation,
    });
  }

  return [...contacts.values()].sort((left, right) => {
    const leftDate = left.conversation?.lastMessageAt ?? left.lead?.lastContactedAt ?? left.lead?.createdAt ?? "";
    const rightDate = right.conversation?.lastMessageAt ?? right.lead?.lastContactedAt ?? right.lead?.createdAt ?? "";
    return String(rightDate).localeCompare(String(leftDate));
  });
}

export default function ContactsClient({ initialLeads, initialConversations }: ContactsClientProps) {
  const [query, setQuery] = useState("");
  const contacts = useMemo(() => buildContacts(initialLeads, initialConversations), [initialConversations, initialLeads]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return contacts;
    return contacts.filter((contact) => [contact.name, contact.phone, contact.lead?.vertical, contact.lead?.location, contact.conversation?.channelKind]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalized));
  }, [contacts, query]);

  return (
    <main className="min-h-dvh bg-[#f7f8fa] pb-8 text-[#142b4b] lg:pb-5">
      <div className="mx-auto max-w-[1300px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7a8797]">Directorio</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Contactos</h1><p className="mt-2 max-w-xl text-sm leading-6 text-[#68778a]">Una vista de los contactos que ya existen en tus leads y conversaciones.</p></div>
          <Link href="/ops/crm" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#142b4b] px-3 text-xs font-semibold text-white transition hover:bg-[#203c60] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#142b4b]"><ContactRound className="size-4" aria-hidden="true" /> Ver pipeline</Link>
        </header>

        <section className="mt-7 overflow-hidden rounded-xl border border-[#e2e7ed] bg-white" aria-labelledby="contacts-heading">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e7ebf0] px-4 py-4 sm:px-5">
            <div><h2 id="contacts-heading" className="text-sm font-semibold text-[#172238]">Todos los contactos <span className="ml-1 font-normal text-[#8a96a5]">{contacts.length}</span></h2><p className="mt-1 text-xs text-[#7a8797]">Sincronizados desde Neon; esta vista no crea ni modifica contactos.</p></div>
            <label className="flex min-h-10 w-full max-w-[300px] items-center gap-2 rounded-lg border border-[#dce3ea] bg-[#fafbfc] px-3 text-sm">
              <Search className="size-4 text-[#8a96a5]" aria-hidden="true" />
              <span className="sr-only">Buscar contactos</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar contacto…" className="w-full bg-transparent text-[#172238] outline-none placeholder:text-[#9aa5b2]" />
            </label>
          </div>

          {filtered.length === 0 ? (
            <p className="px-6 py-16 text-center text-sm leading-6 text-[#7a8797]">{contacts.length ? "No hay contactos que coincidan con la búsqueda." : "Todavía no hay leads ni conversaciones persistidos."}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-collapse text-left">
                <thead className="bg-[#fafbfc] text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8a96a5]"><tr><th className="px-5 py-3 font-semibold">Contacto</th><th className="px-4 py-3 font-semibold">WhatsApp</th><th className="px-4 py-3 font-semibold">Etapa</th><th className="px-4 py-3 font-semibold">Canal</th><th className="px-5 py-3 text-right font-semibold">Abrir</th></tr></thead>
                <tbody>
                  {filtered.map((contact) => {
                    const official = contact.conversation?.channelKind === "cloud_api";
                    const destination = contact.conversation
                      ? `/ops/inbox?conversation=${contact.conversation.id}`
                      : contact.lead
                        ? `/ops/crm?lead=${encodeURIComponent(contact.lead.id)}`
                        : "/ops/crm";
                    const activity = contact.conversation?.lastMessageAt ?? contact.lead?.lastContactedAt ?? contact.lead?.createdAt;
                    return (
                      <tr key={contact.key} className="border-t border-[#edf0f3] transition hover:bg-[#fafbfd]">
                        <td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#e9eef3] text-[11px] font-semibold text-[#526d87]">{initials(contact.name)}</span><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-[#172238]">{contact.name}</p><p className="mt-0.5 truncate text-[11px] text-[#7a8797]">{contact.lead?.vertical || contact.lead?.location || (activity ? new Date(activity).toLocaleDateString("es-VE", { day: "numeric", month: "short" }) : "Sin actividad")}</p></div></div></td>
                        <td className="px-4 py-3.5 text-xs text-[#526174]">{contact.phone || "No disponible"}</td>
                        <td className="px-4 py-3.5"><span className="rounded-full bg-[#f1f4f7] px-2.5 py-1 text-[11px] text-[#526174]">{statusLabel(contact.lead?.status ?? null)}</span></td>
                        <td className="px-4 py-3.5 text-xs"><span className={official ? "text-[#47704d]" : "text-[#7a8797]"}>{official ? "WhatsApp oficial" : contact.conversation ? "WAHA · no oficial" : "Lead"}</span></td>
                        <td className="px-5 py-3.5 text-right"><Link href={destination} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#dce3ea] px-2.5 text-[11px] font-medium text-[#526174] hover:border-[#b9c5d2] hover:text-[#142b4b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f5f7b]">{contact.conversation ? <MessageCircle className="size-3.5" aria-hidden="true" /> : <ArrowUpRight className="size-3.5" aria-hidden="true" />} Abrir</Link></td>
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
