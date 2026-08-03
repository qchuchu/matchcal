---
name: get-calendar
description: Build a MatchCal FIFA World Cup 2026 calendar subscription link (iCal/webcal/Google Calendar) filtered by teams, games, or broadcast country.
---

# Get a MatchCal calendar

MatchCal serves FIFA World Cup 2026 fixtures as an iCal feed at:

```
https://matchcal.live/api/ical
```

Subscribing to this feed keeps the user's calendar in sync: only upcoming games are emitted, and knockout fixtures appear automatically as they get decided.

## Query parameters

At least one of `teams`, `games`, or `exclude` is required (400 otherwise).

- `teams` — comma-separated FIFA team codes, e.g. `teams=FRA,BRA`. Case-insensitive.
- `games` — comma-separated game IDs (from the `show-calendar` tool output) to include only those games. Takes precedence over `teams`.
- `exclude` — comma-separated game IDs to remove from the selection. `exclude=` alone (empty) means all games.
- `country` — broadcast market for TV channel info in event descriptions. Defaults to `fr`. Supported keys: fr, uk, us, es, de, br, ar, pt, sg, mx, dz, au, at, be, ba, ca, cv, co, cd, hr, cw, cz, ec, eg, gh, ht, ir, iq, ci, jp, jo, ma, nl, nz, no, pa, py, qa, sa, sn, za, kr, se, ch, tn, tr, uy, uz.

Example — all France and Brazil games with US broadcast info:

```
https://matchcal.live/api/ical?teams=FRA,BRA&country=us
```

## Subscription links

- **Apple/default calendar app**: replace the `https` scheme with `webcal` — `webcal://matchcal.live/api/ical?teams=FRA`.
- **Google Calendar**: `https://calendar.google.com/calendar/render?cid=<url-encoded webcal URL>`.
- **Download once (.ics)**: use the plain `https` URL; the response is `text/calendar` with an attachment disposition.

## Recommended flow

1. Call the `show-calendar` tool to let the user browse fixtures and pick teams or individual games; its output includes `calendarApiUrl` and game IDs.
2. Build the feed URL from the user's selection using the parameters above.
3. Offer the webcal link for subscription (preferred, stays up to date) and the Google Calendar link as an alternative.

Only the wdc-2026 competition is supported.
