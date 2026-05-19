"use client";

import { useState, useMemo } from "react";
import { COUNTRIES, GROUPS, type Country } from "@/lib/countries";

const GROUP_ICONS: Record<string, string> = {
  "South America": "🌎",
  "Europe": "🇪🇺",
  "CONCACAF": "🌎",
  "Africa": "🌍",
  "Asia": "🌏",
  "Asia/Oceania": "🌏",
};

function isLightColor(hex: string): boolean {
  const normalized = hex.toLowerCase().replace("#", "");
  if (normalized.length === 3) {
    return normalized === "fff";
  }
  return normalized === "ffffff";
}

interface Props {
  onSelect: (country: Country) => void;
}

export default function CountrySelector({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selected, setSelected] = useState<Country | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const filtered = useMemo(() => {
    return COUNTRIES.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase());
      const matchesGroup = activeGroup === null || c.group === activeGroup;
      return matchesSearch && matchesGroup;
    });
  }, [search, activeGroup]);

  const handlePlay = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-white">
      {/* Header */}
      <div className="flex-none px-4 pt-safe-top pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl animate-trophy-pulse inline-block">🏆</span>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-gradient">
              WORLD CUP
            </h1>
            <p className="text-yellow-400/80 font-bold text-xs tracking-widest uppercase mt-0.5">
              Soccer
            </p>
          </div>
        </div>
        <div className="gradient-line mt-3 mb-2" />
        <p className="text-white/50 text-sm">Choose your nation</p>
      </div>

      {/* Search */}
      <div className="flex-none px-4 pb-3">
        <div className={`relative transition-all duration-300 ${isSearchFocused ? "scale-[1.01]" : ""}`}>
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 transition-all duration-300 ${isSearchFocused ? "text-yellow-400 scale-110" : "text-white/40"}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="text"
            placeholder={isSearchFocused ? "" : "Search country..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="w-full bg-white/10 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-white/35 outline-none border border-white/10 transition-all duration-300 focus:border-yellow-400/50 focus:bg-white/15 focus:shadow-[0_0_20px_rgba(255,224,0,0.15)]"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-0.5 animate-scaleIn"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Group filter pills */}
      <div className="flex-none px-4 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          <GroupPill
            label="All"
            icon="🌐"
            isActive={activeGroup === null}
            onClick={() => setActiveGroup(null)}
            delay={0}
          />
          {GROUPS.map((g, i) => (
            <GroupPill
              key={g}
              label={g}
              icon={GROUP_ICONS[g] || "🏳️"}
              isActive={activeGroup === g}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
              delay={i + 1}
            />
          ))}
        </div>
      </div>

      {/* Country grid */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4" style={{ WebkitOverflowScrolling: "touch" }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-white/40 animate-fadeIn">
            <span className="text-5xl mb-4 animate-pulse-empty inline-block">🔍</span>
            <p className="text-lg font-semibold text-white/60">No teams found</p>
            <p className="text-sm mt-1 text-center max-w-[200px]">Try a different search or change your group filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((country, i) => (
              <CountryCard
                key={country.code}
                country={country}
                onSelect={setSelected}
                isSelected={selected?.code === country.code}
                delay={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom sheet */}
      {selected && (
        <div
          className="flex-none animate-slideUp"
          style={{
            animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <div className="mx-4 mb-4 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-pulse-soft-glow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{selected.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white text-base truncate">{selected.name}</div>
                <div className="text-xs text-white/60">{selected.group} · {selected.code}</div>
              </div>
            </div>
            <button
              onClick={handlePlay}
              onMouseDown={() => setIsPressed(true)}
              onMouseUp={() => setIsPressed(false)}
              onTouchStart={() => setIsPressed(true)}
              onTouchEnd={() => setIsPressed(false)}
              className={`ripple-effect w-full py-3 rounded-xl font-bold text-sm tracking-wide text-black transition-all duration-200 ${
                isPressed
                  ? "scale-95"
                  : "hover:shadow-[0_0_25px_rgba(255,224,0,0.5)]"
              }`}
              style={{
                background: `linear-gradient(135deg, var(--accent-yellow), var(--accent-orange))`,
              }}
            >
              ▶ PLAY
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupPill({ label, icon, isActive, onClick, delay }: { label: string; icon: string; isActive: boolean; onClick: () => void; delay: number }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-300 ${
        isActive
          ? "bg-yellow-400 text-black shadow-[0_0_0_3px_rgba(255,224,0,0.3)]"
          : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80"
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  );
}

function CountryCard({ country, onSelect, isSelected, delay }: { country: Country; onSelect: (c: Country) => void; isSelected: boolean; delay: number }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => onSelect(country)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl p-3 text-left transition-all duration-300 ${
        isSelected
          ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-[#0a0f1e]"
          : ""
      }`}
      style={{
        background: `linear-gradient(135deg, ${country.primaryColor}33 0%, ${country.primaryColor}18 100%)`,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: isSelected ? "var(--accent-yellow)" : `${country.primaryColor}44`,
        transform: isHovered ? "scale(1.02)" : "scale(1)",
        boxShadow: isHovered ? `0 4px 20px ${country.primaryColor}40` : "none",
        animation: "fadeIn 0.4s ease forwards, slideUp 0.4s ease forwards",
        animationDelay: `${delay * 40}ms, ${delay * 40}ms`,
        animationFillMode: "backwards",
      }}
    >
      {/* Shimmer overlay - one-shot on mount */}
      <div className="animate-shine-once rounded-2xl" />

      {/* Background flag color accent */}
      <div
        className="absolute inset-0 opacity-10 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${country.primaryColor}, transparent 70%)`,
        }}
      />

      {/* Country code badge */}
      <div className="absolute top-2 right-2 text-[9px] font-mono font-bold text-white/30 bg-white/5 px-1.5 py-0.5 rounded-md">
        {country.code}
      </div>

      <div className="relative flex items-center gap-2.5">
        <span
          className="text-3xl leading-none transition-transform duration-200"
          style={{
            transform: isHovered ? "scale(1.2)" : "scale(1)",
          }}
        >
          {country.flag}
        </span>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm leading-tight truncate">{country.name}</div>
          <div
            className="text-xs font-medium mt-0.5 truncate"
            style={{ color: isLightColor(country.primaryColor) ? "#aaa" : country.primaryColor + "cc" }}
          >
            {country.group}
          </div>
        </div>
      </div>
    </button>
  );
}

