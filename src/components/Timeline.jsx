import { fmtTime, uid, TRACK_COLORS } from "../constants";
import Track from "./Track";

export default function Timeline({ state, dispatch, timelineRef, onTimelineClick, onClipMouseDown, onResizeMouseDown, onAddTrack }) {
  const PX_PER_SEC = 80 * state.zoom;
  const timeMarkers = [];
  const step = state.zoom < 0.5 ? 10 : state.zoom < 1 ? 5 : 2;
  for (let i = 0; i <= state.duration; i += step) timeMarkers.push(i);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Instrument Sans', sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid rgba(139,90,43,0.15)", background: "#131110", flexShrink: 0 }}>
        <span style={{ fontSize: 11, letterSpacing: "0.12em", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>TIMELINE</span>
        
        {/* Playhead indicators */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#d4a574", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontFamily: "'Poppins', sans-serif" }}>{fmtTime(state.playhead)}</span>
          <span style={{ fontSize: 13, color: "rgba(139,90,43,0.3)" }}>/</span>
          <span style={{ fontSize: 13, color: "#8c8780", fontVariantNumeric: "tabular-nums", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>{fmtTime(state.duration)}</span>
        </div>

        {/* Timeline controls: zoom & add track */}
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {/* Zoom Slider */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#8c8780", fontWeight: 500, letterSpacing: "0.04em" }}>ZOOM</span>
            <input 
              type="range" 
              min="0.3" 
              max="4" 
              step="0.1" 
              value={state.zoom} 
              onChange={e => dispatch({ type: "SET_ZOOM", value: parseFloat(e.target.value) })}
              style={{
                width: "80px",
                height: "4px",
                borderRadius: "2px",
                background: "rgba(139,90,43,0.25)",
                outline: "none",
                cursor: "pointer",
                WebkitAppearance: "none",
                accentColor: "#d4a574"
              }}
              className="timeline-zoom-slider"
            />
          </div>

          <button className="tool-btn" style={{ padding: "6px 14px", fontSize: 11, fontFamily: "'Poppins', sans-serif", fontWeight: 400, borderRadius: "6px", background: "rgba(139,90,43,0.08)", border: "1px solid rgba(139,90,43,0.25)", color: "#d4a574", cursor: "pointer", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(139,90,43,0.15)"; e.currentTarget.style.borderColor = "#d4a574"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,90,43,0.08)"; e.currentTarget.style.borderColor = "rgba(139,90,43,0.25)"; }}
            onClick={onAddTrack}>
            + Track
          </button>
        </div>
      </div>

      <div className="timeline-scroll-container" style={{ flex: 1, overflowX: "auto", overflowY: "auto", background: "#0c0a09", position: "relative" }}>
        <div style={{ width: state.duration * PX_PER_SEC + 140 + 200, display: "flex", flexDirection: "column", minWidth: "100%", position: "relative", minHeight: "100%" }}>
          
          {/* Main vertical playhead line */}
          <div style={{ position: "absolute", left: 140 + state.playhead * PX_PER_SEC, top: 0, bottom: 0, width: 2, background: "#ef4444", zIndex: 14, pointerEvents: "none" }}>
            <div style={{ position: "absolute", top: 20, left: -5, width: 12, height: 12, background: "#ef4444", clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
          </div>

          <div style={{ display: "flex", flexShrink: 0, position: "sticky", top: 0, zIndex: 15, background: "#131110", borderBottom: "1px solid rgba(139,90,43,0.12)" }}>
            <div style={{ width: 140, minWidth: 140, background: "#131110", borderRight: "1px solid rgba(139,90,43,0.12)", position: "sticky", left: 0, zIndex: 16 }} />
            <div
              ref={timelineRef}
              style={{ flex: 1, position: "relative", height: 32, cursor: "crosshair" }}
              onClick={onTimelineClick}
            >
              <div style={{ height: "100%", position: "relative" }}>
                {timeMarkers.map((t) => (
                  <div key={t} style={{ position: "absolute", left: t * PX_PER_SEC, top: 0, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                    <div style={{ width: 1, height: t % (step * 2) === 0 ? 12 : 6, background: "rgba(139,90,43,0.2)" }} />
                    {t % (step * 2) === 0 && <span style={{ fontSize: 9, color: "#8c8780", paddingLeft: 4, marginTop: 2, fontFamily: "'Poppins', sans-serif" }}>{fmtTime(t)}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {state.tracks.length === 0 && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, color: "rgba(139,90,43,0.25)", padding: "40px 0" }}>
              <div style={{ fontSize: 48 }}>◈</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, color: "#8c8780", marginBottom: 6, fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>No media on timeline</div>
                <div style={{ fontSize: 12, color: "rgba(139,90,43,0.4)" }}>Select assets from the left panel or click "+ Track" to get started</div>
              </div>
            </div>
          )}

          {state.tracks.map((track) => (
            <Track
              key={track.id}
              track={track}
              state={state}
              dispatch={dispatch}
              PX_PER_SEC={PX_PER_SEC}
              onTimelineClick={onTimelineClick}
              onClipMouseDown={onClipMouseDown}
              onResizeMouseDown={onResizeMouseDown}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
