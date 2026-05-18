"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { Country } from "@/lib/countries";
import { COUNTRIES } from "@/lib/countries";

const CountrySelector = dynamic(() => import("@/components/CountrySelector"), {
  ssr: false,
});

export default function Home() {
  const router = useRouter();
  const [selected, setSelected] = useState<Country | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [randomClicks, setRandomClicks] = useState(0);

  const handleSelect = (country: Country) => {
    setSelected(country);
  };

  // picks a random team
  function pickRandom() {
    var idx = Math.floor(Math.random() * COUNTRIES.length)
    var team = COUNTRIES[idx]
    console.log("random team picked", team)
    setRandomClicks(randomClicks + 1)
    setSelected(team)
    return team
  }

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
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-[#0a0f1e]">
      <div style={{display: "flex", justifyContent: "flex-end", padding: "12px 12px 0 12px"}}>
        <button onClick={() => pickRandom()} style={{background: "purple", color: "white", padding: "8px 16px", borderRadius: "8px", fontWeight: "bold", fontSize: 14, border: "none", cursor: "pointer"}}>
          🎲 Random Team {randomClicks > 0 ? `(${randomClicks})` : ''}
        </button>
      </div>
      <CountrySelector onSelect={handleSelect} />

      {/* Bottom sheet when a country is selected */}
      {selected && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 transition-transform duration-300"
          style={{
            transform: "translateY(0)",
            background: "linear-gradient(180deg, transparent 0%, rgba(10,15,30,0.95) 20%)",
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
                  boxShadow: "0 4px 24px rgba(255, 200, 0, 0.45)",
                }}
              >
                {confirming ? "Loading..." : `⚽ PLAY AS ${selected.name.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
