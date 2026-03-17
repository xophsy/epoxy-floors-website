"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/design-system";

function clamp01(v: number) {
  return Math.min(Math.max(v, 0), 1);
}

function easeOutCubic(v: number) {
  return 1 - Math.pow(1 - v, 3);
}

function useCountUp(target: number, duration = 1800, delay = 600) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(easeOutCubic(p) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [started, target, duration]);

  return count;
}

const HEADLINE = "Epoxy floors that bring beauty, durability, and a more welcoming feel to your space.";
const WORDS = HEADLINE.split(" ");

export default function HeroSection() {
  const heroRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [entranceProgress, setEntranceProgress] = useState(0);
  const installCount = useCountUp(200, 1800, 700);

  useEffect(() => {
    const onScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      setProgress(clamp01(-rect.top / heroRef.current.offsetHeight));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let id: number;
    let start: number | null = null;
    const dur = 1600;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = Math.min(ts - start, dur);
      setEntranceProgress(easeOutCubic(elapsed / dur));
      if (elapsed < dur) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, []);

  const bgScale = 1 + progress * 0.04;
  const parallaxY = progress * 45;
  const overlayOpacity = 0.46 + progress * 0.22;
  const overlayY = progress * -6;
  const contentY = Math.min(progress * 30, 30);
  const cueOpacity = Math.max(0, 1 - progress * 1.2);
  const entranceScale = 1.18 - 0.18 * entranceProgress;
  const entranceBrightness = 0.78 + 0.22 * entranceProgress;
  const combinedScale = bgScale * entranceScale;
  const bgBlur = Math.min(progress * 0.8, 1.5);

  const badges = [
    { value: `${installCount}+`, label: "projects",      sub: "completed"   },
    { value: "1 Day",            label: "Install",        sub: "available"   },
    { value: "✓",                label: "professional",   sub: "surface prep" },
  ];

  return (
    <section
      ref={heroRef}
      data-hero="home"
      className="section relative isolate overflow-hidden px-3 md:px-4"
    >
      {/* ── Parallax background ── */}
      <div
        className="absolute top-0 left-1/2 h-full w-screen will-change-transform"
        aria-hidden
        style={{
          transform: `translateX(-50%) translateY(${parallaxY}px) scale(${combinedScale}) translateZ(0)`,
          filter: `brightness(${entranceBrightness}) blur(${bgBlur}px)`,
        }}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(3,3,3,0.72), rgba(3,3,3,0.32) 55%, rgba(3,3,3,0.58)), url('/legacy-images/main.jpg')",
          }}
        />
      </div>

      {/* ── Floating ambient gold blobs ── */}
      <div className="hero-blob hero-blob-1" aria-hidden />
      <div className="hero-blob hero-blob-2" aria-hidden />

      {/* ── Dark overlay ── */}
      <div
        className="absolute top-0 left-1/2 h-full w-screen bg-gradient-to-b from-black/24 to-black/72"
        style={{ opacity: overlayOpacity, transform: `translateX(-50%) translateY(${overlayY}px)` }}
        aria-hidden
      />

      {/* ── Thin gold rule at bottom of hero ── */}
      <div
        className="pointer-events-none absolute bottom-0 inset-x-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,214,91,0.28) 40%, rgba(255,214,91,0.28) 60%, transparent)" }}
        aria-hidden
      />

      {/* ── Content ── */}
      <div
        className="relative z-10 overflow-hidden px-6 pb-10 pt-32 md:px-8 md:pb-14 md:pt-40"
        style={{ transform: `translateY(${contentY}px)` }}
      >
        <div className="content-shell relative z-10">
          <div className="relative flex flex-col gap-10">
            <div className="max-w-3xl space-y-7">

              {/* Eyebrow */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="h-px w-7 rounded-full bg-gradient-to-r from-gold-400 to-gold-600" />
                <span className="text-[0.65rem] font-bold uppercase tracking-[0.46em] text-gold-400">
                  Tampa Bay&apos;s Premium Epoxy Installer
                </span>
              </motion.div>

              {/* ── Word-by-word blur reveal headline ── */}
              <h1
                className="text-[2.8rem] font-extrabold leading-[0.92] tracking-[-0.055em] text-white md:text-6xl lg:text-[4.5rem]"
                aria-label={HEADLINE}
              >
                {WORDS.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, filter: "blur(8px)", y: 18 }}
                    animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
                    transition={{
                      delay: 0.3 + i * 0.055,
                      duration: 0.7,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mr-[0.22em] inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>

              {/* Subtitle */}

              {/* Buttons */}
              <motion.div
                className="flex flex-wrap items-center gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
                <ButtonLink href="/gallery" variant="secondary" className="sm:w-auto">
                  View our work
                </ButtonLink>
                <div className="flex items-center gap-2">
                  <a
                    href="https://wa.me/18135800323"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/55 backdrop-blur-sm transition-colors hover:border-gold-400/40 hover:text-gold-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.instagram.com/goldenepoxydesigns/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/55 backdrop-blur-sm transition-colors hover:border-gold-400/40 hover:text-gold-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  <a
                    href="https://www.facebook.com/profile.php?id=61565026196201"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white/55 backdrop-blur-sm transition-colors hover:border-gold-400/40 hover:text-gold-400"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Trust badges */}
          <motion.div
            className="mt-12 overflow-hidden rounded-2xl border border-white/10 backdrop-blur-md"
            style={{ background: "rgba(6,6,6,0.42)" }}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.35, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="grid divide-y divide-white/8 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:divide-white/8">
              {badges.map((badge) => (
                <div
                  key={badge.label}
                  className="flex items-center gap-4 px-6 py-5 sm:flex-col sm:items-start sm:gap-2 sm:py-7"
                >
                  <p className="text-[2.6rem] font-extrabold leading-none tracking-[-0.04em] text-gold-300 tabular-nums sm:text-5xl">
                    {badge.value}
                  </p>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[0.65rem] font-bold uppercase tracking-[0.4em] text-white/52">
                      {badge.label}
                    </p>
                    <p className="text-[0.62rem] uppercase tracking-[0.22em] text-white/32">
                      {badge.sub}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll cue */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-xs uppercase tracking-[0.5em] text-white/72"
        style={{ opacity: cueOpacity }}
      >
        Scroll to explore
      </div>
    </section>
  );
}
