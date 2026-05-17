"use client";

import { useState, useMemo } from "react";
import { COUNTRIES, GROUPS, type Country } from "@/lib/countries";

interface Props {
  onSelect: (country: Country) => void;
}

export default function CountrySelector({ onSelect }: Props) {
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-white overflow-hidden">
      {/* Header */}
      <div className="flex-none px-4 pt-safe-top pt-6 pb-4 bg-gradient-to-b from-[#0a0f1e] to-transparent">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">🏆</span>
          <div>
            <h1 className="text-2xl font-black tracking-tight leading-none text-white">
              WORLD CUP
            </h1>
            <p className="text-yellow-400 font-bold text-sm tracking-widest uppercase">
              Soccer
            </p>
          </div>
        </div>
        <p className="text-white/50 text-sm mt-2">Choose your nation</p>
      </div>

      {/* Search */}
      <div className="flex-none px-4 pb-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/35 outline-none border border-white/10 focus:border-yellow-400/50 focus:bg-white/15 transition-colors"
          />
        </div>
      </div>

      {/* Group filter */}
      <div className="flex-none px-4 pb-3 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          <button
            onClick={() => setActiveGroup(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              activeGroup === null
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-white/60 hover:bg-white/20"
            }`}
          >
            All
          </button>
          {GROUPS.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(activeGroup === g ? null : g)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                activeGroup === g
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-white/60 hover:bg-white/20"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Country grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {filtered.length === 0 ? (
          <div className="text-center text-white/40 py-12 text-sm">No countries found</div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filtered.map((country) => (
              <CountryCard key={country.code} country={country} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CountryCard({ country, onSelect }: { country: Country; onSelect: (c: Country) => void }) {
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => {
        setPressed(false);
        onSelect(country);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => {
        setPressed(false);
        onSelect(country);
      }}
      onMouseLeave={() => setPressed(false)}
      className="relative overflow-hidden rounded-2xl p-3 text-left transition-transform active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${country.primaryColor}33 0%, ${country.primaryColor}18 100%)`,
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: pressed ? country.primaryColor : `${country.primaryColor}44`,
        transform: pressed ? "scale(0.95)" : "scale(1)",
      }}
    >
      {/* Background flag color accent */}
      <div
        className="absolute inset-0 opacity-10 rounded-2xl"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${country.primaryColor}, transparent 70%)`,
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <span className="text-3xl leading-none">{country.flag}</span>
        <div className="min-w-0">
          <div className="font-bold text-white text-sm leading-tight truncate">{country.name}</div>
          <div
            className="text-xs font-medium mt-0.5 truncate"
            style={{ color: `${country.primaryColor}cc` === "#FFFFFF" + "cc" ? "#aaa" : country.primaryColor + "cc" }}
          >
            {country.group}
          </div>
        </div>
      </div>
    </button>
  );
}
