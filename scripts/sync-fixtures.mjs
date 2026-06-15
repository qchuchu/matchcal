#!/usr/bin/env node
/**
 * Syncs WDC 2026 fixtures from ESPN's public API into data/wdc-2026.json.
 * No API key required. Run: node scripts/sync-fixtures.mjs
 *
 * ESPN endpoint: site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/wdc-2026.json");

const TOURNAMENT_START = "2026-06-11";
const TOURNAMENT_END   = "2026-07-19";

// --- helpers ----------------------------------------------------------------

function datesInRange(start, end) {
  const dates = [];
  const cur = new Date(start + "T00:00:00Z");
  const last = new Date(end + "T00:00:00Z");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10).replace(/-/g, ""));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

async function fetchDay(yyyymmdd) {
  const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${yyyymmdd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`ESPN ${res.status} for ${yyyymmdd}`);
  const json = await res.json();
  return json.events ?? [];
}

function mapStatus(espnState) {
  if (espnState === "post") return "played";
  if (espnState === "in")   return "live";
  return "upcoming";
}

function phaseFromSlug(slug = "") {
  const s = slug.toLowerCase();
  if (s.includes("group"))        return "group";
  if (s.includes("round-of-32") || s.includes("round of 32")) return "round_of_32";
  if (s.includes("round-of-16") || s.includes("round of 16")) return "round_of_16";
  if (s.includes("quarter"))      return "quarter_final";
  if (s.includes("semi"))         return "semi_final";
  if (s.includes("third") || s.includes("3rd")) return "third_place";
  if (s.includes("final"))        return "final";
  return "group";
}

function groupFromNote(note = "") {
  const m = note.match(/Group\s+([A-Z])/i);
  return m ? m[1].toUpperCase() : null;
}

function matchdayFromNote(note = "") {
  const m = note.match(/Matchday\s+(\d+)/i);
  return m ? parseInt(m[1]) : null;
}

const CITY_TO_VENUE = {
  "East Rutherford": "metlife",
  "Inglewood":       "sofi",
  "Arlington":       "att",
  "Santa Clara":     "levis",
  "Seattle":         "centurylink",
  "Foxborough":      "gillette",
  "Miami Gardens":   "hardrock",
  "Philadelphia":    "lincoln",
  "Kansas City":     "arrowhead",
  "Atlanta":         "mercedes",
  "Toronto":         "bmo",
  "Vancouver":       "bcplace",
  "Mexico City":     "azteca",
  "Guadalajara":     "akron",
  "Monterrey":       "bbva",
};

function venueKey(city = "") {
  for (const [k, v] of Object.entries(CITY_TO_VENUE)) {
    if (city.includes(k)) return v;
  }
  return null;
}

// ESPN geoBroadcasts → { us: ["FOX", "Telemundo"] }
function extractBroadcast(geoBroadcasts = []) {
  const broadcast = {};
  for (const gb of geoBroadcasts) {
    if (gb.type?.shortName !== "TV") continue;
    const region = gb.region ?? "us";
    const name = gb.media?.shortName;
    if (!name) continue;
    if (!broadcast[region]) broadcast[region] = [];
    if (!broadcast[region].includes(name)) broadcast[region].push(name);
  }
  return broadcast;
}

// --- load existing data (preserve hand-curated broadcast fields) ------------

const existing = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

// Keyed by ESPN event id → preserve any broadcast we've added for other regions
const existingById = {};
for (const g of existing.games) {
  if (g.espnId) existingById[g.espnId] = g;
}

// --- fetch all days ---------------------------------------------------------

const dates = datesInRange(TOURNAMENT_START, TOURNAMENT_END);
console.log(`Fetching ${dates.length} days from ESPN…`);

const allEvents = [];
for (const d of dates) {
  const events = await fetchDay(d);
  if (events.length) {
    process.stdout.write(`  ${d}: ${events.length} event(s)\n`);
    allEvents.push(...events);
  }
}

console.log(`Total: ${allEvents.length} fixtures`);

// --- map to our format ------------------------------------------------------

const games = allEvents.map((event, i) => {
  const comp   = event.competitions?.[0] ?? {};
  const status = mapStatus(comp.status?.type?.state ?? "pre");
  const slug   = event.season?.slug ?? "";
  const note   = comp.altGameNote ?? comp.notes?.[0]?.headline ?? "";
  const phase  = phaseFromSlug(slug);
  const group  = groupFromNote(note);
  const matchday = matchdayFromNote(note);

  const home = comp.competitors?.find((c) => c.homeAway === "home");
  const away = comp.competitors?.find((c) => c.homeAway === "away");
  const homeCode = home?.team?.abbreviation ?? home?.team?.displayName?.slice(0, 3).toUpperCase() ?? "TBD";
  const awayCode = away?.team?.abbreviation ?? away?.team?.displayName?.slice(0, 3).toUpperCase() ?? "TBD";

  const dt = new Date(event.date);
  const date = dt.toISOString().slice(0, 10);
  const utcH = dt.getUTCHours().toString().padStart(2, "0");
  const utcM = dt.getUTCMinutes().toString().padStart(2, "0");

  const city = comp.venue?.address?.city ?? "";
  const venue = venueKey(city);

  const espnBroadcast = extractBroadcast(comp.geoBroadcasts ?? []);
  const prev = existingById[event.id];
  // Merge: ESPN gives us live `us` data; preserve hand-curated other regions
  const broadcast = {
    ...(prev?.broadcast ?? {}),
    ...espnBroadcast,
  };

  const score =
    status === "played" || status === "live"
      ? {
          home: parseInt(home?.score ?? "0"),
          away: parseInt(away?.score ?? "0"),
        }
      : null;

  const id = phase === "group"
    ? `gs-${String(i + 1).padStart(3, "0")}`
    : `${phase.replace(/_/g, "-")}-${String(i + 1).padStart(2, "0")}`;

  return {
    id,
    espnId: event.id,
    phase,
    ...(group     ? { group }     : {}),
    ...(matchday  ? { matchday }  : {}),
    date,
    time: `${utcH}:${utcM}`,
    timezone: "UTC",
    home: homeCode,
    away: awayCode,
    homeTeam: home?.team?.displayName ?? homeCode,
    awayTeam: away?.team?.displayName ?? awayCode,
    ...(venue ? { venue } : {}),
    venueCity: city,
    broadcast,
    status,
    score,
  };
});

// Sort by date/time
games.sort((a, b) => (`${a.date}T${a.time}` < `${b.date}T${b.time}` ? -1 : 1));

const updated = { ...existing, games };
writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));

const played  = games.filter((g) => g.status === "played").length;
const live    = games.filter((g) => g.status === "live").length;
const upcoming = games.filter((g) => g.status === "upcoming").length;
console.log(`\n✓ Wrote ${games.length} games to data/wdc-2026.json`);
console.log(`  ${played} played · ${live} live · ${upcoming} upcoming`);
