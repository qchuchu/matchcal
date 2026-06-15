"use client";

import { useState, useMemo } from "react";
import { competitionData } from "@/lib/fixtures";
import Link from "next/link";

const { games, teams, venues, broadcast: broadcastMeta } = competitionData;

type Team = { name: string; flag: string; group: string };
type TeamMap = Record<string, Team>;
const typedTeams = teams as TeamMap;

const PHASE_LABEL: Record<string, string> = {
  group: "Group Stage",
  round_of_32: "Round of 32",
  round_of_16: "Round of 16",
  quarter_final: "Quarter-Final",
  semi_final: "Semi-Final",
  third_place: "3rd Place",
  final: "Final",
};

const PHASE_COLOR: Record<string, string> = {
  group: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  round_of_32: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  round_of_16: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  quarter_final: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  semi_final: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  third_place: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  final: "bg-green-500/20 text-green-300 border-green-500/30",
};

function teamLabel(code: string): string {
  const t = typedTeams[code];
  return t ? `${t.flag} ${t.name}` : code;
}

function formatDate(dateStr: string, timeStr: string): string {
  const dt = new Date(`${dateStr}T${timeStr}Z`);
  return dt.toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "UTC",
  });
}

function broadcastBadges(game: (typeof games)[number]) {
  const bc = game.broadcast as Record<string, string[]>;
  return Object.entries(bc).map(([country, channels]) => {
    const meta = broadcastMeta[country as keyof typeof broadcastMeta];
    return (
      <span key={country} className="text-xs text-white/40">
        {meta?.flag ?? country.toUpperCase()}{" "}
        <span className="text-white/60">{channels.join(", ")}</span>
      </span>
    );
  });
}

// All group-stage team codes
const allGroupTeams = Object.entries(typedTeams)
  .sort((a, b) => a[1].group.localeCompare(b[1].group) || a[1].name.localeCompare(b[1].name))
  .map(([code, t]) => ({ code, ...t }));

export default function GamesPage() {
  const [filterTeam, setFilterTeam] = useState("ALL");
  const [filterPhase, setFilterPhase] = useState("ALL");

  const filtered = useMemo(() => {
    return games.filter((g) => {
      const teamOk =
        filterTeam === "ALL" || g.home === filterTeam || g.away === filterTeam;
      const phaseOk = filterPhase === "ALL" || g.phase === filterPhase;
      return teamOk && phaseOk;
    });
  }, [filterTeam, filterPhase]);

  const phases = [...new Set(games.map((g) => g.phase))];

  return (
    <main className="min-h-screen bg-[#0a1628] text-white">
      {/* Header */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center gap-4">
        <Link href="/wdc-2026" className="text-white/40 hover:text-white text-sm">
          ← matchcal
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="font-semibold">All Games</h1>
        <span className="ml-auto text-xs text-white/30">{filtered.length} of {games.length} games</span>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-[#0a1628]/95 backdrop-blur border-b border-white/10 px-6 py-3 flex flex-wrap gap-3">
        <select
          value={filterTeam}
          onChange={(e) => setFilterTeam(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
        >
          <option value="ALL">All teams</option>
          {allGroupTeams.map((t) => (
            <option key={t.code} value={t.code}>
              {t.flag} {t.name} (Group {t.group})
            </option>
          ))}
        </select>

        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-400"
        >
          <option value="ALL">All phases</option>
          {phases.map((p) => (
            <option key={p} value={p}>{PHASE_LABEL[p] ?? p}</option>
          ))}
        </select>

        {(filterTeam !== "ALL" || filterPhase !== "ALL") && (
          <button
            onClick={() => { setFilterTeam("ALL"); setFilterPhase("ALL"); }}
            className="text-xs text-white/40 hover:text-white px-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Games list */}
      <div className="divide-y divide-white/5">
        {filtered.map((game) => {
          const venue = game.venue ? venues[game.venue as keyof typeof venues] : null;
          const isPlayed = game.status === "played";
          const isLive = game.status === "live";

          return (
            <div
              key={game.id}
              className={`px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:bg-white/[0.02] transition-colors ${isLive ? "bg-green-500/5 border-l-2 border-l-green-400" : ""}`}
            >
              {/* Date + phase */}
              <div className="w-44 shrink-0 space-y-1">
                <p className="text-xs text-white/40 font-mono">
                  {formatDate(game.date, game.time)}
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${PHASE_COLOR[game.phase] ?? "bg-white/10 text-white/40 border-white/20"}`}>
                    {game.phase === "group" && game.group
                      ? `Group ${game.group}`
                      : PHASE_LABEL[game.phase] ?? game.phase}
                  </span>
                  {isLive && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500 text-white font-bold animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Teams + score */}
              <div className="flex-1 flex items-center gap-4">
                <div className="flex-1 text-right">
                  <p className={`font-semibold ${filterTeam === game.home ? "text-blue-300" : ""}`}>
                    {teamLabel(game.home)}
                  </p>
                </div>

                <div className="text-center w-20 shrink-0">
                  {isPlayed && game.score ? (
                    <span className="font-bold text-xl tabular-nums">
                      {game.score.home} – {game.score.away}
                    </span>
                  ) : isLive && game.score ? (
                    <span className="font-bold text-xl tabular-nums text-green-400">
                      {game.score.home} – {game.score.away}
                    </span>
                  ) : (
                    <span className="text-white/30 text-sm">vs</span>
                  )}
                </div>

                <div className="flex-1 text-left">
                  <p className={`font-semibold ${filterTeam === game.away ? "text-blue-300" : ""}`}>
                    {teamLabel(game.away)}
                  </p>
                </div>
              </div>

              {/* Venue + broadcast */}
              <div className="w-52 shrink-0 space-y-1 text-right">
                {venue && (
                  <p className="text-xs text-white/40 truncate">
                    📍 {venue.city}
                  </p>
                )}
                <div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-end">
                  {broadcastBadges(game)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-white/30">No games match your filters</div>
      )}
    </main>
  );
}
