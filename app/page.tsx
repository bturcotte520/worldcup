"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Country } from "@/lib/countries";
import PageTransition from "@/components/PageTransition";
import LoadingOverlay from "@/components/LoadingOverlay";

const CountrySelector = dynamic(() => import("@/components/CountrySelector"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<Country | null>(null);
  const [confirming, setConfirming] = useState(false);

  const handleSelect = (country: Country) => {
    setSelected(country);
  };

  const handlePlay = () => {
    if (!selected) return;
    setConfirming(true);
    setTimeout(() => {
      router.push(`/game?team=${selected.code}`);
    }, 200);
  };

  const handleBack = () => {
    setSelected(null);
  };

  return (
    <PageTransition className="relative flex flex-col w-full h-full overflow-hidden bg-[#0a0f1e] animated-gradient particles">
      {confirming && <LoadingOverlay text="Loading match..." />}
      <CountrySelector onSelect={handleSelect} />

      {/* Background overlay dim when sheet opens */}
      {selected && (
        <div
          className="absolute inset-0 z-10 bg-black/40"
          style={{
            animation: "fadeIn 0.3s ease forwards",
          }}
        />
      )}

      {/* Bottom sheet when a country is selected - keyed to only animate on initial mount */}
      {selected && (
        <div
          key={selected.code}
          className="absolute bottom-0 left-0 right-0 z-20"
          style={{
            animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        >
          <div
            className="mx-3 mb-3 rounded-3xl overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)",
              border: "1px solid rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px)",
            }}
          >
            <div className="flex items-center gap-4 p-4">
              <span className="text-5xl">{selected.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-black text-lg leading-tight">{selected.name}</div>
                <div className="text-white/50 text-sm">{selected.group}</div>
                <div className="text-yellow-400 text-xs font-semibold mt-0.5">Selected ✓</div>
              </div>
              <button
                onClick={handleBack}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 text-sm hover:bg-white/20 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-4 pb-4">
              <button
                onClick={handlePlay}
                disabled={confirming}
                className="w-full py-4 rounded-2xl font-black text-black text-lg tracking-wide transition-transform active:scale-95 disabled:opacity-70"
                style={{
                  background: confirming
                    ? "linear-gradient(135deg, #ccb000, #cc8000)"
                    : "linear-gradient(135deg, #FFE000, #FFA500)",
                  boxShadow: confirming
                    ? "0 4px 24px rgba(255, 200, 0, 0.3)"
                    : "0 4px 24px rgba(255, 200, 0, 0.45)",
                }}
              >
                {confirming ? "Loading..." : `⚽ PLAY AS ${selected.name.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
