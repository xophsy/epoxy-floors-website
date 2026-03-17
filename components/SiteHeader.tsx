"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink, cx } from "@/components/design-system";
import { primaryNavLinks, resolveNavHref } from "@/data/navigation";

type Props = {
  homeLinks?: boolean;
  overlayHero?: boolean;
};

export default function SiteHeader({ homeLinks = true, overlayHero = false }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(!overlayHero);
  const pathname = usePathname();
  const navLinks = primaryNavLinks.map((link) => ({
    ...link,
    href: resolveNavHref(link.href, homeLinks),
  }));

  const handleLogoClick = () => {
    setMobileOpen(false);

    if (pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (!overlayHero) return;

    const handleScroll = () => {
      const hero = document.querySelector<HTMLElement>("[data-hero='home']");

      if (!hero) {
        setScrolledPastHero(true);
        return;
      }

      const rect = hero.getBoundingClientRect();
      setScrolledPastHero(rect.bottom <= 96);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [overlayHero]);

  return (
    <>
      <header
        className={cx(
          "top-0 z-50 px-3 md:px-4",
          overlayHero ? "fixed inset-x-0 pt-3" : "sticky pt-3",
        )}
      >
        <nav
          className={cx(
            "content-shell grid grid-cols-[auto_1fr_auto] md:flex md:justify-between min-h-[4.75rem] items-center overflow-visible rounded-[1.75rem] px-4 md:px-6",
            scrolledPastHero || mobileOpen
              ? "glass border border-white/10 bg-coal-900/78 shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
              : "glass border border-white/10 bg-coal-900/24 shadow-[0_12px_30px_rgba(0,0,0,0.16)]",
          )}
        >
          <Link href="/" className="flex items-center gap-3 overflow-visible" onClick={handleLogoClick}>
            <motion.div
              className="relative -my-5 flex h-28 w-32 items-end justify-center overflow-visible md:-my-6 md:h-34 md:w-38 md:items-end"
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 1.12 }}
              transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.45 }}
              style={{ transformOrigin: "center center" }}
            >
              <Image
                src="/legacy-images/logonew.png"
                alt="Golden Epoxy logo"
                width={140}
                height={140}
                className="h-28 w-auto object-contain drop-shadow-[0_10px_18px_rgba(0,0,0,0.35)] translate-y-[30px] transform-gpu md:translate-y-[32px] md:h-34"
              />
            </motion.div>
            <span className="text-sm sm:text-base font-semibold tracking-[0.08em] text-gold-400">
              Golden Epoxy
            </span>
          </Link>
          {/* Mobile center: Free Quote */}
          <div className="flex items-center justify-center md:!hidden">
            <ButtonLink href="/contact" className="!w-auto !min-h-0 !py-2.5 !px-5 !text-[0.65rem]">
              Free Quote
            </ButtonLink>
          </div>

          {/* Desktop: nav links + Free Quote + no burger */}
          <div className="hidden md:!flex items-center gap-7">
            <ul className="flex items-center gap-7 text-sm text-white/72">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link className="hover:text-gold-300" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ButtonLink href="/contact" className="w-auto">
              Free Quote
            </ButtonLink>
          </div>

          {/* Mobile: burger only */}
          <button
            type="button"
            className={cx(
              "button-ghost flex h-11 w-11 items-center justify-center rounded-2xl md:!hidden",
              mobileOpen && "border-gold-300/40 bg-white/8",
            )}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </nav>
        {mobileOpen ? (
          <div className="content-shell glass mt-3 rounded-[1.75rem] border border-white/10 bg-coal-900/86 p-3 shadow-[0_18px_40px_rgba(0,0,0,0.22)] md:hidden">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    className="block rounded-2xl border border-transparent px-4 py-3 text-sm text-white/78 hover:border-white/10 hover:bg-white/5"
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>
    </>
  );
}
