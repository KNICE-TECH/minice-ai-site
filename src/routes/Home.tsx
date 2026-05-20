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
import { stableViewportHeight } from "@/lib/viewport";

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
      //
      // The raw scroll position only sets a TARGET. A rAF loop eases the
      // actual progress toward it — this is the choreography's own
      // smoothing layer, standing in for the Lenis smoothing the desktop
      // path gets. Without it, a single momentum fling jumps scrollY by
      // hundreds of px in one event and the boom animation snaps instead
      // of playing.
      let targetP = 0;
      let currentP = 0;
      let raf = 0;

      const computeTarget = () => {
        const hero = document.getElementById("hero");
        const projects = document.getElementById("projects");
        if (!hero) return;
        const heroH = hero.offsetHeight;
        const projTop = projects ? projects.offsetTop : heroH;
        const projH = projects ? projects.offsetHeight : heroH * 2;
        const projEnd = projTop + projH;
        // Stable viewport height — NOT window.innerHeight, which jumps as
        // the mobile URL bar hides/shows and would make the boom animation
        // teleport along its timeline mid-scroll.
        const vh = stableViewportHeight();
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
        targetP = Math.max(0, Math.min(0.5, p));
      };

      const tick = () => {
        // ~0.1 per frame ≈ 0.35s to settle — slow enough that a violent
        // fling still plays the boom as an animation, fast enough to feel
        // responsive to deliberate scrolling.
        currentP += (targetP - currentP) * 0.1;
        if (Math.abs(targetP - currentP) < 0.0004) currentP = targetP;
        setProgress(currentP);
        raf = requestAnimationFrame(tick);
      };

      computeTarget();
      currentP = targetP; // start settled — no intro jump on mount
      setProgress(currentP);
      tick();
      window.addEventListener("scroll", computeTarget, { passive: true });
      window.addEventListener("resize", computeTarget);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", computeTarget);
        window.removeEventListener("resize", computeTarget);
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
