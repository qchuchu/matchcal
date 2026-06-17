# MatchCal MCP App

## Value Proposition

Bring MatchCal's FIFA World Cup 2026 calendar into an AI assistant conversation so users can browse localized fixtures, see broadcast options, and add only the matches they care about to their calendar.

**Target users**: Football fans using ChatGPT or another MCP host who want a fast, localized way to subscribe to World Cup 2026 games.

**Pain today**: Users must visit the website, manually choose teams and country, then subscribe to every match for those teams. Trimming the calendar to a smaller match set is not available from the UI.

**Core action**: Show a localized World Cup 2026 calendar and generate a calendar subscription link from the user's selected matches.

## Why LLM?

**Conversational win**: A user can ask for "my World Cup games" or "show France's matches" and the assistant can open the right interactive schedule without asking the user to navigate the website first.

**LLM adds**: It can use conversation context and the MCP client-provided `openai/userLocation` metadata to infer a likely team and broadcast market, explain kickoff times in the user's local context, and summarize selected games.

**What LLM lacks**: The official MatchCal fixture data, broadcast market mapping, and the ability to generate a filtered calendar subscription link. The MCP app provides those.

## UI Overview

**First view**: A compact MatchCal-styled football pitch surface embedded in chat, showing inferred team, broadcast market, timezone, selected-game count, calendar CTAs, and a horizontal carousel of matching games.

**Key interactions**:
- Users can include or exclude individual upcoming games from a compact horizontal game carousel.
- Users can quickly select all or clear all games.
- Users can open an Add to calendar menu with Google Calendar, default calendar `webcal:`, and copy-link options.

**End state**: The user has a calendar subscription link for the live team/all-games feed plus an `exclude` list for opted-out matches, so future knockout matches can still appear automatically.

## Product Context

- **Existing product**: `matchcal.live`, plus this local Next.js app.
- **Competition scope**: The server currently supports only `wdc-2026`.
- **Data**: Reuse `data/wdc-2026.json` and `lib/fixtures.ts` where possible.
- **Localization**: Match the site's Vercel header behavior with MCP client metadata from `openai/userLocation`.
- **Calendar API**: Extend `/api/ical` to accept excluded game IDs while preserving existing `teams` and `country` behavior. The API only emits upcoming matches by default.
- **Design**: Reuse the existing dark football-pitch MatchCal visual language.
- **Authentication**: None.

## UX Flows

Show calendar:
1. Infer team, broadcast market, and timezone from MCP input plus `openai/userLocation`.
2. Return all matching World Cup 2026 games and broadcast metadata.
3. Render a selectable upcoming-fixture carousel.
4. Generate calendar URLs from the currently excluded match IDs.

## Tools and Views

**View tool: `show-calendar`**
- **Input**: optional `{ competition?: "wdc-2026", teams?: string[], country?: string }`
- **Output**: `{ competition, teams, country, timezone, games[] }`
- **View**: `show-calendar`
- **Behavior**: Fetches fixture and broadcast data, provides a custom UI, and stores selected game IDs in view state.
- **Annotations**: read-only, not destructive, no account side effects.

## Server Instructions

This MCP server currently supports only the `wdc-2026` competition. If a user asks for another competition, explain that only FIFA World Cup 2026 is available today and offer to show that calendar instead.
