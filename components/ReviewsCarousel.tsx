"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const GOOGLE_REVIEW_URL = "https://share.google/i1OkVsiyHWqzYPYcw";

const REVIEWS = [
  {
    name: "Dr. Felipe Messias",
    initials: "FM",
    text: "Golden Epoxy is top-tier when it comes to epoxy flooring. They deliver high-quality, durable epoxy floor coatings. I have seen nothing but the best results, whether it be for garages, residential spaces, or commercial floors.",
    source: "Google Review",
  },
  {
    name: "Yohana Romero",
    initials: "YR",
    text: "This company is simply outstanding. From the very first interaction, their professionalism and dedication truly shine. They are the kind of team you can completely trust, always providing quick and effective solutions.",
    source: "Google Review",
  },
  {
    name: "Josue Rivera",
    initials: "JR",
    text: "Carlos and his team are the best in town. Very honest and straightforward business. They really make you feel like family and most importantly they pay attention to details which is important for this kind of work.",
    source: "Google Review",
  },
  {
    name: "Carlos Alberto Martinez",
    initials: "CM",
    text: "Top-quality work. Very responsible, professional, and with excellent customer service. Their experience and commitment to every detail are evident. I will definitely work with them again and highly recommend them.",
    source: "Google Review",
  },
  {
    name: "Coach Annalee",
    initials: "CA",
    text: "Carlos is very professional and trustworthy. He knows what he is doing and works hard to make sure the job is done very well. I definitely recommend him for your next project.",
    source: "Google Review",
  },
  {
    name: "Luz Ospina",
    initials: "LO",
    text: "Golden Epoxy is an excellent company. He performed work in my family business office. The floor was more than shiny. The personnel are very professional and work in a timely manner.",
    source: "Google Review",
  },
];

function StarRow() {
  return (
    <div className="reviews-carousel__stars" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="reviews-carousel__star">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function QuoteIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="reviews-carousel__quote-icon">
      <path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
      <path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z" />
    </svg>
  );
}

export default function ReviewsCarousel() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(1);

  const go = useCallback((index: number) => {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  }, [active]);

  const prev = useCallback(() => go((active - 1 + REVIEWS.length) % REVIEWS.length), [active, go]);
  const next = useCallback(() => go((active + 1) % REVIEWS.length), [active, go]);

  const review = REVIEWS[active];

  // 3 thumbnail previews (next ones after active)
  const thumbIndices = [1, 2, 3].map((offset) => (active + offset) % REVIEWS.length);

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <section className="reviews-carousel-section">
      {/* Ambient glows */}
      <div className="reviews-carousel__glow reviews-carousel__glow--left" aria-hidden />
      <div className="reviews-carousel__glow reviews-carousel__glow--right" aria-hidden />

      <div className="content-shell">
        {/* Header */}
        <motion.div
          className="reviews-carousel__header"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="section-eyebrow">Reviews</p>
          <h2 className="section-title">
            What customers are<br />saying on Google.
          </h2>
        </motion.div>

        {/* Carousel area */}
        <div className="reviews-carousel__stage">

          {/* Prev arrow — desktop */}
          <button
            className="reviews-carousel__arrow reviews-carousel__arrow--prev"
            onClick={prev}
            aria-label="Previous review"
          >
            <ChevronLeft />
          </button>

          {/* Main card */}
          <div className="reviews-carousel__card-wrap" aria-live="polite" aria-atomic="true">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={active}
                className="reviews-carousel__card"
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <QuoteIcon />

                <blockquote className="reviews-carousel__blockquote">
                  &ldquo;{review.text}&rdquo;
                </blockquote>

                <div className="reviews-carousel__meta">
                  <div className="reviews-carousel__author">
                    <div className="reviews-carousel__initials" aria-hidden="true">
                      {review.initials}
                    </div>
                    <div>
                      <p className="reviews-carousel__name">{review.name}</p>
                      <div className="reviews-carousel__source">
                        <GoogleIcon />
                        <span>{review.source}</span>
                      </div>
                    </div>
                  </div>
                  <StarRow />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next arrow — desktop */}
          <button
            className="reviews-carousel__arrow reviews-carousel__arrow--next"
            onClick={next}
            aria-label="Next review"
          >
            <ChevronRight />
          </button>
        </div>

        {/* Tab indicators + mobile arrows */}
        <div className="reviews-carousel__controls">
          <div className="reviews-carousel__tabs" role="tablist" aria-label="Review navigation">
            {REVIEWS.map((_, i) => (
              <button
                key={i}
                role="tab"
                aria-selected={i === active}
                aria-label={`Review ${i + 1}`}
                className="reviews-carousel__tab"
                data-active={i === active ? "true" : "false"}
                onClick={() => go(i)}
              />
            ))}
          </div>

          {/* Mobile arrows */}
          <div className="reviews-carousel__mobile-arrows">
            <button className="reviews-carousel__arrow" onClick={prev} aria-label="Previous review">
              <ChevronLeft />
            </button>
            <button className="reviews-carousel__arrow" onClick={next} aria-label="Next review">
              <ChevronRight />
            </button>
          </div>
        </div>

        {/* Desktop thumbnail previews */}
        <div className="reviews-carousel__thumbs">
          {thumbIndices.map((idx) => {
            const r = REVIEWS[idx];
            return (
              <button
                key={idx}
                className="reviews-carousel__thumb"
                onClick={() => go(idx)}
                aria-label={`Jump to ${r.name}'s review`}
              >
                <StarRow />
                <p className="reviews-carousel__thumb-text">&ldquo;{r.text}&rdquo;</p>
                <p className="reviews-carousel__thumb-name">— {r.name}</p>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <div className="reviews-carousel__cta">
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noreferrer"
            className="reviews-carousel__cta-link"
          >
            <GoogleIcon />
            <span>See all reviews on Google</span>
          </a>
        </div>
      </div>
    </section>
  );
}
