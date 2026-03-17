"use client";

import { motion } from "framer-motion";

type Review = {
  name: string;
  text: string;
  source: string;
  href: string;
  stars?: number;
};

const GOOGLE_REVIEW_URL = "https://share.google/i1OkVsiyHWqzYPYcw";

const REVIEWS: Review[] = [
  {
    name: "Calimeño P",
    stars: 5,
    text: "Quality of work is the best and price-wise it is the best.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Dr. Felipe Messias",
    stars: 5,
    text: "Golden Epoxy is top-tier when it comes to epoxy flooring. They deliver high-quality, durable epoxy floor coatings. I have seen nothing but the best results, whether it be for garages, residential spaces, or commercial floors.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Coach Annalee",
    stars: 5,
    text: "Carlos is very professional and trustworthy. He knows what he is doing and works hard to make sure the job is done very well. I definitely recommend him for your next project.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Gerardo Dominguez (GDominguez)",
    stars: 5,
    text: "Very professional and great to work with.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Luz Ospina",
    stars: 5,
    text: "Golden Epoxy is an excellent company. He performed work in my family business office. The floor was more than shiny. The personnel are very professional and work in a timely manner.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Jay Miller",
    stars: 5,
    text: "Good guy nice work gonna use his services highly recommend.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Bryant Osorno",
    stars: 5,
    text: "They did a wonderful job and exceeded my expectations.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Fabio Gomez",
    stars: 5,
    text: "Very professional, reliable and competitive pricing on his services. Strongly recommend this company for future projects.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "josue rivera",
    stars: 5,
    text: "Carlos and his team are the best in town. Very honest and straightforward business. They really make you feel like family and most importantly they pay attention to details which is important for this kind of work.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Yohana Romero",
    stars: 5,
    text: "This company is simply outstanding. From the very first interaction, their professionalism and dedication truly shine. They are the kind of team you can completely trust, always providing quick and effective solutions.",
    source: "Google Review",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "John Maury Muneton",
    stars: 5,
    text: "Excellent work, very professional.",
    source: "Google Review (Translated)",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Walter Sossa",
    stars: 5,
    text: "Excellent service, a very professional and reliable person, and good prices.",
    source: "Google Review (Translated)",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Oscar Mora",
    stars: 5,
    text: "Excellent service, punctuality and good work.",
    source: "Google Review (Translated)",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Noé Osorio",
    stars: 5,
    text: "This is a completely reliable company, with very high quality finishes; more than enough reasons to consider them for your projects.",
    source: "Google Review (Translated)",
    href: GOOGLE_REVIEW_URL,
  },
  {
    name: "Carlos Alberto Martinez Martinez",
    stars: 5,
    text: "Top-quality work. Very responsible, professional, and with excellent customer service. Their experience and commitment to every detail are evident. I will definitely work with them again and highly recommend them.",
    source: "Google Review (Translated)",
    href: GOOGLE_REVIEW_URL,
  },
];

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden="true">
      <path d="M6.5 0l1.59 4.89H13L8.94 7.91 10.53 13 6.5 9.98 2.47 13l1.59-5.09L0 4.89h4.91z" />
    </svg>
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

function ReviewCard({ review }: { review: Review }) {
  const stars = review.stars ?? 5;

  return (
    <a
      className="reviews-card"
      href={review.href}
      target="_blank"
      rel="noreferrer"
      aria-label={`${review.name} Google review`}
    >
      <div className="reviews-card__stars" aria-label={`${stars} out of 5 stars`}>
        {Array.from({ length: stars }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </div>

      <p className="reviews-card__text">&ldquo;{review.text}&rdquo;</p>

      <div className="reviews-card__footer">
        <div className="reviews-card__avatar" aria-hidden="true">
          {review.name[0]}
        </div>
        <div>
          <p className="reviews-card__name">{review.name}</p>
          <div className="reviews-card__source">
            <GoogleIcon />
            <span>{review.source}</span>
          </div>
        </div>
      </div>
    </a>
  );
}

export default function ReviewsMarquee() {
  const track = [...REVIEWS, ...REVIEWS];

  return (
    <section className="reviews-section">
      <div className="content-shell">
        <motion.div
          className="reviews-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="section-eyebrow">Reviews</p>
          <h2 className="section-title reviews-heading__title">
            What customers are saying on Google.
          </h2>
        </motion.div>
      </div>

      <div className="reviews-marquee-wrap" aria-label="Customer reviews">
        <div className="reviews-marquee">
          <div className="reviews-marquee__track">
            {track.map((review, i) => (
              <ReviewCard key={i} review={review} />
            ))}
          </div>
        </div>

        <div className="reviews-marquee__fade reviews-marquee__fade--left" aria-hidden />
        <div className="reviews-marquee__fade reviews-marquee__fade--right" aria-hidden />
      </div>
    </section>
  );
}
