import type { Metadata } from "next";
import Script from "next/script";
import AllokHome from "@/components/ak/Home";
import MotionInit from "@/components/ak/MotionInit";
import "@/styles/allok/tokens.css";
import "@/styles/allok/allok.css";
import "@/styles/allok/home.css";

// The home runs on the allok design system ("All business OK."): plain CSS
// scoped under `.ak` and one small script, motion.js. The rest of the site
// keeps its own styles. Rebuild the CSS with `node scripts/build-allok-ds.mjs`.

const TITLE = "allok · All business OK.";
const DESCRIPTION =
  "I'm Adrián. I build AI systems that take the busywork off your business — one every two weeks, in public, with the code.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/", type: "website", locale: "en" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

// "New", the next ship date and the countdown are computed from the dates:
// rebuild the page once an hour so they never go stale.
export const revalidate = 3600;

// Design system, Build §1: put .motion on <html> before the first paint so
// nothing flashes before it hides; if motion.js never arrives, take it back
// off after 3 s and everything shows.
const MOTION_GUARD =
  "(function(h){if(!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)&&'IntersectionObserver' in window){h.classList.add('motion');setTimeout(function(){if(!window.AllokMotion)h.classList.remove('motion')},3000)}})(document.documentElement)";

export default function Home() {
  return (
    <div className="ak" data-theme="cloud" lang="en" id="top">
      <script dangerouslySetInnerHTML={{ __html: MOTION_GUARD }} />
      <link rel="preload" href="/allok/Geist-Variable.woff2" as="font" type="font/woff2" crossOrigin="" />
      <AllokHome />
      <Script src="/allok/motion.js" strategy="afterInteractive" />
      <MotionInit />
    </div>
  );
}
