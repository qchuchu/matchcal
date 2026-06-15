import { ImageResponse } from "next/og";

export const alt = "MatchCal — add World Cup 2026 games to your calendar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #0b2014 0%, #091a0f 55%, #05130a 100%)",
          color: "white",
          padding: "72px",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
        {/* Pitch motif — center circle + halfway line, low opacity */}
        <div
          style={{
            position: "absolute",
            top: "95px",
            right: "-170px",
            width: "440px",
            height: "440px",
            borderRadius: "9999px",
            border: "6px solid rgba(255,255,255,0.07)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: "50px",
            width: "6px",
            background: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Top row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              fontSize: "36px",
              fontWeight: 800,
              letterSpacing: "1px",
            }}
          >
            <span>MATCHCAL</span>
            <span style={{ color: "#a3e635", fontSize: "22px", fontWeight: 700 }}>
              .LIVE
            </span>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "22px",
              fontWeight: 700,
              color: "#fbbf24",
              border: "2px solid rgba(251,191,36,0.4)",
              background: "rgba(251,191,36,0.12)",
              borderRadius: "10px",
              padding: "10px 18px",
              letterSpacing: "2px",
            }}
          >
            WORLD CUP 2026
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: "112px",
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: "-3px",
            }}
          >
            <span>NEVER&nbsp;</span>
            <span style={{ color: "#a3e635" }}>MISS</span>
            <span>&nbsp;A GAME.</span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "30px",
              fontSize: "32px",
              color: "rgba(255,255,255,0.6)",
              maxWidth: "860px",
            }}
          >
            Pick your teams, get the TV channel, and add every match to your
            calendar in one click.
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "28px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "20px",
              height: "20px",
              borderRadius: "9999px",
              background: "#a3e635",
            }}
          />
          <span>matchcal.live</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
