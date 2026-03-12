"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@aaas/ui";

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: LazyImageProps) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (priority) return;

    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  if (hasError) {
    return (
      <div
        ref={imgRef}
        className={cn(
          "flex items-center justify-center bg-surface rounded-lg text-text-muted text-xs font-mono",
          className,
        )}
        style={{ width, height }}
        role="img"
        aria-label={alt}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="opacity-40"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 16l5-5 4 4 4-4 5 5" />
          <circle cx="8.5" cy="8.5" r="1.5" />
        </svg>
      </div>
    );
  }

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      style={{ width, height }}
    >
      {/* Shimmer skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-surface rounded-lg overflow-hidden">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {isVisible && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? "eager" : "lazy"}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
