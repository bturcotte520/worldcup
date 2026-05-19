"use client";

import { useEffect, useState, type ReactNode, type CSSProperties } from "react";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function PageTransition({ children, className = "", style }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true);
    });
  }, []);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? (style?.opacity ?? 1) : 0,
        transform: isVisible ? (style?.transform ?? "translateY(0)") : "translateY(20px)",
        transition: style?.transition
          ? `opacity 0.4s ease-out, transform 0.4s ease-out, ${style.transition}`
          : "opacity 0.4s ease-out, transform 0.4s ease-out",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
