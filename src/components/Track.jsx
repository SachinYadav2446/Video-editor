import { TRACK_COLORS } from "../constants";

export default function Track({ track, state, dispatch, PX_PER_SEC, onTimelineClick, onClipMouseDown, onResizeMouseDown }) {
  const colors = TRACK_COLORS[track.type] || TRACK_COLORS.video;

  return (
    <div className="track-row" style={{ minHeight: 56, display: "flex", alignItems: "stretch", borderBottom: "1px solid rgba(139,90,43,0.1)", width: "100%", position: "relative" }}>
      <div className="track-label" style={{ width: 140, minWidth: 140, padding: "0 12px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#131110", borderRight: "1px solid rgba(139,90,43,0.12)", fontSize: 11, gap: 4, fontFamily: "'Instrument Sans', sans-serif", position: "sticky", left: 0, zIndex: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <div style={{ fontSize: 9, color: colors.label, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2, fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>{track.type}</div>
          <div style={{ fontSize: 11, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{track.name}</div>
        </div>
        <button className="tool-btn danger" style={{ padding: "3px 6px", fontSize: 9, flexShrink: 0, fontFamily: "'Poppins', sans-serif", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "4px", background: "rgba(239,68,68,0.05)", color: "#ef4444", cursor: "pointer" }}
          onClick={() => dispatch({ type: "REMOVE_TRACK", trackId: track.id })}>✕</button>
      </div>

      <div
        style={{ flex: 1, position: "relative", cursor: "crosshair" }}
        onClick={onTimelineClick}
      >
        {track.clips.map((clip) => (
          <div
            key={clip.id}
            className={`clip-block${state.selectedClip === clip.id ? " selected" : ""}`}
            style={{
              position: "absolute",
              left: clip.start * PX_PER_SEC,
              width: Math.max(clip.duration * PX_PER_SEC - 2, 8),
              top: 8,
              height: 40,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: 6,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              zIndex: 10
            }}
            onMouseDown={(e) => onClipMouseDown(e, track.id, clip)}
          >
            {clip.imageEl && (
              <img src={clip.url} alt="" style={{ height: "100%", width: "auto", opacity: 0.5, pointerEvents: "none" }} />
            )}
            {clip.type === "audio" && (
              <div style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 8px" }}>
                {Array.from({ length: Math.floor(clip.duration * PX_PER_SEC / 4) }).map((_, i) => (
                  <div key={i} style={{ width: 2, height: `${20 + Math.sin(i * 2.1) * 14}px`, background: colors.border, marginRight: 2, borderRadius: 1 }} />
                ))}
              </div>
            )}
            <div style={{ position: "absolute", left: 0, right: 0, padding: "4px 8px", display: "flex", alignItems: "flex-end", bottom: 0 }}>
              <span style={{ fontSize: 10, color: colors.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%", fontWeight: 500 }}>
                {clip.type === "text" ? `"${clip.text}"` : clip.name}
              </span>
            </div>
            <div
              style={{ position: "absolute", right: 0, top: 0, width: 8, height: "100%", cursor: "ew-resize", background: colors.border, opacity: 0.6 }}
              onMouseDown={(e) => onResizeMouseDown(e, track.id, clip)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
