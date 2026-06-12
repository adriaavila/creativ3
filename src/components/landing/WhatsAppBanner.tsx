"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MessageCircle, ArrowRight, Zap, RefreshCw, LayoutDashboard } from "lucide-react";

interface Message {
  sender: "client" | "agent";
  text: string;
}

const CONVERSATION: Message[] = [
  { sender: "client", text: "Hola! Me interesa cotizar un sprint de diseño web. ¿Qué disponibilidad tienen?" },
  { sender: "agent", text: "Hola. ¡Con gusto! Diseñamos y programamos en sprints de 10 a 21 días. Para darte fechas exactas: ¿tienes un diseño previo o empezamos desde cero?" },
  { sender: "client", text: "Empezamos desde cero." },
  { sender: "agent", text: "Excelente. Podemos arrancar el próximo lunes. ¿Te gustaría agendar una llamada breve de 15 min para definir el alcance?" },
];

export default function WhatsAppBanner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [step, setStep] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout;

    const run = async () => {
      if (!active) return;

      if (step === 0) {
        setMessages([]);
        setIsTyping(false);
        timer = setTimeout(() => {
          if (active) setStep(1);
        }, 1500);
        return;
      }

      const currentMsgIndex = step - 1;
      const msg = CONVERSATION[currentMsgIndex];
      if (!msg) {
        timer = setTimeout(() => {
          if (active) setStep(0);
        }, 6000);
        return;
      }

      if (msg.sender === "client") {
        setMessages((prev) => [...prev, msg]);
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
        
        timer = setTimeout(() => {
          if (active) setStep((s) => s + 1);
        }, 2000);
      } else {
        setIsTyping(true);
        if (containerRef.current) {
          containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }

        timer = setTimeout(() => {
          if (!active) return;
          setIsTyping(false);
          setMessages((prev) => [...prev, msg]);
          if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
          }
          
          timer = setTimeout(() => {
            if (active) setStep((s) => s + 1);
          }, 2500);
        }, 2000);
      }
    };

    run();

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [step]);

  return (
    <section className="relative w-full bg-[#f5f3ec] pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-[#173322] text-white p-8 md:p-12 shadow-2xl border border-white/5">
          {/* Subtle background glow */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-[#b7d989]/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute -left-24 -top-24 w-96 h-96 bg-[#7fae61]/5 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDuration: '12s' }} />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#b7d989]/15 border border-[#b7d989]/20 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#b7d989]">
                <span className="flex h-1.5 w-1.5 rounded-full bg-[#b7d989] animate-ping" />
                Nuevo · IA Revenue System
              </div>
              
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal leading-[1.05] tracking-tight">
                Convierte tus chats de WhatsApp en clientes automáticos.
              </h2>
              
              <p className="text-base text-white/70 leading-relaxed max-w-xl">
                Instalamos un sistema de ventas con IA que responde preguntas, califica necesidades, realiza seguimiento continuo y agenda reuniones. Todo listo en 7 días y conectado a un panel de control.
              </p>
              
              <div className="grid gap-3 sm:grid-cols-3 pt-2">
                {[
                  { icon: Zap, text: "Respuestas 24/7" },
                  { icon: RefreshCw, text: "Seguimiento auto" },
                  { icon: LayoutDashboard, text: "Dashboard de leads" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white/90 hover:bg-white/10 transition-colors duration-300">
                      <Icon className="h-4 w-4 text-[#b7d989] shrink-0" />
                      <span className="font-medium">{item.text}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex items-center gap-4 pt-4">
                <Link
                  href="/whatsapp"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#b7d989] px-6 py-3 text-sm font-semibold text-[#173322] shadow-[0_12px_30px_rgba(183,217,137,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c5e69b] hover:shadow-[0_15px_35px_rgba(183,217,137,0.3)]"
                >
                  Ver sistema completo
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Live Chat Simulator */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md shadow-2xl">
                <div className="rounded-xl bg-[#fffdf7] p-4 text-[#173322] flex flex-col h-[320px]">
                  
                  {/* WhatsApp style header */}
                  <div className="flex items-center gap-2 border-b border-[#173322]/5 pb-2.5 mb-3 shrink-0">
                    <div className="relative">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#173322] text-white">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-white animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold leading-none">Asistente Creativv</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">En línea · Sistema IA</span>
                    </div>
                  </div>

                  {/* Message log area */}
                  <div 
                    ref={containerRef}
                    className="flex-1 overflow-y-auto space-y-3 pr-1 scroll-smooth"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed transition-all duration-500 transform scale-100 opacity-100 ${
                          msg.sender === "client"
                            ? "rounded-bl-sm bg-[#f2f0e8] text-[#173322] mr-auto animate-in fade-in slide-in-from-left-4 duration-300"
                            : "ml-auto rounded-br-sm bg-[#dff5c1] text-[#173322] animate-in fade-in slide-in-from-right-4 duration-300"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-sm bg-[#dff5c1]/70 px-3.5 py-2.5 text-xs text-[#173322]/70 flex items-center gap-1.5 animate-pulse">
                        <span className="font-semibold text-[10px]">Escribiendo</span>
                        <span className="flex gap-0.5">
                          <span className="h-1.5 w-1.5 bg-[#173322]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 bg-[#173322]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 bg-[#173322]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                      </div>
                    )}
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
