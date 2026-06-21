"use client";

import { useState } from "react";
import { ArrowRight, Check, Clock3, RotateCcw, Sparkles, TrendingDown } from "lucide-react";
import { track } from "@vercel/analytics";
import { whatsappUrl } from "@/lib/contact";

type CalculatorState = {
  people: number;
  weeklyHours: number;
  hourlyCost: number;
  automatable: number;
};

const DEFAULTS: CalculatorState = {
  people: 3,
  weeklyHours: 8,
  hourlyCost: 10,
  automatable: 60,
};

const PRESETS: Array<{ label: string; description: string; values: CalculatorState }> = [
  {
    label: "Equipo pequeño",
    description: "2 personas · operación ligera",
    values: { people: 2, weeklyHours: 5, hourlyCost: 8, automatable: 50 },
  },
  {
    label: "Operación comercial",
    description: "Seguimiento y carga de datos",
    values: { people: 4, weeklyHours: 10, hourlyCost: 12, automatable: 65 },
  },
  {
    label: "Proceso intensivo",
    description: "Mucho trabajo manual",
    values: { people: 8, weeklyHours: 15, hourlyCost: 10, automatable: 70 },
  },
];

const OFFERS = [
  ["Landing Page", "USD 199", "3 días", "Captar y convertir demanda con una oferta clara."],
  ["Automatización", "Desde USD 499", "5–10 días", "Eliminar un flujo repetitivo con trazabilidad."],
  ["Web / Producto", "Desde USD 699", "10–21 días", "Construir una operación, dashboard o producto completo."],
] as const;

const usd = new Intl.NumberFormat("es-VE", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat("es-VE", { maximumFractionDigits: 1 });

export default function QuoteConfigurator() {
  const [values, setValues] = useState(DEFAULTS);

  const monthlyHours = values.people * values.weeklyHours * 4.33;
  const monthlyCost = monthlyHours * values.hourlyCost;
  const recoveredHours = monthlyHours * (values.automatable / 100);
  const monthlyPotential = monthlyCost * (values.automatable / 100);
  const annualPotential = monthlyPotential * 12;
  const paybackMonths = monthlyPotential > 0 ? 499 / monthlyPotential : 0;

  const summary = `Hola, quiero revisar una automatización con creativv. Mi estimación es: ${values.people} personas, ${values.weeklyHours} horas semanales por persona en tareas repetitivas, costo de ${usd.format(values.hourlyCost)}/hora y ${values.automatable}% potencialmente automatizable. La calculadora estima ${number.format(recoveredHours)} horas recuperables al mes y un valor potencial de ${usd.format(monthlyPotential)} mensuales. Quiero validar estos supuestos.`;

  const update = (key: keyof CalculatorState, next: number) => {
    setValues((current) => ({ ...current, [key]: next }));
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              setValues(preset.values);
              track("savings_preset_selected", { preset: preset.label });
            }}
            className="group rounded-full border border-[#172016]/10 bg-white/65 px-4 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#31583a]/30 hover:bg-white"
          >
            <span className="block text-xs font-semibold text-[#273526]">{preset.label}</span>
            <span className="hidden text-[10px] text-[#73806f] sm:block">{preset.description}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setValues(DEFAULTS)}
          className="ml-auto inline-flex size-11 items-center justify-center rounded-full border border-[#172016]/10 bg-white/65 text-[#53624f] transition-colors hover:bg-white hover:text-[#172016]"
          aria-label="Restablecer calculadora"
        >
          <RotateCcw className="size-4" />
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
        <section className="rounded-[1.75rem] border border-[#172016]/10 bg-white p-5 shadow-[0_24px_80px_rgba(23,32,22,0.07)] sm:p-8">
          <div className="mb-8 flex items-start justify-between gap-5 border-b border-[#172016]/10 pb-6">
            <div>
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#587151]">Tus números</div>
              <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">¿Cuánto cuesta repetirlo?</h2>
            </div>
            <span className="hidden rounded-full bg-[#edf1e8] px-3 py-1.5 text-xs font-semibold text-[#456241] sm:block">
              Resultado en vivo
            </span>
          </div>

          <div className="grid gap-7">
            <CalculatorField
              id="people"
              label="Personas involucradas"
              hint="Quienes hacen parte del trabajo manual"
              value={values.people}
              min={1}
              max={30}
              step={1}
              suffix="personas"
              onChange={(value) => update("people", value)}
            />
            <CalculatorField
              id="weekly-hours"
              label="Horas repetitivas por semana"
              hint="Por persona, no el total del equipo"
              value={values.weeklyHours}
              min={1}
              max={40}
              step={1}
              suffix="h/sem"
              onChange={(value) => update("weeklyHours", value)}
            />
            <CalculatorField
              id="hourly-cost"
              label="Costo promedio por hora"
              hint="Salario, honorarios y carga operativa estimada"
              value={values.hourlyCost}
              min={3}
              max={100}
              step={1}
              prefix="$"
              suffix="USD"
              onChange={(value) => update("hourlyCost", value)}
            />
            <CalculatorField
              id="automatable"
              label="Parte potencialmente automatizable"
              hint="Usa 50–70% si todavía no tienes un mapa del proceso"
              value={values.automatable}
              min={10}
              max={90}
              step={5}
              suffix="%"
              onChange={(value) => update("automatable", value)}
            />
          </div>
        </section>

        <aside className="overflow-hidden rounded-[1.75rem] bg-[#172016] text-white shadow-[0_36px_100px_rgba(23,32,22,0.24)] lg:sticky lg:top-24">
          <div className="border-b border-white/10 p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#b8d397]">Capacidad recuperable</div>
              <Sparkles className="size-4 text-[#b8d397]" />
            </div>
            <div aria-live="polite" aria-atomic="true">
              <div className="mt-5 font-display text-[clamp(3.4rem,7vw,6rem)] leading-[0.8] tracking-[-0.05em] text-[#dbe9c3]">
                {number.format(recoveredHours)} h
              </div>
              <span className="sr-only">recuperables al mes</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/48">
              al mes que podrían volver a ventas, servicio o trabajo estratégico.
            </p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[#b8d397] transition-[width] duration-500"
                style={{ width: `${values.automatable}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px bg-white/10">
            <Metric label="Costo manual / mes" value={usd.format(monthlyCost)} icon={<Clock3 className="size-3.5" />} />
            <Metric label="Valor recuperable / mes" value={usd.format(monthlyPotential)} icon={<TrendingDown className="size-3.5" />} />
            <Metric label="Potencial / año" value={usd.format(annualPotential)} />
            <Metric
              label="Retorno desde USD 499"
              value={paybackMonths > 0 ? `${number.format(paybackMonths)} meses` : "—"}
            />
          </div>

          <div className="p-6 sm:p-8">
            <a
              href={whatsappUrl(summary)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("savings_calculator_handoff", {
                people: values.people,
                monthly_potential: Math.round(monthlyPotential),
              })}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#dbe9c3] px-6 text-sm font-semibold text-[#172016] transition-all hover:-translate-y-0.5 hover:bg-white"
            >
              Validar este ahorro
              <ArrowRight className="size-4" />
            </a>
            <p className="mt-4 text-center text-[10px] leading-4 text-white/32">
              Estimación orientativa. Validamos proceso, excepciones y alcance antes de proponer una inversión.
            </p>
          </div>
        </aside>
      </div>

      <section className="mt-16">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#587151]">Formas de empezar</div>
            <h2 className="mt-3 font-display text-4xl leading-none sm:text-5xl">Del cálculo a un sistema real.</h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-[#53624f]">
            El precio final depende del proceso. Estos rangos mantienen una entrada clara y verificable.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {OFFERS.map(([name, price, delivery, result]) => (
            <article key={name} className="rounded-[1.3rem] border border-[#172016]/10 bg-white/70 p-6">
              <div className="flex items-center justify-between gap-3 font-mono text-[9px] uppercase tracking-[0.15em] text-[#73806f]">
                <span>{delivery}</span>
                <Check className="size-3.5 text-[#456241]" />
              </div>
              <h3 className="mt-6 font-display text-3xl leading-none">{name}</h3>
              <div className="mt-3 text-sm font-semibold text-[#31583a]">{price}</div>
              <p className="mt-5 text-sm leading-6 text-[#53624f]">{result}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CalculatorField({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  prefix,
  suffix,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  prefix?: string;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const normalize = (value: number) => Math.min(max, Math.max(min, value || min));
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-start justify-between gap-5">
        <label htmlFor={`${id}-number`}>
          <span className="block text-sm font-semibold text-[#273526]">{label}</span>
          <span className="mt-1 block text-xs leading-5 text-[#7a8676]">{hint}</span>
        </label>
        <div className="flex shrink-0 items-center rounded-xl border border-[#172016]/10 bg-[#f4f0e5] px-3 focus-within:border-[#456b48]/45">
          {prefix && <span className="text-sm font-semibold text-[#53624f]">{prefix}</span>}
          <input
            id={`${id}-number`}
            type="number"
            inputMode="decimal"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(event) => onChange(normalize(Number(event.target.value)))}
            className="w-14 bg-transparent py-2 text-right text-lg font-semibold tabular-nums outline-none"
          />
          <span className="ml-1 text-[10px] font-semibold text-[#73806f]">{suffix}</span>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={`Ajustar ${label.toLowerCase()}`}
        aria-valuetext={`${value} ${suffix}`}
        className="savings-range mt-4 w-full"
        style={{ "--range-progress": `${progress}%` } as React.CSSProperties}
      />
      <div className="mt-1.5 flex justify-between font-mono text-[8px] uppercase tracking-[0.12em] text-[#98a095]">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#172016] p-5 sm:p-6">
      <div className="flex items-center gap-2 text-[10px] text-white/38">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-lg font-semibold tabular-nums text-white sm:text-xl">{value}</div>
    </div>
  );
}
