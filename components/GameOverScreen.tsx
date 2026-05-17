"use client";

import { useEffect, useState } from "react";
import type { Country } from "@/lib/countries";

interface Props {
  playerCountry: Country;
  aiCountry: Country;
  score: { player: number; ai: number };
  onPlayAgain: () => void;
  onChangeTeam: () => void;
}

export default function GameOverScreen({
  playerCountry,
  aiCountry,
  score,
  onPlayAgain,
  onChangeTeam,
}: Props) {
  const [visible, setVisible] = useState(false);
  const playerWon = score.player > score.ai;
  const draw = score.player === score.ai;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50 px-6 transition-opacity duration-500"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Trophy / result icon */}
      <div className="text-6xl mb-3 animate-bounce">
        {playerWon ? "🏆" : draw ? "🤝" : "😞"}
      </div>

      {/* Result text */}
      <h1 className="text-3xl font-black text-white mb-1 tracking-tight">
        {playerWon ? "VICTORY!" : draw ? "DRAW!" : "DEFEAT"}
      </h1>
      <p className="text-white/50 text-sm mb-6">
        {playerWon
          ? "What a performance!"
          : draw
          ? "An incredible battle!"
          : "So close! Next time."}
      </p>

      {/* Score card */}
      <div
        className="w-full max-w-xs rounded-3xl overflow-hidden mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="px-2 py-3 text-center text-xs text-white/40 font-bold uppercase tracking-widest border-b border-white/10">
          Full Time
        </div>
        <div className="flex items-center justify-between px-6 py-5">
          {/* Player */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-4xl">{playerCountry.flag}</span>
            <span className="text-white text-xs font-semibold text-center leading-tight">
              {playerCountry.name}
            </span>
            <span className="text-xs text-yellow-400 font-bold">YOU</span>
          </div>

          {/* Score */}
          <div className="flex items-center gap-3 px-4">
            <span
              className="text-5xl font-black tabular-nums"
              style={{ color: playerWon ? "#FFE000" : draw ? "#FFFFFF" : "#FF6B6B" }}
            >
              {score.player}
            </span>
            <span className="text-white/30 text-2xl font-light">–</span>
            <span
              className="text-5xl font-black tabular-nums"
              style={{ color: !playerWon && !draw ? "#FFE000" : draw ? "#FFFFFF" : "#FF6B6B" }}
            >
              {score.ai}
            </span>
          </div>

          {/* AI */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-4xl">{aiCountry.flag}</span>
            <span className="text-white text-xs font-semibold text-center leading-tight">
              {aiCountry.name}
            </span>
            <span className="text-xs text-red-400 font-bold">CPU</span>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={onPlayAgain}
          className="w-full py-4 rounded-2xl font-black text-black text-base tracking-wide transition-transform active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FFE000, #FFA500)",
            boxShadow: "0 4px 20px rgba(255, 200, 0, 0.4)",
          }}
        >
          REMATCH
        </button>
        <button
          onClick={onChangeTeam}
          className="w-full py-4 rounded-2xl font-bold text-white text-base bg-white/10 border border-white/15 transition-transform active:scale-95"
        >
          Change Team
        </button>
      </div>
    </div>
  );
}
