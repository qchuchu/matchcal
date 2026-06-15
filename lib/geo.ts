// Maps a visitor's ISO 3166-1 alpha-2 country code (from Vercel's
// `x-vercel-ip-country` header) to a prefilled World Cup team and broadcast country.

// ISO country → World Cup 2026 team code (only the 48 qualified nations)
export const COUNTRY_TO_TEAM: Record<string, string> = {
  DZ: "ALG", AR: "ARG", AU: "AUS", AT: "AUT", BE: "BEL", BA: "BIH",
  BR: "BRA", CA: "CAN", CV: "CPV", CO: "COL", CD: "COD", HR: "CRO",
  CW: "CUW", CZ: "CZE", EC: "ECU", EG: "EGY", GB: "ENG", FR: "FRA",
  DE: "GER", GH: "GHA", HT: "HAI", IR: "IRN", IQ: "IRQ", CI: "CIV",
  JP: "JPN", JO: "JOR", MX: "MEX", MA: "MAR", NL: "NED", NZ: "NZL",
  NO: "NOR", PA: "PAN", PY: "PAR", PT: "POR", QA: "QAT", SA: "KSA",
  SN: "SEN", ZA: "RSA", KR: "KOR", ES: "ESP", SE: "SWE", CH: "SUI",
  TN: "TUN", TR: "TUR", US: "USA", UY: "URU", UZ: "UZB",
};

// ISO country → our broadcast country key (only the ones we have TV data for)
export const COUNTRY_TO_BROADCAST: Record<string, string> = {
  FR: "fr", GB: "uk", US: "us", ES: "es",
  DE: "de", BR: "br", AR: "ar", PT: "pt", SG: "sg",
};

const DEFAULT_COUNTRY = "fr";

export function prefillFromCountry(iso: string | null | undefined): {
  teams: string[];
  country: string;
} {
  const code = (iso ?? "").toUpperCase();
  const team = COUNTRY_TO_TEAM[code];
  return {
    teams: team ? [team] : [],
    country: COUNTRY_TO_BROADCAST[code] ?? DEFAULT_COUNTRY,
  };
}
