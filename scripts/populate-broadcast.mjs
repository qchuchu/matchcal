#!/usr/bin/env node
/**
 * One-shot script to populate broadcast data for FR, UK, ES.
 * Also fixes US channel meta keys to match ESPN shortNames (FOX, Tele, FS1).
 *
 * FR: per-game accuracy from Eurosport schedule (M6 free + beIN pay, or beIN only)
 * UK: BBC + ITV for all games (both hold rights, split coverage)
 * ES: RTVE + Cuatro for all games (both hold rights)
 *
 * The sync script (sync-fixtures.mjs) already preserves non-US broadcast data,
 * so running it after this script will NOT overwrite FR/UK/ES.
 *
 * Run once: node scripts/populate-broadcast.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/wdc-2026.json");

const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

// ─── 1. Fix US channel meta keys to match ESPN shortNames ────────────────────
// ESPN returns FOX, Tele, FS1, Peacock — not Fox/Telemundo
data.broadcast.us.channels = {
  FOX:     { name: "Fox Sports",  free: false, url: "https://foxsports.com" },
  Tele:    { name: "Telemundo",   free: false, url: "https://telemundo.com" },
  FS1:     { name: "FS1",         free: false, url: "https://foxsports.com" },
  Peacock: { name: "Peacock",     free: false, url: "https://peacocktv.com" },
};

// Singapore meta (not in the original JSON) — Mediacorp Ch 5 + mewatch + StarHub
data.broadcast.sg = {
  label: "Singapore",
  flag: "🇸🇬",
  channels: {
    Ch5:     { name: "Mediacorp Ch 5", free: true,  url: "https://www.mewatch.sg/fifaworldcup" },
    meWatch: { name: "mewatch",        free: false, url: "https://www.mewatch.sg/fifaworldcup" },
    StarHub: { name: "StarHub",        free: false, url: "https://www.starhub.com" },
  },
};

// Mexico meta (not in the original JSON) — open TV (Televisa/TV Azteca) + ViX streaming
data.broadcast.mx = {
  label: "Mexico",
  flag: "🇲🇽",
  channels: {
    Canal5:  { name: "Canal 5",  free: true,  url: "https://canal5.com" },
    Azteca7: { name: "Azteca 7", free: true,  url: "https://www.aztecadeportes.com" },
    ViX:     { name: "ViX",      free: false, url: "https://www.vix.com" },
    TUDN:    { name: "TUDN",     free: false, url: "https://www.tudn.com" },
  },
};

// ─── 2. FR — per-game data from Eurosport (published 15 Jun 2026) ────────────
// Source: https://www.eurosport.fr/football/coupe-du-monde/2026/...
//
// Rule: 54 games on M6 (free), ALL 104 on beIN Sports (pay)
// Knockouts: M6 gets France's games + best affiches; semis/3rd/final always M6
//
// Games confirmed on M6 from the schedule (group stage, from Jun 15):
const FR_M6 = new Set([
  // Jun 15
  "ESP-CPV", "BEL-EGY",
  // Jun 16
  "KSA-URU", "FRA-SEN",
  // Jun 17
  "IRQ-NOR", "POR-COD", "ENG-CRO",
  // Jun 18
  "CZE-RSA", "SUI-BIH",
  // Jun 19
  "USA-AUS",
  // Jun 20
  "SCO-MAR", "BRA-HAI", "NED-SWE", "GER-CIV",
  // Jun 21
  "ESP-KSA", "BEL-IRN",
  // Jun 22
  "ARG-AUT", "FRA-IRQ",
  // Jun 23
  "POR-UZB", "ENG-GHA",
  // Jun 24
  "SUI-CAN",
  // Jun 25
  "SCO-BRA", "ECU-GER",
  // Jun 26
  "TUN-NED", "NOR-FRA",
  // Jun 27
  "URU-ESP", "PAN-ENG",
  // Jun 28
  "COL-POR",
]);

// ─── SG — the 24 group matches free-to-air on Mediacorp Channel 5 ────────────
// Source: CNA "Where to watch FIFA World Cup 2026" (Mediacorp official).
// 28 free total = these 24 group games + both semis + 3rd place + final.
// Matched as sorted team-code pairs so home/away ordering can't break it.
const sgFreePair = (a, b) => [a, b].sort().join("-");
const SG_FTA_GROUP = new Set([
  sgFreePair("MEX", "RSA"), sgFreePair("KOR", "CZE"), sgFreePair("USA", "PAR"),
  sgFreePair("AUS", "TUR"), sgFreePair("GER", "CUW"), sgFreePair("CIV", "ECU"),
  sgFreePair("BEL", "EGY"), sgFreePair("IRN", "NZL"), sgFreePair("ARG", "ALG"),
  sgFreePair("AUT", "JOR"), sgFreePair("POR", "COD"), sgFreePair("UZB", "COL"),
  sgFreePair("SUI", "BIH"), sgFreePair("CAN", "QAT"), sgFreePair("SCO", "MAR"),
  sgFreePair("BRA", "HAI"), sgFreePair("NED", "SWE"), sgFreePair("TUN", "JPN"),
  sgFreePair("ESP", "KSA"), sgFreePair("URU", "CPV"), sgFreePair("FRA", "IRQ"),
  sgFreePair("NOR", "SEN"), sgFreePair("ENG", "GHA"), sgFreePair("PAN", "CRO"),
]);

// ─── MX — the 17 group matches free-to-air on open TV (Canal 5 / Azteca 7) ───
// Source: TUDN "Calendario Mundial 2026: los partidos que van por TV abierta y por ViX".
// ~32 free total across the tournament; the 17 mappable group games are listed here.
// Knockout free picks are bracket-slot/conditional ("en caso de ser México"), so the
// loop only adds semis + 3rd place + final as free; everything else defaults to ViX.
const mxFreePair = (a, b) => [a, b].sort().join("-");
const MX_FTA_GROUP = new Set([
  mxFreePair("MEX", "RSA"), mxFreePair("USA", "PAR"), mxFreePair("BRA", "MAR"),
  mxFreePair("NED", "JPN"), mxFreePair("ARG", "ALG"), mxFreePair("ENG", "CRO"),
  mxFreePair("MEX", "KOR"), mxFreePair("BRA", "HAI"), mxFreePair("NED", "SWE"),
  mxFreePair("ESP", "KSA"), mxFreePair("NOR", "SEN"), mxFreePair("COL", "COD"),
  mxFreePair("CZE", "MEX"), mxFreePair("ECU", "GER"), mxFreePair("URU", "ESP"),
  mxFreePair("PAN", "ENG"), mxFreePair("COL", "POR"),
]);

// ─── 3. Apply to all games ────────────────────────────────────────────────────
let frM6Count = 0, frBeINCount = 0;
let sgFreeCount = 0;
let mxFreeCount = 0;

for (const game of data.games) {
  if (!game.broadcast) game.broadcast = {};

  const key = `${game.home}-${game.away}`;

  // France
  if (game.phase === "group") {
    if (FR_M6.has(key)) {
      game.broadcast.fr = ["M6", "beIN"];
      frM6Count++;
    } else {
      game.broadcast.fr = ["beIN"];
      frBeINCount++;
    }
  } else if (["semi_final", "third_place", "final"].includes(game.phase)) {
    // Always on M6 (confirmed free-to-air for all semis/3rd/final)
    game.broadcast.fr = ["M6", "beIN"];
    frM6Count++;
  } else {
    // round_of_32, round_of_16, quarter_final: M6 shows France + best, unknown in advance
    game.broadcast.fr = ["beIN"];
    frBeINCount++;
  }

  // United Kingdom — BBC and ITV both hold rights and split coverage
  game.broadcast.uk = ["BBC", "ITV"];

  // Spain — RTVE (La 1) and Cuatro/Mediaset both hold rights
  game.broadcast.es = ["RTVE", "Cuatro"];

  // Germany — ARD and ZDF share free-to-air rights (alternating games, both public)
  game.broadcast.de = ["ARD", "ZDF"];

  // Brazil — TV Globo (free) + SporTV (pay, Globo's sports channel)
  game.broadcast.br = ["Globo", "SporTV"];

  // Argentina — TyC Sports (pay, all games) + TV Pública (free, Argentina games only)
  const argGame = game.home === "ARG" || game.away === "ARG";
  game.broadcast.ar = argGame ? ["TyC", "TV Pública"] : ["TyC"];

  // Portugal — Sport TV (pay, all games) + RTP (free, Portugal games + major knockouts)
  const porGame = game.home === "POR" || game.away === "POR";
  const majorKnockout = ["semi_final", "third_place", "final"].includes(game.phase);
  game.broadcast.pt = (porGame || majorKnockout) ? ["RTP", "Sport TV"] : ["Sport TV"];

  // Singapore — mewatch + StarHub carry all 104 (pay); 28 are also free on Mediacorp Ch 5
  const sgFree =
    SG_FTA_GROUP.has(`${[game.home, game.away].sort().join("-")}`) ||
    ["semi_final", "third_place", "final"].includes(game.phase);
  game.broadcast.sg = sgFree ? ["Ch5", "meWatch", "StarHub"] : ["meWatch", "StarHub"];
  if (sgFree) sgFreeCount++;

  // Mexico — ViX carries all 104 (pay); ~32 are free on open TV (Canal 5 / Azteca 7)
  const mxFree =
    MX_FTA_GROUP.has(`${[game.home, game.away].sort().join("-")}`) ||
    ["semi_final", "third_place", "final"].includes(game.phase);
  game.broadcast.mx = mxFree ? ["Canal5", "Azteca7", "ViX"] : ["ViX"];
  if (mxFree) mxFreeCount++;
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

console.log("✓ Broadcast data written to data/wdc-2026.json");
console.log(`  🇺🇸 US: meta keys fixed (FOX, Tele, FS1, Peacock)`);
console.log(`  🇫🇷 FR: ${frM6Count} games on M6+beIN · ${frBeINCount} games on beIN only`);
console.log(`  🇬🇧 UK: all ${data.games.length} games → BBC + ITV`);
console.log(`  🇪🇸 ES: all ${data.games.length} games → RTVE + Cuatro`);
console.log(`  🇩🇪 DE: all ${data.games.length} games → ARD + ZDF`);
console.log(`  🇧🇷 BR: all ${data.games.length} games → Globo + SporTV`);
const argGames = data.games.filter(g => g.home === "ARG" || g.away === "ARG").length;
console.log(`  🇦🇷 AR: ${argGames} Argentina games → TyC + TV Pública · rest → TyC only`);
const porGames = data.games.filter(g => g.home === "POR" || g.away === "POR" || ["semi_final","third_place","final"].includes(g.phase)).length;
console.log(`  🇵🇹 PT: ${porGames} games → RTP + Sport TV · rest → Sport TV only`);
console.log(`  🇸🇬 SG: ${sgFreeCount} games free on Mediacorp Ch 5 · all 104 → mewatch + StarHub`);
console.log(`  🇲🇽 MX: ${mxFreeCount} games free on Canal 5 / Azteca 7 · all 104 → ViX`);
