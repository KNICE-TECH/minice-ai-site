import { useRef, useState } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ProjectCard } from "@/components/ProjectCard";
import { StellaModal } from "@/components/StellaModal";
import { projects } from "@/data/projects";
import { useI18n } from "@/hooks/useI18n";
import { useGSAPScroll } from "@/hooks/useScrollScene";
import { useIsMobile } from "@/hooks/useIsMobile";

export function Projects() {
  const { t } = useI18n();
  const [stellaOpen, setStellaOpen] = useState(false);
  const mobile = useIsMobile();
  const sectionRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);

  // Desktop pin-and-scroll: section is 200dvh tall; sticky child stays in viewport;
  // inner content translates up by `overflow` distance across the scroll range.
  // Mobile: plain document flow — no pinning, no overflow clip.
  useGSAPScroll(sectionRef, (el) => {
    if (mobile) return;
    const inner = innerRef.current;
    const sticky = stickyRef.current;
    if (!inner || !sticky) return;

    const computeOverflow = () => Math.max(0, inner.offsetHeight - sticky.offsetHeight);
    let overflow = computeOverflow();

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        invalidateOnRefresh: true,
        onRefresh: () => {
          overflow = computeOverflow();
        },
      },
    });

    tl.fromTo(inner, { y: 0 }, { y: () => -overflow, ease: "none", duration: 1 }, 0);
  }, [mobile]);

  if (mobile) {
    return (
      <section id="projects" className="relative w-full px-4 py-12">
        <div className="max-w-6xl mx-auto w-full">
          <header className="mb-5">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.5 }}
              className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2"
              style={{ fontSize: "0.62rem" }}
            >
              {t.projects.eyebrow}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold tracking-tight"
              style={{ fontSize: "1.65rem" }}
            >
              {t.projects.headline}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-1.5 text-[color:var(--muted)]"
              style={{ fontSize: "0.88rem" }}
            >
              {t.projects.sub}
            </motion.p>
          </header>
          <div className="grid grid-cols-1 gap-3">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                onLineage={p.id === "stella" ? () => setStellaOpen(true) : undefined}
              />
            ))}
          </div>
        </div>
        <StellaModal open={stellaOpen} onClose={() => setStellaOpen(false)} />
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      id="projects"
      className="relative w-full"
      style={{ height: "200dvh" }}
    >
      <div
        ref={stickyRef}
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100dvh", transform: "translateZ(0)" }}
      >
        <div className="absolute inset-0 px-4 sm:px-10 pt-20 sm:pt-28 pb-16">
          <div className="max-w-6xl mx-auto w-full h-full flex flex-col">
            <div ref={innerRef} className="will-change-transform">
              <header className="mb-6 sm:mb-8">
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2 sm:mb-3"
                  style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
                >
                  {t.projects.eyebrow}
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className="font-display font-bold tracking-tight"
                  style={{ fontSize: "clamp(1.5rem, 4.5vmin, 2.5rem)" }}
                >
                  {t.projects.headline}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.18 }}
                  className="mt-2 sm:mt-3 text-[color:var(--muted)]"
                  style={{ fontSize: "clamp(0.85rem, 1.3vmin, 1rem)" }}
                >
                  {t.projects.sub}
                </motion.p>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
                {projects.map((p, i) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    index={i}
                    onLineage={p.id === "stella" ? () => setStellaOpen(true) : undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <StellaModal open={stellaOpen} onClose={() => setStellaOpen(false)} />
    </section>
  );
}
