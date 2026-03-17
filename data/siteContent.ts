export type TrustBadge = {
  label: string;
  detail: string;
};

export type MediaCardItem = {
  title: string;
  description: string;
  image: string;
  alt?: string;
};

export type TextCardItem = {
  title: string;
  description: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export const trustBadges: TrustBadge[] = [
  { label: "Over 100", detail: "Installs" },
  { label: "1 Day", detail: "Install" },
  { label: "Dustless", detail: "Prep System" },
];

export const services: MediaCardItem[] = [
  {
    title: "Floor Preparation",
    description:
      "The most critical step in any install. Crack repair, moisture mitigation, leveling, and diamond grinding create the foundation that determines how long your floor lasts — done right, it holds for a lifetime.",
    image: "/legacy-images/concrete.jpg",
    alt: "Concrete repair",
  },
  {
    title: "Residential Floors",
    description:
      "Transform your garage, basement, or living space. Metallic, flake, and solid systems in bespoke colorways.",
    image: "/legacy-images/residential.jpg",
    alt: "Residential epoxy floor",
  },
  {
    title: "Commercial Floors",
    description:
      "High-performance solutions for retail, offices, salons, gyms, and showrooms. Built for heavy foot traffic.",
    image: "/legacy-images/industrial.jpg",
    alt: "Commercial epoxy floor",
  },
];

export const flooringTypes: MediaCardItem[] = [
  {
    title: "Metallic Epoxy",
    description:
      "Layers of pearlescent pigments with subtle glitter that shimmer under showroom lighting and resist wear.",
    image: "/legacy-images/metallic-floor.png",
  },
  {
    title: "Flake Systems",
    description:
      "Broadcast vinyl flakes for textured slip resistance and a terrazzo-like appearance that hides imperfections.",
    image: "/legacy-images/flake-floor.png",
  },
  {
    title: "Custom Solids & Logos",
    description:
      "Decorative finishes, solid hues, and custom logos that match your brand while staying uniform and low-maintenance.",
    image: "/legacy-images/solid-floor.png",
  },
];

export const coatingOptions: TextCardItem[] = [
  {
    title: "Urethane Topcoats",
    description:
      "Used as the protective finish coat to improve scratch resistance, reduce wear, and help the floor hold its color and sheen over time.",
  },
  {
    title: "Polyaspartic Coats",
    description:
      "Best for faster return to service, with strong UV stability and chemical resistance for garages, shops, and high-use spaces.",
  },
  {
    title: "Anti-Slip Additives",
    description:
      "Added to the topcoat to create more traction and make the floor safer in wet areas, work zones, and heavy-traffic spaces.",
  },
  {
    title: "ESD Additives",
    description:
      "Used when static control matters, helping safely dissipate electrical charge in technical, lab, and electronics environments.",
  },
];

export const processSteps: TextCardItem[] = [
  {
    title: "Consult & Plan",
    description: "We inspect the slab, confirm the finish, and set the plan before installation day.",
  },
  {
    title: "Day 1: Prep, Repair, Build & Seal",
    description: "We grind, repair, prime, build the system, and apply the seal coat in one disciplined install day.",
  },
  {
    title: "Day 2: Cure & Turnover",
    description: "The floor cures cleanly and is prepped for handoff, with return-to-use timing based on the system selected.",
  },
];

export const faqs: FAQ[] = [
  {
    question: "How long does installation take?",
    answer:
      "Most residential installs are finished within 2 to 3 days total, depending on prep and system selection. Installation typically takes about a day.",
  },
  {
    question: "Will epoxy yellow in the sun?",
    answer:
      "We recommend UV-stable polyaspartic or urethane topcoats for sunny garages to maintain clarity.",
  },
  {
    question: "What warranty do you offer?",
    answer:
      "Lifetime residential warranty paired with strong commercial coverage for heavier traffic floors.",
  },
];

