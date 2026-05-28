import CatalogGrid from "@/components/CatalogGrid";
import { ButtonLink, SectionShell } from "@/components/design-system";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getCatalogCategories } from "@/lib/catalog";

export default function CatalogPage() {
  const categories = getCatalogCategories();
  const total = categories.reduce((sum, category) => sum + category.count, 0);

  return (
    <div className="site-shell">
      <SiteHeader homeLinks={false} />
      <main>
        <section className="gallery-page-header">
          <div className="gallery-page-header__glow gallery-page-header__glow--1" aria-hidden />
          <div className="gallery-page-header__glow gallery-page-header__glow--2" aria-hidden />
          <div className="content-shell">
            <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(15rem,18rem)] md:items-end">
              <div>
                <div className="gallery-eyebrow">
                  <div className="gallery-eyebrow__line" aria-hidden />
                  <span>Catalog</span>
                </div>
                <p className="mb-4 inline-flex items-center rounded-full border border-gold-300/35 bg-gold-400/12 px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-gold-200">
                  Under Construction
                </p>
                <h1 className="gallery-page-header__title">Find your finish.</h1>
                <p className="gallery-page-header__desc">
                  Browse our full color catalog by finish type. Explore metallic depth, flake blends, and neon accents
                  to choose the system that matches your space.
                </p>
              </div>
              <div className="surface-card rounded-3xl p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-300/85">Available Colors</p>
                <p className="mt-3 text-5xl font-black tracking-[-0.05em] text-gold-300">{total}</p>
                <p className="mt-2 text-sm text-white/65">
                  Swatches grouped into Metallic, Flakes, and Neon collections.
                </p>
              </div>
            </div>
          </div>
        </section>

        <SectionShell className="section-shell-tight">
          <CatalogGrid categories={categories} />
        </SectionShell>

        <SectionShell className="section-shell-compact">
          <div className="section-cta-premium rounded-[2rem] px-6 py-14 text-center md:px-10 md:py-20">
            <p className="section-eyebrow mx-auto justify-center">Need Help Choosing?</p>
            <h2 className="section-title mx-auto mt-5 max-w-2xl">
              We can match your color palette to your concrete, lighting, and usage.
            </h2>
            <p className="section-body mx-auto mt-5 text-center">
              Tell us your space goals and we&apos;ll recommend a finish system that looks right and performs long-term.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <ButtonLink href="/contact" className="sm:w-auto">
                Request a Free Estimate
              </ButtonLink>
              <ButtonLink href="/gallery" variant="secondary" className="sm:w-auto">
                View Completed Floors
              </ButtonLink>
            </div>
          </div>
        </SectionShell>
      </main>
      <SiteFooter homeLinks={false} />
    </div>
  );
}
