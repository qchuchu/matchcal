#!/usr/bin/env node
/**
 * One-shot script to populate broadcast data for every World Cup 2026 nation.
 *
 * Source of broadcasters: Wikipedia "2026 FIFA World Cup broadcasting rights"
 * (per-territory rights holders), cross-checked against official broadcaster
 * schedules for the countries where coverage is split free vs pay per game.
 *
 * Precision model:
 *   - FR, SG, MX: per-game free/pay split sourced from the official broadcaster
 *     schedules (Eurosport / CNA-Mediacorp / TUDN). A free channel shows a
 *     subset, a pay platform shows all 104.
 *   - AR, PT: free national channel for that nation's games + the late knockouts,
 *     pay platform for the rest.
 *   - US: per-game channels come from the ESPN sync (FOX/Tele/FS1); not touched here.
 *   - All other nations: one or more rights holders carry all 104 games, so the
 *     same channels apply to every game (uniform, but still accurate).
 *
 * The GitHub-action sync (sync-fixtures.mjs) preserves every non-US region,
 * so running it after this script will NOT overwrite any of this.
 *
 * Run once: node scripts/populate-broadcast.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, "../data/wdc-2026.json");
const data = JSON.parse(readFileSync(DATA_PATH, "utf-8"));

const c = (name, free, url = "") => ({ name, free, url });

// ─── Broadcast meta: every territory of a participating nation ───────────────
// free: true  = free-to-air   |   free: false = pay TV / subscription
const META = {
  // --- already had precise / curated data ---
  fr: { label: "France", flag: "🇫🇷", channels: {
    M6: c("M6", true, "https://m6.fr"), beIN: c("beIN Sports", false, "https://beinsports.com") } },
  uk: { label: "United Kingdom", flag: "🇬🇧", channels: {
    BBC: c("BBC", true, "https://bbc.co.uk/sport"), ITV: c("ITV / STV", true, "https://itv.com") } },
  us: { label: "United States", flag: "🇺🇸", channels: {
    FOX: c("Fox Sports", false, "https://foxsports.com"), Tele: c("Telemundo", false, "https://telemundo.com"),
    FS1: c("FS1", false, "https://foxsports.com"), Peacock: c("Peacock", false, "https://peacocktv.com") } },
  es: { label: "Spain", flag: "🇪🇸", channels: {
    RTVE: c("RTVE", true, "https://rtve.es"), DAZN: c("DAZN", false, "https://dazn.com") } },
  de: { label: "Germany", flag: "🇩🇪", channels: {
    ARD: c("ARD", true, "https://ard.de"), ZDF: c("ZDF", true, "https://zdf.de"),
    Magenta: c("Magenta Sport", false, "https://magentasport.de") } },
  br: { label: "Brazil", flag: "🇧🇷", channels: {
    Globo: c("TV Globo", true, "https://globo.com"), CazeTV: c("CazéTV", true, "https://youtube.com"),
    SporTV: c("SporTV", false, "https://sportv.globo.com") } },
  ar: { label: "Argentina", flag: "🇦🇷", channels: {
    Telefe: c("Telefe", true, "https://telefe.com"), TVPublica: c("TV Pública", true, "https://tvpublica.com.ar"),
    TyC: c("TyC Sports", false, "https://tycsports.com") } },
  pt: { label: "Portugal", flag: "🇵🇹", channels: {
    RTP: c("RTP", true, "https://rtp.pt"), SportTV: c("Sport TV", false, "https://sporttv.pt") } },
  sg: { label: "Singapore", flag: "🇸🇬", channels: {
    Ch5: c("Mediacorp Ch 5", true, "https://www.mewatch.sg/fifaworldcup"),
    meWatch: c("mewatch", false, "https://www.mewatch.sg/fifaworldcup"),
    StarHub: c("StarHub", false, "https://www.starhub.com") } },
  mx: { label: "Mexico", flag: "🇲🇽", channels: {
    Canal5: c("Canal 5", true, "https://canal5.com"), Azteca7: c("Azteca 7", true, "https://www.aztecadeportes.com"),
    ViX: c("ViX", false, "https://www.vix.com"), TUDN: c("TUDN", false, "https://www.tudn.com") } },

  // --- one or more rights holders carry all 104 games (uniform) ---
  dz: { label: "Algeria", flag: "🇩🇿", channels: { ENTV: c("ENTV", true, "https://entv.dz") } },
  au: { label: "Australia", flag: "🇦🇺", channels: { SBS: c("SBS", true, "https://sbs.com.au") } },
  at: { label: "Austria", flag: "🇦🇹", channels: {
    ORF: c("ORF", true, "https://orf.at"), ServusTV: c("ServusTV", true, "https://servustv.com") } },
  be: { label: "Belgium", flag: "🇧🇪", channels: {
    VRT: c("VRT", true, "https://vrt.be"), RTBF: c("RTBF", true, "https://rtbf.be") } },
  ba: { label: "Bosnia-Herzegovina", flag: "🇧🇦", channels: {
    BHRT: c("BHRT", true, "https://bhrt.ba"), Arena: c("Arena Sport", false, "https://arenasport.com") } },
  ca: { label: "Canada", flag: "🇨🇦", channels: {
    CTV: c("CTV", true, "https://ctv.ca"), TSN: c("TSN", false, "https://tsn.ca") } },
  cv: { label: "Cape Verde", flag: "🇨🇻", channels: { RTC: c("RTC", true, "https://rtc.cv") } },
  co: { label: "Colombia", flag: "🇨🇴", channels: {
    Caracol: c("Caracol", true, "https://caracoltv.com"), RCN: c("RCN", true, "https://canalrcn.com"),
    Win: c("Win Sports", false, "https://winsports.co") } },
  cd: { label: "Congo DR", flag: "🇨🇩", channels: { RTNC: c("RTNC", true) } },
  hr: { label: "Croatia", flag: "🇭🇷", channels: { HRT: c("HRT", true, "https://hrt.hr") } },
  cw: { label: "Curaçao", flag: "🇨🇼", channels: { Nos: c("Nos País TV", true) } },
  cz: { label: "Czechia", flag: "🇨🇿", channels: {
    CT: c("ČT Sport", true, "https://ct.cz"), Nova: c("TV Nova", true, "https://nova.cz") } },
  ec: { label: "Ecuador", flag: "🇪🇨", channels: { Teleamazonas: c("Teleamazonas", true, "https://teleamazonas.com") } },
  eg: { label: "Egypt", flag: "🇪🇬", channels: { beIN: c("beIN Sports", false, "https://beinsports.com") } },
  gh: { label: "Ghana", flag: "🇬🇭", channels: { GBC: c("GBC", true, "https://gbcghana.tv") } },
  ht: { label: "Haiti", flag: "🇭🇹", channels: {
    TNH: c("TNH", true), CanalPlus: c("Canal+", false, "https://canalplus.com") } },
  ir: { label: "Iran", flag: "🇮🇷", channels: { IRIB: c("IRIB", true, "https://irib.ir") } },
  iq: { label: "Iraq", flag: "🇮🇶", channels: { beIN: c("beIN Sports", false, "https://beinsports.com") } },
  ci: { label: "Ivory Coast", flag: "🇨🇮", channels: { RTI: c("RTI", true, "https://rti.ci") } },
  jp: { label: "Japan", flag: "🇯🇵", channels: {
    NHK: c("NHK", true, "https://nhk.or.jp"), FujiTV: c("Fuji TV", true), DAZN: c("DAZN", false, "https://dazn.com") } },
  jo: { label: "Jordan", flag: "🇯🇴", channels: { beIN: c("beIN Sports", false, "https://beinsports.com") } },
  ma: { label: "Morocco", flag: "🇲🇦", channels: { SNRT: c("SNRT", true, "https://snrt.ma") } },
  nl: { label: "Netherlands", flag: "🇳🇱", channels: { NOS: c("NOS", true, "https://nos.nl") } },
  nz: { label: "New Zealand", flag: "🇳🇿", channels: { TVNZ: c("TVNZ", true, "https://tvnz.co.nz") } },
  no: { label: "Norway", flag: "🇳🇴", channels: {
    NRK: c("NRK", true, "https://nrk.no"), TV2: c("TV2", false, "https://tv2.no") } },
  pa: { label: "Panama", flag: "🇵🇦", channels: {
    RPC: c("RPC", true, "https://rpctv.com"), Tigo: c("Tigo Sports", false, "https://tigosports.com.pa") } },
  py: { label: "Paraguay", flag: "🇵🇾", channels: {
    Trece: c("Trece", true, "https://trecepy.com"), GEN: c("GEN", true, "https://gen.com.py") } },
  qa: { label: "Qatar", flag: "🇶🇦", channels: {
    Alkass: c("Alkass", true, "https://alkass.net"), beIN: c("beIN Sports", false, "https://beinsports.com") } },
  sa: { label: "Saudi Arabia", flag: "🇸🇦", channels: { beIN: c("beIN Sports", false, "https://beinsports.com") } },
  sn: { label: "Senegal", flag: "🇸🇳", channels: { RTS: c("RTS", true, "https://rts.sn") } },
  za: { label: "South Africa", flag: "🇿🇦", channels: {
    SABC: c("SABC", true, "https://sabc.co.za"), SuperSport: c("SuperSport", false, "https://supersport.com") } },
  kr: { label: "South Korea", flag: "🇰🇷", channels: {
    KBS: c("KBS", true, "https://kbs.co.kr"), JTBC: c("JTBC", true, "https://jtbc.co.kr") } },
  se: { label: "Sweden", flag: "🇸🇪", channels: {
    SVT: c("SVT", true, "https://svt.se"), TV4: c("TV4", false, "https://tv4.se") } },
  ch: { label: "Switzerland", flag: "🇨🇭", channels: { SRG: c("SRF / RTS", true, "https://srf.ch") } },
  tn: { label: "Tunisia", flag: "🇹🇳", channels: { beIN: c("beIN Sports", false, "https://beinsports.com") } },
  tr: { label: "Türkiye", flag: "🇹🇷", channels: { TRT: c("TRT", true, "https://trt.net.tr") } },
  uy: { label: "Uruguay", flag: "🇺🇾", channels: {
    Canal5: c("Canal 5", true), Antel: c("Antel TV", false, "https://antel.com.uy") } },
  uz: { label: "Uzbekistan", flag: "🇺🇿", channels: { ZorTV: c("Zo'r TV", true) } },
};

// ─── Per-game free-to-air subsets (only where coverage is split) ─────────────
const isLateKnockout = (g) => ["semi_final", "third_place", "final"].includes(g.phase);
const pair = (g) => [g.home, g.away].sort().join("-");
const sp = (a, b) => [a, b].sort().join("-");

// FR — 32 games free on M6 (Eurosport schedule); all 104 on beIN.
const FR_M6 = new Set([
  "ESP-CPV", "BEL-EGY", "KSA-URU", "FRA-SEN", "IRQ-NOR", "POR-COD", "ENG-CRO",
  "CZE-RSA", "SUI-BIH", "USA-AUS", "SCO-MAR", "BRA-HAI", "NED-SWE", "GER-CIV",
  "ESP-KSA", "BEL-IRN", "ARG-AUT", "FRA-IRQ", "POR-UZB", "ENG-GHA", "SUI-CAN",
  "SCO-BRA", "ECU-GER", "TUN-NED", "NOR-FRA", "URU-ESP", "PAN-ENG", "COL-POR",
]);
// SG — 28 free on Mediacorp Ch 5 (CNA): these 24 group games + semis/3rd/final.
const SG_FTA_GROUP = new Set([
  sp("MEX","RSA"), sp("KOR","CZE"), sp("USA","PAR"), sp("AUS","TUR"), sp("GER","CUW"),
  sp("CIV","ECU"), sp("BEL","EGY"), sp("IRN","NZL"), sp("ARG","ALG"), sp("AUT","JOR"),
  sp("POR","COD"), sp("UZB","COL"), sp("SUI","BIH"), sp("CAN","QAT"), sp("SCO","MAR"),
  sp("BRA","HAI"), sp("NED","SWE"), sp("TUN","JPN"), sp("ESP","KSA"), sp("URU","CPV"),
  sp("FRA","IRQ"), sp("NOR","SEN"), sp("ENG","GHA"), sp("PAN","CRO"),
]);
// MX — ~32 free on open TV (TUDN): these 17 group games + semis/3rd/final.
const MX_FTA_GROUP = new Set([
  sp("MEX","RSA"), sp("USA","PAR"), sp("BRA","MAR"), sp("NED","JPN"), sp("ARG","ALG"),
  sp("ENG","CRO"), sp("MEX","KOR"), sp("BRA","HAI"), sp("NED","SWE"), sp("ESP","KSA"),
  sp("NOR","SEN"), sp("COL","COD"), sp("CZE","MEX"), sp("ECU","GER"), sp("URU","ESP"),
  sp("PAN","ENG"), sp("COL","POR"),
]);

function channelsForGame(code, game) {
  const all = Object.keys(META[code].channels);
  switch (code) {
    case "fr":
      return (FR_M6.has(`${game.home}-${game.away}`) || isLateKnockout(game)) ? ["M6", "beIN"] : ["beIN"];
    case "sg":
      return (SG_FTA_GROUP.has(pair(game)) || isLateKnockout(game)) ? ["Ch5", "meWatch", "StarHub"] : ["meWatch", "StarHub"];
    case "mx":
      return (MX_FTA_GROUP.has(pair(game)) || isLateKnockout(game)) ? ["Canal5", "Azteca7", "ViX"] : ["ViX"];
    case "ar":
      return (game.home === "ARG" || game.away === "ARG" || isLateKnockout(game)) ? ["Telefe", "TVPublica", "TyC"] : ["TyC"];
    case "pt":
      return (game.home === "POR" || game.away === "POR" || isLateKnockout(game)) ? ["RTP", "SportTV"] : ["SportTV"];
    default:
      return all; // uniform: this nation's broadcaster(s) carry every game
  }
}

// ─── Apply ───────────────────────────────────────────────────────────────────
// 1. Rebuild broadcast meta from META (source of truth).
data.broadcast = Object.fromEntries(
  Object.entries(META).map(([code, m]) => [code, { label: m.label, flag: m.flag, channels: m.channels }])
);

// 2. Set per-game channels for every territory except US (US comes from ESPN sync).
for (const game of data.games) {
  if (!game.broadcast) game.broadcast = {};
  for (const code of Object.keys(META)) {
    if (code === "us") continue; // preserve ESPN-sourced US channels
    game.broadcast[code] = channelsForGame(code, game);
  }
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));

const total = Object.keys(META).length;
const frFree = data.games.filter((g) => g.broadcast.fr.includes("M6")).length;
const sgFree = data.games.filter((g) => g.broadcast.sg.includes("Ch5")).length;
const mxFree = data.games.filter((g) => g.broadcast.mx.includes("Canal5")).length;
console.log(`✓ Broadcast data written for ${total} territories across ${data.games.length} games`);
console.log(`  Per-game free/pay split: FR (${frFree} free on M6), SG (${sgFree} on Ch 5), MX (${mxFree} on open TV), AR & PT (nation's games)`);
console.log(`  US channels preserved from ESPN sync; all other nations: rights holder(s) on every game`);
