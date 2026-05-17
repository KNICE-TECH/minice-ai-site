import { useEffect, useRef } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Hero } from "@/sections/Hero";
import { Projects } from "@/sections/Projects";
import { About } from "@/sections/About";
import { Contact } from "@/sections/Contact";
import { applyMeta, seo } from "@/lib/seo";
import { ProgressRail } from "@/components/ProgressRail";
import { useProgressStore } from "@/scroll/progressStore";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function Home() {
  const mainRef = useRef<HTMLElement>(null);
  const mobile = useIsMobile();

  useEffect(() => {
    applyMeta(seo.home);
  }, []);

  // On mobile: play the boom + split as an autoplay intro animation
  // (progress 0 → 0.5 over ~2.4s), then mark stays in its open/lens state.
  // On desktop: a single ScrollTrigger drives the 3D mark across the whole page.
  useEffect(() => {
    const setProgress = useProgressStore.getState().set;
    if (mobile) {
      // Mobile scroll-driven choreography:
      //   scrollY = 0                 → p = 0    (closed M logo)
      //   scrollY = Hero bottom       → p = 0.5  (fully split / lens)
      //   scrollY = Projects end      → p = 0    (back to closed M)
      //   beyond Projects             → p = 0    (logo as static backdrop)
      // Scrolling back up rewinds smoothly.
      const apply = () => {
        const hero = document.getElementById("hero");
        const projects = document.getElementById("projects");
        if (!hero) return;
        const heroH = hero.offsetHeight;
        const projTop = projects ? projects.offsetTop : heroH;
        const projH = projects ? projects.offsetHeight : heroH * 2;
        const projEnd = projTop + projH;
        const vh = window.innerHeight;
        // Collapse begins exactly when the NEXT section (About) edges into
        // the bottom of the viewport, and finishes when Projects scrolls off
        // the top — so the mark is fully closed before About replaces Projects.
        const collapseStart = projEnd - vh;
        const y = window.scrollY;
        let p = 0;
        if (y <= heroH) {
          // Hero scroll-out: closed M → boom → split → lens
          p = (y / heroH) * 0.5;
        } else if (y < collapseStart) {
          // Projects hold: boomed + split locked while only Projects is on screen
          p = 0.5;
        } else if (y < projEnd) {
          // Collapse as About scrolls into view, finishing at the section boundary
          const k = (y - collapseStart) / Math.max(1, projEnd - collapseStart);
          p = 0.5 * (1 - k);
        }
        setProgress(Math.max(0, Math.min(0.5, p)));
      };
      apply();
      window.addEventListener("scroll", apply, { passive: true });
      window.addEventListener("resize", apply);
      return () => {
        window.removeEventListener("scroll", apply);
        window.removeEventListener("resize", apply);
        setProgress(0);
      };
    }
    const main = mainRef.current;
    if (!main) return;
    const trigger = ScrollTrigger.create({
      trigger: main,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => setProgress(self.progress),
      onRefresh: (self) => setProgress(self.progress),
    });
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      trigger.kill();
      setProgress(0);
    };
  }, [mobile]);

  return (
    <main ref={mainRef} className="relative z-10">
      <Hero />
      <Projects />
      <About />
      <Contact />
      {!mobile && <ProgressRail />}
    </main>
  );
}
