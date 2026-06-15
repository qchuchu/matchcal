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

// ─── 3. Apply to all games ────────────────────────────────────────────────────
let frM6Count = 0, frBeINCount = 0;

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
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

console.log("✓ Broadcast data written to data/wdc-2026.json");
console.log(`  🇺🇸 US: meta keys fixed (FOX, Tele, FS1, Peacock)`);
console.log(`  🇫🇷 FR: ${frM6Count} games on M6+beIN · ${frBeINCount} games on beIN only`);
console.log(`  🇬🇧 UK: all ${data.games.length} games → BBC + ITV`);
console.log(`  🇪🇸 ES: all ${data.games.length} games → RTVE + Cuatro`);
