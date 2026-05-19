"use client";

import { useEffect, useState } from "react";
import type { Country } from "@/lib/countries";

interface MatchIntroProps {
  playerCountry: Country;
  aiCountry: Country;
  onComplete: () => void;
}

export default function MatchIntro({ playerCountry, aiCountry, onComplete }: MatchIntroProps) {
  const [phase, setPhase] = useState<"slide-in" | "show" | "fade-out">("slide-in");

  useEffect(() => {
    const completeRef = { current: false };
    const slideInTimer = setTimeout(() => setPhase("show"), 600);
    const fadeOutTimer = setTimeout(() => setPhase("fade-out"), 1200);
    const completeTimer = setTimeout(() => {
      if (!completeRef.current) {
        completeRef.current = true;
        onComplete();
      }
    }, 1500);

    return () => {
      clearTimeout(slideInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- timers should only run once on mount
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: "rgba(10, 15, 30, 0.95)",
        backdropFilter: "blur(12px)",
        opacity: phase === "fade-out" ? 0 : 1,
        transition: "opacity 0.3s ease-out",
      }}
    >
      <div
        className="glass flex items-center gap-4 px-6 py-5 rounded-2xl"
        style={{
          maxWidth: "90%",
          opacity: phase === "slide-in" ? 0 : 1,
          transform: phase === "slide-in" ? "scale(0.8)" : "scale(1)",
          transition: "opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        {/* Player flag */}
        <div
          className="flex flex-col items-center"
          style={{
            opacity: phase === "slide-in" ? 0 : 1,
            transform: phase === "slide-in" ? "translateX(-60px)" : "translateX(0)",
            transition: "opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span className="text-5xl sm:text-6xl">{playerCountry.flag}</span>
          <span className="text-white/70 text-xs mt-1 font-medium truncate max-w-[80px]">
            {playerCountry.code}
          </span>
        </div>

        {/* VS text */}
        <div
          className="flex-shrink-0 px-3"
          style={{
            opacity: phase === "slide-in" ? 0 : 1,
            transform: phase === "slide-in" ? "scale(0.5)" : "scale(1)",
            transition: "opacity 0.4s ease-out 0.2s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s",
          }}
        >
          <span
            className="text-2xl font-black tracking-wider"
            style={{
              background: "linear-gradient(135deg, var(--accent-yellow), var(--accent-orange))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            VS
          </span>
        </div>

        {/* AI flag */}
        <div
          className="flex flex-col items-center"
          style={{
            opacity: phase === "slide-in" ? 0 : 1,
            transform: phase === "slide-in" ? "translateX(60px)" : "translateX(0)",
            transition: "opacity 0.5s ease-out, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span className="text-5xl sm:text-6xl">{aiCountry.flag}</span>
          <span className="text-white/70 text-xs mt-1 font-medium truncate max-w-[80px]">
            {aiCountry.code}
          </span>
        </div>
      </div>
    </div>
  );
}
