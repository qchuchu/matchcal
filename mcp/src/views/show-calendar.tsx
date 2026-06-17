import "../index.css";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useLayout, useOpenExternal, useViewState } from "skybridge/web";
import { useToolInfo } from "../helpers.js";

type SelectionState = {
  selectionKey: string;
  excludedGameIds: string[];
};

type ShowCalendarToolInfo = ReturnType<typeof useToolInfo<"show-calendar">>;
type LoadedToolInfo = Extract<ShowCalendarToolInfo, { status: "success" }>;

function PitchLines() {
  return (
    <svg className="pitch-lines" viewBox="0 0 68 105" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect x="2" y="2" width="64" height="101" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="2" y1="52.5" x2="66" y2="52.5" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="52.5" r="9.15" fill="none" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="52.5" r="0.6" fill="white" />
      <rect x="13.85" y="2" width="40.3" height="16.5" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="24.84" y="2" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="13" r="0.6" fill="white" />
      <path d="M 24.5 18.5 A 9.15 9.15 0 0 1 43.5 18.5" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="13.85" y="86.5" width="40.3" height="16.5" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="24.84" y="97.5" width="18.32" height="5.5" fill="none" stroke="white" strokeWidth="0.5" />
      <circle cx="34" cy="92" r="0.6" fill="white" />
      <path d="M 24.5 86.5 A 9.15 9.15 0 0 0 43.5 86.5" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 2 4 A 2 2 0 0 1 4 2" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 64 4 A 2 2 0 0 0 62 2" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 2 101 A 2 2 0 0 0 4 103" fill="none" stroke="white" strokeWidth="0.5" />
      <path d="M 64 101 A 2 2 0 0 1 62 103" fill="none" stroke="white" strokeWidth="0.5" />
      {Array.from({ length: 6 }).map((_, index) => (
        <rect key={index} x="2" y={2 + index * 16.83} width="64" height="8.4" fill="white" fillOpacity="0.08" />
      ))}
    </svg>
  );
}

export default function ShowCalendar() {
  const toolInfo = useToolInfo<"show-calendar">();

  if (toolInfo.status !== "success") {
    return (
      <main className="matchcal-shell">
        <PitchLines />
        <div className="grass" />
        <div className="loading">Loading MatchCal calendar</div>
      </main>
    );
  }

  return <LoadedCalendar toolInfo={toolInfo} />;
}

function LoadedCalendar({ toolInfo }: { toolInfo: LoadedToolInfo }) {
  const openExternal = useOpenExternal();
  const { safeArea } = useLayout();
  const [selection, setSelection] = useViewState<SelectionState>({
    selectionKey: "",
    excludedGameIds: [],
  });
  const [copyLabel, setCopyLabel] = useState("Copy webcal link");
  const [calendarMenuOpen, setCalendarMenuOpen] = useState(false);

  const { output, responseMetadata } = toolInfo;
  const selectionKey = output.games.map((game) => game.id).join("|");
  const allGameIds = useMemo(() => output.games.map((game) => game.id), [output.games]);
  const excludedGameIds = selection.selectionKey === selectionKey ? selection.excludedGameIds : [];
  const excludedSet = useMemo(() => new Set(excludedGameIds), [excludedGameIds]);
  const selectedGameIds = useMemo(
    () => allGameIds.filter((gameId) => !excludedSet.has(gameId)),
    [allGameIds, excludedSet],
  );
  const selectedSet = useMemo(() => new Set(selectedGameIds), [selectedGameIds]);
  const selectedCount = selectedGameIds.length;
  const allSelected = selectedCount === output.games.length;
  const teamLabel = output.teams.length > 0 ? output.teams.map((team) => team.name).join(" + ") : "All teams";
  const webcalUrl = buildWebcalUrl(output.calendarApiUrl, output.country.code, output.teams.map((team) => team.code), excludedGameIds);
  const googleUrl = `${responseMetadata.googleCalendarBase}${encodeURIComponent(webcalUrl)}`;
  const copyCaption = `webcal://matchcal.live/api/ical · ${selectedCount} game${selectedCount === 1 ? "" : "s"}`;
  const shellStyle = {
    paddingTop: safeArea.insets.top,
    paddingRight: safeArea.insets.right,
    paddingBottom: safeArea.insets.bottom,
    paddingLeft: safeArea.insets.left,
  } satisfies CSSProperties;

  useEffect(() => {
    if (selection.selectionKey !== selectionKey) {
      setSelection({ selectionKey, excludedGameIds: [] });
    }
  }, [selection.selectionKey, selectionKey, setSelection]);

  function toggleGame(id: string) {
    setSelection((current) => {
      const active = current.selectionKey === selectionKey ? current.excludedGameIds : [];
      const next = active.includes(id) ? active.filter((gameId) => gameId !== id) : [...active, id];
      return { selectionKey, excludedGameIds: next };
    });
  }

  function selectAll() {
    setSelection({ selectionKey, excludedGameIds: [] });
  }

  function clearAll() {
    setSelection({ selectionKey, excludedGameIds: allGameIds });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(webcalUrl);
      setCopyLabel("Copied");
      setCalendarMenuOpen(false);
    } catch {
      setCopyLabel("Copy failed");
    } finally {
      window.setTimeout(() => setCopyLabel("Copy webcal link"), 1800);
    }
  }

  return (
    <main
      className="matchcal-shell"
      style={shellStyle}
      data-llm={`MatchCal ${output.competition.shortName}: ${selectedCount} of ${output.games.length} upcoming games selected, ${excludedGameIds.length} excluded, timezone ${output.timezone}, broadcast market ${output.country.label}.`}
    >
      <PitchLines />
      <div className="grass" />
      <div className="content">
        <header className="topbar">
          <div className="brand">
            MATCHCAL<span>.LIVE</span>
          </div>
          <div className="top-actions">
            <div className="competition-pill">{output.competition.shortName}</div>
            <div className="calendar-menu">
              <button
                type="button"
                className="add-calendar-button"
                disabled={selectedCount === 0}
                aria-expanded={calendarMenuOpen}
                onClick={() => setCalendarMenuOpen((open) => !open)}
              >
                Add to calendar
                <span aria-hidden>▾</span>
              </button>
              {calendarMenuOpen ? (
                <div className="calendar-dropdown">
                  <button
                    type="button"
                    className="calendar-option"
                    onClick={() => {
                      setCalendarMenuOpen(false);
                      openExternal(googleUrl, { redirectUrl: false });
                    }}
                  >
                    <span className="button-icon google-icon" aria-hidden>
                      <span>G</span>
                    </span>
                    <span>
                      Google Calendar
                      <span className="button-sub">Subscribe automatically</span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="calendar-option"
                    onClick={() => {
                      setCalendarMenuOpen(false);
                      openExternal(webcalUrl, { redirectUrl: false });
                    }}
                  >
                    <span className="button-icon calendar-icon" aria-hidden>17</span>
                    <span>
                      Default calendar
                      <span className="button-sub">Apple, Outlook, Fantastical</span>
                    </span>
                  </button>
                  <button type="button" className="calendar-option muted" onClick={copyLink}>
                    <span className="button-icon link-icon" aria-hidden />
                    <span>
                      {copyLabel}
                      <span className="button-sub copy-link">{copyCaption}</span>
                    </span>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {output.unsupportedCompetition ? (
          <p className="notice">
            Only wdc-2026 is supported right now. Showing the FIFA World Cup 2026 calendar instead.
          </p>
        ) : null}

        <section className="compact-summary">
          <div>
            <p className="summary-eyebrow">{teamLabel}</p>
            <h1 className="summary-title">
              {selectedCount}/{output.games.length} upcoming games
            </h1>
            <p className="summary-copy">
              Calendar feed for {output.country.label}, with opt-outs excluded and future matches kept live.
            </p>
          </div>
          <div className="summary-row">
            <span className="meta-pill">{output.country.flag} {output.country.label}</span>
            <span className="meta-pill">{output.timezone}</span>
            <span className="meta-pill">{selectedCount} selected</span>
          </div>
        </section>

        <section className="games-strip">
          <div className="selection-heading">
            <p className="selection-count">
              {selectedCount === 0
                ? "No games selected"
                : allSelected
                  ? `All ${output.games.length} games`
                  : `${selectedCount}/${output.games.length} games`}
            </p>
            <div className="selection-actions" aria-label="Selection controls">
              <button type="button" className="mini-button" onClick={selectAll}>
                All
              </button>
              <button type="button" className="mini-button" onClick={clearAll}>
                None
              </button>
            </div>
          </div>

          <div className="matches" aria-label="World Cup games">
          {output.games.map((game) => {
            const selected = selectedSet.has(game.id);
            return (
              <article
                key={game.id}
                className={`match-card ${selected ? "" : "off"}`}
                data-llm={`${selected ? "Selected" : "Excluded"}: ${game.title}, ${game.localTimeLabel}, ${game.broadcasts.map((broadcast) => broadcast.name).join(", ") || "broadcast unavailable"}`}
              >
                <button
                  type="button"
                  className={`match-toggle ${selected ? "on" : ""}`}
                  aria-pressed={selected}
                  aria-label={`${selected ? "Exclude" : "Include"} ${game.title}`}
                  onClick={() => toggleGame(game.id)}
                />
                <div className="match-body">
                  <div className="match-kicker">
                    <span>{game.phase}</span>
                    <span>{game.localTimeLabel}</span>
                  </div>
                  <h2 className="match-title">
                    <span className="team-flag">{game.home.flag}</span>
                    <span>{game.home.name}</span>
                    <span>vs</span>
                    <span className="team-flag">{game.away.flag}</span>
                    <span>{game.away.name}</span>
                  </h2>
                  <div className="match-meta">
                    {game.venue ? (
                      <span>{game.venue.name}, {game.venue.city}</span>
                    ) : null}
                  </div>
                  <div className="broadcasts">
                    {game.broadcasts.length > 0 ? (
                      game.broadcasts.map((broadcast) => (
                        <span key={`${game.id}-${broadcast.name}`} className="broadcast-chip">
                          {broadcast.logoUrl ? (
                            <img className="broadcast-logo" src={broadcast.logoUrl} alt="" aria-hidden />
                          ) : (
                            <span className="broadcast-fallback">{broadcast.name.slice(0, 1)}</span>
                          )}
                          <span>{broadcast.name}</span>
                          {!broadcast.free ? <span className="pay-label">Pay</span> : null}
                        </span>
                      ))
                    ) : (
                      <span className="empty-broadcast">Broadcast info unavailable for {output.country.label}</span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </section>
      </div>
    </main>
  );
}

function buildWebcalUrl(calendarApiUrl: string, country: string, teams: string[], excludedGameIds: string[]) {
  const params = new URLSearchParams({
    country,
    exclude: excludedGameIds.join(","),
  });

  if (teams.length > 0) {
    params.set("teams", teams.join(","));
  }

  return `${calendarApiUrl}?${params.toString()}`.replace(/^https?:/, "webcal:");
}
