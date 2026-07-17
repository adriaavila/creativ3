import Link from "next/link";

export const metadata = {
  title: "Acceso Ops | Creativv",
  description: "Acceso privado al centro operativo de Creativv.",
};

export default async function OpsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = params.next?.startsWith("/ops") ? params.next : "/ops";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f1711] p-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 shadow-2xl shadow-black/30 sm:p-9">
        <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#a9c989]">
          Creativv · Operación privada
        </div>
        <h1 className="mt-4 font-display text-5xl leading-[0.9]">Entrar a Ops</h1>
        <p className="mt-4 text-sm leading-6 text-white/50">
          Acceso protegido a prompts, leads, números conectados y mensajería comercial.
        </p>

        {params.error === "1" && (
          <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/8 px-4 py-3 text-sm text-red-200">
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
            className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-[#a9c989]/50"
          />
          <button
            type="submit"
            className="mt-4 min-h-12 w-full rounded-full bg-[#dbe9c3] px-5 text-sm font-semibold text-[#172016] transition hover:bg-white"
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
