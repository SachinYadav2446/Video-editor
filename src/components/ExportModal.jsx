export default function ExportModal({ show, progress, downloadUrl, fileName, onClose }) {
  if (!show) return null;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#0a0a0a", border: "2px solid #2d5a2d", borderRadius: 12, padding: 40, minWidth: 400, maxWidth: 480 }}>
        <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", marginBottom: 8, color: "#ffffff" }}>
          {progress === 100 ? "Export complete" : "Exporting video…"}
        </div>
        <div style={{ fontSize: 13, color: "#888888", marginBottom: 24 }}>
          {progress === 100
            ? "Your video has been rendered in-browser successfully."
            : "Processing timeline · Rendering tracks"}
        </div>
        <div style={{ background: "#1a1a1a", borderRadius: 6, height: 8, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ height: "100%", background: "linear-gradient(90deg,#2d5a2d,#4a9a4a)", borderRadius: 6, width: `${progress ?? 0}%`, transition: "width 0.2s" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontSize: 12, color: "#4a9a4a", fontWeight: 500 }}>
            {progress === 100 ? "✓ Done" : `${Math.round(progress ?? 0)}%`}
          </span>
          <span style={{ fontSize: 12, color: "#666666", fontWeight: 500 }}>
            {progress === 100 ? "WebM · VP8" : "Processing"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {progress === 100 && downloadUrl && (
            <a 
              href={downloadUrl} 
              download={fileName || "video.webm"} 
              className="tool-btn primary" 
              style={{ flex: 1, justifyContent: "center", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
            >
              ⬇ Download WebM
            </a>
          )}
          <button className="tool-btn" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
            {progress === 100 ? "Close" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
