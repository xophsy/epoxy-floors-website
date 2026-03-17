export type NavLink = {
  label: string;
  href: string;
};

export const primaryNavLinks: NavLink[] = [
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export const footerNavLinks: NavLink[] = [
  { label: "Services", href: "#services" },
  { label: "Before / After", href: "#before-after" },
  { label: "Process", href: "#process" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export function resolveNavHref(href: string, homeLinks: boolean) {
  if (!href.startsWith("#")) {
    return href;
  }

  return `${homeLinks ? "" : "/"}${href}`;
}
