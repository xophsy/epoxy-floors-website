"use client";

import Image from "next/image";
import { type CSSProperties, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type ScrollPinnedRevealProps = {
  id?: string;
  beforeImage: string;
  afterImage: string;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  description?: string;
};

export default function ScrollPinnedReveal({
  id = "before-after",
  beforeImage,
  afterImage,
  imageAlt,
  eyebrow = "Transformation",
  title,
  description,
}: ScrollPinnedRevealProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [mobileReveal, setMobileReveal] = useState(50);

  const mobileRevealStyle = {
    "--ba-mobile-reveal": `${mobileReveal}%`,
    "--ba-mobile-progress": `${mobileReveal / 100}`,
  } as CSSProperties;

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;

    if (!section || !viewport) {
      return;
    }

    const mm = gsap.matchMedia();
    const ctx = gsap.context(() => {
      const afterLayer = section.querySelector<HTMLElement>(".ba-scroll__after");
      const divider = section.querySelector<HTMLElement>(".ba-scroll__divider");
      const beforeImage = section.querySelector<HTMLElement>(".ba-scroll__image--before");
      const afterImage = section.querySelector<HTMLElement>(".ba-scroll__image--after");
      const content = section.querySelector<HTMLElement>(".ba-scroll__content");
      const progressFill = section.querySelector<HTMLElement>(".ba-scroll__progress-fill");
      const beforeLabel = section.querySelector<HTMLElement>("[data-ba-label='before']");
      const afterLabel = section.querySelector<HTMLElement>("[data-ba-label='after']");
      const ambient = section.querySelector<HTMLElement>(".ba-scroll__ambient");

      if (
        !afterLayer ||
        !divider ||
        !beforeImage ||
        !afterImage ||
        !content ||
        !progressFill ||
        !beforeLabel ||
        !afterLabel ||
        !ambient
      ) {
        return;
      }

      mm.add("(max-width: 768px)", () => {
        gsap.set(afterLayer, { clearProps: "clipPath" });
        gsap.set(divider, { clearProps: "left" });
        gsap.set(progressFill, { clearProps: "transform" });
        gsap.set(content, { clearProps: "transform,opacity" });
        gsap.set(beforeImage, { clearProps: "transform,filter" });
        gsap.set(afterImage, { clearProps: "transform,filter" });
        gsap.set(ambient, { clearProps: "transform,opacity" });
        gsap.set(beforeLabel, { autoAlpha: 1 });
        gsap.set(afterLabel, { autoAlpha: 1 });
      });

      mm.add("(min-width: 769px) and (prefers-reduced-motion: reduce)", () => {
        gsap.set(afterLayer, { clipPath: "inset(0 0% 0 0)" });
        gsap.set(divider, { left: "100%" });
        gsap.set(progressFill, { scaleX: 1 });
        gsap.set(content, { clearProps: "transform,opacity" });
        gsap.set(beforeLabel, { autoAlpha: 0.56 });
        gsap.set(afterLabel, { autoAlpha: 1 });
      });

      mm.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
        const scrollLength = () => viewport.clientHeight * 1.55;

        const timeline = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${scrollLength()}`,
            scrub: 1.15,
            pin: viewport,
            pinSpacing: true,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            fastScrollEnd: true,
          },
        });

        timeline
          .fromTo(afterLayer, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }, 0)
          .fromTo(divider, { left: "0%" }, { left: "100%" }, 0)
          .fromTo(
            beforeImage,
            { scale: 1.08, filter: "brightness(0.74) saturate(0.88)" },
            { scale: 1.02, filter: "brightness(0.95) saturate(0.98)" },
            0,
          )
          .fromTo(
            afterImage,
            { scale: 1.14, filter: "brightness(0.66) saturate(0.92)" },
            { scale: 1, filter: "brightness(1) saturate(1.04)" },
            0,
          )
          .fromTo(ambient, { autoAlpha: 0.36, scale: 1.1 }, { autoAlpha: 0.82, scale: 1 }, 0)
          .fromTo(progressFill, { scaleX: 0 }, { scaleX: 1 }, 0)
          .fromTo(content, { yPercent: 8, autoAlpha: 0.76 }, { yPercent: 0, autoAlpha: 1 }, 0.08)
          .fromTo(beforeLabel, { autoAlpha: 1 }, { autoAlpha: 0.52 }, 0)
          .fromTo(afterLabel, { autoAlpha: 0.42 }, { autoAlpha: 1 }, 0.32);

        const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
        resizeObserver.observe(section);
        resizeObserver.observe(viewport);

        return () => {
          resizeObserver.disconnect();
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      });
    }, section);

    return () => {
      mm.revert();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id={id}
      ref={sectionRef}
      className="ba-scroll section"
      aria-label="Before and after floor reveal"
      style={mobileRevealStyle}
    >
      <div ref={viewportRef} className="ba-scroll__viewport">
        <div className="ba-scroll__media">
          <Image
            src={beforeImage}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="ba-scroll__image ba-scroll__image--before"
          />

          <div className="ba-scroll__after" aria-hidden="true">
            <Image
              src={afterImage}
              alt=""
              fill
              priority
              sizes="100vw"
              className="ba-scroll__image ba-scroll__image--after"
            />
          </div>

          <div className="ba-scroll__ambient" />
          <div className="ba-scroll__scrim" />
          <div className="ba-scroll__divider" aria-hidden="true" />
        </div>

        <div className="ba-scroll__chrome">
          <div className="ba-scroll__shell">
            <div className="ba-scroll__content">
              <p className="section-eyebrow">{eyebrow}</p>
              <h2 className="ba-scroll__title">{title}</h2>
              {description && <p className="ba-scroll__description">{description}</p>}
              <p className="ba-scroll__hint ba-scroll__hint--desktop">Scroll through the section to reveal the finished floor.</p>
              <p className="ba-scroll__hint ba-scroll__hint--mobile">Drag the slider to compare the before and after.</p>
              <span className="sr-only">
                Use the slider on mobile or scroll on desktop to reveal the finished epoxy surface.
              </span>
            </div>

            <div className="ba-scroll__status">
              <span className="ba-scroll__pill" data-ba-label="before">
                Before
              </span>
              <div className="ba-scroll__control">
                <div className="ba-scroll__progress" aria-hidden="true">
                  <span className="ba-scroll__progress-fill" />
                </div>
                <label className="sr-only" htmlFor={`${id}-compare`}>
                  Drag to compare the before and after floor images
                </label>
                <input
                  id={`${id}-compare`}
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={mobileReveal}
                  onChange={(event) => setMobileReveal(Number(event.target.value))}
                  className="ba-range"
                />
              </div>
              <span className="ba-scroll__pill" data-ba-label="after">
                After
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
