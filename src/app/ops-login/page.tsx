import Link from "next/link";
import AllokLogo from "@/components/brand/AllokLogo";
import Waveform from "@/components/brand/Waveform";

export const metadata = {
  title: "Acceso Ops",
  description: "Acceso privado al centro operativo de Allok.",
};

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath =
    params.next?.startsWith("/ops") || params.next?.startsWith("/embedded-whatsapp")
      ? params.next
      : "/ops";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090a] p-6 text-white">
      {/* The mark at banner scale, dimmed to a texture. */}
      <Waveform
        className="pointer-events-none absolute inset-x-0 top-1/2 h-[420px] w-[160%] -translate-x-[15%] -translate-y-1/2 text-white/[0.06]"
        cycles={26}
        weight={2}
      />

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/40 sm:p-9">
        <AllokLogo variant="mark" className="h-11 w-11" />
        <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.2em] text-[#c5f04a]">
          allok · Operación privada
        </div>
        <h1 className="mt-3 font-display text-5xl leading-[0.9]">Entrar a Ops</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">
          Acceso protegido a prompts, leads, números conectados y mensajería comercial.
        </p>

        {params.error === "1" && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            La contraseña no es correcta.
          </div>
        )}

        <form action="/api/ops/login" method="post" className="mt-6">
          <input type="hidden" name="next" value={nextPath} />
          <label className="text-xs font-medium text-white/55" htmlFor="ops-password">
            Contraseña de acceso
          </label>
          <input
            id="ops-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-[#c5f04a]/60"
          />
          <button
            type="submit"
            className="mt-4 min-h-12 w-full rounded-full bg-[#c5f04a] px-5 text-sm font-semibold text-[#0a0a0a] transition hover:bg-white"
          >
            Continuar
          </button>
        </form>

        <Link href="/" className="mt-6 inline-flex text-xs text-white/35 transition hover:text-white/70">
          Volver al sitio
        </Link>
      </div>
    </main>
  );
}
