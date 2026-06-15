import data from "@/data/wdc-2026.json";

export type Game = (typeof data.games)[number];
export type BroadcastCountry = keyof typeof data.broadcast;
export type TeamCode = keyof typeof data.teams;

export function getGamesForTeams(teamCodes: string[]): Game[] {
  const codes = teamCodes.map((c) => c.toUpperCase());
  return data.games.filter(
    (g) => codes.includes(g.home) || codes.includes(g.away)
  );
}

export function getTeamLabel(code: string): string {
  const team = data.teams[code as TeamCode];
  if (team) return `${team.flag} ${team.name}`;
  return code;
}

export function getVenue(id: string) {
  return data.venues[id as keyof typeof data.venues] ?? null;
}

export function getBroadcastForGame(
  game: Game,
  country: string
): { name: string; free: boolean; url: string }[] {
  const countryData = data.broadcast[country as BroadcastCountry];
  if (!countryData) return [];

  const channelKeys =
    (game.broadcast as Record<string, string[]>)[country] ?? [];
  return channelKeys
    .map((key) => countryData.channels[key as keyof typeof countryData.channels])
    .filter(Boolean) as { name: string; free: boolean; url: string }[];
}

export function getGameTitle(game: Game): string {
  const homeDisplay =
    (game as { homeTeam?: string }).homeTeam ?? getTeamLabel(game.home);
  const awayDisplay =
    (game as { awayTeam?: string }).awayTeam ?? getTeamLabel(game.away);
  return `${homeDisplay} vs ${awayDisplay}`;
}

// All times stored as UTC since ESPN sync
export function getGameStartUTC(game: Game): Date {
  return new Date(`${game.date}T${game.time}:00Z`);
}

export const allTeams = Object.entries(data.teams).map(([code, team]) => ({
  code,
  ...team,
}));

export const allCountries = Object.entries(data.broadcast).map(
  ([code, country]) => ({ code, ...country })
);

export { data as competitionData };
