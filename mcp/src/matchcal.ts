import data from "./data/wdc-2026.json" with { type: "json" };

export const SUPPORTED_COMPETITION = "wdc-2026";
export const MATCHCAL_SITE_URL = "https://matchcal.live";
export const MATCHCAL_ICAL_URL = `${MATCHCAL_SITE_URL}/api/ical`;
export const GOOGLE_CAL_BASE = "https://calendar.google.com/calendar/r?cid=";

type CompetitionData = typeof data;
type Game = CompetitionData["games"][number];
type TeamCode = keyof CompetitionData["teams"];
type BroadcastCountry = keyof CompetitionData["broadcast"];

type UserLocation = {
  city?: string;
  region?: string;
  country?: string;
  timezone?: string;
  longitude?: number;
  latitude?: number;
};

type BroadcastSource = {
  name: string;
  free: boolean;
  url: string;
};

export type CalendarInput = {
  competition?: string;
  teams?: string[];
  country?: string;
};

export type CalendarGame = {
  id: string;
  title: string;
  phase: string;
  group?: string;
  matchday?: number | null;
  kickoffUtc: string;
  localTimeLabel: string;
  home: TeamDisplay;
  away: TeamDisplay;
  venue: {
    name: string;
    city: string;
    country: string;
  } | null;
  broadcasts: BroadcastChannel[];
};

export type TeamDisplay = {
  code: string;
  name: string;
  flag: string;
  group?: string;
};

export type BroadcastChannel = {
  name: string;
  free: boolean;
  url: string;
  logoUrl: string | null;
};

export type CountryDisplay = {
  code: string;
  label: string;
  flag: string;
};

export const COUNTRY_TO_TEAM: Record<string, string> = {
  DZ: "ALG",
  AR: "ARG",
  AU: "AUS",
  AT: "AUT",
  BE: "BEL",
  BA: "BIH",
  BR: "BRA",
  CA: "CAN",
  CV: "CPV",
  CO: "COL",
  CD: "COD",
  HR: "CRO",
  CW: "CUW",
  CZ: "CZE",
  EC: "ECU",
  EG: "EGY",
  GB: "ENG",
  FR: "FRA",
  DE: "GER",
  GH: "GHA",
  HT: "HAI",
  IR: "IRN",
  IQ: "IRQ",
  CI: "CIV",
  JP: "JPN",
  JO: "JOR",
  MX: "MEX",
  MA: "MAR",
  NL: "NED",
  NZ: "NZL",
  NO: "NOR",
  PA: "PAN",
  PY: "PAR",
  PT: "POR",
  QA: "QAT",
  SA: "KSA",
  SN: "SEN",
  ZA: "RSA",
  KR: "KOR",
  ES: "ESP",
  SE: "SWE",
  CH: "SUI",
  TN: "TUN",
  TR: "TUR",
  US: "USA",
  UY: "URU",
  UZ: "UZB",
};

export const COUNTRY_TO_BROADCAST: Record<string, string> = {
  FR: "fr",
  GB: "uk",
  US: "us",
  ES: "es",
  DE: "de",
  BR: "br",
  AR: "ar",
  PT: "pt",
  SG: "sg",
  MX: "mx",
  DZ: "dz",
  AU: "au",
  AT: "at",
  BE: "be",
  BA: "ba",
  CA: "ca",
  CV: "cv",
  CO: "co",
  CD: "cd",
  HR: "hr",
  CW: "cw",
  CZ: "cz",
  EC: "ec",
  EG: "eg",
  GH: "gh",
  HT: "ht",
  IR: "ir",
  IQ: "iq",
  CI: "ci",
  JP: "jp",
  JO: "jo",
  MA: "ma",
  NL: "nl",
  NZ: "nz",
  NO: "no",
  PA: "pa",
  PY: "py",
  QA: "qa",
  SA: "sa",
  SN: "sn",
  ZA: "za",
  KR: "kr",
  SE: "se",
  CH: "ch",
  TN: "tn",
  TR: "tr",
  UY: "uy",
  UZ: "uz",
};

const DEFAULT_COUNTRY: BroadcastCountry = "us";
const DEFAULT_TIMEZONE = "UTC";
const BROADCAST_COUNTRY_TO_TIMEZONE: Record<string, string> = {
  ar: "America/Argentina/Buenos_Aires",
  at: "Europe/Vienna",
  au: "Australia/Sydney",
  ba: "Europe/Sarajevo",
  be: "Europe/Brussels",
  br: "America/Sao_Paulo",
  ca: "America/Toronto",
  cd: "Africa/Kinshasa",
  ch: "Europe/Zurich",
  ci: "Africa/Abidjan",
  co: "America/Bogota",
  cv: "Atlantic/Cape_Verde",
  cw: "America/Curacao",
  cz: "Europe/Prague",
  de: "Europe/Berlin",
  dz: "Africa/Algiers",
  ec: "America/Guayaquil",
  eg: "Africa/Cairo",
  es: "Europe/Madrid",
  fr: "Europe/Paris",
  gh: "Africa/Accra",
  hr: "Europe/Zagreb",
  ht: "America/Port-au-Prince",
  iq: "Asia/Baghdad",
  ir: "Asia/Tehran",
  jp: "Asia/Tokyo",
  jo: "Asia/Amman",
  kr: "Asia/Seoul",
  ma: "Africa/Casablanca",
  mx: "America/Mexico_City",
  nl: "Europe/Amsterdam",
  no: "Europe/Oslo",
  nz: "Pacific/Auckland",
  pa: "America/Panama",
  pt: "Europe/Lisbon",
  py: "America/Asuncion",
  qa: "Asia/Qatar",
  sa: "Asia/Riyadh",
  se: "Europe/Stockholm",
  sg: "Asia/Singapore",
  sn: "Africa/Dakar",
  tn: "Africa/Tunis",
  tr: "Europe/Istanbul",
  uk: "Europe/London",
  us: "America/New_York",
  uy: "America/Montevideo",
  uz: "Asia/Tashkent",
  za: "Africa/Johannesburg",
};

export function buildCalendarData(
  input: CalendarInput,
  location: UserLocation | undefined,
  locale: string | undefined,
) {
  const requestedCompetition = input.competition?.trim() || SUPPORTED_COMPETITION;
  const unsupportedCompetition =
    requestedCompetition !== SUPPORTED_COMPETITION ? requestedCompetition : null;
  const countryIso = location?.country?.toUpperCase();
  const country = resolveBroadcastCountry(input.country, countryIso);
  const timezone = resolveTimezone(location?.timezone, country.code);
  const requestedTeams = normalizeTeams(input.teams);
  const inferredTeam = countryIso ? COUNTRY_TO_TEAM[countryIso] : undefined;
  const teamCodes = requestedTeams.length > 0 ? requestedTeams : inferredTeam ? [inferredTeam] : [];
  const games = getGamesForTeams(teamCodes)
    .filter((game) => getGameStartUTC(game) >= new Date())
    .map((game) => toCalendarGame(game, country.code, timezone, locale));

  return {
    structuredContent: {
      competition: {
        id: data.competition.id,
        name: data.competition.name,
        shortName: data.competition.shortName,
      },
      supportedCompetition: SUPPORTED_COMPETITION,
      unsupportedCompetition,
      teams: teamCodes.map((code) => getTeamDisplay(code)),
      country,
      timezone,
      locale: locale ?? "en-US",
      locationLabel: formatLocation(location),
      calendarApiUrl: MATCHCAL_ICAL_URL,
      games,
    },
    responseMetadata: {
      allTeams: getAllTeams(),
      allCountries: getAllCountries(),
      googleCalendarBase: GOOGLE_CAL_BASE,
      matchcalUrl: `${MATCHCAL_SITE_URL}/wdc-2026`,
    },
  };
}

function getGamesForTeams(teamCodes: string[]) {
  if (teamCodes.length === 0) {
    return [...data.games].sort(byKickoff);
  }

  const codeSet = new Set(teamCodes.map((code) => code.toUpperCase()));
  return data.games
    .filter((game) => codeSet.has(game.home) || codeSet.has(game.away))
    .sort(byKickoff);
}

function byKickoff(a: Game, b: Game) {
  return getGameStartUTC(a).getTime() - getGameStartUTC(b).getTime();
}

function normalizeTeams(teams: string[] | undefined) {
  if (!teams) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const raw of teams) {
    const code = raw.trim().toUpperCase();
    if (!code || seen.has(code) || !(code in data.teams)) continue;
    seen.add(code);
    normalized.push(code);
  }
  return normalized;
}

function resolveBroadcastCountry(value: string | undefined, countryIso: string | undefined): CountryDisplay {
  const explicit = value?.trim();
  const fromExplicit = explicit
    ? findBroadcastCountry(explicit) ?? COUNTRY_TO_BROADCAST[explicit.toUpperCase()]
    : undefined;
  const code = (fromExplicit ?? (countryIso ? COUNTRY_TO_BROADCAST[countryIso] : undefined) ?? DEFAULT_COUNTRY) as BroadcastCountry;
  const country = data.broadcast[code] ?? data.broadcast[DEFAULT_COUNTRY];
  return { code, label: country.label, flag: country.flag };
}

function findBroadcastCountry(value: string) {
  const normalized = value.toLowerCase();
  if (normalized in data.broadcast) return normalized;

  const match = Object.entries(data.broadcast).find(([, country]) => {
    return country.label.toLowerCase() === normalized;
  });
  return match?.[0];
}

function resolveTimezone(timezone: string | undefined, country: string) {
  const fallback = BROADCAST_COUNTRY_TO_TIMEZONE[country] ?? DEFAULT_TIMEZONE;
  if (!timezone) return fallback;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return timezone;
  } catch {
    return fallback;
  }
}

function toCalendarGame(
  game: Game,
  country: string,
  timezone: string,
  locale: string | undefined,
): CalendarGame {
  return {
    id: game.id,
    title: getGameTitle(game),
    phase: getPhaseLabel(game),
    group: "group" in game ? game.group : undefined,
    matchday: (game as { matchday?: number | null }).matchday,
    kickoffUtc: getGameStartUTC(game).toISOString(),
    localTimeLabel: formatLocalTime(getGameStartUTC(game), timezone, locale),
    home: getTeamDisplay(game.home, (game as { homeTeam?: string }).homeTeam),
    away: getTeamDisplay(game.away, (game as { awayTeam?: string }).awayTeam),
    venue: getVenue(game.venue),
    broadcasts: getBroadcastForGame(game, country),
  };
}

function getGameStartUTC(game: Game) {
  return new Date(`${game.date}T${game.time}:00Z`);
}

function getTeamDisplay(code: string, fallbackName?: string): TeamDisplay {
  const team = data.teams[code as TeamCode];
  if (!team) {
    return { code, name: fallbackName ?? code, flag: "", group: undefined };
  }

  return {
    code,
    name: fallbackName ?? team.name,
    flag: team.flag,
    group: team.group,
  };
}

function getGameTitle(game: Game) {
  const home = getTeamDisplay(game.home, (game as { homeTeam?: string }).homeTeam);
  const away = getTeamDisplay(game.away, (game as { awayTeam?: string }).awayTeam);
  return `${home.name} vs ${away.name}`;
}

function getVenue(id: string | undefined) {
  if (!id) return null;
  const venue = data.venues[id as keyof typeof data.venues];
  if (!venue) return null;
  return {
    name: venue.name,
    city: venue.city,
    country: venue.country,
  };
}

function getBroadcastForGame(game: Game, country: string): BroadcastChannel[] {
  const countryData = data.broadcast[country as BroadcastCountry];
  if (!countryData) return [];

  const channelKeys = (game.broadcast as Record<string, string[]>)[country] ?? [];
  const channels = countryData.channels as Record<string, BroadcastSource>;
  return channelKeys
    .map((key) => channels[key])
    .filter((channel): channel is BroadcastSource => Boolean(channel))
    .map((channel) => ({
      ...channel,
      logoUrl: getFaviconUrl(channel.url),
    }));
}

function getFaviconUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`;
  } catch {
    return null;
  }
}

function getPhaseLabel(game: Game) {
  if (game.phase === "group") {
    const group = "group" in game ? game.group : "";
    const matchday = "matchday" in game && game.matchday ? `, matchday ${game.matchday}` : "";
    return `Group ${group}${matchday}`;
  }

  const labels: Record<string, string> = {
    round_of_32: "Round of 32",
    round_of_16: "Round of 16",
    quarter_final: "Quarter-final",
    semi_final: "Semi-final",
    third_place: "Third place",
    final: "Final",
  };

  return labels[game.phase] ?? game.phase;
}

function formatLocalTime(date: Date, timezone: string, locale: string | undefined) {
  return new Intl.DateTimeFormat(locale ?? "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
    timeZoneName: "short",
  }).format(date);
}

function formatLocation(location: UserLocation | undefined) {
  if (!location) return null;
  return [location.city, location.region, location.country].filter(Boolean).join(", ") || null;
}

export function getAllTeams(): TeamDisplay[] {
  return Object.entries(data.teams)
    .map(([code, team]) => ({ code, name: team.name, flag: team.flag, group: team.group }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getAllCountries(): CountryDisplay[] {
  return Object.entries(data.broadcast)
    .map(([code, country]) => ({ code, label: country.label, flag: country.flag }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
