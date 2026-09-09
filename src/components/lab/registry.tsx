import SystemsConstellation from "./SystemsConstellation";
import type { ComponentType } from "react";
import AgentTerminal from "./AgentTerminal";
import GlassForge from "./GlassForge";
import SkyMachine from "./SkyMachine";
import TypeWeather from "./TypeWeather";

export type Experiment = {
  slug: string;
  unit: string;
  title: string;
  /** The thing I actually wanted to find out. */
  question: string;
  note: string;
  Component: ComponentType<{ compact?: boolean }>;
};

export const EXPERIMENTS: Experiment[] = [
  {
    slug: "systems-constellation", unit: "L-05", title: "Systems constellation",
    question: "What connects the things I build?",
    note: "Every bright point is a project, grouped by its primary role: web, applications or automation. Rotate the field to see the connections, then open a system to see the work behind it. A Canvas 2D projection gives the field depth; an ordinary list keeps every project within reach.",
    Component: SystemsConstellation,
  },
  {
    slug: "sky-machine",
    unit: "L-01",
    title: "Sky Machine",
    question: "Can one number light a whole site?",
    note: "The engine behind every sky plate here, with its knobs exposed. Scroll position feeds it in production; a slider feeds it in the lab. One value moves the gradient, the glow and the glass tint together — and a test keeps the text readable across the entire range.",
    Component: SkyMachine,
  },
  {
    slug: "glass-forge",
    unit: "L-02",
    title: "Glass Forge",
    question: "What actually makes glass look expensive?",
    note: "Four things, it turns out: a specular top edge, a chromatic rim, a puddle of coloured light underneath, and a tint borrowed from whatever is behind it. Turn each one off and watch it get cheap. Copy the CSS when you like it.",
    Component: GlassForge,
  },
  {
    slug: "type-weather",
    unit: "L-03",
    title: "Type Weather",
    question: "How far can type move and still be read?",
    note: "A flow field pushes each glyph; your cursor shoves them out of the way. Somewhere around 60 turbulence it stops being a word and becomes a texture. Useful to know before putting motion on a headline.",
    Component: TypeWeather,
  },
  {
    slug: "agent-terminal",
    unit: "L-04",
    title: "Agent Terminal",
    question: "What does building with agents actually look like?",
    note: "Less magic than the demos suggest. A replay of a real fix on this repository: the agent reads, proposes, and I approve the diff. Fast, not trusted.",
    Component: AgentTerminal,
  },
];

export const findExperiment = (slug: string) => EXPERIMENTS.find((e) => e.slug === slug);
