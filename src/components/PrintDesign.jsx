import { useState, useEffect, useRef } from "react";

const PRINT_PRESETS = {
  a4: { name: "A4 Flyer", width: 210, height: 297, ratio: 210/297, pxW: 360, pxH: 509, bleed: 3, margin: 15 },
  card_h: { name: "Business Card (H)", width: 85, height: 55, ratio: 85/55, pxW: 440, pxH: 284, bleed: 2, margin: 5 },
  card_v: { name: "Business Card (V)", width: 55, height: 85, ratio: 55/85, pxW: 284, pxH: 440, bleed: 2, margin: 5 }
};

export default function PrintDesign({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "Corporate Flyer Design";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeSize, setActiveSize] = useState("a4");
  const [showBleed, setShowBleed] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  
  // CMYK Simulated Color Space Toggle
  const [cmykPreview, setCmykPreview] = useState(false);

  const [layers, setLayers] = useState([
    { id: "frame_border", type: "shape", shape: "border", x: 50, y: 50, w: 90, h: 90, color: "#8b5a2b" },
    { id: "text_title", type: "text", text: "ANNUAL SUMMIT", x: 50, y: 25, size: 24, color: "#1e3a8a", font: "Syne" },
    { id: "text_subtitle", type: "text", text: "Innovating the future of design and technology", x: 50, y: 32, size: 11, color: "#8b5a2b", font: "Poppins" },
    { id: "sticker_badge", type: "shape", shape: "shield", x: 50, y: 60, w: 20, h: 20, color: "#d4a574" }
  ]);
  const [activeLayerId, setActiveLayerId] = useState("text_title");

  const canvasRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.activeSize) setActiveSize(d.activeSize);
      if (d.layers) setLayers(d.layers);
      if (d.showBleed !== undefined) setShowBleed(d.showBleed);
      if (d.showMargins !== undefined) setShowMargins(d.showMargins);
      if (d.cmykPreview !== undefined) setCmykPreview(d.cmykPreview);
    }
  }, [initialProject]);

  const addTextLayer = () => {
    const id = `text_${Date.now()}`;
    setLayers(prev => [...prev, { id, type: "text", text: "PRINT READY", x: 50, y: 50, size: 16, color: "#111111", font: "Poppins" }]);
    setActiveLayerId(id);
  };

  const addShapeLayer = (shape) => {
    const id = `shape_${Date.now()}`;
    setLayers(prev => [...prev, { id, type: "shape", shape, x: 50, y: 55, w: 20, h: 20, color: "#8b5a2b" }]);
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
    const projectId = initialProject?.id || `print_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Print Layout",
      category: "Print Layout",
      tool: "Print Design",
      year: new Date().getFullYear().toString(),
      accent: "#8b5a2b",
      gradient: "linear-gradient(135deg, #1c0f0f 0%, #3d1a1a 50%, #8b5a2b30 100%)",
      image: "",
      icon: "🖨️",
      tags: ["Print-ready PDF", `${layers.length} Elements`, activeSize.toUpperCase()],
      desc: `High-res flyer print layout with bleed/margin markers and ${layers.length} elements.`,
      data: {
        activeSize,
        layers,
        showBleed,
        showMargins,
        cmykPreview
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
        console.log("Saved print layout to DB successfully");
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

  const exportHighResPNG = () => {
    const preset = PRINT_PRESETS[activeSize];
    let exportW = 2480;
    let exportH = 3508;
    if (activeSize === "card_h") {
      exportW = 1004;
      exportH = 650;
    } else if (activeSize === "card_v") {
      exportW = 650;
      exportH = 1004;
    }
    
    const canvas = document.createElement("canvas");
    canvas.width = exportW;
    canvas.height = exportH;
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, exportW, exportH);
    
    layers.forEach(layer => {
      ctx.save();
      const pX = (layer.x / 100) * exportW;
      const pY = (layer.y / 100) * exportH;
      ctx.translate(pX, pY);
      
      ctx.fillStyle = layer.color || "#000000";
      ctx.strokeStyle = layer.color || "#000000";
      
      if (layer.type === "text") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const fontFamily = layer.font === "Syne" ? "Syne, sans-serif" : "Poppins, sans-serif";
        const fontSize = layer.size * (exportW / preset.pxW);
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
        ctx.fillText(layer.text, 0, 0);
      } else if (layer.type === "shape") {
        const w = layer.w * (exportW / 100);
        const h = layer.h * (exportH / 100);
        
        if (layer.shape === "border") {
          ctx.lineWidth = 6 * (exportW / 1000);
          ctx.strokeRect(-w/2, -h/2, w, h);
          const gap = 12 * (exportW / 1000);
          ctx.strokeRect(-w/2 + gap, -h/2 + gap, w - gap * 2, h - gap * 2);
        } else if (layer.shape === "shield") {
          const path = new Path2D("M 50,5 C 70,5 90,15 90,40 C 90,70 65,90 50,95 C 35,90 10,70 10,40 C 10,15 30,5 50,5 Z");
          ctx.save();
          ctx.translate(-w/2, -h/2);
          ctx.scale(w / 100, h / 100);
          ctx.fill(path);
          ctx.restore();
        } else if (layer.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(w, h) / 2, 0, 2 * Math.PI);
          ctx.fill();
        } else if (layer.shape === "badge") {
          const radius = Math.min(w, h) / 2;
          ctx.lineWidth = 4 * (exportW / 1000);
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, 2 * Math.PI);
          ctx.stroke();
          
          ctx.save();
          ctx.setLineDash([8, 6]);
          ctx.beginPath();
          ctx.arc(0, 0, radius * 0.8, 0, 2 * Math.PI);
          ctx.stroke();
          ctx.restore();
        }
      }
      ctx.restore();
    });
    
    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${projectTitle.replace(/\s+/g, "_")}_highres.png`;
    link.href = pngUrl;
    link.click();
  };

  const triggerPrint = () => {
    window.print();
  };

  // Dragging event handlers
  const handleMouseDown = (e, layerId) => {
    e.stopPropagation();
    setActiveLayerId(layerId);
    isDraggingRef.current = true;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    const element = layers.find(l => l.id === layerId);
    if (element) {
      dragOffsetRef.current = { x: clickX - element.x, y: clickY - element.y };
    }
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !activeLayerId) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setLayers(prev => prev.map(l => {
      if (l.id === activeLayerId) {
        const newX = Math.min(100, Math.max(0, Math.round(x - dragOffsetRef.current.x)));
        const newY = Math.min(100, Math.max(0, Math.round(y - dragOffsetRef.current.y)));
        return { ...l, x: newX, y: newY };
      }
      return l;
    }));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const activePreset = PRINT_PRESETS[activeSize];
  const activeLayer = layers.find(l => l.id === activeLayerId);

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print-canvas-sheet, .print-canvas-sheet * {
            visibility: visible;
          }
          .print-canvas-sheet {
            position: absolute;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Hide bleed lines and safe margins in print output */
          div[style*="border: 1.5px dashed rgb(239, 68, 68)"],
          div[style*="border: 1px dashed"] {
            display: none !important;
          }
        }
      ` }} />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header Toolbar */}
      <div style={{ height: "54px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "6px 14px", fontSize: "11px" }}>Exit</button>
          <div style={{ width: "1px", height: "18px", background: "rgba(212,165,116,0.15)" }} />
          <span style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 800 }}>PrintStudio</span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input 
            type="text" 
            value={projectTitle} 
            onChange={e => setProjectTitle(e.target.value)} 
            style={{ background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "6px 12px", fontSize: "12px", outline: "none", width: "220px" }}
            placeholder="Document Name"
          />
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={exportHighResPNG} className="tool-btn" style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#fff", background: "rgba(255,255,255,0.02)", padding: "6px 14px", fontSize: "12px" }}>
            Export High-Res PNG
          </button>
          <button onClick={triggerPrint} className="tool-btn" style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#fff", background: "rgba(255,255,255,0.02)", padding: "6px 14px", fontSize: "12px" }}>
            Print / PDF
          </button>
          <button onClick={handleSaveAndExit} className="tool-btn primary" style={{ background: "linear-gradient(135deg,#8b5a2b,#5c4028)", border: "none", color: "#fff", padding: "6px 16px", fontSize: "12px" }}>
            Save Layout
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Controls */}
        <div style={{ width: "300px", minWidth: "300px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", overflowY: "auto", padding: "20px", gap: "20px" }}>
          
          {/* Preset size selector */}
          <div>
            <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>LAYOUT SIZE</span>
            <select
              value={activeSize}
              onChange={e => {
                setActiveSize(e.target.value);
                setActiveLayerId(null);
              }}
              style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", fontSize: "12px", padding: "8px" }}
            >
              <option value="a4">A4 Flyer (210 x 297 mm)</option>
              <option value="card_h">Business Card (85 x 55 mm)</option>
              <option value="card_v">Business Card (55 x 85 mm)</option>
            </select>
          </div>

          {/* Guidelines toggles */}
          <div>
            <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>PRINT GUIDELINES</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "11px", color: "#8c8780", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" checked={showBleed} onChange={e => setShowBleed(e.target.checked)} style={{ accentColor: "#8b5a2b" }} />
                Show Bleed Line (3mm)
              </label>
              <label style={{ fontSize: "11px", color: "#8c8780", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="checkbox" checked={showMargins} onChange={e => setShowMargins(e.target.checked)} style={{ accentColor: "#8b5a2b" }} />
                Show Safe Margins
              </label>
            </div>
          </div>

          {/* CMYK color space simulator */}
          <div>
            <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>COLOR SPACE ENGINE</span>
            <button
              onClick={() => setCmykPreview(!cmykPreview)}
              className={`tool-btn ${cmykPreview ? "primary" : ""}`}
              style={{
                width: "100%",
                justifyContent: "center",
                padding: "10px",
                fontSize: "11.5px",
                background: cmykPreview ? "linear-gradient(135deg,#8b5a2b,#5c4028)" : "rgba(255,255,255,0.02)",
                border: cmykPreview ? "none" : "1px solid rgba(212,165,116,0.15)"
              }}
            >
              {cmykPreview ? "✓ Simulating CMYK Inks" : "📺 RGB Screen Mode (Switch to CMYK)"}
            </button>
            <span style={{ fontSize: "9px", color: "#5c5650", display: "block", marginTop: "4px", lineHeight: 1.3 }}>
              CMYK preview simulates paper printing properties by slightly desaturating screen-emitted RGB tones.
            </span>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Insert graphical overlays */}
          <div>
            <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>INSERT ASSETS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button onClick={addTextLayer} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>+ Text Layer</button>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button onClick={() => addShapeLayer("border")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Border Frame</button>
                <button onClick={() => addShapeLayer("shield")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Shield Vector</button>
                <button onClick={() => addShapeLayer("circle")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Circle</button>
                <button onClick={() => addShapeLayer("badge")} className="tool-btn" style={{ padding: "6px", fontSize: "11px", justifyContent: "center" }}>Badge</button>
              </div>
            </div>
          </div>

        </div>

        {/* Center: Vector Canvas Workspace with Bleed guidelines */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", overflowY: "auto", padding: "40px", alignItems: "center", justifyContent: "center" }}>
          
          {/* Main workspace container */}
          <div style={{ position: "relative" }}>
            
            {/* Visual Red Bleed Guide (3mm crop marker boundary) */}
            {showBleed && (
              <div style={{
                position: "absolute",
                top: "-12px",
                left: "-12px",
                right: "-12px",
                bottom: "-12px",
                border: "1.5px dashed #ef4444",
                borderRadius: "4px",
                pointerEvents: "none"
              }}>
                <span style={{ position: "absolute", top: "-18px", left: "0", fontSize: "9px", color: "#ef4444", fontWeight: 600 }}>3mm Crop Bleed Limit</span>
              </div>
            )}

            {/* Print canvas sheets */}
            <div
              ref={canvasRef}
              className="print-canvas-sheet"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{
                width: `${activePreset.pxW}px`,
                height: `${activePreset.pxH}px`,
                background: "#ffffff",
                boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s",
                // CMYK Desaturation Filter
                filter: cmykPreview ? "saturate(0.68) contrast(1.02) brightness(0.97)" : "none"
              }}
            >
              {/* Layout Content Layers */}
              {layers.map(layer => {
                const isActive = layer.id === activeLayerId;
                
                return (
                  <div
                    key={layer.id}
                    onMouseDown={(e) => handleMouseDown(e, layer.id)}
                    style={{
                      position: "absolute",
                      left: `${layer.x}%`,
                      top: `${layer.y}%`,
                      transform: "translate(-50%, -50%)",
                      cursor: "grab",
                      outline: isActive ? "1.5px dashed #8b5a2b" : "none",
                      padding: "4px"
                    }}
                  >
                    
                    {layer.type === "text" && (
                      <span style={{
                        color: layer.color,
                        fontSize: `${layer.size}px`,
                        fontFamily: layer.font === "Syne" ? "Syne, sans-serif" : "Poppins, sans-serif",
                        fontWeight: "bold",
                        whiteSpace: "nowrap",
                        userSelect: "none"
                      }}>
                        {layer.text}
                      </span>
                    )}

                    {layer.type === "shape" && layer.shape === "border" && (
                      <div style={{
                        width: `${layer.w * 3.5}px`,
                        height: `${layer.h * 4.8}px`,
                        border: `3px double ${layer.color}`,
                        pointerEvents: "none"
                      }} />
                    )}

                    {layer.type === "shape" && layer.shape === "shield" && (
                      <svg width={`${layer.w * 3}px`} height={`${layer.h * 3}px`} viewBox="0 0 100 100">
                        <path d="M 50,5 C 70,5 90,15 90,40 C 90,70 65,90 50,95 C 35,90 10,70 10,40 C 10,15 30,5 50,5 Z" fill={layer.color} />
                      </svg>
                    )}

                    {layer.type === "shape" && layer.shape === "circle" && (
                      <div style={{
                        width: `${layer.w * 3}px`,
                        height: `${layer.h * 3}px`,
                        borderRadius: "50%",
                        background: layer.color
                      }} />
                    )}

                    {layer.type === "shape" && layer.shape === "badge" && (
                      <div style={{
                        width: `${layer.w * 3.5}px`,
                        height: `${layer.h * 3.5}px`,
                        borderRadius: "50%",
                        border: `2px solid ${layer.color}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: `${layer.color}15`
                      }}>
                        <div style={{ width: "80%", height: "80%", borderRadius: "50%", border: `1px dashed ${layer.color}` }} />
                      </div>
                    )}

                  </div>
                );
              })}

              {/* Visual margin guidelines inside the print layout */}
              {showMargins && (
                <div style={{
                  position: "absolute",
                  top: `${activePreset.margin}px`,
                  left: `${activePreset.margin}px`,
                  right: `${activePreset.margin}px`,
                  bottom: `${activePreset.margin}px`,
                  border: "1px dashed rgba(139,90,43,0.15)",
                  pointerEvents: "none"
                }}>
                  <span style={{ position: "absolute", top: "4px", left: "6px", fontSize: "7px", color: "rgba(139,90,43,0.3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Safe print margin</span>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Sidebar: Active Layer Editor */}
        <div style={{ width: "280px", minWidth: "280px", borderLeft: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", padding: "20px", gap: "16px" }}>
          
          <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em" }}>ELEMENT INSPECTOR</span>

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

              {activeLayer.type === "text" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "10px" }}>
                    <span style={{ color: "#8c8780" }}>Font Size</span>
                    <span style={{ color: "#8b5a2b" }}>{activeLayer.size}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="60"
                    value={activeLayer.size}
                    onChange={e => updateLayer(activeLayer.id, "size", parseInt(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Width</label>
                    <input
                      type="number"
                      value={activeLayer.w}
                      onChange={e => updateLayer(activeLayer.id, "w", parseInt(e.target.value) || 5)}
                      style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Height</label>
                    <input
                      type="number"
                      value={activeLayer.h}
                      onChange={e => updateLayer(activeLayer.id, "h", parseInt(e.target.value) || 5)}
                      style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Color Tint</label>
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
              Select any design element to configure bleed position and margins.
            </div>
          )}

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)", margin: "8px 0" }} />

          {/* Layer Hierarchy */}
          <div>
            <span style={{ fontSize: "10px", color: "#8b5a2b", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>DOCUMENT LAYERS</span>
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
                      background: isAct ? "rgba(139,90,43,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isAct ? "#8b5a2b" : "rgba(255,255,255,0.05)"}`,
                      cursor: "pointer",
                      fontSize: "11px"
                    }}
                  >
                    <span>{l.type === "text" ? "T" : "●"}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.type === "text" ? l.text : `Shape (${l.shape})`}
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
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🖨️</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>Save print layout?</h3>
            <p style={{ fontSize: "13px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px" }}>
              Would you like to save this print layout design to your works database, or discard your current layout session?
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

    </div>
  );
}
