import { useEffect } from "react";
import { Stage } from "@/components/Stage";
import { Hero } from "@/sections/Hero";
import { Projects } from "@/sections/Projects";
import { About } from "@/sections/About";
import { Contact } from "@/sections/Contact";
import { applyMeta, seo } from "@/lib/seo";
import { useNativeScrollProgress } from "@/hooks/useNativeScrollProgress";
import { ProgressRail } from "@/components/ProgressRail";

const PAGE_VH = 320; // total scroll length — short enough that transitions feel responsive

export default function Home() {
  useEffect(() => applyMeta(seo.home), []);
  useNativeScrollProgress();

  return (
    <>
      {/* Spacer: provides the scroll length the native browser scroll consumes */}
      <div style={{ height: `${PAGE_VH}vh` }} aria-hidden="true" />

      {/* Fixed visual stage: stays in the viewport while user scrolls the spacer above */}
      <div className="fixed inset-0 z-10 overflow-hidden pointer-events-none">
        <Stage id="hero" range={[0.0, 0.25]} enter={0}>
          <Hero />
        </Stage>
        <Stage id="projects" range={[0.25, 0.55]}>
          <Projects />
        </Stage>
        <Stage id="about" range={[0.55, 0.8]}>
          <About />
        </Stage>
        <Stage id="contact" range={[0.8, 1.0]} exit={0}>
          <Contact />
        </Stage>
        <ProgressRail />
      </div>
    </>
  );
}
