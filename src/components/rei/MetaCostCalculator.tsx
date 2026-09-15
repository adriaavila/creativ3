"use client";

import { useId, useState } from "react";
import { metaMonthlyCost, usd } from "@/lib/rei-pricing";

/**
 * La calculadora del costo de Meta. Es el argumento comercial entero: ningún
 * competidor enseña lo que el cliente va a pagar aparte, porque todos lo
 * cobran ellos. Asume 5 respuestas por consulta — el promedio que apuntamos
 * con el agente, y la razón por la que vale la pena resolver en pocas.
 */
export default function MetaCostCalculator() {
  const [consultas, setConsultas] = useState(500);
  const [adsShare, setAdsShare] = useState(30);
  const r = metaMonthlyCost({
    consultas,
    repliesPerConsulta: 5,
    adsShare: adsShare / 100,
  });

  return (
    <div className="grid items-center gap-10 rounded-[22px] border border-[var(--line)] bg-white p-6 sm:p-9 lg:grid-cols-[1fr_auto]">
      <div>
        <p className="mono text-[var(--dusk)]">Lo que Meta te cobraría aparte</p>
        <p className="mt-3.5 mb-6 max-w-xl text-[16.5px] leading-relaxed text-[#3E4043] text-pretty">
          Los primeros 1.000 mensajes de servicio por número son gratis cada
          mes. Lo que llega desde un anuncio Click-to-WhatsApp no paga
          mensajería durante 72 horas.
        </p>

        <Slider
          label="Consultas al mes"
          value={consultas}
          min={50}
          max={3000}
          step={50}
          onChange={setConsultas}
        />
        <Slider
          label="Llegan desde anuncios"
          value={adsShare}
          min={0}
          max={100}
          step={5}
          suffix="%"
          onChange={setAdsShare}
        />
      </div>

      <div className="allok-sky min-w-[260px] rounded-[18px] p-7">
        <div>
          <p className="mono opacity-75">Costo Meta</p>
          <p className="display mt-2.5 text-[52px]">{usd(r.cost)}</p>
          <p className="text-[13.5px] opacity-80">al mes, facturado por Meta</p>

          <dl className="mt-4.5 grid gap-1.5 border-t border-[rgba(247,244,239,.26)] pt-3.5 text-[13.5px]">
            <Row k="Respuestas cobrables" v={r.billable.toLocaleString("es")} />
            <Row k="Evitado por anuncios" v={usd(r.avoided)} accent />
          </dl>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, accent }: { k: string; v: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="opacity-80">{k}</dt>
      <dd className={`font-semibold ${accent ? "text-[var(--lit-dusk)]" : ""}`}>{v}</dd>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="mb-5 max-w-lg">
      <label htmlFor={id} className="mb-2 flex justify-between text-sm text-[var(--ink-60)]">
        {label}
        <strong className="font-semibold text-[var(--ink)]">
          {value.toLocaleString("es")}
          {suffix}
        </strong>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
