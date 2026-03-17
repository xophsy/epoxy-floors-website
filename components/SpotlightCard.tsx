"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";
import { cx } from "@/components/design-system";

type Props = {
  children: ReactNode;
  className?: string;
  spotlightColor?: string;
};

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "rgba(255, 214, 91, 0.13)",
}: Props) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={cx("surface-card", className)}
    >
      {/* Spotlight layer — inline position overrides surface-card > * { position: relative } */}
      <div
        className="pointer-events-none inset-0 z-[3] rounded-[inherit] transition-opacity duration-300"
        style={{
          position: "absolute",
          opacity,
          background: `radial-gradient(480px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 45%)`,
        }}
        aria-hidden
      />
      {children}
    </div>
  );
}
