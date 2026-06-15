import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { clicks } from "@/db/schema";

export async function POST(req: NextRequest) {
  try {
    const { teams, country, action } = await req.json();

    if (!teams?.length || !country || !action) {
      return new NextResponse("Bad request", { status: 400 });
    }

    await db.insert(clicks).values({
      createdAt: new Date().toISOString(),
      teams: Array.isArray(teams) ? teams.join(",") : String(teams),
      country: String(country),
      action: String(action),
    });

    return new NextResponse("ok");
  } catch {
    return new NextResponse("error", { status: 500 });
  }
}
