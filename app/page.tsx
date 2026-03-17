"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, type ReactNode } from "react";
import ParallaxImage from "@/components/ParallaxImage";
import ScrollPinnedReveal from "@/components/ScrollPinnedReveal";
import SpotlightCard from "@/components/SpotlightCard";
import {
  ButtonLink,
  SectionHeading,
  SectionShell,
  SurfaceCard,
  motionPresets,
} from "@/components/design-system";
import HeroSection from "@/components/HeroSection";
import ReviewsMarquee from "@/components/ReviewsMarquee";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  coatingOptions,
  faqs,
  flooringTypes,
  processSteps,
  services,
  type FAQ,
} from "@/data/siteContent";

function RevealSection({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={motionPresets.section}
      initial="hidden"
      whileInView="visible"
      viewport={motionPresets.viewport}
    >
      {children}
    </motion.div>
  );
}

function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div>
      {faqs.map((faq, i) => (
        <div key={faq.question} className="border-b border-white/8 last:border-0">
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full cursor-pointer items-center justify-between py-6 text-left"
          >
            <span className="pr-6 text-lg font-semibold tracking-[-0.025em] text-white">
              {faq.question}
            </span>
            <motion.div
              animate={{ rotate: openIndex === i ? 45 : 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="flex-shrink-0 rounded-full border border-white/14 p-1.5 text-gold-400"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </motion.div>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <p className="pb-7 text-sm leading-7 text-white/68">{faq.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  return (
    <div className="site-shell">
      <SiteHeader homeLinks overlayHero />
      <HeroSection />
      <ReviewsMarquee />

      {/* ── Services ──────────────────────────────────────────── */}
      <SectionShell id="services">
        <RevealSection>
          <SectionHeading
            title="Premium epoxy systems for every kind of space."
            description="From surface prep to final coat, every floor is installed with the same high standard of care and execution."
            actions={
              <ButtonLink href="/contact" variant="secondary" className="sm:w-auto">
                Start a Project
              </ButtonLink>
            }
          />
        </RevealSection>

        {/* Bento grid: 2 large equal cards + 1 slim full-width card */}
        <motion.div
          className="mt-10 grid gap-5"
          variants={motionPresets.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={motionPresets.viewport}
        >
          {/* Top row — Residential + Commercial equal large cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            <motion.div variants={motionPresets.card}>
              <SurfaceCard className="flex h-full flex-col">
                <div className="image-frame flex-1 min-h-72">
                  <ParallaxImage
                    src={services[1].image}
                    alt={services[1].alt ?? services[1].title}
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3 p-7">
                  <p className="meta-label">Residential</p>
                  <h3 className="text-2xl font-bold tracking-[-0.035em]">{services[1].title}</h3>
                  <p className="text-sm leading-7 text-white/72">{services[1].description}</p>
                </div>
              </SurfaceCard>
            </motion.div>

            <motion.div variants={motionPresets.card}>
              <SurfaceCard className="flex h-full flex-col">
                <div className="image-frame flex-1 min-h-72">
                  <ParallaxImage
                    src={services[2].image}
                    alt={services[2].alt ?? services[2].title}
                    sizes="(min-width: 640px) 45vw, 90vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-3 p-7">
                  <p className="meta-label">Commercial</p>
                  <h3 className="text-2xl font-bold tracking-[-0.035em]">{services[2].title}</h3>
                  <p className="text-sm leading-7 text-white/72">{services[2].description}</p>
                </div>
              </SurfaceCard>
            </motion.div>
          </div>

          {/* Floor Preparation — slim horizontal card */}
          <motion.div variants={motionPresets.card}>
            <SurfaceCard className="flex flex-col sm:flex-row sm:items-stretch overflow-hidden">
              <div className="image-frame h-48 sm:h-auto sm:w-72 sm:flex-shrink-0">
                <ParallaxImage
                  src={services[0].image}
                  alt={services[0].alt ?? services[0].title}
                  sizes="(min-width: 640px) 18rem, 90vw"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="space-y-2 p-6 flex flex-col justify-center">
                <p className="meta-label">Foundation</p>
                <h3 className="text-xl font-semibold tracking-[-0.02em]">{services[0].title}</h3>
                <p className="text-sm leading-7 text-white/68">{services[0].description}</p>
              </div>
            </SurfaceCard>
          </motion.div>
        </motion.div>

        {/* ── Flooring Systems ──── */}
        <RevealSection className="mt-20">
          <SectionHeading
            eyebrow="Flooring Systems"
            title="Finish options that stay within one premium standard."
            description="Each system is engineered for durability and elevated aesthetics across residential and commercial spaces."
          />

          <motion.div
            className="mt-10 grid gap-5 sm:grid-cols-3"
            variants={motionPresets.stagger}
            initial="hidden"
            whileInView="visible"
            viewport={motionPresets.viewport}
          >
            {flooringTypes.map((floor) => (
              <motion.div key={floor.title} variants={motionPresets.card}>
                <div className="flooring-overlay-card group">
                  <ParallaxImage
                    src={floor.image}
                    alt={floor.title}
                    sizes="(min-width: 640px) 30vw, 90vw"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="flooring-overlay-card__gradient" />
                  <div className="flooring-overlay-card__top-line" />
                  <div className="flooring-overlay-card__content">
                    <p className="meta-label mb-2 text-gold-400/80">Floor System</p>
                    <h3 className="text-xl font-bold tracking-[-0.025em] text-white">{floor.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">{floor.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </RevealSection>

        {/* ── Protective Coats ──── */}
        <RevealSection className="mt-20">
          <SectionHeading
            eyebrow="Protective Coats"
            title="Topcoats and additives chosen for real-world performance."
            description="These finish options are selected for durability, UV stability, and safety across all floor types."
          />

          <motion.div
            className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
            variants={motionPresets.stagger}
            initial="hidden"
            whileInView="visible"
            viewport={motionPresets.viewport}
          >
            {coatingOptions.map((option) => (
              <motion.div key={option.title} variants={motionPresets.card}>
                <SpotlightCard className="h-full p-6">
                  <div className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl border border-gold-400/20 bg-gold-400/8">
                    <div className="h-2.5 w-2.5 rounded-full bg-gold-400" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-[-0.02em] text-gold-300">{option.title}</h3>
                  <div className="mt-3 h-px w-8 bg-gradient-to-r from-gold-500/40 to-transparent" />
                  <p className="mt-4 text-sm leading-7 text-white/68">{option.description}</p>
                </SpotlightCard>
              </motion.div>
            ))}
          </motion.div>
        </RevealSection>
      </SectionShell>

      <ScrollPinnedReveal
        beforeImage="/legacy-images/slider/before.png"
        afterImage="/legacy-images/slider/after.png"
        imageAlt="Floor before coating"
        eyebrow="Transformation"
        title="A single scroll reveals the full transformation."
        description=""
      />

      {/* ── Process ───────────────────────────────────────────── */}
      <SectionShell id="process">
        <RevealSection>
          <SectionHeading
            eyebrow="Process"
            title="A simple process designed to complete most floors in two days."
            description="We keep the job moving with three clear steps: plan the project, install in a focused day, then allow proper cure time before use."
          />
        </RevealSection>

        <motion.div
          className="mt-12 grid gap-5 md:grid-cols-3"
          variants={motionPresets.stagger}
          initial="hidden"
          whileInView="visible"
          viewport={motionPresets.viewport}
        >
          {processSteps.map((step, i) => (
            <motion.div key={step.title} variants={motionPresets.card}>
              <SpotlightCard className="h-full p-7">
                <div className="process-step-numeral">{String(i + 1).padStart(2, "0")}</div>
                <h3 className="mt-3 text-xl font-bold tracking-[-0.025em] text-gold-300">{step.title}</h3>
                <div className="mt-3 h-px w-10 bg-gradient-to-r from-gold-500/50 to-transparent" />
                <p className="mt-4 text-sm leading-7 text-white/68">{step.description}</p>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* ── FAQ ───────────────────────────────────────────────── */}
      <SectionShell id="faq" className="section-shell-compact">
        <RevealSection className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-16">
          <SectionHeading
            eyebrow="FAQ"
            title="Common questions answered."
            description="Straightforward answers to what most clients ask before booking."
          />
          <FaqAccordion faqs={faqs} />
        </RevealSection>
      </SectionShell>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <SectionShell className="section-shell-compact">
        <RevealSection>
          <div className="section-cta-premium rounded-[2rem] px-6 py-16 text-center md:px-10 md:py-20">
            <p className="section-eyebrow mx-auto justify-center">Estimate</p>
            <h2 className="section-title mx-auto mt-5 max-w-xl">
              Have a project in mind?
            </h2>
            <p className="section-body mx-auto mt-5 text-center">
              Tell us about your floor and we&apos;ll take it from there.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact" className="sm:w-auto">
                Book a free estimate
              </ButtonLink>
              <ButtonLink href="tel:+18135800323" variant="secondary" className="sm:w-auto">
                Call (813) 580-0323
              </ButtonLink>
            </div>
          </div>
        </RevealSection>
      </SectionShell>

      <SiteFooter homeLinks />
    </div>
  );
}
