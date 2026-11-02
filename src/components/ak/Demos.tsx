import type { Build } from "@/lib/builds";
import { vars } from "./Brand";

// The scripted demos that run inside each capture until the real capture
// exists (design system, Build §4). Markup is the Home card's, 1:1; motion.js
// plays the data-step attributes. Every one carries the demo label.

const WAVE = [8, 14, 22, 12, 26, 18, 10, 24, 16, 8, 20, 12, 6, 14, 22, 10];

function Wave(props: { "data-add": string; "data-wait": string; "data-for"?: string; "data-order"?: string }) {
  return (
    <span className="ui-wave" aria-hidden="true" data-step {...props}>
      {WAVE.map((h, k) => (
        <i key={k} style={vars({ "--h": `${h}px`, "--k": k })} />
      ))}
    </span>
  );
}

function Bar({ title }: { title: string }) {
  return (
    <div className="window-bar">
      <span>{title}</span>
      <span className="window-end">
        <button className="run-toggle" type="button" data-run-toggle aria-pressed="false">
          Pause
        </button>
        <span className="demo-label">Demo · not live data</span>
      </span>
    </div>
  );
}

function Vocero() {
  return (
    <div className="split">
      <div className="chat">
        <span className="chat-day">Today · 23:14</span>
        <p className="msg" data-step data-order="1" data-wait="600" lang="es">
          Hola, ¿cuánto cuesta la limpieza dental?<time>23:14</time>
        </p>
        <p className="msg out" data-step data-order="2" data-type="1300" data-wait="300" lang="es">
          ¡Hola! Cuesta $35 y dura 40 minutos. Mañana tengo libre a las 9:00 y a las 16:30. ¿Te reservo una?<time>23:14</time>
        </p>
        <p className="msg" data-step data-order="3" data-wait="1100" lang="es">
          A las 9, porfa<time>23:15</time>
        </p>
        <p className="msg out" data-step data-order="9" data-type="900" data-wait="300" lang="es">
          Listo: mañana a las 9:00. Te escribo una hora antes.<time>23:15</time>
        </p>
      </div>
      <aside className="booking">
        <p className="label">Booked by vocero</p>
        <dl>
          <div data-step data-order="4" data-wait="400"><dt>Customer</dt><dd>New · WhatsApp</dd></div>
          <div data-step data-order="5" data-wait="140"><dt>Service</dt><dd>Dental cleaning</dd></div>
          <div data-step data-order="6" data-wait="140"><dt>When</dt><dd>Tomorrow, 9:00</dd></div>
          <div data-step data-order="7" data-wait="140"><dt>Price</dt><dd className="tnum">$35</dd></div>
          <div data-step data-order="8" data-wait="140"><dt>Reminder</dt><dd>Tomorrow, 8:00</dd></div>
        </dl>
        <span className="ok" data-step data-order="10" data-wait="400">
          Confirmed at 23:15 · nobody was awake
        </span>
      </aside>
    </div>
  );
}

function Dilo() {
  return (
    <div className="ui">
      <p className="ui-q">What are you feeling right now?</p>
      <div className="chips">
        <span className="chip">calm</span>
        <span className="chip" data-step data-add="on" data-wait="900" data-for="450">anxious</span>
        <span className="chip" data-step data-add="on" data-wait="550">tired</span>
        <span className="chip">frustrated</span>
        <span className="chip">happy</span>
        <span className="chip">lonely</span>
      </div>
      <p className="ui-say" data-step data-wait="350">
        I&apos;m feeling <b>tired</b>, and it&apos;s okay to say it.
      </p>
      <div className="ui-rec">
        <span className="btn btn-primary" data-step data-add="is-pressed" data-wait="700" data-for="160">
          Say it out loud
        </span>
        <Wave data-add="is-live" data-wait="0" />
        <span className="ui-time" data-step data-add="is-counting" data-count="0:42" data-count-ms="2600" data-wait="0">
          0:00
        </span>
      </div>
    </div>
  );
}

function Banter() {
  return (
    <div className="ui">
      <p className="ui-q">Tell me about your weekend.</p>
      <div className="chat" style={{ padding: 0 }}>
        <p className="msg out" data-step data-order="3" data-type="600" data-wait="1500">
          Last weekend I go to the mountains with my friends.<time>You · 0:06</time>
        </p>
        <p className="fix" data-step data-order="4" data-wait="500">
          <s>go</s> → <b>went</b> · past tense
        </p>
        <p className="msg" data-step data-order="5" data-type="1000" data-wait="600">
          Nice. What did you do up there?<time>banter</time>
        </p>
      </div>
      <div className="ui-rec">
        <span className="btn btn-solid" data-step data-order="1" data-add="is-pressed" data-wait="700" data-for="1500">
          Hold to talk
        </span>
        <Wave data-order="2" data-add="is-live" data-wait="0" data-for="1500" />
        <span className="ui-time">Round 3 of 5</span>
      </div>
    </div>
  );
}

const BODIES = { vocero: Vocero, dilo: Dilo, banter: Banter } as const;
const HOLD = { vocero: "2800", dilo: "2600", banter: "2800" } as const;

/** The capture: a Cloud window with the build's demo running inside. */
export function Capture({ build }: { build: Build }) {
  const Body = BODIES[build.demo];
  return (
    <figure
      className="window"
      data-theme="cloud"
      data-reveal="window"
      style={vars({ margin: 0, "--d": build.featured ? "200ms" : "150ms" })}
      data-parallax={build.featured ? undefined : "0.05"}
      data-run
      data-hold={HOLD[build.demo]}
    >
      <Bar title={build.windowTitle} />
      <Body />
    </figure>
  );
}
