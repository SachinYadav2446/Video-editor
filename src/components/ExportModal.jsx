export default function ExportModal({ show, progress, onClose }) {
  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#0a0a0a", border: "2px solid #2d5a2d", borderRadius: 12, padding: 40, minWidth: 400, maxWidth: 480 }}>
        <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, color: "#ffffff" }}>
          {progress === 100 ? "Export complete" : "Exporting video…"}
        </div>
        <div style={{ fontSize: 13, color: "#888888", marginBottom: 24 }}>
          {progress === 100
            ? "Your video has been rendered in-browser via WebAssembly."
            : "Processing timeline · Rendering with ffmpeg.wasm"}
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#2d5a2d,#4a9a4a)", borderRadius: 6, width: `${progress ?? 0}%`, transition: "width 0.2s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: "#4a9a4a", fontWeight: 500 }}>
            {progress === 100 ? "✓ Done" : `${Math.round(progress ?? 0)}%`}
          </span>
          <span style={{ fontSize: 12, color: "#666666", fontWeight: 500 }}>
            {progress === 100 ? "MP4 · H.264" : "ffmpeg.wasm"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {progress === 100 && (
            <button className="tool-btn primary" style={{ flex: 1, justifyContent: "center" }}>⬇ Download MP4</button>
          )}
          <button className="tool-btn" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
            {progress === 100 ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
