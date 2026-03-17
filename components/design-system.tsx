import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type ClassValue = string | false | null | undefined;

export function cx(...values: ClassValue[]) {
  return values.filter(Boolean).join(" ");
}

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
} & Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "className" | "children">;

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cx(
        "button-base",
        variant === "primary" ? "button-primary" : "button-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

type SectionShellProps = {
  id?: string;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
};

export function SectionShell({
  id,
  className,
  containerClassName,
  children,
}: SectionShellProps) {
  return (
    <section id={id} className={cx("section-shell section", className)}>
      <div className={cx("content-shell", containerClassName)}>{children}</div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  actions?: ReactNode;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  actions,
}: SectionHeadingProps) {
  return (
    <div
      className={cx(
        "section-heading",
        align === "center" && "section-heading-center",
        className,
      )}
    >
      <div className="section-heading-copy">
        {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
        <h2 className="section-title">{title}</h2>
        {description ? <p className="section-body">{description}</p> : null}
      </div>
      {actions ? <div className="section-heading-actions">{actions}</div> : null}
    </div>
  );
}

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return <article className={cx("surface-card", className)}>{children}</article>;
}

export const motionPresets = {
  section: {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
    },
  },
  card: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  },
  stagger: {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.12, delayChildren: 0.05 },
    },
  },
  viewport: { once: true, amount: 0.25 },
} as const;
