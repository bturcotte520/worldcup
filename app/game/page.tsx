"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { COUNTRIES, type Country } from "@/lib/countries";
import GameOverScreen from "@/components/GameOverScreen";
import MatchIntro from "@/components/MatchIntro";

const SoccerGame = dynamic(() => import("@/components/SoccerGame"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-[#0a1f0a]">
      <div className="text-center">
        <div className="text-4xl animate-spin mb-3">⚽</div>
        <div className="text-white/60 text-sm">Loading match...</div>
      </div>
    </div>
  ),
});

function pickRandomCountry(exclude?: string): Country {
  const available = COUNTRIES.filter((c) => c.code !== exclude);
  return available[Math.floor(Math.random() * available.length)];
}

function GamePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [playerCountry, setPlayerCountry] = useState<Country | null>(null);
  const [aiCountry, setAiCountry] = useState<Country | null>(null);
  const [gameKey, setGameKey] = useState(0);
  const [finalScore, setFinalScore] = useState<{ player: number; ai: number } | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const code = params.get("team");
    const found = COUNTRIES.find((c) => c.code === code);
    const player = found ?? COUNTRIES[0];
    const ai = pickRandomCountry(player.code);
    setPlayerCountry(player);
    setAiCountry(ai);
  }, [params]);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  const handleGameEnd = (score: { player: number; ai: number }) => {
    setFinalScore(score);
  };

  const handleRematch = () => {
    setFinalScore(null);
    setGameKey((k) => k + 1);
  };

  const handleChangeTeam = () => {
    setIsExiting(true);
    setTimeout(() => {
      router.push("/");
    }, 300);
  };

  if (!playerCountry || !aiCountry) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-[#0a1f0a]">
        <div className="text-4xl animate-pulse">⚽</div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      style={{
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? "translateY(-10px)" : "translateY(0)",
        transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
      }}
    >
      {showIntro && (
        <MatchIntro
          playerCountry={playerCountry}
          aiCountry={aiCountry}
          onComplete={handleIntroComplete}
        />
      )}
      <SoccerGame
        key={gameKey}
        playerCountry={playerCountry}
        aiCountry={aiCountry}
        onGameEnd={handleGameEnd}
      />
      {finalScore && (
        <GameOverScreen
          playerCountry={playerCountry}
          aiCountry={aiCountry}
          score={finalScore}
          onPlayAgain={handleRematch}
          onChangeTeam={handleChangeTeam}
        />
      )}
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-full bg-[#0a1f0a]">
          <div className="text-4xl animate-spin">⚽</div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
