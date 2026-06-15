import { NextRequest, NextResponse } from "next/server";
import {
  getGamesForTeams,
  getBroadcastForGame,
  getGameTitle,
  getGameDateUTC,
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
  const country = searchParams.get("country") ?? "fr";

  const teams = teamsParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  if (teams.length === 0) {
    return new NextResponse("Missing teams parameter", { status: 400 });
  }

  const games = getGamesForTeams(teams, country);
  const countryBroadcast = competitionData.broadcast[country as keyof typeof competitionData.broadcast];
  const countryLabel = countryBroadcast?.label ?? country.toUpperCase();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//MatchCal//WDC 2026//EN`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:WDC 2026 — ${teams.join(", ")}`,
    `X-WR-TIMEZONE:UTC`,
    `X-WR-CALDESC:FIFA World Cup 2026 matches for ${teams.join(", ")} — Watch info for ${countryLabel}`,
  ];

  for (const game of games) {
    const start = getGameDateUTC(game);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h
    const title = `⚽ ${getGameTitle(game)}`;
    const venue = getVenue(game.venue);
    const channels = getBroadcastForGame(game, country);

    const channelLine =
      channels.length > 0
        ? `📺 ${channels.map((c) => `${c.name}${c.free ? "" : " (pay)"}`).join(" / ")}`
        : "";

    const phaseLabel: Record<string, string> = {
      group: `Group ${(game as { group?: string }).group ?? ""} — Matchday ${(game as { matchday?: number | null }).matchday ?? ""}`,
      round_of_32: "Round of 32",
      round_of_16: "Round of 16",
      quarter_final: "Quarter-Final",
      semi_final: "Semi-Final",
      third_place: "Third Place",
      final: "Final 🏆",
    };

    const description = [
      phaseLabel[game.phase] ?? game.phase,
      venue ? `📍 ${venue.name}, ${venue.city}` : "",
      channelLine,
      "",
      "matchcal.live/wdc-2026",
    ]
      .filter((l) => l !== undefined)
      .join("\\n");

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
      "Content-Disposition": `attachment; filename="wdc-2026-${teams.join("-")}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
