"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { allTeams, allCountries } from "@/lib/fixtures";

const GOOGLE_CAL_BASE = "https://calendar.google.com/calendar/r?cid=";

function buildIcalUrl(teams: string[], country: string, base: string) {
  return `${base}/api/ical?${new URLSearchParams({ teams: teams.join(","), country })}`;
}
function buildWebcalUrl(teams: string[], country: string, base: string) {
  return buildIcalUrl(teams, country, base).replace(/^https?/, "webcal");
}
function buildGoogleUrl(webcalUrl: string) {
  return `${GOOGLE_CAL_BASE}${encodeURIComponent(webcalUrl)}`;
}

const sortedTeams = [...allTeams].sort((a, b) => a.name.localeCompare(b.name));

function PitchSVG() {
  return (
    <svg
      viewBox="0 0 68 105"
      className="absolute inset-0 w-full h-full object-cover opacity-[0.07]"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="52.5" r="0.6" fill="white" />
      {/* Top penalty area */}
      <rect x="13.85" y="2" width="40.3" height="16.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Top goal area */}
      <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Top penalty spot */}
      <circle cx="34" cy="13" r="0.6" fill="white" />
      {/* Top penalty arc */}
      <path d="M 24.5 18.5 A 9.15 9.15 0 0 1 43.5 18.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Bottom penalty area */}
      <rect x="13.85" y="86.5" width="40.3" height="16.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Bottom goal area */}
      <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Bottom penalty spot */}
      <circle cx="34" cy="92" r="0.6" fill="white" />
      {/* Bottom penalty arc */}
      <path d="M 24.5 86.5 A 9.15 9.15 0 0 0 43.5 86.5" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Corner arcs */}
      <path d="M 2 4 A 2 2 0 0 1 4 2" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 64 4 A 2 2 0 0 0 62 2" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 2 101 A 2 2 0 0 0 4 103" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 64 101 A 2 2 0 0 1 62 103" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Alternate grass stripes */}
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="2" y={2 + i * 16.83} width="64" height="8.4" fill="white" fillOpacity="0.03" />
      ))}
    </svg>
  );
}

function TeamDropdown({
  selectedTeams,
  onToggle,
}: {
  selectedTeams: string[];
  onToggle: (code: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = sortedTeams.filter((t) =>
    t.name.toLowerCase().includes(query.toLowerCase())
  );

  const label =
    selectedTeams.length === 0
      ? "Select teams…"
      : selectedTeams.length === 1
      ? `${sortedTeams.find((t) => t.code === selectedTeams[0])?.flag} ${sortedTeams.find((t) => t.code === selectedTeams[0])?.name}`
      : `${selectedTeams.length} teams selected`;

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer ${
          open
            ? "bg-lime-400/10 border-lime-400/60 text-white"
            : selectedTeams.length > 0
            ? "bg-lime-400/10 border-lime-400/40 text-white"
            : "bg-white/5 border-white/15 text-white/50 hover:border-white/30 hover:text-white/80"
        }`}
      >
        <span className="font-[family-name:var(--font-body)] text-sm truncate">{label}</span>
        <svg
          className={`w-4 h-4 shrink-0 transition-transform text-white/40 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-white/15 bg-[#0d2818] shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-2 border-b border-white/10">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search…"
              className="w-full bg-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none border border-white/10 focus:border-lime-400/50"
            />
          </div>
          <ul className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.map((team) => {
              const checked = selectedTeams.includes(team.code);
              return (
                <li key={team.code}>
                  <button
                    onClick={() => onToggle(team.code)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                      checked ? "bg-lime-400/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked ? "bg-lime-400 border-lime-400" : "border-white/30"
                    }`}>
                      {checked && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </span>
                    <span className="text-base leading-none">{team.flag}</span>
                    <span className="font-[family-name:var(--font-body)]">{team.name}</span>
                    <span className="ml-auto text-xs text-white/25">Group {team.group}</span>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-white/30">No teams found</li>
            )}
          </ul>
          {selectedTeams.length > 0 && (
            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => { selectedTeams.forEach(onToggle); }}
                className="w-full text-xs text-white/40 hover:text-white/70 py-1 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WDC2026Page() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("fr");
  const [copied, setCopied] = useState(false);

  const base = typeof window !== "undefined" ? window.location.origin : "https://matchcal.live";
  const webcalUrl = buildWebcalUrl(selectedTeams, selectedCountry, base);
  const googleUrl = buildGoogleUrl(webcalUrl);

  const toggleTeam = (code: string) =>
    setSelectedTeams((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]
    );

  const track = (action: string) => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teams: selectedTeams, country: selectedCountry, action }),
    }).catch(() => {});
  };

  const copyLink = () => {
    navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    track("copy");
  };

  const ready = selectedTeams.length > 0;

  return (
    <main className="min-h-screen bg-[#091a0f] text-white relative overflow-hidden font-[family-name:var(--font-body)]">
      <PitchSVG />

      {/* Gradient overlay — darker at top/bottom, open in middle */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#091a0f] via-transparent to-[#091a0f] pointer-events-none" />

      <div className="relative z-10 flex flex-col min-h-screen max-w-lg mx-auto px-4">

        {/* Header */}
        <header className="pt-8 pb-6 flex items-center gap-3">
          <div className="flex items-baseline gap-1">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-wide text-white">MATCHCAL</span>
            <span className="text-lime-400 font-[family-name:var(--font-display)] text-sm font-semibold">.LIVE</span>
          </div>
          <span className="ml-auto text-[10px] font-semibold tracking-widest uppercase bg-amber-400/15 text-amber-300 border border-amber-400/25 rounded px-2 py-1">
            WDC 2026
          </span>
        </header>

        {/* Hero */}
        <div className="py-6">
          <h1 className="font-[family-name:var(--font-display)] text-6xl font-extrabold leading-none tracking-tight uppercase">
            Never<br />
            <span className="text-lime-400">miss</span><br />
            a game.
          </h1>
          <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-sm">
            Pick your teams, choose your country, and add every World Cup match to your calendar — with the TV channel baked in.
          </p>
        </div>

        {/* Card */}
        <div className="flex-1 pb-10 space-y-5">
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-5 backdrop-blur-sm">

            {/* Step 1 — Teams */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                <span className="w-5 h-5 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center text-[10px] font-bold">1</span>
                Your teams
              </label>
              <TeamDropdown selectedTeams={selectedTeams} onToggle={toggleTeam} />
            </div>

            {/* Step 2 — Country */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                <span className="w-5 h-5 rounded-full bg-lime-400/20 text-lime-400 flex items-center justify-center text-[10px] font-bold">2</span>
                Your country <span className="text-white/25 normal-case font-normal tracking-normal">for TV info</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {allCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => setSelectedCountry(c.code)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      selectedCountry === c.code
                        ? "bg-lime-400/15 border-lime-400/50 text-lime-300"
                        : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/10" />

            {/* Step 3 — Calendar buttons */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-white/40">
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${ready ? "bg-lime-400/20 text-lime-400" : "bg-white/10 text-white/30"}`}>3</span>
                Add to calendar
              </label>

              {ready ? (
                <div className="space-y-2">
                  <a
                    href={googleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track("google")}
                    className="flex items-center gap-3 w-full bg-white text-gray-900 rounded-xl px-4 py-3.5 font-semibold hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                      <path fill="#4285F4" d="M45.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.1c-.5 2.8-2.1 5.1-4.5 6.7v5.6h7.3c4.3-4 6.6-9.8 6.6-16.3z"/>
                      <path fill="#34A853" d="M24 46c6.5 0 11.9-2.1 15.9-5.8l-7.3-5.6c-2.2 1.5-5 2.3-8.6 2.3-6.6 0-12.2-4.4-14.2-10.4H2.2v5.8C6.1 40.9 14.4 46 24 46z"/>
                      <path fill="#FBBC05" d="M9.8 26.5c-.5-1.5-.8-3-.8-4.5s.3-3 .8-4.5v-5.8H2.2C.8 14.7 0 19.2 0 24s.8 9.3 2.2 12.3l7.6-5.8z"/>
                      <path fill="#EA4335" d="M24 9.5c3.7 0 7 1.3 9.6 3.8l7.2-7.2C36.9 2.1 31.5 0 24 0 14.4 0 6.1 5.1 2.2 12.7l7.6 5.8C11.8 13.9 17.4 9.5 24 9.5z"/>
                    </svg>
                    <div>
                      <div className="text-sm font-bold leading-none">Add to Google Calendar</div>
                      <div className="text-xs text-gray-500 mt-0.5">Subscribes automatically</div>
                    </div>
                  </a>

                  <a
                    href={webcalUrl}
                    onClick={() => track("webcal")}
                    className="flex items-center gap-3 w-full bg-white/8 border border-white/15 text-white rounded-xl px-4 py-3.5 font-semibold hover:bg-white/12 active:scale-[0.98] transition-all"
                  >
                    <span className="text-xl shrink-0">📅</span>
                    <div>
                      <div className="text-sm font-bold leading-none">Apple / Outlook</div>
                      <div className="text-xs text-white/40 mt-0.5">Opens your default calendar</div>
                    </div>
                  </a>

                  <button
                    onClick={copyLink}
                    className="flex items-center gap-3 w-full bg-transparent border border-white/10 text-white/50 rounded-xl px-4 py-3 hover:text-white/70 hover:border-white/20 active:scale-[0.98] transition-all"
                  >
                    <span className="text-base shrink-0">{copied ? "✅" : "🔗"}</span>
                    <div className="text-left overflow-hidden">
                      <div className="text-xs font-semibold">{copied ? "Copied!" : "Copy link"}</div>
                      <div className="text-[10px] text-white/25 truncate">{webcalUrl}</div>
                    </div>
                  </button>
                </div>
              ) : (
                <p className="text-xs text-white/25 py-2">
                  Select at least one team to generate your link.
                </p>
              )}
            </div>
          </div>

          {/* How it works — ultra compact */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { icon: "🔄", label: "Auto-updates", sub: "Knockouts included" },
              { icon: "📺", label: "TV channel", sub: "Per game" },
              { icon: "📱", label: "Any app", sub: "Google, Apple, Outlook" },
            ].map((item) => (
              <div key={item.label} className="bg-white/[0.03] border border-white/8 rounded-xl p-3 space-y-1">
                <div className="text-xl">{item.icon}</div>
                <div className="text-xs font-semibold text-white/70">{item.label}</div>
                <div className="text-[10px] text-white/30">{item.sub}</div>
              </div>
            ))}
          </div>

          <footer className="flex items-center justify-between text-[11px] text-white/20 pt-1">
            <span>Not affiliated with FIFA</span>
            <Link href="/wdc-2026/games" className="hover:text-white/50 transition-colors">
              All games →
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
