"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { GalleryImage } from "@/lib/gallery";

type Props = { images: GalleryImage[] };

const EAGER_COUNT = 6;
const HIGH_PRIORITY = 2;

function buildSrcSet(imgs: GalleryImage["responsive"], fmt: "avif" | "webp") {
  return imgs.map((i) => `${i[fmt]} ${i.width}w`).join(", ");
}

/* ── Lightbox ──────────────────────────────────────────── */
function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: GalleryImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = images[index];

  // Keyboard nav + scroll lock
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, onPrev, onNext]);

  return createPortal(
    <motion.div
      className="gallery-lightbox"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Image panel */}
      <motion.div
        className="gallery-lightbox__panel"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={index}
            src={image.lightbox.src}
            alt={image.alt}
            className="gallery-lightbox__img"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        </AnimatePresence>
      </motion.div>

      {/* Close */}
      <button
        type="button"
        className="gallery-lightbox__close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {/* Prev */}
      {images.length > 1 && (
        <button
          type="button"
          className="gallery-lightbox__nav gallery-lightbox__nav--prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous image"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M11 3L5 9l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Next */}
      {images.length > 1 && (
        <button
          type="button"
          className="gallery-lightbox__nav gallery-lightbox__nav--next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next image"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <path d="M7 3l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* Counter */}
      <div className="gallery-lightbox__counter" aria-live="polite">
        {index + 1} / {images.length}
      </div>
    </motion.div>,
    document.body
  );
}

/* ── Grid item ─────────────────────────────────────────── */
function GalleryItem({
  image,
  index,
  onClick,
}: {
  image: GalleryImage;
  index: number;
  onClick: (i: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-48px 0px" });

  return (
    <motion.figure
      ref={ref}
      className="masonry-gallery__item"
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.04, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <button
        type="button"
        className="masonry-gallery__link group"
        onClick={() => onClick(index)}
        aria-label={`View install photo ${index + 1}`}
      >
        <div className="masonry-gallery__shimmer" aria-hidden />
        <picture>
          <source
            type="image/avif"
            srcSet={buildSrcSet(image.responsive, "avif")}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
          <source
            type="image/webp"
            srcSet={buildSrcSet(image.responsive, "webp")}
            sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
          />
          <img
            src={image.thumbnail.webp}
            alt={image.alt}
            width={image.thumbnail.width}
            height={image.thumbnail.height}
            className="masonry-gallery__image"
            loading={index < EAGER_COUNT ? "eager" : "lazy"}
            fetchPriority={index < HIGH_PRIORITY ? "high" : "auto"}
            decoding="async"
          />
        </picture>
        <div className="masonry-gallery__overlay" aria-hidden="true">
          <div className="masonry-gallery__zoom-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11.5 11.5L15.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M5.5 7.5h4M7.5 5.5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </div>
          <div className="masonry-gallery__meta">
            <p className="masonry-gallery__badge">Completed Install</p>
          </div>
        </div>
      </button>
    </motion.figure>
  );
}

/* ── Root ──────────────────────────────────────────────── */
export default function GalleryGrid({ images }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const open = useCallback((i: number) => setSelectedIndex(i), []);
  const close = useCallback(() => setSelectedIndex(null), []);
  const prev = useCallback(() =>
    setSelectedIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)),
    [images.length]
  );
  const next = useCallback(() =>
    setSelectedIndex((i) => (i !== null ? (i + 1) % images.length : null)),
    [images.length]
  );

  if (!images.length) {
    return (
      <div className="surface-card gallery-empty">
        <p className="gallery-empty__title">No gallery images found.</p>
        <p className="gallery-empty__body">
          Drop image files into <code>public/gallery/source</code> and rebuild to populate the gallery.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="masonry-gallery" aria-label="Project gallery">
        {images.map((image, i) => (
          <GalleryItem key={image.id} image={image} index={i} onClick={open} />
        ))}
      </div>

      <AnimatePresence>
        {selectedIndex !== null && (
          <Lightbox
            images={images}
            index={selectedIndex}
            onClose={close}
            onPrev={prev}
            onNext={next}
          />
        )}
      </AnimatePresence>
    </>
  );
}
