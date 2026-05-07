"use client";

import React, { useEffect, useState } from "react";
import Colofon from "@/components/landing/Colofon";
import { CheckCircle2, MessageSquare, Shield, Zap, ArrowRight, Share2, Phone, Database } from "lucide-react";
import { motion } from "motion/react";

// Add FB to window object for TypeScript
declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: any;
  }
}

export default function EmbeddedWhatsapp() {
  const [isSdkLoaded, setIsSdkLoaded] = useState(false);

  useEffect(() => {
    // Initialize Facebook SDK for Embedded Signup
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: 'YOUR_FACEBOOK_APP_ID', // Reemplazar con el ID de la App de Meta
        autoLogAppEvents: true,
        xfbml: true,
        version: 'v20.0'
      });
      setIsSdkLoaded(true);
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s) as HTMLScriptElement; js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs?.parentNode?.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));
  }, []);

  const launchWhatsAppSignup = () => {
    if (window.FB) {
      window.FB.login((response: any) => {
        if (response.authResponse) {
          const accessToken = response.authResponse.accessToken;
          console.log('Access Token:', accessToken);
          // Aquí se manejaría el intercambio de tokens y la obtención del WABA ID
        } else {
          console.log('User cancelled login or did not fully authorize.');
        }
      }, {
        scope: 'whatsapp_business_management,whatsapp_business_messaging',
        extras: {
          feature: 'whatsapp_embedded_signup',
          setup: {
            // Configuración para Coexistence si es necesario
          }
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-noche text-papiro selection:bg-cobalto/10 relative overflow-hidden">
      <main className="pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-32 relative">
            {/* Background Glow */}
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cobalto/10 rounded-full blur-[120px] pointer-events-none" />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex mb-6 border border-cobalto/30 text-cobalto px-5 py-1.5 rounded-full bg-cobalto/5 backdrop-blur-xl animate-pulse font-mono tracking-widest text-[10px] uppercase">
                Onboarding Oficial Meta • v20.0
              </div>
              <h1 className="text-5xl md:text-8xl mb-8 tracking-tighter leading-[0.9] font-editorial italic">
                WhatsApp <br />
                <span className="text-cobalto not-italic font-display">Embedded</span>
              </h1>
              <p className="text-xl md:text-2xl text-papiro/60 mb-12 max-w-2xl mx-auto leading-relaxed font-mono">
                El futuro de la comunicación empresarial. Conecta tu número actual a la API Cloud mediante el flujo de <span className="text-papiro font-medium">Coexistence</span>.
              </p>
              
              <div className="flex flex-wrap justify-center gap-6">
                <button 
                  onClick={launchWhatsAppSignup}
                  className="bg-cobalto hover:bg-cobalto/80 text-white px-10 h-16 rounded-2xl text-lg font-semibold shadow-2xl shadow-cobalto/30 transition-all hover:scale-[1.02] active:scale-[0.98] group flex items-center"
                >
                  Configurar Número
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button 
                  className="h-16 px-10 rounded-2xl border border-papiro/20 bg-noche/50 backdrop-blur-md hover:bg-white/5 hover:border-cobalto/20 transition-all text-papiro"
                >
                  Guía de Integración
                </button>
              </div>
            </motion.div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-10 mb-40">
            {[
              {
                icon: <Share2 className="h-7 w-7 text-cobalto" />,
                title: "Coexistencia Híbrida",
                description: "Mantén tu App de WhatsApp activa mientras escalas con herramientas de automatización API."
              },
              {
                icon: <Database className="h-7 w-7 text-cobalto" />,
                title: "Historial Preservado",
                description: "Sincronización bidireccional de contactos y mensajes para una transición sin fricciones."
              },
              {
                icon: <Shield className="h-7 w-7 text-cobalto" />,
                title: "Seguridad de Grado Meta",
                description: "Autenticación directa con los servidores de Meta sin intermediarios de terceros."
              }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
              >
                <div className="p-10 rounded-3xl border border-papiro/10 bg-papiro/5 backdrop-blur-xl hover:bg-papiro/10 transition-all duration-500 group relative overflow-hidden h-full">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-cobalto/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-cobalto/10 transition-colors" />
                  <div className="w-14 h-14 rounded-2xl bg-cobalto/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-editorial italic mb-4 leading-tight">{feature.title}</h3>
                  <p className="text-papiro/60 leading-relaxed font-mono text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* How it works */}
          <div className="p-1 bg-gradient-to-br from-papiro/10 to-transparent rounded-[2.5rem] mb-40">
            <div className="bg-noche/90 backdrop-blur-3xl rounded-[2.4rem] p-12 md:p-24 grid md:grid-cols-2 gap-20 items-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="inline-block mb-8 bg-cobalto/10 text-cobalto border-none px-4 py-1 rounded-full text-sm font-mono">Proceso Paso a Paso</div>
                <h2 className="text-4xl md:text-5xl font-editorial italic mb-12 tracking-tight">Infraestructura <br/> en minutos.</h2>
                <div className="space-y-12">
                  {[
                    {
                      step: "01",
                      title: "Vínculo con Facebook",
                      description: "Conecta tu Business Manager oficial para gestionar los activos de marca."
                    },
                    {
                      step: "02",
                      title: "Verificación en Tiempo Real",
                      description: "Validación instantánea del número mediante OTP (One-Time Password)."
                    },
                    {
                      step: "03",
                      title: "Activación del Túnel",
                      description: "Habilitación del canal API conservando la interfaz móvil de WhatsApp."
                    }
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-8 group">
                      <div className="relative">
                        <span className="text-5xl font-bold text-cobalto/20 font-mono leading-none transition-colors group-hover:text-cobalto/40">{step.step}</span>
                        {idx !== 2 && <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-12 bg-papiro/10 mt-2" />}
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-3 font-display">{step.title}</h4>
                        <p className="text-papiro/60 text-sm font-mono leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="aspect-[4/5] rounded-[3rem] bg-gradient-to-br from-cobalto/10 to-transparent border border-cobalto/20 p-1">
                  <div className="w-full h-full bg-noche/40 backdrop-blur-2xl rounded-[2.9rem] flex flex-col items-center justify-center p-12 text-center border border-papiro/10">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 5, 0]
                      }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className="w-24 h-24 rounded-3xl bg-green-500/10 flex items-center justify-center mb-8 shadow-inner"
                    >
                      <Phone className="h-12 w-12 text-green-500" />
                    </motion.div>
                    <h3 className="text-3xl font-editorial italic mb-6">Estado: Listo</h3>
                    <p className="text-papiro/60 text-sm font-mono mb-10 leading-relaxed">Tu número +34 ••• ••• ••• está operando en modo coexistencia.</p>
                    
                    <div className="w-full space-y-4">
                      <div className="flex justify-between text-xs font-mono text-papiro/60 uppercase tracking-wider mb-2">
                        <span>Sincronizando</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full h-1.5 bg-papiro/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          className="h-full bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating icons */}
                <motion.div 
                  animate={{ y: [0, -15, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-6 -right-6 w-16 h-16 bg-noche border border-papiro/20 rounded-2xl shadow-xl flex items-center justify-center"
                >
                  <MessageSquare className="text-cobalto h-8 w-8" />
                </motion.div>
                
                <motion.div 
                  animate={{ y: [0, 15, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="absolute -bottom-6 -left-6 w-20 h-20 bg-noche border border-papiro/20 rounded-3xl shadow-xl flex items-center justify-center"
                >
                  <Zap className="text-cobalto h-10 w-10" />
                </motion.div>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="max-w-4xl mx-auto">
            <div className="p-12 rounded-3xl border border-papiro/10 bg-papiro/5 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cobalto/50 to-transparent" />
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 rounded-xl bg-cobalto/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-cobalto" />
                </div>
                <h3 className="text-3xl font-editorial italic">Requisitos del Sistema</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-10">
                <ul className="space-y-6">
                  {[
                    "WhatsApp Business App v2.24.17+",
                    "Admin en Meta Business Manager",
                  ].map((req, idx) => (
                    <li key={idx} className="flex gap-4 items-start text-papiro/70 group">
                      <div className="mt-1.5 p-0.5 rounded-full bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      </div>
                      <span className="text-lg font-mono text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
                <ul className="space-y-6">
                  {[
                    "Número capaz de recibir SMS/Llamadas",
                    "Portafolio verificado por Meta"
                  ].map((req, idx) => (
                    <li key={idx} className="flex gap-4 items-start text-papiro/70 group">
                      <div className="mt-1.5 p-0.5 rounded-full bg-green-500/10 transition-colors group-hover:bg-green-500/20">
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      </div>
                      <span className="text-lg font-mono text-sm">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Colofon />
    </div>
  );
}
