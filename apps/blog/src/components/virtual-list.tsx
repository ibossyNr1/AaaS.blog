"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  itemHeight: number;
  overscan?: number;
  className?: string;
  onVisibleRangeChange?: (start: number, end: number) => void;
}

export function VirtualList<T>({
  items,
  renderItem,
  itemHeight,
  overscan = 5,
  className,
  onVisibleRangeChange,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const rafRef = useRef<number | null>(null);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    observer.observe(el);
    setContainerHeight(el.clientHeight);

    return () => observer.disconnect();
  }, []);

  // Scroll handler with rAF
  const handleScroll = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      const el = containerRef.current;
      if (el) setScrollTop(el.scrollTop);
    });
  }, []);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Calculate visible range
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    if (totalHeight === 0 || containerHeight === 0) {
      return { startIndex: 0, endIndex: 0, visibleItems: [] as { item: T; index: number }[] };
    }

    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);

    const visible: { item: T; index: number }[] = [];
    for (let i = start; i <= end; i++) {
      visible.push({ item: items[i], index: i });
    }

    return { startIndex: start, endIndex: end, visibleItems: visible };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  // Report visible range
  useEffect(() => {
    onVisibleRangeChange?.(startIndex, endIndex);
  }, [startIndex, endIndex, onVisibleRangeChange]);

  const totalHeight = items.length * itemHeight;

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={className}
      style={{ overflow: "auto", position: "relative" }}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleItems.map(({ item, index }) => (
          <div
            key={index}
            style={{
              position: "absolute",
              top: index * itemHeight,
              left: 0,
              right: 0,
              height: itemHeight,
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
