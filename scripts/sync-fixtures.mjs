#!/usr/bin/env node
/**
 * Syncs WDC 2026 fixtures from api-football.com into data/wdc-2026.json.
 * Usage: API_FOOTBALL_KEY=xxx node scripts/sync-fixtures.mjs
 *
 * api-football docs: https://www.api-football.com/documentation-v3
 * WC 2026: league=1, season=2026
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/wdc-2026.json");

const API_KEY = process.env.API_FOOTBALL_KEY;
if (!API_KEY) {
  console.error("Missing API_FOOTBALL_KEY environment variable");
  process.exit(1);
}

const LEAGUE_ID = 1;   // FIFA World Cup
const SEASON = 2026;

async function apiFetch(path, retries = 3) {
  const res = await fetch(`https://v3.football.api-sports.io${path}`, {
    headers: { "x-apisports-key": API_KEY },
  });

  const dailyRemaining = parseInt(res.headers.get("x-ratelimit-requests-remaining") ?? "");
  const dailyLimit = parseInt(res.headers.get("x-ratelimit-requests-limit") ?? "");
  if (!isNaN(dailyLimit)) {
    console.log(`  quota: ${dailyRemaining}/${dailyLimit} daily requests remaining`);
    if (dailyRemaining === 0) {
      console.warn("⚠️  Daily quota exhausted — keeping existing data unchanged.");
      process.exit(0);
    }
  }

  if (res.status === 429) {
    if (retries === 0) throw new Error("Rate limited after retries");
    const retryAfter = parseInt(res.headers.get("retry-after") ?? "60");
    console.log(`  429 — retrying in ${retryAfter}s (${retries} left)`);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return apiFetch(path, retries - 1);
  }

  if (!res.ok) throw new Error(`api-football ${res.status}: ${await res.text()}`);

  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`api-football error: ${JSON.stringify(json.errors)}`);
  }
  return json.response;
}

// Map api-football status to our status
function mapStatus(apiStatus) {
  const finished = ["FT", "AET", "PEN"];
  const live = ["1H", "HT", "2H", "ET", "P", "LIVE"];
  if (finished.includes(apiStatus)) return "played";
  if (live.includes(apiStatus)) return "live";
  return "upcoming";
}

// Map api-football venue id to our venue key (best effort by city name)
const CITY_TO_VENUE = {
  "East Rutherford": "metlife",
  "Inglewood": "sofi",
  "Arlington": "att",
  "Santa Clara": "levis",
  "Seattle": "centurylink",
  "Foxborough": "gillette",
  "Miami Gardens": "hardrock",
  "Philadelphia": "lincoln",
  "Kansas City": "arrowhead",
  "Atlanta": "mercedes",
  "Toronto": "bmo",
  "Vancouver": "bcplace",
  "Mexico City": "azteca",
  "Guadalajara": "akron",
  "Monterrey": "bbva",
};

function venueKey(fixture) {
  const city = fixture.fixture?.venue?.city ?? "";
  for (const [k, v] of Object.entries(CITY_TO_VENUE)) {
    if (city.includes(k)) return v;
  }
  return "metlife"; // fallback
}

// Map api-football team code (3-letter) to our team codes
// api-football uses its own IDs; we map by name
function normalizeTeamCode(name) {
  const MAP = {
    "United States": "USA",
    "Uruguay": "URU",
    "Panama": "PAN",
    "Bolivia": "BOL",
    "Mexico": "MEX",
    "Ecuador": "ECU",
    "Venezuela": "VEN",
    "New Zealand": "NZL",
    "Canada": "CAN",
    "Morocco": "MAR",
    "Portugal": "POR",
    "Argentina": "ARG",
    "Chile": "CHI",
    "Peru": "PER",
    "France": "FRA",
    "Colombia": "COL",
    "Switzerland": "SUI",
    "Cameroon": "CMR",
    "England": "ENG",
    "Australia": "AUS",
    "Serbia": "SRB",
    "Tunisia": "TUN",
    "Brazil": "BRA",
    "Paraguay": "PAR",
    "Costa Rica": "CRC",
    "Nigeria": "NGA",
    "Germany": "GER",
    "Japan": "JPN",
    "Croatia": "CRO",
    "South Korea": "KOR",
    "Senegal": "SEN",
    "Austria": "AUT",
    "Spain": "ESP",
    "Ghana": "GHA",
    "Turkey": "TUR",
    "South Africa": "RSA",
    "Netherlands": "NED",
    "Poland": "POL",
    "Algeria": "ALG",
    "Belgium": "BEL",
    "Iran": "IRN",
    "Qatar": "QAT",
    "Angola": "ANG",
  };
  return MAP[name] ?? name.slice(0, 3).toUpperCase();
}

function phaseFromRound(round) {
  if (!round) return "group";
  const r = round.toLowerCase();
  if (r.includes("group")) return "group";
  if (r.includes("32")) return "round_of_32";
  if (r.includes("16")) return "round_of_16";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("3rd") || r.includes("third")) return "third_place";
  if (r.includes("final")) return "final";
  return "group";
}

function groupFromRound(round) {
  if (!round) return null;
  const m = round.match(/Group\s+([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

function matchdayFromRound(round) {
  if (!round) return null;
  const m = round.match(/Matchday\s+(\d)/i) ?? round.match(/(\d)/);
  return m ? parseInt(m[1]) : null;
}

// Load existing broadcast data (we keep it as-is, only updating fixture fields)
const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

// Build a lookup of existing game broadcast data by a fuzzy key
const broadcastByTeams = {};
for (const g of existing.games) {
  const key = [g.home, g.away].sort().join("-");
  broadcastByTeams[key] = g.broadcast ?? {};
}

console.log("Fetching fixtures from api-football.com…");
const fixtures = await apiFetch(`/fixtures?league=${LEAGUE_ID}&season=${SEASON}`);
console.log(`  → ${fixtures.length} fixtures returned`);

if (fixtures.length === 0) {
  console.log("No fixtures found. The season may not be indexed yet on api-football.");
  console.log("Keeping existing data unchanged.");
  process.exit(0);
}

const games = fixtures.map((f, i) => {
  const round = f.league?.round ?? "";
  const phase = phaseFromRound(round);
  const group = groupFromRound(round);
  const matchday = groupFromRound(round) ? matchdayFromRound(round) : null;

  const homeCode = normalizeTeamCode(f.teams?.home?.name ?? "");
  const awayCode = normalizeTeamCode(f.teams?.away?.name ?? "");
  const key = [homeCode, awayCode].sort().join("-");

  const dt = new Date(f.fixture.date);
  const date = dt.toISOString().slice(0, 10);
  // Store time in ET (UTC-4 summer)
  const etHours = ((dt.getUTCHours() - 4 + 24) % 24).toString().padStart(2, "0");
  const etMinutes = dt.getUTCMinutes().toString().padStart(2, "0");
  const time = `${etHours}:${etMinutes}`;

  const status = mapStatus(f.fixture?.status?.short ?? "NS");
  const score =
    status === "played"
      ? { home: f.goals?.home ?? 0, away: f.goals?.away ?? 0 }
      : null;

  const id =
    phase === "group"
      ? `gs-${String(i + 1).padStart(3, "0")}`
      : `${phase.replace(/_/g, "-")}-${String(i + 1).padStart(2, "0")}`;

  return {
    id,
    phase,
    ...(group ? { group } : {}),
    matchday,
    date,
    time,
    timezone: "America/New_York",
    home: homeCode,
    away: awayCode,
    venue: venueKey(f),
    broadcast: broadcastByTeams[key] ?? existing.games[0]?.broadcast ?? {},
    status,
    score,
  };
});

// Sort by date then time
games.sort((a, b) => {
  const da = `${a.date}T${a.time}`;
  const db = `${b.date}T${b.time}`;
  return da < db ? -1 : da > db ? 1 : 0;
});

const updated = { ...existing, games };
writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));

const played = games.filter((g) => g.status === "played").length;
const upcoming = games.filter((g) => g.status === "upcoming").length;
console.log(`✓ Wrote ${games.length} games to data/wdc-2026.json`);
console.log(`  ${played} played · ${upcoming} upcoming`);
