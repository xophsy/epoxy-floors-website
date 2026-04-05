"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import GalleryGrid from "@/components/GalleryGrid";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getGalleryImages } from "@/lib/gallery";

function scrollToGrid() {
  document.getElementById("gallery-grid")?.scrollIntoView({ behavior: "smooth" });
}

export default function GalleryPage() {
  const images = getGalleryImages();

  return (
    <div className="site-shell">
      <SiteHeader homeLinks={false} />
      <main>

        {/* ── Page header ───────────────────────────────────── */}
        <div className="gallery-page-header">
          {/* Ambient background glows */}
          <div className="gallery-page-header__glow gallery-page-header__glow--1" aria-hidden />
          <div className="gallery-page-header__glow gallery-page-header__glow--2" aria-hidden />

          <div className="content-shell">
            <div className="gallery-page-header__layout">

              {/* Left: text block */}
              <motion.div
                className="gallery-page-header__text"
                initial={{ opacity: 0, x: -28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Eyebrow */}
                <motion.div
                  className="gallery-eyebrow"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <div className="gallery-eyebrow__line" aria-hidden />
                  <span>Gallery</span>
                </motion.div>

                <h1 className="gallery-page-header__title">
                  Work we<br />stand behind.
                </h1>

                <p className="gallery-page-header__desc">
                  Every install below was completed by our crew — metallic finishes,
                  flake systems, and seamless solids across garages, showrooms, and
                  commercial spaces in Tampa Bay.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    type="button"
                    onClick={scrollToGrid}
                    className="gallery-scroll-cta"
                  >
                    <div className="gallery-scroll-cta__line" aria-hidden />
                    <span>View Our Work</span>
                  </button>
                </motion.div>
              </motion.div>

              {/* Right: owner photo */}
              <motion.div
                className="gallery-page-header__image"
                initial={{ opacity: 0, x: 28 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
              >
                <Image
                  src="/legacy-images/owner-photo.webp"
                  alt="Golden Epoxy owner"
                  width={1080}
                  height={810}
                  priority
                />
              </motion.div>

            </div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className="gallery-scroll-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            aria-hidden
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 7l6 6 6-6" stroke="rgba(255,214,91,0.5)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.div>
          </motion.div>
        </div>

        {/* ── Masonry gallery ────────────────────────────────── */}
        <div id="gallery-grid" className="content-shell gallery-grid-shell">
          <GalleryGrid images={images} />
        </div>

      </main>
      <SiteFooter homeLinks={false} />
    </div>
  );
}
