import { NextRequest, NextResponse } from "next/server";
import {
  getGamesForTeams,
  getBroadcastForGame,
  getGameTitle,
  getGameStartUTC,
  getVenue,
  competitionData,
} from "@/lib/fixtures";

function formatDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const MAX = 75;
  if (line.length <= MAX) return line;
  const chunks: string[] = [];
  chunks.push(line.slice(0, MAX));
  let i = MAX;
  while (i < line.length) {
    chunks.push(" " + line.slice(i, i + MAX - 1));
    i += MAX - 1;
  }
  return chunks.join("\r\n");
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const teamsParam = searchParams.get("teams") ?? "";
  const gamesParam = searchParams.get("games") ?? "";
  const excludeParam = searchParams.get("exclude") ?? "";
  const hasExcludeParam = searchParams.has("exclude");
  const country = searchParams.get("country") ?? "fr";
  const now = new Date();

  const teams = teamsParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const gameIds = gamesParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  const excludedGameIds = excludeParam
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (teams.length === 0 && gameIds.length === 0 && !hasExcludeParam) {
    return new NextResponse("Missing teams, games, or exclude parameter", { status: 400 });
  }

  const gameIdSet = new Set(gameIds);
  const excludedGameIdSet = new Set(excludedGameIds);
  const games =
    gameIds.length > 0
      ? competitionData.games.filter((game) => gameIdSet.has(game.id))
      : (teams.length > 0 ? getGamesForTeams(teams) : competitionData.games).filter(
          (game) => !excludedGameIdSet.has(game.id)
        );
  const upcomingGames = games.filter((game) => getGameStartUTC(game) >= now);

  if (upcomingGames.length === 0) {
    return new NextResponse("No games found", { status: 404 });
  }

  const countryBroadcast = competitionData.broadcast[country as keyof typeof competitionData.broadcast];
  const countryLabel = countryBroadcast?.label ?? country.toUpperCase();
  const calendarLabel =
    teams.length > 0
      ? teams.join(", ")
      : gameIds.length > 0
      ? `${upcomingGames.length} selected game${upcomingGames.length === 1 ? "" : "s"}`
      : "all games";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//MatchCal//WDC 2026//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:WDC 2026 — ${calendarLabel}`,
    `X-WR-TIMEZONE:UTC`,
    `X-WR-CALDESC:FIFA World Cup 2026 matches for ${calendarLabel} — Watch info for ${countryLabel}`,
  ];

  for (const game of upcomingGames) {
    const start = getGameStartUTC(game);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
    const title = `⚽ ${getGameTitle(game)}`;
    const venue = game.venue ? getVenue(game.venue) : null;
    const channels = getBroadcastForGame(game, country);

    const channelLine =
      channels.length > 0
        ? `📺 ${channels.map((c) => `${c.name}${c.free ? "" : " (pay)"}`).join(" / ")}`
        : "";

    const g = game as { group?: string; matchday?: number | null };
    const phaseStr =
      game.phase === "group"
        ? `Group ${g.group ?? ""}${g.matchday ? ` — Matchday ${g.matchday}` : ""}`
        : { round_of_32: "Round of 32", round_of_16: "Round of 16", quarter_final: "Quarter-Final", semi_final: "Semi-Final", third_place: "Third Place", final: "Final 🏆" }[game.phase] ?? game.phase;

    const description = [
      phaseStr,
      venue ? `📍 ${venue.name}, ${venue.city}` : "",
      channelLine,
      "",
      "matchcal.live/wdc-2026",
    ]
      .filter(Boolean)
      .join("\n");

    const location = venue ? `${venue.name}, ${venue.city}, ${venue.country}` : "";

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${game.id}@matchcal.live`));
    lines.push(foldLine(`DTSTAMP:${formatDate(new Date())}`));
    lines.push(foldLine(`DTSTART:${formatDate(start)}`));
    lines.push(foldLine(`DTEND:${formatDate(end)}`));
    lines.push(foldLine(`SUMMARY:${escapeIcal(title)}`));
    lines.push(foldLine(`DESCRIPTION:${escapeIcal(description)}`));
    if (location) lines.push(foldLine(`LOCATION:${escapeIcal(location)}`));
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");

  const body = lines.join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="wdc-2026-${teams.length > 0 ? teams.join("-") : "selected"}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
