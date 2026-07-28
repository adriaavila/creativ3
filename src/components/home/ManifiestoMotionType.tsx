"use client";

import { motion, useReducedMotion } from "motion/react";
import React from "react";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delayOffset?: number;
  as?: "h2" | "p" | "span" | "div";
  mode?: "letters" | "words";
  highlightWords?: string[];
}

export function MotionTypeText({
  text,
  className = "",
  delayOffset = 0,
  as: Component = "p",
  mode = "letters",
  highlightWords = [],
}: AnimatedTextProps) {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <Component className={className}>{text}</Component>;
  }

  if (mode === "letters") {
    const words = text.split(" ");

    return (
      <Component className={`inline-block ${className}`}>
        {words.map((word, wordIdx) => {
          const isHighlighted = highlightWords.includes(word.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, ""));
          return (
            <span key={`${word}-${wordIdx}`} className="inline-block whitespace-nowrap mr-[0.28em]">
              {word.split("").map((char, charIdx) => {
                const globalIndex = wordIdx * 5 + charIdx;
                return (
                  <motion.span
                    key={`${char}-${charIdx}`}
                    className={`inline-block transition-colors duration-200 ${
                      isHighlighted ? "text-black font-semibold" : ""
                    }`}
                    initial={{ opacity: 0, y: 14, filter: "blur(4px)", scale: 0.9 }}
                    whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                    viewport={{ once: true, margin: "-10% 0px" }}
                    transition={{
                      duration: 0.45,
                      delay: delayOffset + globalIndex * 0.018,
                      ease: [0.215, 0.61, 0.355, 1],
                    }}
                    whileHover={{
                      y: -4,
                      scale: 1.12,
                      color: "#000000",
                      transition: { duration: 0.15, ease: "easeOut" },
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
          );
        })}
      </Component>
    );
  }

  // Words mode fallback for longer blocks
  const words = text.split(" ");
  return (
    <Component className={`inline-block ${className}`}>
      {words.map((word, wordIdx) => (
        <motion.span
          key={`${word}-${wordIdx}`}
          className="inline-block mr-[0.3em]"
          initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{
            duration: 0.5,
            delay: delayOffset + wordIdx * 0.035,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </Component>
  );
}

export default function ManifiestoMotionType() {
  return (
    <div className="mx-auto max-w-4xl px-5 text-center sm:px-8">
      {/* Label */}
      <motion.p
        initial={{ opacity: 0, letterSpacing: "0.4em" }}
        whileInView={{ opacity: 1, letterSpacing: "0.2em" }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-400"
      >
        Manifiesto
      </motion.p>

      {/* Main Title with Motion Type */}
      <div className="mt-4 overflow-hidden py-1">
        <MotionTypeText
          as="h2"
          text="Observar antes de construir"
          className="text-[clamp(2.2rem,4.8vw,3.8rem)] font-bold tracking-tight text-black leading-[1.1]"
          mode="letters"
        />
      </div>

      {/* Paragraphs with Kinetic Motion Stagger */}
      <div className="mt-10 space-y-6 text-[17px] sm:text-[20px] leading-relaxed max-w-2xl mx-auto text-neutral-700">
        <div className="font-semibold text-black text-[19px] sm:text-[22px]">
          <MotionTypeText
            as="p"
            text="No comienzo con una idea cerrada."
            delayOffset={0.2}
            mode="letters"
          />
        </div>

        <p className="leading-relaxed">
          <MotionTypeText
            as="span"
            text="Observo cómo trabajan las personas, cómo compran, qué intentan resolver y dónde aparecen fricciones una y otra vez."
            delayOffset={0.35}
            mode="words"
          />
        </p>

        <p className="leading-relaxed">
          <MotionTypeText
            as="span"
            text="A veces la conexión está entre un proceso manual y una plataforma."
            delayOffset={0.5}
            mode="words"
          />
        </p>

        <p className="leading-relaxed">
          <MotionTypeText
            as="span"
            text="Otras veces, entre una nueva tecnología y una necesidad que todavía no tiene una buena solución."
            delayOffset={0.65}
            mode="words"
          />
        </p>

        <div className="font-semibold text-black text-[19px] sm:text-[22px] pt-3">
          <MotionTypeText
            as="p"
            text="Ahí comienza cada producto."
            delayOffset={0.8}
            mode="letters"
          />
        </div>
      </div>
    </div>
  );
}
