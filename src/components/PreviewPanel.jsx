import { fmtTime } from "../constants";
import { useRef, useEffect } from "react";

export default function PreviewPanel({ state, dispatch, canvasRef, onTogglePlay, onSeek, onResetFilters }) {
  const selectedClipData = state.selectedClip
    ? state.tracks.flatMap((t) => t.clips).find((c) => c.id === state.selectedClip)
    : null;

  const videoRef = useRef(null);

  // Find active video/image clip at playhead
  const activeClip = state.tracks.flatMap(t => t.clips).find(c => 
    c.start <= state.playhead && c.start + c.duration > state.playhead && (c.videoEl || c.imageEl)
  );

  // Sync video element with timeline
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    if (activeClip?.videoEl) {
      // Update video source if changed
      if (video.src !== activeClip.url) {
        video.src = activeClip.url;
        video.load();
      }
      
      const videoTime = state.playhead - activeClip.start;
      
      if (state.isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
        // Sync video time when scrubbing
        if (Math.abs(video.currentTime - videoTime) > 0.05) {
          video.currentTime = videoTime;
        }
      }
    } else {
      video.pause();
    }
  }, [state.playhead, state.isPlaying, activeClip]);

  // Update timeline from video time during playback
  useEffect(() => {
    if (!videoRef.current || !state.isPlaying || !activeClip?.videoEl) return;
    
    const video = videoRef.current;
    const handleTimeUpdate = () => {
      const newPlayhead = activeClip.start + video.currentTime;
      dispatch({ type: "SET_PLAYHEAD", time: newPlayhead });
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [state.isPlaying, activeClip, dispatch]);

  return (
    <div style={{ width: 400, minWidth: 320, display: "flex", flexDirection: "column", borderRight: "2px solid #2d5a2d", background: "#0a0a0a" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #2a2a2a", fontSize: 11, color: "#4a9a4a", letterSpacing: "0.12em", fontWeight: 600 }}>PREVIEW</div>

      <div style={{ position: "relative", background: "#000000", aspectRatio: "16/9", width: "100%", overflow: "hidden" }}>
        {activeClip ? (
          activeClip.videoEl ? (
            <video
              ref={videoRef}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%)`
              }}
              playsInline
            />
          ) : (
            <img
              src={activeClip.url}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%)`
              }}
            />
          )
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#2a2a2a" }}>
            <div style={{ fontSize: 48 }}>▶</div>
            <span style={{ fontSize: 13, color: "#4a4a4a" }}>Upload media to preview</span>
          </div>
        )}
        {state.tracks.filter((t) => t.type === "text").map((track) =>
          track.clips
            .filter((c) => c.start <= state.playhead && c.start + c.duration > state.playhead)
            .map((clip) => (
              <div key={clip.id} style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#ffffff", padding: "8px 16px", borderRadius: 6, fontSize: 16, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, whiteSpace: "nowrap", border: "1px solid #2d5a2d" }}>
                {clip.text}
              </div>
            ))
        )}
        <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.8)", color: "#4a9a4a", fontSize: 12, padding: "4px 12px", borderRadius: 4, fontVariantNumeric: "tabular-nums", fontWeight: 500, border: "1px solid #2d5a2d" }}>
          {fmtTime(state.playhead)} / {fmtTime(state.duration)}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "16px", borderBottom: "1px solid #2a2a2a", background: "#0a0a0a" }}>
        <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: 0 })}>⏮</button>
        <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 5) })}>⏪</button>
        <button className="tool-btn primary" style={{ padding: "8px 16px", fontSize: 16 }}
          onClick={onTogglePlay}>
          {state.isPlaying ? "⏸" : "▶"}
        </button>
        <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 5) })}>⏩</button>
        <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => { dispatch({ type: "SET_PLAYING", value: false }); dispatch({ type: "SET_PLAYHEAD", time: state.duration }); }}>⏭</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a9a4a", marginBottom: 16, fontWeight: 600 }}>COLOR GRADE</div>
        {[
          { key: "brightness", label: "Brightness", min: 0, max: 200, default: 100 },
          { key: "contrast", label: "Contrast", min: 0, max: 300, default: 100 },
          { key: "saturation", label: "Saturation", min: 0, max: 300, default: 100 },
          { key: "hue", label: "Hue Shift", min: -180, max: 180, default: 0 },
          { key: "opacity", label: "Opacity", min: 0, max: 100, default: 100 },
        ].map(({ key, label, min, max, def }) => (
          <div key={key} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#cccccc" }}>
              <span style={{ fontWeight: 500 }}>{label}</span>
              <span style={{ color: state[key] !== (def ?? 100) ? "#4a9a4a" : "#666666", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{Math.round(state[key])}</span>
            </div>
            <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider"
              onChange={(e) => dispatch({ type: "SET_FILTER", key, value: parseFloat(e.target.value) })} />
          </div>
        ))}
        <button className="tool-btn" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={onResetFilters}>
          ↺ Reset all
        </button>

        {selectedClipData && (
          <div style={{ marginTop: 24, borderTop: "1px solid #2a2a2a", paddingTop: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#4a9a4a", marginBottom: 12, fontWeight: 600 }}>CLIP PROPERTIES</div>
            <div style={{ fontSize: 12, color: "#cccccc", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 500 }}>{selectedClipData.name}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
              <div style={{ background: "#1a1a1a", padding: "10px 12px", borderRadius: 6, border: "1px solid #2a2a2a" }}>
                <div style={{ color: "#666666", marginBottom: 4, fontSize: 11 }}>Start</div>
                <div style={{ color: "#ffffff", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtTime(selectedClipData.start)}</div>
              </div>
              <div style={{ background: "#1a1a1a", padding: "10px 12px", borderRadius: 6, border: "1px solid #2a2a2a" }}>
                <div style={{ color: "#666666", marginBottom: 4, fontSize: 11 }}>Duration</div>
                <div style={{ color: "#ffffff", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{fmtTime(selectedClipData.duration)}</div>
              </div>
            </div>
            <button className="tool-btn danger" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
              onClick={() => dispatch({ type: "REMOVE_CLIP", clipId: selectedClipData.id })}>
              ✕ Remove clip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
