import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

/**
 * «Arma tu demo», sin su ropa: el dueño pega su web y en ~30 segundos le
 * escribe a un agente que ya conoce su negocio (`/demo/<slug>?tuya=1`), antes
 * de crear cuenta. Lo pesado vive en `/api/demo/crear`. Lo usan `ArmaTuDemo`
 * (en /agente-whatsapp) y la demo de la portada, cada uno con su marcado.
 */

const STEPS = ["Abriendo tu web…", "Leyendo tus servicios y precios…", "Enseñándole a tu agente…", "Casi listo…"];

export function useArmarDemo() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  // El `error.code` de la API, para quien quiera decir el error a su manera (la portada no tiene cuenta que crear).
  const [codigo, setCodigo] = useState<string | null>(null);

  // La espera se cuenta: cada paso se ve unos segundos, el último se queda.
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 7000);
    return () => window.clearInterval(id);
  }, [busy]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setCodigo(null);
    setStep(0);
    setBusy(true);
    const res = await fetch("/api/demo/crear", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, website }),
    }).catch(() => null);
    const data = (await res?.json().catch(() => null)) as { slug?: string; error?: { code?: string; message?: string } } | null;
    if (res?.ok && data?.slug) {
      router.push(`/demo/${data.slug}?tuya=1`);
      return;
    }
    setBusy(false);
    setCodigo(data?.error?.code ?? null);
    setError(data?.error?.message ?? "No pudimos armar la demo ahora. Prueba de nuevo en un momento.");
  }

  return { name, setName, website, setWebsite, busy, paso: STEPS[step], error, codigo, submit };
}
