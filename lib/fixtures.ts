import data from "@/data/wdc-2026.json";

export type Game = (typeof data.games)[number];
export type BroadcastCountry = keyof typeof data.broadcast;
export type TeamCode = keyof typeof data.teams;

export function getGamesForTeams(
  teamCodes: string[],
  country?: string
): Game[] {
  const codes = teamCodes.map((c) => c.toUpperCase());
  return data.games.filter(
    (g) => codes.includes(g.home) || codes.includes(g.away)
  );
}

export function getTeamLabel(code: string): string {
  const team = data.teams[code as TeamCode];
  return team ? `${team.flag} ${team.name}` : code;
}

export function getVenue(id: string) {
  return data.venues[id as keyof typeof data.venues];
}

export function getBroadcastForGame(
  game: Game,
  country: string
): { name: string; free: boolean; url: string }[] {
  const countryData = data.broadcast[country as BroadcastCountry];
  if (!countryData) return [];

  const channelKeys =
    game.broadcast[country as keyof typeof game.broadcast] ?? [];
  return channelKeys
    .map(
      (key) =>
        countryData.channels[key as keyof typeof countryData.channels]
    )
    .filter(Boolean);
}

export function getGameTitle(game: Game): string {
  const homeLabel =
    game.home === "TBD" && "homeLabel" in game && game.homeLabel
      ? (game.homeLabel as string)
      : getTeamLabel(game.home);
  const awayLabel =
    game.away === "TBD" && "awayLabel" in game && game.awayLabel
      ? (game.awayLabel as string)
      : getTeamLabel(game.away);
  return `${homeLabel} vs ${awayLabel}`;
}

export function getGameDateUTC(game: Game): Date {
  const [hours, minutes] = game.time.split(":").map(Number);
  // Build datetime string and parse as local timezone
  // We store offsets per timezone for correctness
  const tzOffsets: Record<string, number> = {
    "America/New_York": -4, // EDT (summer)
    "America/Chicago": -5,  // CDT (summer)
    "America/Los_Angeles": -7, // PDT (summer)
    "America/Denver": -6,   // MDT (summer)
    "America/Toronto": -4,
    "America/Vancouver": -7,
    "America/Mexico_City": -5,
  };
  const offset = tzOffsets[game.timezone] ?? -4;
  const localMs = new Date(`${game.date}T${game.time}:00`).getTime();
  return new Date(localMs - offset * 3600 * 1000);
}

export const allTeams = Object.entries(data.teams).map(([code, team]) => ({
  code,
  ...team,
}));

export const allCountries = Object.entries(data.broadcast).map(
  ([code, country]) => ({ code, ...country })
);

export { data as competitionData };
