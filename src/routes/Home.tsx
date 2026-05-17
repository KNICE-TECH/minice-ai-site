import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/sections/Hero";
import { Projects } from "@/sections/Projects";
import { About } from "@/sections/About";
import { Contact } from "@/sections/Contact";
import { applyMeta, seo } from "@/lib/seo";
import { ProgressRail } from "@/components/ProgressRail";
import { useProgressStore } from "@/scroll/progressStore";

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    applyMeta(seo.home);
  }, []);

  // Global progress trigger: drives the 3D mark across the whole page scroll.
  useEffect(() => {
    const main = mainRef.current;
    if (!main) return;
    const setProgress = useProgressStore.getState().set;
    const trigger = ScrollTrigger.create({
      trigger: main,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: (self) => setProgress(self.progress),
    });
    // Force an initial refresh after sections mount + layout
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      trigger.kill();
      setProgress(0);
    };
  }, []);

  return (
    <main ref={mainRef} className="relative z-10">
      <Hero />
      <Projects />
      <About />
      <Contact />
      <ProgressRail />
    </main>
  );
}
