import { Geist, Instrument_Serif } from "next/font/google";

// Las dos letras de /pen y de su cuaderno: Geist para leer, Instrument Serif
// en cursiva para la palabra que firma.
export const sans = Geist({ subsets: ["latin"], variable: "--font-pen-sans", display: "swap" });
export const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-pen-serif",
  display: "swap",
});

export const penFonts = `${sans.variable} ${serif.variable}`;
