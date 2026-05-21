import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

type Proyecto = {
  num: string;
  name: string;
  tag: string;
  desc: string;
  stack: string[];
  url: string;
  image?: string;
  brand?: { bg: string; fg: string; logo: string };
};

const PROYECTOS: Proyecto[] = [
  {
    num: "01",
    name: "Pace Running",
    tag: "SaaS · Coaching",
    desc: "App para coaches de running: planes, atletas y métricas semanales.",
    stack: ["Next.js", "Supabase", "TypeScript"],
    url: "https://pace-running-three.vercel.app",
    image: "/projects/pace-running/01-desktop.jpg",
  },
  {
    num: "02",
    name: "Rei FM",
    tag: "SaaS · Real estate",
    desc: "Gestión de propiedades, contratos y cobranzas para inmobiliarias.",
    stack: ["Next.js", "Postgres", "Stripe"],
    url: "https://rei-fm.vercel.app",
    image: "/projects/rei-fm/01-desktop.jpg",
  },
  {
    num: "03",
    name: "Soapy",
    tag: "SaaS · Operaciones",
    desc: "Gestión ágil para lavanderías: órdenes, ruta y notificaciones.",
    stack: ["Next.js", "Supabase", "WhatsApp"],
    url: "https://soapy-sooty.vercel.app",
    brand: { bg: "#3FBFB8", fg: "#ffffff", logo: "soapy" },
  },
  {
    num: "04",
    name: "Artistheway",
    tag: "Ecommerce · Marca",
    desc: "Tienda online para una marca de arte. Catálogo y checkout.",
    stack: ["Next.js", "Stripe", "Tailwind"],
    url: "https://artistheway.vercel.app",
    image: "/projects/artistheway/01-desktop.jpg",
  },
  {
    num: "05",
    name: "Taller Samer",
    tag: "SaaS · Taller",
    desc: "Software para taller mecánico: órdenes de trabajo, clientes, repuestos.",
    stack: ["Next.js", "Postgres", "Supabase"],
    url: "https://taller-samer.vercel.app",
    image: "/projects/taller-samer/01-desktop.jpg",
  },
  {
    num: "06",
    name: "Mistica",
    tag: "App · Wellness",
    desc: "Reservas y clases para academia de natación. Cupos y pagos.",
    stack: ["Next.js", "Supabase", "Stripe"],
    url: "https://mistica-app-fawn.vercel.app",
    image: "/projects/mistica/dashboard.png",
  },
];

function ProjectMedia({ p }: { p: Proyecto }) {
  if (p.image) {
    return (
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10">
        <Image
          src={p.image}
          alt={`Captura de ${p.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-top group-hover:scale-[1.03] transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
    );
  }
  const b = p.brand!;
  return (
    <div
      className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl flex items-center justify-center"
      style={{ background: b.bg, color: b.fg }}
    >
      <div className="absolute inset-0 opacity-30" style={{
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.2), transparent 60%)`,
      }} />
      <div className="relative font-display text-5xl md:text-6xl tracking-tight font-bold lowercase">
        {b.logo}
      </div>
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between font-mono text-[10px] tracking-widest uppercase opacity-80">
        <span>{p.tag}</span>
        <span>· login gated</span>
      </div>
    </div>
  );
}

export default function ProyectosShowcase() {
  return (
    <section
      id="proyectos"
      className="relative w-full bg-[#1f2a1d] text-white scroll-mt-24 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-24 md:py-32">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 md:mb-20">
          <div>
            <div className="text-xs font-medium tracking-widest uppercase text-[#85AB8B] mb-4">
              Proyectos
            </div>
            <h2
              className="font-normal leading-[0.95] text-4xl sm:text-5xl md:text-6xl lg:text-7xl max-w-3xl text-white"
              style={{ letterSpacing: "-0.035em" }}
            >
              Trabajos{" "}
              <span className="text-[#85AB8B]">vivos, no demos.</span>
            </h2>
          </div>
          <p className="text-white/70 text-base md:text-lg max-w-sm leading-relaxed">
            Productos reales en producción. Cada uno construido con su equipo, su industria y sus restricciones.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {PROYECTOS.map((p) => (
            <a
              key={p.num}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col bg-white/[0.04] border border-white/10 rounded-3xl p-4 hover:bg-white/[0.07] hover:border-white/20 hover:-translate-y-1 transition-all duration-300"
            >
              <ProjectMedia p={p} />

              <div className="px-3 md:px-4 pt-6 pb-3">
                <div className="flex items-start justify-between mb-4">
                  <span className="text-xs font-mono font-medium text-[#85AB8B] tracking-widest">
                    {p.num} · {p.tag}
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
                </div>
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
                  {p.name}
                </h3>
                <p className="text-white/65 text-sm leading-relaxed mb-6">
                  {p.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-medium text-white/70 bg-white/[0.06] border border-white/10 px-2.5 py-1 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-16 md:mt-20 flex items-center justify-center">
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-white text-[#1f2a1d] hover:bg-[#85AB8B] hover:text-white text-sm font-semibold px-6 py-3 rounded-full transition-colors"
          >
            ¿Tu proyecto es el siguiente?
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
