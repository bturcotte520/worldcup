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

function AnimatedScore({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    const duration = 1000;
    const steps = 20;
    const interval = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= steps) {
        setDisplay(target);
        clearInterval(timer);
      } else {
        setDisplay(Math.round((current / steps) * target));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [target]);
  return <span>{display}</span>;
}

export default function GameOverScreen({
  playerCountry,
  aiCountry,
  score,
  onPlayAgain,
  onChangeTeam,
}: Props) {
  const [visible, setVisible] = useState(false);
  const [showDetermined, setShowDetermined] = useState(false);
  const playerWon = score.player > score.ai;
  const draw = score.player === score.ai;
  const defeated = !playerWon && !draw;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (defeated) {
      const t = setTimeout(() => setShowDetermined(true), 2000);
      return () => clearTimeout(t);
    }
    setShowDetermined(false);
  }, [defeated]);

  const resultIcon = playerWon ? (
    <div className="relative result-icon-victory">
      <div className="text-7xl result-glow" aria-hidden="true">🏆</div>
      <div className="star-particle star-1" aria-hidden="true">✦</div>
      <div className="star-particle star-2" aria-hidden="true">✦</div>
      <div className="star-particle star-3" aria-hidden="true">✦</div>
      <div className="star-particle star-4" aria-hidden="true">✦</div>
      <div className="star-particle star-5" aria-hidden="true">✦</div>
    </div>
  ) : draw ? (
    <div className="text-7xl result-icon-draw" aria-hidden="true">🤝</div>
  ) : (
    <div className={`text-7xl ${showDetermined ? 'result-icon-determined' : 'result-icon-defeat'}`} aria-hidden="true">
      {showDetermined ? "💪" : "😞"}
    </div>
  );

  const resultText = playerWon ? (
    <h1 className="text-4xl font-black tracking-tight result-text-victory">VICTORY!</h1>
  ) : draw ? (
    <h1 className="text-4xl font-black tracking-tight result-text-draw">DRAW!</h1>
  ) : (
    <h1 className="text-4xl font-black tracking-tight result-text-defeat">DEFEAT</h1>
  );

  const subtitle = playerWon
    ? "What a performance!"
    : draw
    ? "An incredible battle!"
    : "So close! Next time.";

  const particleClass = playerWon ? "particles-victory" : draw ? "particles-draw" : "particles-defeat";

  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-black/90 z-50 px-6 transition-opacity duration-500 overflow-hidden ${particleClass}`}
      style={{ opacity: visible ? 1 : 0 }}
    >
      {/* Result icon */}
      <div
        className="mb-4"
        style={{
          animation: visible ? "slideUp 0.5s ease forwards" : "none",
        }}
      >
        {resultIcon}
      </div>

      {/* Result text */}
      <div
        className="mb-1 text-center"
        style={{
          animation: visible ? "slideUp 0.5s ease forwards" : "none",
          animationDelay: "0.1s",
          opacity: 0,
        }}
      >
        {resultText}
      </div>
      <p
        className="text-white/50 text-sm mb-6 text-center"
        style={{
          animation: visible ? "slideUp 0.5s ease forwards" : "none",
          animationDelay: "0.2s",
          opacity: 0,
        }}
      >
        {subtitle}
      </p>

      {/* Score card */}
      <div
        className="w-full max-w-xs rounded-3xl overflow-hidden mb-6 glass"
        style={{
          animation: visible ? "slideUp 0.5s ease forwards" : "none",
          animationDelay: "0.3s",
          opacity: 0,
        }}
      >
        <div className="px-2 py-3 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-white/40">Full Time</span>
        </div>
        <div className="h-px mx-6 bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
        <div className="flex items-center justify-between px-6 py-5">
          {/* Player */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-4xl animate-float">{playerCountry.flag}</span>
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
              <AnimatedScore target={score.player} />
            </span>
            <span className="text-white/30 text-2xl font-light">–</span>
            <span
              className="text-5xl font-black tabular-nums"
              style={{ color: defeated ? "#FFE000" : draw ? "#FFFFFF" : "#FF6B6B" }}
            >
              <AnimatedScore target={score.ai} />
            </span>
          </div>

          {/* AI */}
          <div className="flex flex-col items-center gap-1.5 flex-1">
            <span className="text-4xl animate-float" style={{ animationDelay: "0.5s" }}>{aiCountry.flag}</span>
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
          className="btn-rematch w-full py-4 rounded-2xl font-black text-black text-base tracking-wide relative overflow-hidden"
          style={{
            animation: visible ? "slideUp 0.5s ease forwards" : "none",
            animationDelay: "0.4s",
            opacity: 0,
          }}
        >
          <span className="btn-rematch-shimmer" aria-hidden="true" />
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-.001 4.992H2.985m4.992 0V14.65m9.348-4.992v4.992m0 0h4.992m-4.992-4.992h-4.992" />
            </svg>
            REMATCH
          </span>
        </button>
        <button
          onClick={onChangeTeam}
          className="btn-change-team w-full py-4 rounded-2xl font-bold text-white text-base glass relative overflow-hidden"
          style={{
            animation: visible ? "slideUp 0.5s ease forwards" : "none",
            animationDelay: "0.5s",
            opacity: 0,
          }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
            </svg>
            Change Team
          </span>
        </button>
      </div>
    </div>
  );
}
