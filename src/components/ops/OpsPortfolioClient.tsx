"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Images,
  LoaderCircle,
  RefreshCw,
  XCircle,
} from "lucide-react";
import type { PortfolioProject } from "@/lib/projects";
import { DISPLAY_TIGHT, TapButton } from "@/components/ops/apple";

type OpsPortfolioClientProps = {
  projects: PortfolioProject[];
  lastSyncedAt: string;
};

type RowState = "idle" | "pending" | "ok" | "error";

export default function OpsPortfolioClient({ projects, lastSyncedAt }: OpsPortfolioClientProps) {
  const [rowState, setRowState] = useState<Record<string, RowState>>({});
  const [globalState, setGlobalState] = useState<RowState>("idle");
  const [runsUrl, setRunsUrl] = useState<string | null>(null);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const withLiveUrl = useMemo(() => projects.filter((p) => p.liveUrl), [projects]);

  async function dispatch(ids: string[], setState: (state: RowState) => void) {
    setState("pending");
    setErrorDetail(null);
    try {
      const res = await fetch("/api/ops/portfolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setRunsUrl(data.runsUrl);
      setState("ok");
    } catch (e) {
      setErrorDetail(e instanceof Error ? e.message : "Error desconocido");
      setState("error");
    }
  }

  return (
    <main className="min-h-dvh bg-[#08090a] pb-24 text-white md:pb-8">
      <div className="mx-auto max-w-[1400px] px-4 pb-5 sm:px-7 lg:px-10">
        <Link
          href="/ops"
          className="mt-6 inline-flex min-h-10 items-center gap-2 text-sm text-white/55 transition hover:text-white"
        >
          <ArrowLeft className="size-4" /> Ops
        </Link>
        <header className="mt-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#c5f04a]">
              Sync portafolio
            </div>
            <h1 className={`mt-2 font-display text-4xl ${DISPLAY_TIGHT}`}>Portafolio</h1>
            <p className="mt-2 text-sm text-white/45">
              {projects.length} proyectos · {withLiveUrl.length} con capturas automáticas · último
              sync {lastSyncedAt}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {runsUrl ? (
              <a
                href={runsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
              >
                <ExternalLink className="size-4" /> Ver en GitHub Actions
              </a>
            ) : null}
            <TapButton
              type="button"
              disabled={globalState === "pending"}
              onClick={() => dispatch([], setGlobalState)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#c5f04a] px-4 text-sm font-semibold text-[#0a0a0a] transition hover:bg-white disabled:opacity-50"
            >
              {globalState === "pending" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}
              Sincronizar todo
            </TapButton>
          </div>
        </header>

        {globalState === "ok" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-[#c5f04a]">
            <CheckCircle2 className="size-4" /> Disparado. La Action captura pantallas y hace commit
            sola — puede tardar unos minutos.
          </p>
        )}
        {globalState === "error" && (
          <p className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <XCircle className="size-4" /> {errorDetail}
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[11px] uppercase tracking-[0.12em] text-white/45">
              <tr>
                <th className="px-4 py-3 font-medium">Proyecto</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Capturas</th>
                <th className="px-4 py-3 font-medium">GitHub</th>
                <th className="px-4 py-3 font-medium text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {projects.map((project) => {
                const state = rowState[project.id] ?? "idle";
                return (
                  <tr key={project.id} className="align-middle">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{project.name}</div>
                      {project.liveUrl ? (
                        <a
                          href={project.liveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-white/45 hover:text-white/70"
                        >
                          {project.liveUrl.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-xs text-white/30">sin liveUrl</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-white/60">{project.categories.join(", ")}</td>
                    <td className="px-4 py-3 text-white/60">
                      <span className="inline-flex items-center gap-1.5">
                        <Images className="size-3.5" /> {project.images.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/45">{project.githubUpdatedLabel}</td>
                    <td className="px-4 py-3 text-right">
                      <TapButton
                        type="button"
                        disabled={!project.liveUrl || state === "pending"}
                        onClick={() =>
                          dispatch([project.id], (s) =>
                            setRowState((prev) => ({ ...prev, [project.id]: s })),
                          )
                        }
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                      >
                        {state === "pending" ? (
                          <LoaderCircle className="size-3.5 animate-spin" />
                        ) : state === "ok" ? (
                          <CheckCircle2 className="size-3.5 text-[#c5f04a]" />
                        ) : (
                          <RefreshCw className="size-3.5" />
                        )}
                        Sincronizar
                      </TapButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
