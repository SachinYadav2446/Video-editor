import { useRef } from "react";
import { uid } from "../constants";

export default function TopBar({ state, dispatch, fileInputRef, onAddVideo, onAddImage, onAddAudio, onAddText, onExport }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: "#0a0a0a", borderBottom: "2px solid #2d5a2d", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginRight: 16 }}>
        <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#2d5a2d,#1a2a1a)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#4a9a4a" }}>✦</div>
        <span style={{ fontSize: 16, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#ffffff", letterSpacing: "-0.02em" }}>CINÉCUT</span>
        <span style={{ fontSize: 11, color: "#4a9a4a", marginLeft: 4, fontWeight: 500 }}>v0.1</span>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="tool-btn" onClick={onAddVideo}>
          <span>📹</span> Add Video
        </button>
        <button className="tool-btn" onClick={onAddImage}>
          <span>🖼️</span> Add Image
        </button>
        <button className="tool-btn" onClick={onAddAudio}>
          <span>🎵</span> Add Audio
        </button>
        <button className="tool-btn" onClick={onAddText}>
          <span>T</span> Add Text
        </button>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888888" }}>
        <span style={{ fontWeight: 500 }}>ZOOM</span>
        <input type="range" min="0.3" max="4" step="0.1" value={state.zoom} onChange={(e) => dispatch({ type: "SET_ZOOM", value: parseFloat(e.target.value) })} className="filter-slider" style={{ width: 80 }} />
        <span style={{ minWidth: 32, color: "#ffffff", fontWeight: 500 }}>{state.zoom.toFixed(1)}x</span>
      </div>

      <button className="tool-btn primary" onClick={onExport} style={{ marginLeft: 12 }}>
        ⬆ Export
      </button>
      <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" style={{ display: "none" }} />
    </div>
  );
}
