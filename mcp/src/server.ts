import { McpServer } from "skybridge/server";
import { z } from "zod";
import { buildCalendarData, SUPPORTED_COMPETITION } from "./matchcal.js";

const server = new McpServer(
  {
    name: "matchcal",
    title: "MatchCal",
    version: "0.1.0",
    description: "Localized FIFA World Cup 2026 fixtures and calendar subscription links.",
    websiteUrl: "https://matchcal.live",
  },
  {
    capabilities: {},
    instructions:
      "This server currently supports only the wdc-2026 competition. If a user asks for another competition, explain that only FIFA World Cup 2026 is available today and offer to show wdc-2026 instead.",
  },
).registerTool(
  {
    name: "show-calendar",
    title: "Show Calendar",
    description:
      "Show the MatchCal calendar for FIFA World Cup 2026, localized with the user's MCP location hints when available.",
    inputSchema: {
      competition: z
        .string()
        .optional()
        .describe(`Competition id. Currently only ${SUPPORTED_COMPETITION} is supported.`),
      teams: z
        .array(z.string())
        .optional()
        .describe("Optional FIFA team codes such as FRA, USA, BRA, ARG, or ENG."),
      country: z
        .string()
        .optional()
        .describe("Optional broadcast market as a MatchCal country key, ISO country code, or country name."),
    },
    outputSchema: {
      competition: z.object({
        id: z.string(),
        name: z.string(),
        shortName: z.string(),
      }),
      supportedCompetition: z.literal(SUPPORTED_COMPETITION),
      unsupportedCompetition: z.string().nullable(),
      teams: z.array(
        z.object({
          code: z.string(),
          name: z.string(),
          flag: z.string(),
          group: z.string().optional(),
        }),
      ),
      country: z.object({
        code: z.string(),
        label: z.string(),
        flag: z.string(),
      }),
      timezone: z.string(),
      locale: z.string(),
      locationLabel: z.string().nullable(),
      calendarApiUrl: z.string(),
      games: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          phase: z.string(),
          group: z.string().optional(),
          matchday: z.number().nullable().optional(),
          kickoffUtc: z.string(),
          localTimeLabel: z.string(),
          home: z.object({
            code: z.string(),
            name: z.string(),
            flag: z.string(),
            group: z.string().optional(),
          }),
          away: z.object({
            code: z.string(),
            name: z.string(),
            flag: z.string(),
            group: z.string().optional(),
          }),
          venue: z
            .object({
              name: z.string(),
              city: z.string(),
              country: z.string(),
            })
            .nullable(),
          broadcasts: z.array(
            z.object({
              name: z.string(),
              free: z.boolean(),
              url: z.string(),
              logoUrl: z.string().nullable(),
            }),
          ),
        }),
      ),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
    securitySchemes: [{ type: "noauth" }],
    _meta: {
      securitySchemes: [{ type: "noauth" }],
      "openai/widgetAccessible": true,
      "openai/toolInvocation/invoking": "Loading MatchCal",
      "openai/toolInvocation/invoked": "MatchCal ready",
    },
    view: {
      component: "show-calendar",
      description: "Interactive MatchCal World Cup 2026 schedule",
      prefersBorder: false,
      csp: {
        resourceDomains: ["https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://www.google.com", "https://*.gstatic.com"],
        redirectDomains: ["https://calendar.google.com", "https://matchcal.live"],
      },
      _meta: {
        "openai/widgetDescription":
          "A localized MatchCal fixture list where users can select games and open a filtered calendar subscription link.",
      },
    },
  },
  async (input, extra) => {
    const location = extra._meta?.["openai/userLocation"];
    const locale = extra._meta?.["openai/locale"];
    const { structuredContent, responseMetadata } = buildCalendarData(input, location, locale);
    const teamLabel =
      structuredContent.teams.length > 0
        ? structuredContent.teams.map((team) => team.name).join(", ")
        : "all teams";
    const unsupported = structuredContent.unsupportedCompetition
      ? ` Only ${SUPPORTED_COMPETITION} is supported, so this view shows FIFA World Cup 2026 instead.`
      : "";

    return {
      structuredContent,
      content: `Showing ${structuredContent.games.length} ${structuredContent.competition.shortName} games for ${teamLabel}, with broadcasts for ${structuredContent.country.label} and kickoff times in ${structuredContent.timezone}.${unsupported}`,
      _meta: responseMetadata,
    };
  },
);

export default await server.run();

export type AppType = typeof server;
