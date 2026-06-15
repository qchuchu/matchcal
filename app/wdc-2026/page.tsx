import { headers } from "next/headers";
import { prefillFromCountry } from "@/lib/geo";
import WDC2026Client from "./Client";

export default async function WDC2026Page() {
  // Vercel injects the visitor's country from their IP — prefill team + TV country.
  const h = await headers();
  const iso = h.get("x-vercel-ip-country");
  const { teams, country } = prefillFromCountry(iso);

  return <WDC2026Client initialTeams={teams} initialCountry={country} />;
}
