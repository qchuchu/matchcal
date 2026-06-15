"use client";

import { useState } from "react";
import Link from "next/link";
import { allTeams, allCountries } from "@/lib/fixtures";

const GOOGLE_CAL_BASE =
  "https://calendar.google.com/calendar/r?cid=";

function buildIcalUrl(
  teams: string[],
  country: string,
  base: string
): string {
  const params = new URLSearchParams({ teams: teams.join(","), country });
  return `${base}/api/ical?${params.toString()}`;
}

function buildWebcalUrl(teams: string[], country: string, base: string): string {
  return buildIcalUrl(teams, country, base).replace(/^https?/, "webcal");
}

function buildGoogleUrl(webcalUrl: string): string {
  return `${GOOGLE_CAL_BASE}${encodeURIComponent(webcalUrl)}`;
}

// Group teams by group letter
const groupedTeams = allTeams.reduce<Record<string, typeof allTeams>>(
  (acc, team) => {
    const g = team.group;
    if (!acc[g]) acc[g] = [];
    acc[g].push(team);
    return acc;
  },
  {}
);

export default function WDC2026Page() {
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("fr");
  const [copied, setCopied] = useState(false);

  const base =
    typeof window !== "undefined" ? window.location.origin : "https://matchcal.live";

  const toggleTeam = (code: string) => {
    setSelectedTeams((prev) =>
      prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]
    );
  };

  const webcalUrl = buildWebcalUrl(selectedTeams, selectedCountry, base);
  const googleUrl = buildGoogleUrl(webcalUrl);
  const icalUrl = buildIcalUrl(selectedTeams, selectedCountry, base);

  const copyLink = () => {
    navigator.clipboard.writeText(webcalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ready = selectedTeams.length > 0;

  return (
    <main className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-3">
        <span className="text-2xl">⚽</span>
        <div>
          <h1 className="font-bold text-lg leading-none">matchcal</h1>
          <p className="text-xs text-white/50">.live</p>
        </div>
        <span className="ml-2 text-xs bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 rounded-full px-2 py-0.5">
          FIFA World Cup 2026
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <h2 className="text-4xl font-bold tracking-tight">
            Never miss a game.
          </h2>
          <p className="text-white/60 text-lg max-w-xl mx-auto">
            Pick your teams, choose your country, and add every match to your
            calendar in one click — with the TV channel included.
          </p>
        </div>

        {/* Step 1 — Pick teams */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              1
            </span>
            <h3 className="font-semibold text-lg">Pick your teams</h3>
            {selectedTeams.length > 0 && (
              <span className="text-xs text-white/50">
                {selectedTeams.length} selected
              </span>
            )}
          </div>

          <div className="space-y-3">
            {Object.entries(groupedTeams)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, teams]) => (
                <div key={group}>
                  <p className="text-xs text-white/40 uppercase tracking-widest mb-2">
                    Group {group}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {teams.map((team) => {
                      const selected = selectedTeams.includes(team.code);
                      return (
                        <button
                          key={team.code}
                          onClick={() => toggleTeam(team.code)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                            selected
                              ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                              : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{team.flag}</span>
                          <span>{team.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Step 2 — Pick country */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold shrink-0">
              2
            </span>
            <h3 className="font-semibold text-lg">Your country</h3>
            <span className="text-xs text-white/50">for TV channel info</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {allCountries.map((country) => (
              <button
                key={country.code}
                onClick={() => setSelectedCountry(country.code)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                  selectedCountry === country.code
                    ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30"
                    : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{country.flag}</span>
                <span>{country.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3 — Add to calendar */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                ready ? "bg-blue-500" : "bg-white/20"
              }`}
            >
              3
            </span>
            <h3 className="font-semibold text-lg">Add to your calendar</h3>
          </div>

          {ready ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {/* Google Calendar */}
              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-white text-gray-900 rounded-2xl px-5 py-4 font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12s4.48 10 10 10 10-4.48 10-10z"
                  />
                  <path
                    fill="white"
                    d="M12 6.5v5.5l4 2-1 1.5-4.5-2.5V6.5H12z"
                  />
                </svg>
                <div>
                  <div className="text-sm font-bold">Add to Google Calendar</div>
                  <div className="text-xs text-gray-500">Opens & subscribes automatically</div>
                </div>
              </a>

              {/* Apple / Outlook */}
              <a
                href={webcalUrl}
                className="flex items-center gap-3 bg-white/10 border border-white/20 text-white rounded-2xl px-5 py-4 font-semibold hover:bg-white/20 transition-colors"
              >
                <span className="text-2xl shrink-0">📅</span>
                <div>
                  <div className="text-sm font-bold">Apple / Outlook Calendar</div>
                  <div className="text-xs text-white/50">Opens your default calendar app</div>
                </div>
              </a>

              {/* Copy link */}
              <button
                onClick={copyLink}
                className="flex items-center gap-3 bg-white/5 border border-white/10 text-white/70 rounded-2xl px-5 py-4 font-semibold hover:bg-white/10 hover:text-white transition-colors sm:col-span-2"
              >
                <span className="text-xl shrink-0">{copied ? "✅" : "🔗"}</span>
                <div className="text-left">
                  <div className="text-sm font-bold">
                    {copied ? "Copied!" : "Copy subscription URL"}
                  </div>
                  <div className="text-xs text-white/40 truncate max-w-sm">
                    {webcalUrl}
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-6 text-center text-white/40">
              Select at least one team above to generate your calendar link
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="border-t border-white/10 pt-8 space-y-3">
          <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wider">
            How it works
          </h4>
          <div className="grid sm:grid-cols-3 gap-4 text-sm text-white/50">
            <div className="space-y-1">
              <p className="text-white/80 font-medium">Live subscription</p>
              <p>
                Your calendar auto-updates as knockout matchups are confirmed. No
                manual re-import needed.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/80 font-medium">TV channel in each event</p>
              <p>
                Every game shows which channel to watch on, based on your country
                selection.
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-white/80 font-medium">Works everywhere</p>
              <p>
                Google Calendar, Apple Calendar, Outlook — any app that supports
                iCal subscriptions.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center text-white/20 text-xs pt-4 flex items-center justify-center gap-4">
          <span>matchcal.live · Not affiliated with FIFA</span>
          <Link href="/wdc-2026/games" className="hover:text-white/50 underline underline-offset-2">
            View all games →
          </Link>
        </footer>
      </div>
    </main>
  );
}
