import { useState, useEffect, useRef } from "react";

const PLATFORMS = {
  instagram: { name: "Instagram Feed", ratio: "1:1", w: 400, h: 400, desc: "Standard square post" },
  reels: { name: "Reels / TikTok", ratio: "9:16", w: 280, h: 498, desc: "Vertical fullscreen story" },
  youtube: { name: "YouTube Thumbnail", ratio: "16:9", w: 480, h: 270, desc: "Landscape video cover" },
  facebook: { name: "Facebook Banner", ratio: "16:5", w: 480, h: 150, desc: "Horizontal cover page" }
};

export default function SocialStudio({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "New Social Campaign";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [caption, setCaption] = useState("Unleashing creative possibilities with Creatify! 🚀✨ #design #marketing #creativity");
  const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)");
  const [layers, setLayers] = useState([
    { id: "text_main", type: "text", text: "CREATIVITY WITHOUT LIMITS", x: 50, y: 40, size: 24, color: "#ffffff", font: "Syne" },
    { id: "sticker_badge", type: "sticker", shape: "✦", x: 50, y: 70, size: 40, color: "#f5c842" }
  ]);
  const [activeLayerId, setActiveLayerId] = useState("text_main");
  
  // Scheduling State
  const [scheduleDate, setScheduleDate] = useState("2026-05-28");
  const [scheduleTime, setScheduleTime] = useState("12:00");
  const [isScheduled, setIsScheduled] = useState(false);
  
  // Simulator State
  const [previewPlatform, setPreviewPlatform] = useState(null); // 'instagram' | 'reels' | 'youtube'

  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.caption) setCaption(d.caption);
      if (d.bgGradient) setBgGradient(d.bgGradient);
      if (d.layers) setLayers(d.layers);
      if (d.scheduleDate) setScheduleDate(d.scheduleDate);
      if (d.scheduleTime) setScheduleTime(d.scheduleTime);
      if (d.isScheduled) setIsScheduled(d.isScheduled);
    }
  }, [initialProject]);

  const isDraggingRef = useRef(false);
  const activeDragLayerIdRef = useRef(null);
  const dragStartPosRef = useRef({ offsetX: 0, offsetY: 0 });
  const containerRectRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current || !activeDragLayerIdRef.current || !containerRectRef.current) return;
      
      const rect = containerRectRef.current;
      const mouseXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const mouseYPercent = ((e.clientY - rect.top) / rect.height) * 100;
      
      let newX = Math.round(mouseXPercent - dragStartPosRef.current.offsetX);
      let newY = Math.round(mouseYPercent - dragStartPosRef.current.offsetY);
      
      newX = Math.max(-20, Math.min(120, newX));
      newY = Math.max(-20, Math.min(120, newY));
      
      setLayers(prev => prev.map(l => {
        if (l.id === activeDragLayerIdRef.current) {
          return { ...l, x: newX, y: newY };
        }
        return l;
      }));
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
      activeDragLayerIdRef.current = null;
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [layers]);

  const handleLayerMouseDown = (e, layerId) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveLayerId(layerId);
    isDraggingRef.current = true;
    activeDragLayerIdRef.current = layerId;
    
    const container = e.currentTarget.closest(".social-canvas-container");
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    containerRectRef.current = rect;
    
    const layer = layers.find(l => l.id === layerId);
    if (layer) {
      const clickXPercent = ((e.clientX - rect.left) / rect.width) * 100;
      const clickYPercent = ((e.clientY - rect.top) / rect.height) * 100;
      dragStartPosRef.current = {
        offsetX: clickXPercent - layer.x,
        offsetY: clickYPercent - layer.y
      };
    }
  };

  const downloadPlatformPost = (key) => {
    const platform = PLATFORMS[key];
    if (!platform) return;
    
    let exportW = 1080;
    let exportH = 1080;
    if (key === "reels") {
      exportW = 1080;
      exportH = 1920;
    } else if (key === "youtube") {
      exportW = 1920;
      exportH = 1080;
    } else if (key === "facebook") {
      exportW = 1600;
      exportH = 500;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext("2d");
    
    const grad = ctx.createLinearGradient(0, 0, exportW, exportH);
    const colorMatches = bgGradient.match(/#[0-9a-fA-F]{6}|rgba?\([^)]+\)/g);
    if (colorMatches && colorMatches.length >= 2) {
      colorMatches.forEach((color, idx) => {
        const stop = idx / (colorMatches.length - 1);
        grad.addColorStop(stop, color);
      });
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = "#6366f1";
    }
    ctx.fillRect(0, 0, exportW, exportH);
    
    layers.forEach(layer => {
      ctx.save();
      const pX = (layer.x / 100) * exportW;
      const pY = (layer.y / 100) * exportH;
      
      ctx.translate(pX, pY);
      
      ctx.fillStyle = layer.color || "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      const fontSize = layer.size * (exportW / 400);
      
      if (layer.type === "text") {
        const fontFamily = layer.font === "Syne" ? "Syne, sans-serif" : "Poppins, sans-serif";
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillText(layer.text, 0, 0);
      } else {
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillText(layer.shape, 0, 0);
      }
      ctx.restore();
    });
    
    const imgUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${projectTitle.replace(/\s+/g, "_")}_${key}.png`;
    link.href = imgUrl;
    link.click();
  };

  const addTextLayer = () => {
    const id = `text_${Date.now()}`;
    setLayers(prev => [...prev, { id, type: "text", text: "NEW OVERLAY", x: 50, y: 50, size: 20, color: "#ffffff", font: "Poppins" }]);
    setActiveLayerId(id);
  };

  const addStickerLayer = (shape) => {
    const id = `sticker_${Date.now()}`;
    setLayers(prev => [...prev, { id, type: "sticker", shape, x: 50, y: 60, size: 45, color: "#f5c842" }]);
    setActiveLayerId(id);
  };

  const updateLayer = (id, prop, val) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, [prop]: val } : l));
  };

  const deleteLayer = (id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `social_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Campaign Design",
      category: "Social Post",
      tool: "Social Studio",
      year: new Date().getFullYear().toString(),
      accent: "#c49a6c",
      gradient: "linear-gradient(135deg, #1c150e 0%, #3a2818 50%, #0c0a09 100%)",
      image: "",
      icon: "📱",
      tags: ["Stories · Reels", `${layers.length} Layers`, "Multi-Ratio"],
      desc: `Social media campaign with scheduled publish time and ${layers.length} graphic layers.`,
      data: {
        caption,
        bgGradient,
        layers,
        scheduleDate,
        scheduleTime,
        isScheduled
      }
    };

    if (existingIdx > -1) {
      savedWorks[existingIdx] = projectData;
    } else {
      savedWorks.unshift(projectData);
    }
    localStorage.setItem("creatify_past_works", JSON.stringify(savedWorks));

    const token = localStorage.getItem("creatify_token");
    if (token) {
      fetch((window.API_URL || "http://localhost:3001") + "/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Server rejected save");
        console.log("Saved social project to DB successfully");
      })
      .catch(err => {
        console.error("DB save error:", err.message);
      })
      .finally(() => {
        onBack();
      });
    } else {
      onBack();
    }
  };

  const handleDiscardAndExit = () => {
    onBack();
  };

  const activeLayer = layers.find(l => l.id === activeLayerId);

  // Render content elements inside standard percentage coordinates for dynamic canvas resizing
  const renderCanvasContent = (width, height) => {
    return (
      <div style={{ width: "100%", height: "100%", position: "relative", background: bgGradient, overflow: "hidden" }}>
        {layers.map(layer => {
          const lX = `${layer.x}%`;
          const lY = `${layer.y}%`;
          const isActive = layer.id === activeLayerId;
          return (
            <div
              key={layer.id}
              onClick={(e) => { e.stopPropagation(); setActiveLayerId(layer.id); }}
              onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
              style={{
                position: "absolute",
                left: lX,
                top: lY,
                transform: "translate(-50%, -50%)",
                cursor: "grab",
                border: isActive ? "1px dashed #f5c842" : "1px dashed transparent",
                padding: "4px",
                borderRadius: "4px",
                transition: "border 0.2s",
                userSelect: "none"
              }}
            >
              {layer.type === "text" ? (
                <span style={{
                  color: layer.color,
                  fontSize: `${layer.size * (width / 400)}px`,
                  fontFamily: layer.font === "Syne" ? "Syne, sans-serif" : "Poppins, sans-serif",
                  fontWeight: "bold",
                  whiteSpace: "nowrap",
                  textAlign: "center"
                }}>
                  {layer.text}
                </span>
              ) : (
                <span style={{
                  color: layer.color,
                  fontSize: `${layer.size * (width / 400)}px`,
                  userSelect: "none"
                }}>
                  {layer.shape}
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header Toolbar */}
      <div style={{ height: "54px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "6px 14px", fontSize: "11px" }}>Exit</button>
          <div style={{ width: "1px", height: "18px", background: "rgba(212,165,116,0.15)" }} />
          <span style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 800 }}>SocialStudio</span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input 
            type="text" 
            value={projectTitle} 
            onChange={e => setProjectTitle(e.target.value)} 
            style={{ background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "6px 12px", fontSize: "12px", outline: "none", width: "180px" }}
            placeholder="Campaign Name"
          />
        </div>

        <button onClick={handleSaveAndExit} className="tool-btn primary" style={{ background: "linear-gradient(135deg,#c49a6c,#8b5a2b)", border: "none", color: "#fff", padding: "6px 16px", fontSize: "12px" }}>
          Save Campaign
        </button>
      </div>

      {/* Main Studio Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Controls */}
        <div style={{ width: "320px", minWidth: "320px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", overflowY: "auto", padding: "20px", gap: "20px" }}>
          
          {/* Caption editor */}
          <div>
            <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>CAMPAIGN CAPTION</span>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              style={{ width: "100%", height: "80px", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "8px 12px", fontSize: "11.5px", resize: "none", outline: "none", lineHeight: 1.5 }}
              placeholder="Write post hashtags and description..."
            />
          </div>

          {/* Canvas styling */}
          <div>
            <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>CANVAS BACKDROP</span>
            <select
              value={bgGradient}
              onChange={e => setBgGradient(e.target.value)}
              style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", fontSize: "12px", padding: "8px" }}
            >
              <option value="linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)">Sunset Purple</option>
              <option value="linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)">Ocean Blue</option>
              <option value="linear-gradient(135deg, #111827 0%, #374151 100%)">Minimalist Charcoal</option>
              <option value="linear-gradient(135deg, #059669 0%, #10b981 100%)">Emerald Forest</option>
              <option value="linear-gradient(135deg, #d97706 0%, #f59e0b 100%)">Neon Amber</option>
            </select>
          </div>

          {/* Insert Overlays */}
          <div>
            <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>INSERT GRAPHICS</span>
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <button onClick={addTextLayer} className="tool-btn" style={{ flex: 1, padding: "6px", fontSize: "11px", justifyContent: "center" }}>+ Text Layer</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
              {["✦", "★", "●", "♥", "♦", "▲", "■", "⚙"].map(sh => (
                <button
                  key={sh}
                  onClick={() => addStickerLayer(sh)}
                  className="tool-btn"
                  style={{ padding: "6px 0", justifyContent: "center", fontSize: "14px" }}
                >
                  {sh}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Publisher Scheduler */}
          <div>
            <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>CAMPAIGN SCHEDULER</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(212,165,116,0.08)", borderRadius: "10px", padding: "10px" }}>
              <label style={{ fontSize: "10px", color: "#8c8780" }}>Publish Date</label>
              <input
                type="date"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11.5px" }}
              />
              <label style={{ fontSize: "10px", color: "#8c8780" }}>Publish Time</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11.5px" }}
              />
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className={`tool-btn ${isScheduled ? "primary" : ""}`}
                style={{
                  marginTop: "6px",
                  justifyContent: "center",
                  padding: "8px",
                  fontSize: "11px",
                  background: isScheduled ? "linear-gradient(135deg,#c49a6c,#8b5a2b)" : "rgba(255,255,255,0.02)",
                  border: isScheduled ? "none" : "1px solid rgba(212,165,116,0.15)"
                }}
              >
                {isScheduled ? "✓ Scheduled to Queue" : "⚡ Queue campaign publishing"}
              </button>
            </div>
          </div>
        </div>

        {/* Center: Multi-Ratio Workspace Grid */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", overflowY: "auto", padding: "40px", alignItems: "center" }}>
          
          <div style={{ width: "100%", maxWidth: "1000px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div>
              <h3 style={{ fontFamily: "Syne", fontSize: "20px", fontWeight: 800, color: "#fff", margin: 0 }}>Omni-Channel Canvas</h3>
              <p style={{ fontSize: "11px", color: "#666", margin: "4px 0 0" }}>Editing renders live layouts across all four target dimensions. Click a card to preview on phone feed simulators.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", width: "100%", maxWidth: "1000px" }}>
            
            {Object.keys(PLATFORMS).map(key => {
              const platform = PLATFORMS[key];
              return (
                <div
                  key={key}
                  onClick={() => setPreviewPlatform(key)}
                  style={{
                    background: "rgba(10,8,7,0.5)",
                    border: "1px solid rgba(212,165,116,0.1)",
                    borderRadius: "16px",
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    position: "relative"
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(212,165,116,0.3)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(212,165,116,0.1)"}
                >
                  <div style={{ width: "100%", display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "11px", color: "#8c8780" }}>
                    <span style={{ fontWeight: 600, color: "#fff" }}>{platform.name}</span>
                    <span>{platform.ratio}</span>
                  </div>

                  <div 
                    className="social-canvas-container"
                    style={{ width: `${platform.w}px`, height: `${platform.h}px`, borderRadius: "10px", overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}
                  >
                    {renderCanvasContent(platform.w, platform.h)}
                  </div>

                  <div style={{ marginTop: "12px", display: "flex", gap: "10px", width: "100%", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "#5c5650" }}>
                      {platform.desc}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPlatformPost(key);
                      }}
                      className="tool-btn primary"
                      style={{
                        padding: "4px 10px",
                        fontSize: "10px",
                        background: "linear-gradient(135deg,#c49a6c,#8b5a2b)",
                        border: "none",
                        color: "#fff"
                      }}
                    >
                      Download PNG
                    </button>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        {/* Right Sidebar: Active Layer Inspector */}
        <div style={{ width: "280px", minWidth: "280px", borderLeft: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", padding: "20px", gap: "16px" }}>
          <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em" }}>LAYER PROPERTIES</span>

          {activeLayer ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#fff", fontWeight: 600 }}>{activeLayer.id}</span>
                <button onClick={() => deleteLayer(activeLayer.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕ Delete</button>
              </div>

              {activeLayer.type === "text" && (
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Text Value</label>
                  <input
                    type="text"
                    value={activeLayer.text}
                    onChange={e => updateLayer(activeLayer.id, "text", e.target.value)}
                    style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                  />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Position X (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={activeLayer.x}
                    onChange={e => updateLayer(activeLayer.id, "x", parseInt(e.target.value) || 0)}
                    style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Position Y (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={activeLayer.y}
                    onChange={e => updateLayer(activeLayer.id, "y", parseInt(e.target.value) || 0)}
                    style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "10px" }}>
                  <span style={{ color: "#8c8780" }}>Scale Size</span>
                  <span style={{ color: "#c49a6c" }}>{activeLayer.size}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={activeLayer.size}
                  onChange={e => updateLayer(activeLayer.id, "size", parseInt(e.target.value))}
                  style={{ width: "100%" }}
                  className="filter-slider"
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Color</label>
                <input
                  type="color"
                  value={activeLayer.color}
                  onChange={e => updateLayer(activeLayer.id, "color", e.target.value)}
                  style={{ width: "100%", height: "26px", border: "none", background: "none", cursor: "pointer" }}
                />
              </div>

              {activeLayer.type === "text" && (
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Font Family</label>
                  <select
                    value={activeLayer.font || "Poppins"}
                    onChange={e => updateLayer(activeLayer.id, "font", e.target.value)}
                    style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "6px" }}
                  >
                    <option value="Poppins">Poppins</option>
                    <option value="Syne">Syne</option>
                  </select>
                </div>
              )}
            </div>
          ) : (
            <div style={{ color: "#5c5650", fontSize: "11px", textAlign: "center", marginTop: "20px" }}>
              Select a layer in the canvas preview to edit its properties.
            </div>
          )}

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)", margin: "8px 0" }} />

          {/* Vector Layers Hierarchy */}
          <div>
            <span style={{ fontSize: "10px", color: "#c49a6c", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>CAMPAIGN LAYERS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {layers.map(l => {
                const isAct = l.id === activeLayerId;
                return (
                  <div
                    key={l.id}
                    onClick={() => setActiveLayerId(l.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 10px",
                      borderRadius: "6px",
                      background: isAct ? "rgba(196,154,108,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isAct ? "#c49a6c" : "rgba(255,255,255,0.05)"}`,
                      cursor: "pointer",
                      fontSize: "11px"
                    }}
                  >
                    <span>{l.type === "text" ? "T" : "✦"}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.type === "text" ? l.text : `Sticker (${l.shape})`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(12px)" }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>📱</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>Save social campaign?</h3>
            <p style={{ fontSize: "13px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px" }}>
              Would you like to save this campaign to your past works database, or discard your current workspace edits?
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="tool-btn primary" onClick={handleSaveAndExit} style={{ justifyContent: "center", padding: "12px", fontSize: "13px" }}>
                Save & Exit to Dashboard
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="tool-btn danger" onClick={handleDiscardAndExit} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12px" }}>
                  Discard Edits
                </button>
                <button className="tool-btn" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Preview Simulator Modal */}
      {previewPlatform && (
        <div onClick={() => setPreviewPlatform(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 998, backdropFilter: "blur(10px)", padding: "20px" }}>
          
          <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "360px", height: "720px", background: "#000000", border: "12px solid #222", borderRadius: "48px", boxShadow: "0 25px 60px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            
            {/* Phone Notch/Island */}
            <div style={{ position: "absolute", top: "0", left: "50%", transform: "translateX(-50%)", width: "110px", height: "30px", background: "#000", borderRadius: "0 0 20px 20px", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#111", border: "2px solid #222" }} />
            </div>

            {/* Phone status bar */}
            <div style={{ height: "40px", padding: "0 24px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#fff", zIndex: 999 }}>
              <span>9:41</span>
              <div style={{ display: "flex", gap: "6px" }}>
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>

            {/* Platform Mockup App interface wrapper */}
            {previewPlatform === "instagram" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#000", color: "#fff" }}>
                <div style={{ height: "44px", borderBottom: "1px solid #1f1f1f", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold", fontFamily: "sans-serif", fontSize: "16px" }}>Instagram</span>
                  <span>💬</span>
                </div>
                {/* Scrollable feed content */}
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(45deg, #f5c842, #ec4899)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px" }}>👤</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: "bold" }}>{user?.name || "your_brand"}</div>
                      <div style={{ fontSize: "9px", color: "#999" }}>Sponsored</div>
                    </div>
                  </div>

                  <div style={{ width: "100%", aspectRatio: "1/1", overflow: "hidden" }}>
                    {renderCanvasContent(336, 336)}
                  </div>

                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "18px", marginBottom: "8px" }}>
                      <div style={{ display: "flex", gap: "14px" }}>
                        <span>❤️</span>
                        <span>💬</span>
                        <span>✈️</span>
                      </div>
                      <span>🔖</span>
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>1,234 likes</div>
                    <div style={{ fontSize: "12px", lineHeight: 1.4 }}>
                      <span style={{ fontWeight: "bold", marginRight: "6px" }}>{user?.name || "your_brand"}</span>
                      {caption}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewPlatform === "reels" && (
              <div style={{ flex: 1, position: "relative", background: "#000" }}>
                {/* Viewport filling 9:16 layout */}
                <div style={{ width: "100%", height: "100%" }}>
                  {renderCanvasContent(336, 680)}
                </div>
                {/* Reels Overlay items */}
                <div style={{ position: "absolute", bottom: "40px", left: "16px", right: "60px", zIndex: 10, color: "#fff", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#000", fontSize: "10px" }}>👤</div>
                    <span style={{ fontSize: "12px", fontWeight: "bold" }}>{user?.name || "your_brand"}</span>
                    <button style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "10px" }}>Follow</button>
                  </div>
                  <p style={{ fontSize: "11px", margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>{caption}</p>
                </div>

                <div style={{ position: "absolute", right: "12px", bottom: "80px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", zIndex: 10 }}>
                  <div style={{ fontSize: "20px" }}>❤️<div style={{ fontSize: "9px", textAlign: "center", color: "#fff" }}>Likes</div></div>
                  <div style={{ fontSize: "20px" }}>💬<div style={{ fontSize: "9px", textAlign: "center", color: "#fff" }}>Reply</div></div>
                  <div style={{ fontSize: "20px" }}>✈️<div style={{ fontSize: "9px", textAlign: "center", color: "#fff" }}>Share</div></div>
                </div>
              </div>
            )}

            {previewPlatform === "youtube" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0f0f0f", color: "#fff" }}>
                <div style={{ height: "44px", borderBottom: "1px solid #272727", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold", fontSize: "15px" }}>YouTube</span>
                  <span>🔍</span>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden" }}>
                    {renderCanvasContent(336, 189)}
                  </div>
                  <div style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", lineHeight: 1.4 }}>{projectTitle}</div>
                    <div style={{ fontSize: "11px", color: "#aaa", marginTop: "4px" }}>{user?.name || "your_channel"} · 10K views · 2 hours ago</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px", borderTop: "1px solid #272727", paddingTop: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#444" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "12px", fontWeight: "bold" }}>{user?.name || "your_channel"}</div>
                        <div style={{ fontSize: "10px", color: "#aaa" }}>1.2M subscribers</div>
                      </div>
                      <button style={{ background: "#cc0000", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", fontWeight: "bold" }}>Subscribe</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {previewPlatform === "facebook" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#18191a", color: "#e4e6eb" }}>
                <div style={{ height: "44px", background: "#242526", display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold", fontSize: "16px", color: "#1877f2" }}>facebook</span>
                  <span>💬</span>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {/* Banner is Cover photo */}
                  <div style={{ width: "100%", height: "120px", overflow: "hidden", position: "relative" }}>
                    {renderCanvasContent(336, 120)}
                  </div>
                  {/* Page header styling */}
                  <div style={{ padding: "16px", position: "relative", borderBottom: "1px solid #3e4042" }}>
                    <div style={{ width: "68px", height: "68px", borderRadius: "50%", border: "4px solid #18191a", background: "#3a3b3c", position: "absolute", top: "-34px", left: "16px", overflow: "hidden" }} />
                    <div style={{ marginTop: "40px" }}>
                      <h4 style={{ fontSize: "18px", fontWeight: "bold", margin: 0 }}>{user?.name || "your_brand"}</h4>
                      <p style={{ fontSize: "11px", color: "#b0b3b8", margin: "4px 0 0" }}>Marketing Agency · @yourbrand</p>
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                      <button style={{ flex: 1, background: "#1877f2", border: "none", color: "#fff", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>✓ Liked</button>
                      <button style={{ flex: 1, background: "#3a3b3c", border: "none", color: "#fff", padding: "8px", borderRadius: "6px", fontSize: "11px", fontWeight: "bold" }}>Message</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Back to Campaign button */}
            <div style={{ height: "44px", borderTop: "1px solid #1f1f1f", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", zIndex: 1001 }}>
              <span style={{ fontSize: "11px", color: "#8c8780", fontWeight: 500 }}>Tap anywhere outside to exit preview</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
