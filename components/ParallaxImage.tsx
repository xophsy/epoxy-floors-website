"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

type Props = Omit<ImageProps, "fill"> & {
  maxTranslateY?: number;
};

const PARALLAX_OVERFLOW_PX = 40;

function clamp01(value: number) {
  return Math.min(Math.max(value, 0), 1);
}

function isLowPerformanceDevice() {
  if (typeof window === "undefined") return true;

  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean };
    deviceMemory?: number;
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return true;

  if (nav.connection?.saveData) return true;

  const deviceMemory = nav.deviceMemory;
  if (typeof deviceMemory === "number" && deviceMemory <= 4) return true;

  if (nav.hardwareConcurrency <= 4) return true;

  return false;
}

export default function ParallaxImage({
  maxTranslateY = 40,
  alt,
  className,
  style,
  ...props
}: Props) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [enabled] = useState(() => {
    if (typeof window === "undefined") return false;
    return !isLowPerformanceDevice();
  });
  const [translateY, setTranslateY] = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let frame = 0;

    const updatePosition = () => {
      frame = 0;

      if (!frameRef.current) return;

      const rect = frameRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const progress = clamp01((viewportHeight - rect.top) / (viewportHeight + rect.height));

      setTranslateY(-maxTranslateY * progress);
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updatePosition);
    };

    requestUpdate();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, [enabled, maxTranslateY]);

  return (
    <div
      ref={frameRef}
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{ bottom: `-${PARALLAX_OVERFLOW_PX}px` }}
    >
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${translateY}px, 0)`,
        }}
      >
        <Image
          {...props}
          fill
          alt={alt}
          className={className}
          style={style}
        />
      </div>
    </div>
  );
}
