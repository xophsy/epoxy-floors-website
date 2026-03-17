import Image from "next/image";
import ContactForm from "@/components/ContactForm";
import {
  ButtonLink,
  SectionHeading,
  SectionShell,
  SurfaceCard,
} from "@/components/design-system";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function ContactPage() {
  return (
    <div className="site-shell">
      <SiteHeader homeLinks={false} />
      <main>
        <SectionShell id="contact-page">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.75fr]">
            <div>
              <SectionHeading
                eyebrow="Free Estimate"
                title="Tell us about your floor — we'll handle the rest."
                description="Answer a few quick questions and we'll put together a custom estimate. No pressure, no jargon, just a clear plan for your space."
              />
              <ContactForm />
            </div>

            <aside className="grid gap-6 self-start">
              <SurfaceCard className="p-6">
                <p className="meta-label">Get in Touch</p>
                <div className="meta-list mt-5">
                  <div>
                    <p className="meta-label">Phone</p>
                    <a href="tel:+18135800323" className="meta-value block text-white">
                      (813) 580-0323
                    </a>
                    <p className="text-xs text-white/50 mt-1">Mon – Sun, 8 am – 5 pm</p>
                  </div>
                  <div className="divider-line" />
                  <div>
                    <p className="meta-label">Email</p>
                    <a
                      href="mailto:goldenepoxyworks@gmail.com"
                      className="meta-value block text-white"
                    >
                      goldenepoxyworks@gmail.com
                    </a>
                  </div>
                  <div className="divider-line" />
                  <div>
                    <p className="meta-label">Instagram</p>
                    <a
                      href="https://www.instagram.com/goldenepoxydesigns/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-value flex items-center gap-2 text-white hover:text-gold-400 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                      </svg>
                      @goldenepoxydesigns
                    </a>
                  </div>
                  <div className="divider-line" />
                  <div>
                    <p className="meta-label">Facebook</p>
                    <a
                      href="https://www.facebook.com/profile.php?id=61565026196201"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="meta-value flex items-center gap-2 text-white hover:text-gold-400 transition-colors"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 flex-shrink-0">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Golden Epoxy Designs
                    </a>
                  </div>
                </div>
              </SurfaceCard>

              <SurfaceCard className="p-6">
                <p className="meta-label">We Work Across Tampa Bay</p>
                <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03]">
                  <Image
                    src="/service-area-map.png"
                    alt="Service area map covering Tampa, St. Petersburg, Clearwater, Brandon, Wesley Chapel, and nearby communities."
                    width={379}
                    height={359}
                    className="h-auto w-full"
                  />
                </div>
                <p className="meta-value mt-4">
                  Tampa, St. Petersburg, Clearwater, Brandon, Wesley Chapel, and nearby
                  communities throughout the region.
                </p>
                <div className="mt-6">
                  <ButtonLink href="/gallery" variant="secondary" className="sm:w-auto">
                    See Our Recent Work
                  </ButtonLink>
                </div>
              </SurfaceCard>
            </aside>
          </div>
        </SectionShell>
      </main>
      <SiteFooter homeLinks={false} />
    </div>
  );
}
