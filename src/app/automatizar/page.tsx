"use client";

import React, { useState, useEffect } from "react";
import Colofon from "@/components/landing/Colofon";
import { Mic, Loader2, CheckCircle2, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function AutomatizarPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);
      
      setTimeout(() => {
        setIsProcessing(false);
        setIsSuccess(true);
      }, 3000);
    } else {
      setIsRecording(true);
      setIsSuccess(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-noche text-papiro selection:bg-cobalto/20 selection:text-papiro flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/noise.png')]" />
      
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-24 px-6 relative z-10 min-h-[80vh]">
        <div className="max-w-2xl mx-auto w-full flex flex-col items-center text-center">
          
          <AnimatePresence mode="wait">
            {!isSuccess ? (
              <motion.div
                key="recording-ui"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex flex-col items-center"
              >
                <div className="inline-flex mb-8 border border-cobalto/30 text-cobalto px-5 py-1.5 rounded-full bg-cobalto/5 backdrop-blur-xl font-mono tracking-widest text-[10px] uppercase">
                  Ingeniero de Automatización IA
                </div>
                
                <h1 className="text-4xl md:text-6xl font-editorial italic mb-6 leading-tight">
                  Elimina el <br />
                  <span className="text-cobalto not-italic font-display tracking-tight">trabajo repetitivo</span>
                </h1>
                
                <p className="text-papiro/60 text-lg mb-16 max-w-md mx-auto leading-relaxed font-mono">
                  Presiona el micrófono y descríbenos ese cuello de botella manual que te roba tiempo. Diseñaremos un flujo automatizado para ti.
                </p>

                <div className="relative flex flex-col items-center justify-center">
                  {isRecording && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                        className="absolute w-32 h-32 rounded-full bg-cobalto/30 pointer-events-none"
                      />
                      <motion.div 
                        initial={{ opacity: 0.8, scale: 1 }}
                        animate={{ opacity: 0, scale: 2.5 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut", delay: 0.5 }}
                        className="absolute w-32 h-32 rounded-full bg-cobalto/20 pointer-events-none"
                      />
                    </>
                  )}

                  <button
                    onClick={handleMicClick}
                    disabled={isProcessing}
                    className={`relative w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 z-10
                      ${isProcessing 
                        ? 'bg-noche border border-papiro/20 cursor-wait' 
                        : isRecording 
                          ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
                          : 'bg-cobalto hover:bg-cobalto/80 text-white hover:scale-105'
                      }
                    `}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-10 h-10 animate-spin text-cobalto" />
                    ) : isRecording ? (
                      <Square className="w-10 h-10 fill-current" />
                    ) : (
                      <Mic className="w-12 h-12" />
                    )}
                  </button>
                  
                  <div className="mt-8 h-8 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {isProcessing ? (
                        <motion.span 
                          key="processing"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="font-mono text-sm text-cobalto animate-pulse"
                        >
                          Diseñando arquitectura de flujo...
                        </motion.span>
                      ) : isRecording ? (
                        <motion.div 
                          key="recording"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="flex flex-col items-center"
                        >
                          <span className="font-mono text-sm text-red-400 mb-1 animate-pulse">Grabando audio...</span>
                          <span className="font-mono text-xl text-papiro font-light">{formatTime(recordingTime)}</span>
                        </motion.div>
                      ) : (
                        <motion.span 
                          key="ready"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="font-mono text-sm text-papiro/40"
                        >
                          Toca para hablar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="success-ui"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-noche-rise/30 border border-papiro/10 rounded-[2rem] p-12 flex flex-col items-center relative overflow-hidden"
              >
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
                
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-8">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                
                <h2 className="text-3xl font-editorial italic mb-4">Caso Recibido</h2>
                <p className="text-papiro/70 font-mono text-sm leading-relaxed mb-10">
                  Hemos analizado tu proceso manual. En breve, nuestro equipo te enviará un diagrama de solución automatizada.
                </p>
                
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="w-full border border-papiro/20 rounded-full py-4 font-mono text-sm hover:bg-papiro hover:text-noche transition-colors"
                >
                  Reportar otro proceso
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      <Colofon />
    </div>
  );
}
