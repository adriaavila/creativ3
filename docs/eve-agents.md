# Agentes Eve en allok

`apps/growth-agent` es la fuente de verdad del agente operativo de allok. El panel `/ops/agents` solo lo inspecciona desde el servidor; no edita archivos, no expone secretos y no inicia sesiones Eve.

## Qué existe hoy

- Agente raíz: `apps/growth-agent/agent/agent.ts` + `instructions.md`.
- Herramientas: `apps/growth-agent/agent/tools/`. Un archivo con `disableTool()` queda deshabilitado.
- Subagentes declarados: `apps/growth-agent/agent/subagents/<id>/`.
- Canal: `apps/growth-agent/agent/channels/eve.ts`.
- Schedules raíz: `apps/growth-agent/agent/schedules/` con cron en frontmatter.
- Evaluaciones: `apps/growth-agent/evals/*.eval.ts` y `evals.config.ts`.

Eve obtiene la identidad por la ruta de cada archivo. Por eso mover o renombrar una herramienta, subagente o evaluación también cambia su identidad. Mantén estos cambios en una rama y revisa el diff antes de desplegar.

## Crear un agente nuevo

1. Duplica el patrón mínimo en una aplicación separada bajo `apps/`.
2. Declara el paquete y la versión en `package.json`.
3. Crea `agent/agent.ts` con `defineAgent({ model })` e `instructions.md` con misión, límites y política de escalamiento.
4. Agrega solo las capacidades que existan: cada tool debe tener `description`, `inputSchema` y `execute`; cada subagente declarado necesita `agent.ts` con `description`.
5. Escribe un `.eval.ts` por comportamiento importante. Los evals deben poder ejecutarse contra el servidor Eve real, no contra mocks del panel.

Ejemplo de estructura:

```text
apps/my-agent/
├── package.json
├── agent/
│   ├── agent.ts
│   ├── instructions.md
│   ├── tools/
│   ├── channels/
│   ├── subagents/
│   └── schedules/
└── evals/
    ├── evals.config.ts
    └── smoke.eval.ts
```

## Versionar y promover

1. Cambia prompt, tool o eval en una rama.
2. Ejecuta `pnpm --dir apps/growth-agent typecheck`.
3. Lista los evals descubiertos: `pnpm --dir apps/growth-agent eval --list`.
4. Ejecuta la suite con sus credenciales de evaluación: `pnpm --dir apps/growth-agent eval --strict --junit .eve/junit.xml`.
5. Revisa los artefactos en `.eve/evals/` y el diff de archivos.
6. Promueve por etapas: `Simulation` → `Shadow` → `Approval` → `Production`. El paso `Approval` requiere que una persona revise la salida antes de usarla en WhatsApp.

Los modos que muestra `/ops/agents` son controles de diseño. Mientras no exista un puente seguro entre Eve y el flujo de envío oficial de Meta, no deben interpretarse como un cambio de runtime.

## Despliegue

Desde la raíz del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm --dir apps/growth-agent build
pnpm --dir apps/growth-agent start
```

El paquete actual usa Eve `0.11.7`; no actualices Eve como parte de una modificación del CRM sin revisar el changelog, regenerar el lockfile y repetir typecheck, build y evals. En Vercel, configura el proyecto con `apps/growth-agent` como root o conserva el comando `eve build` equivalente del monorepo.

Variables necesarias para el runtime actual:

- `DATABASE_URL` para las herramientas que persisten datos de growth.
- `AI_GATEWAY_API_KEY` o la credencial de Vercel AI Gateway equivalente.
- `GROWTH_MODEL` opcional; `agent.ts` tiene un fallback de modelo.
- `GROWTH_AGENT_USERNAME` y `GROWTH_AGENT_PASSWORD` opcionales para HTTP Basic; nunca se envían al navegador.

No copies valores de secretos a `instructions.md`, evals, logs ni resultados de tools. Las credenciales deben configurarse en el entorno de despliegue.

## WhatsApp oficial y Eve

La integración oficial de WhatsApp sigue siendo propiedad de Meta/Next/Neon: el webhook persiste el mensaje, el CRM actualiza la conversación y las respuestas pasan por la ventana de 24 horas y las plantillas aprobadas. Eve puede proponer una respuesta o clasificar una conversación, pero no debe saltarse esa ruta ni enviar por su cuenta.

El puente correcto para una futura promoción es:

```text
Meta Cloud API → webhook → Neon → Eve (propuesta) → aprobación humana → API existente de WhatsApp
```

Hasta que ese puente tenga autenticación, aislamiento por tenant, idempotencia y evals de envío, mantén Eve en `Simulation`, `Shadow` o `Approval`.
