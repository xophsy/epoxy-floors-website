"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CatalogCategory, CatalogImage } from "@/lib/catalog";

type CatalogCategoryGroup = {
  key: CatalogCategory;
  label: string;
  count: number;
  images: CatalogImage[];
};

type Props = {
  categories: CatalogCategoryGroup[];
};

function buildSrcSet(imgs: CatalogImage["responsive"], fmt: "avif" | "webp") {
  return imgs.map((i) => `${i[fmt]} ${i.width}w`).join(", ");
}

function numberLabel(value: number | null) {
  if (value === null) return "N/A";
  return value.toString().padStart(2, "0");
}

function Lightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: {
  images: CatalogImage[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const image = images[index];
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const closeButton = container.querySelector<HTMLElement>("button");
    closeButton?.focus();

    const onTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>("button:not([disabled])"),
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, []);

  return createPortal(
    <div
      ref={containerRef}
      className="gallery-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Catalog swatch lightbox"
      onClick={onClose}
    >
      <div className="gallery-lightbox__panel" onClick={(event) => event.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.lightbox.src} alt={image.alt} className="gallery-lightbox__img" />
      </div>

      <button
        type="button"
        className="gallery-lightbox__close"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path
            d="M2 2l12 12M14 2L2 14"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--prev"
            onClick={(event) => {
              event.stopPropagation();
              onPrev();
            }}
            aria-label="Previous swatch"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M11 3L5 9l6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <button
            type="button"
            className="gallery-lightbox__nav gallery-lightbox__nav--next"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            aria-label="Next swatch"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path
                d="M7 3l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      )}

      <div className="gallery-lightbox__counter" aria-live="polite">
        {index + 1} / {images.length}
      </div>
    </div>,
    document.body,
  );
}

export default function CatalogGrid({ categories }: Props) {
  const [activeCategory, setActiveCategory] = useState<CatalogCategory>(categories[0]?.key ?? "metallic");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const currentCategory = useMemo(
    () => categories.find((category) => category.key === activeCategory) ?? categories[0],
    [activeCategory, categories],
  );

  const images = currentCategory?.images ?? [];

  const open = useCallback((index: number) => setSelectedIndex(index), []);
  const close = useCallback(() => setSelectedIndex(null), []);
  const prev = useCallback(() => {
    setSelectedIndex((index) => (index !== null ? (index - 1 + images.length) % images.length : null));
  }, [images.length]);
  const next = useCallback(() => {
    setSelectedIndex((index) => (index !== null ? (index + 1) % images.length : null));
  }, [images.length]);

  if (!currentCategory) {
    return (
      <div className="surface-card rounded-3xl p-8">
        <p className="text-xl font-semibold text-white">No catalog swatches found.</p>
        <p className="mt-2 text-sm text-white/70">
          Run <code>npm run catalog:sync</code> then <code>npm run catalog:build</code> to populate the catalog.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-3" role="tablist" aria-label="Color categories">
        {categories.map((category) => {
          const isActive = category.key === activeCategory;
          return (
            <button
              key={category.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`catalog-panel-${category.key}`}
              id={`catalog-tab-${category.key}`}
              onClick={() => {
                setSelectedIndex(null);
                setActiveCategory(category.key);
              }}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]",
                isActive
                  ? "border-gold-400/45 bg-gold-400/15 text-gold-300"
                  : "border-white/15 bg-white/[0.04] text-white/70 hover:border-gold-400/30 hover:text-white",
              ].join(" ")}
            >
              <span>{category.label}</span>
              <span className="rounded-full bg-black/35 px-2 py-0.5 text-[0.62rem] tracking-[0.12em]">
                {category.count}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`catalog-panel-${currentCategory.key}`}
        role="tabpanel"
        aria-labelledby={`catalog-tab-${currentCategory.key}`}
        className="mt-8"
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-lg font-semibold tracking-[-0.02em] text-white">
            {currentCategory.label} Collection
          </p>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
            {currentCategory.count} colors
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => open(index)}
              className="surface-card overflow-hidden rounded-2xl border border-white/10 text-left transition hover:border-gold-400/35"
              aria-label={`Open ${image.title} swatch`}
            >
              <picture>
                <source
                  type="image/avif"
                  srcSet={buildSrcSet(image.responsive, "avif")}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                />
                <source
                  type="image/webp"
                  srcSet={buildSrcSet(image.responsive, "webp")}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                />
                <img
                  src={image.thumbnail.webp}
                  alt={image.alt}
                  width={image.thumbnail.width}
                  height={image.thumbnail.height}
                  className="aspect-square h-auto w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-300/80">
                    #{numberLabel(image.number)}
                  </p>
                  <p className="mt-1 text-sm font-semibold tracking-[-0.01em] text-white">{image.title}</p>
                </div>
                <span className="rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-white/55">
                  {currentCategory.label}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedIndex !== null ? (
        <Lightbox images={images} index={selectedIndex} onClose={close} onPrev={prev} onNext={next} />
      ) : null}
    </>
  );
}
