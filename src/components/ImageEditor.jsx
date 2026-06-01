import { useState, useRef, useEffect } from "react";

const STOCK_IMAGES = [
  { id: "img1", name: "Nordic Minimal", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80" },
  { id: "img2", name: "Cyber Tokyo", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80" },
  { id: "img3", name: "Sunset Horizon", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80" }
];

export default function ImageEditor({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "Untitled Artwork";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeTool, setActiveTool] = useState("select"); // select | brush | text
  const [zoom, setZoom] = useState(1);

  // Filters State
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hue, setHue] = useState(0);
  const [blur, setBlur] = useState(0);
  const [invert, setInvert] = useState(0);

  // Layers State (Dynamic stack)
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);

  // Brush settings
  const [brushColor, setBrushColor] = useState("#d4a574");
  const [brushSize, setBrushSize] = useState(8);
  const [brushOpacity, setBrushOpacity] = useState(1);

  // Text overlay input
  const [textInput, setTextInput] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(24);
  const [textFont, setTextFont] = useState("Syne");

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const isPaintingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize project if loaded
  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.filters) {
        setBrightness(d.filters.brightness ?? 100);
        setContrast(d.filters.contrast ?? 100);
        setSaturation(d.filters.saturation ?? 100);
        setHue(d.filters.hue ?? 0);
        setBlur(d.filters.blur ?? 0);
        setInvert(d.filters.invert ?? 0);
      }
      if (d.layers) {
        // Rehydrate Image elements for image layers
        const loadedLayers = d.layers.map(layer => {
          if (layer.type === "image") {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.src = layer.url;
            return { ...layer, imgEl: img };
          }
          return layer;
        });
        setLayers(loadedLayers);
        if (loadedLayers.length > 0) setActiveLayerId(loadedLayers[0].id);
      }
    } else {
      // Seed a default background image layer
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = STOCK_IMAGES[0].url;
      img.onload = () => {
        setLayers([
          {
            id: `layer_${Date.now()}`,
            name: "Background",
            type: "image",
            url: STOCK_IMAGES[0].url,
            imgEl: img,
            visible: true,
            opacity: 1,
            x: 0,
            y: 0,
            width: 600,
            height: 400
          }
        ]);
      };
    }
  }, [initialProject]);

  // Main Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply global editor filters
    const filterString = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
      hue-rotate(${hue}deg)
      blur(${blur}px)
      invert(${invert}%)
    `;
    ctx.filter = filterString;

    // Draw layers from bottom (index 0) to top
    layers.forEach(layer => {
      if (!layer.visible) return;
      ctx.globalAlpha = layer.opacity;

      if (layer.type === "image" && layer.imgEl) {
        try {
          ctx.drawImage(layer.imgEl, layer.x, layer.y, layer.width, layer.height);
        } catch (e) {
          console.warn("Canvas failed drawing layer image:", e);
        }
      } else if (layer.type === "text") {
        ctx.fillStyle = layer.color || "#ffffff";
        ctx.font = `bold ${layer.size || 24}px ${layer.font || "Poppins"}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(layer.text, layer.x, layer.y);
      } else if (layer.type === "shape") {
        ctx.fillStyle = layer.color || "#d4a574";
        ctx.strokeStyle = layer.color || "#d4a574";
        ctx.lineWidth = 3;
        const w = layer.width || 80;
        const h = layer.height || 80;
        if (layer.shape === "circle") {
          ctx.beginPath();
          ctx.arc(layer.x + w/2, layer.y + h/2, w/2, 0, Math.PI * 2);
          ctx.fill();
        } else if (layer.shape === "rect") {
          ctx.fillRect(layer.x, layer.y, w, h);
        } else if (layer.shape === "border") {
          ctx.strokeRect(layer.x, layer.y, w, h);
        } else if (layer.shape === "star") {
          ctx.beginPath();
          const cx = layer.x + w/2;
          const cy = layer.y + h/2;
          const spikes = 5;
          const outerRadius = w/2;
          const innerRadius = w/4;
          let rot = Math.PI / 2 * 3;
          let xCoords = cx;
          let yCoords = cy;
          const step = Math.PI / spikes;

          ctx.moveTo(cx, cy - outerRadius);
          for (let k = 0; k < spikes; k++) {
            xCoords = cx + Math.cos(rot) * outerRadius;
            yCoords = cy + Math.sin(rot) * outerRadius;
            ctx.lineTo(xCoords, yCoords);
            rot += step;

            xCoords = cx + Math.cos(rot) * innerRadius;
            yCoords = cy + Math.sin(rot) * innerRadius;
            ctx.lineTo(xCoords, yCoords);
            rot += step;
          }
          ctx.lineTo(cx, cy - outerRadius);
          ctx.closePath();
          ctx.fill();
        }
      } else if (layer.type === "draw" && layer.canvasEl) {
        // Draw paint strokes layer canvas
        ctx.drawImage(layer.canvasEl, 0, 0);
      }
    });

    ctx.globalAlpha = 1;
    ctx.filter = "none";

    // Draw selection border for active layer in move mode
    if (activeTool === "select" && activeLayerId) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer && activeLayer.visible) {
        ctx.strokeStyle = "#d4a574";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        
        if (activeLayer.type === "image" || activeLayer.type === "shape") {
          ctx.strokeRect(activeLayer.x, activeLayer.y, activeLayer.width || 80, activeLayer.height || 80);
        } else if (activeLayer.type === "text") {
          const textWidth = (activeLayer.text || "").length * (activeLayer.size || 24) * 0.6;
          const textHeight = activeLayer.size || 24;
          ctx.strokeRect(
            activeLayer.x - textWidth / 2 - 6,
            activeLayer.y - textHeight / 2 - 6,
            textWidth + 12,
            textHeight + 12
          );
        }
        ctx.setLineDash([]);
      }
    }
  }, [layers, activeLayerId, activeTool, brightness, contrast, saturation, hue, blur, invert]);

  // Drawing event handlers
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (activeTool === "select") {
      let clickedLayer = null;
      // Loop from top to bottom layer
      for (let i = layers.length - 1; i >= 0; i--) {
        const layer = layers[i];
        if (!layer.visible) continue;

        if (layer.type === "image" || layer.type === "shape") {
          const w = layer.width || 80;
          const h = layer.height || 80;
          if (x >= layer.x && x <= layer.x + w && y >= layer.y && y <= layer.y + h) {
            clickedLayer = layer;
            break;
          }
        } else if (layer.type === "text") {
          const textWidth = (layer.text || "").length * (layer.size || 24) * 0.6;
          const textHeight = layer.size || 24;
          const halfWidth = textWidth / 2;
          const halfHeight = textHeight / 2;
          if (x >= layer.x - halfWidth && x <= layer.x + halfWidth && y >= layer.y - halfHeight && y <= layer.y + halfHeight) {
            clickedLayer = layer;
            break;
          }
        }
      }

      if (clickedLayer) {
        setActiveLayerId(clickedLayer.id);
        isDraggingRef.current = true;
        dragOffsetRef.current = { x: x - clickedLayer.x, y: y - clickedLayer.y };
      }
      return;
    }

    if (activeTool !== "brush") return;

    isPaintingRef.current = true;
    lastPosRef.current = { x, y };

    // Get or create paint layer
    let paintLayer = layers.find(l => l.type === "draw" && l.id === activeLayerId);
    if (!paintLayer) {
      const drawCanvas = document.createElement("canvas");
      drawCanvas.width = canvas.width;
      drawCanvas.height = canvas.height;

      paintLayer = {
        id: `draw_${Date.now()}`,
        name: "Paint Layer",
        type: "draw",
        canvasEl: drawCanvas,
        visible: true,
        opacity: 1
      };
      setLayers(prev => [...prev, paintLayer]);
      setActiveLayerId(paintLayer.id);
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;

    if (activeTool === "select" && isDraggingRef.current && activeLayerId) {
      setLayers(prev => prev.map(l => {
        if (l.id === activeLayerId) {
          const newX = Math.round(x - dragOffsetRef.current.x);
          const newY = Math.round(y - dragOffsetRef.current.y);
          return { ...l, x: newX, y: newY };
        }
        return l;
      }));
      return;
    }

    if (!isPaintingRef.current || activeTool !== "brush") return;

    const activeLayer = layers.find(l => l.id === activeLayerId && l.type === "draw");
    if (!activeLayer || !activeLayer.canvasEl) return;

    const drawCtx = activeLayer.canvasEl.getContext("2d");
    drawCtx.strokeStyle = brushColor;
    drawCtx.lineWidth = brushSize;
    drawCtx.lineCap = "round";
    drawCtx.lineJoin = "round";
    drawCtx.globalAlpha = brushOpacity;

    drawCtx.beginPath();
    drawCtx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    drawCtx.lineTo(x, y);
    drawCtx.stroke();

    lastPosRef.current = { x, y };

    // Force canvas refresh
    setLayers(prev => [...prev]);
  };

  const handleMouseUp = () => {
    isPaintingRef.current = false;
    isDraggingRef.current = false;
  };

  // Add a new stock image layer
  const addStockLayer = (url) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => {
      const newLayer = {
        id: `layer_${Date.now()}`,
        name: `Layer ${layers.length + 1}`,
        type: "image",
        url,
        imgEl: img,
        visible: true,
        opacity: 1,
        x: 40,
        y: 40,
        width: 300,
        height: 200
      };
      setLayers(prev => [...prev, newLayer]);
      setActiveLayerId(newLayer.id);
    };
  };

  // File Upload layer
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      addStockLayer(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const [exportFormat, setExportFormat] = useState("png");

  // Add Shape layer
  const addShapeLayer = (shape) => {
    const newLayer = {
      id: `shape_${Date.now()}`,
      name: `Shape: ${shape}`,
      type: "shape",
      shape: shape,
      color: "#d4a574",
      visible: true,
      opacity: 1,
      x: 250,
      y: 150,
      width: 100,
      height: 100
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  // Add Text layer
  const addTextLayer = () => {
    if (!textInput.trim()) return;
    const newLayer = {
      id: `text_${Date.now()}`,
      name: `Text: ${textInput.substring(0, 10)}`,
      type: "text",
      text: textInput,
      color: textColor,
      size: textSize,
      font: textFont,
      visible: true,
      opacity: 1,
      x: 300,
      y: 200
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    setTextInput("");
  };

  // Move layer around (basic centering/adjustments)
  const adjustLayerPosition = (axis, val) => {
    setLayers(prev => prev.map(l => {
      if (l.id === activeLayerId) {
        return { ...l, [axis]: l[axis] + val };
      }
      return l;
    }));
  };

  const updateActiveLayerProp = (prop, val) => {
    setLayers(prev => prev.map(l => {
      if (l.id === activeLayerId) {
        return { ...l, [prop]: val };
      }
      return l;
    }));
  };

  // Toggle Visibility
  const toggleVisibility = (id) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  };

  // Adjust Opacity
  const adjustLayerOpacity = (id, val) => {
    setLayers(prev => prev.map(l => l.id === id ? { ...l, opacity: val } : l));
  };

  // Delete Layer
  const deleteLayer = (id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(null);
  };

  // Layer ordering
  const moveLayerOrder = (idx, dir) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= layers.length) return;
    const updated = [...layers];
    const temp = updated[idx];
    updated[idx] = updated[nextIdx];
    updated[nextIdx] = temp;
    setLayers(updated);
  };

  // Apply visual preset filter LUT
  const applyLUT = (lut) => {
    if (lut === "vintage") {
      setBrightness(95); setContrast(120); setSaturation(85); setHue(10); setBlur(0); setInvert(0);
    } else if (lut === "neon") {
      setBrightness(110); setContrast(130); setSaturation(160); setHue(-15); setBlur(0); setInvert(0);
    } else if (lut === "noir") {
      setBrightness(90); setContrast(140); setSaturation(0); setHue(0); setBlur(0); setInvert(0);
    } else if (lut === "invert") {
      setBrightness(100); setContrast(100); setSaturation(100); setHue(0); setBlur(0); setInvert(100);
    } else {
      setBrightness(100); setContrast(100); setSaturation(100); setHue(0); setBlur(0); setInvert(0);
    }
  };

  // Save changes
  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `image_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Artwork",
      category: "Image Edit",
      tool: "Image Editor",
      year: new Date().getFullYear().toString(),
      accent: "#d4a574",
      gradient: "linear-gradient(135deg, #1e1b18 0%, #30261c 50%, #0c0a09 100%)",
      image: canvasRef.current ? canvasRef.current.toDataURL() : "",
      tags: ["Canvas API", `${layers.length} Layers`, "Filters"],
      desc: `Visual canvas edit with ${layers.length} graphic layers.`,
      data: {
        filters: { brightness, contrast, saturation, hue, blur, invert },
        layers: layers.map(l => ({
          id: l.id,
          name: l.name,
          type: l.type,
          url: l.url,
          visible: l.visible,
          opacity: l.opacity,
          x: l.x,
          y: l.y,
          width: l.width,
          height: l.height,
          text: l.text,
          color: l.color,
          size: l.size,
          font: l.font
        }))
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
        console.log("Saved image project to DB successfully");
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

  // Export Canvas
  const triggerExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let url;
    if (exportFormat === "jpeg") {
      url = canvas.toDataURL("image/jpeg", 0.9);
    } else {
      url = canvas.toDataURL("image/png");
    }
    const link = document.createElement("a");
    link.download = `${projectTitle.replace(/\s+/g, "_")}.${exportFormat}`;
    link.href = url;
    link.click();
  };

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&family=Outfit:wght@400;600&display=swap" rel="stylesheet" />
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* Workspace Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Side: presets, layers, inputs */}
        <div style={{ width: "300px", minWidth: "300px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column" }}>
          {/* Header Panel Tab */}
          <div style={{ padding: "16px", borderBottom: "1px solid rgba(212,165,116,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", letterSpacing: "0.06em", color: "#d4a574", fontWeight: 700 }}>IMAGE ASSETS</span>
            <button className="tool-btn" onClick={() => fileInputRef.current.click()} style={{ padding: "4px 8px", fontSize: "10px" }}>+ Upload</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Presets library */}
            <div>
              <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>STOCK BACKDROP</span>
              <div style={{ display: "flex", gap: "8px" }}>
                {STOCK_IMAGES.map(item => (
                  <div key={item.id} onClick={() => addStockLayer(item.url)} style={{ flex: 1, height: "48px", borderRadius: "8px", overflow: "hidden", cursor: "pointer", border: "1px solid rgba(212,165,116,0.15)", position: "relative" }}>
                    <img src={item.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Brush Controls */}
            <div>
              <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>PAINT BRUSH SETTINGS</span>
              <div style={{ background: "rgba(212,165,116,0.03)", border: "1px solid rgba(212,165,116,0.1)", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px" }}>Brush Size: {brushSize}px</span>
                  <input type="range" min="2" max="40" value={brushSize} onChange={e => setBrushSize(parseInt(e.target.value))} className="filter-slider" style={{ width: "100px" }} />
                </div>
                <div style={{ display: "flex", justifyBetween: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "11px" }}>Brush Color</span>
                  <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} style={{ width: "40px", border: "none", height: "20px", background: "none", cursor: "pointer" }} />
                </div>
              </div>
            </div>

            {/* Text Overlay tool */}
            <div>
              <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>ADD TEXT ELEMENT</span>
              <div style={{ background: "rgba(212,165,116,0.03)", border: "1px solid rgba(212,165,116,0.1)", borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "8px", fontSize: "11px" }} placeholder="Enter title text..." />
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} style={{ flex: 1, height: "24px", background: "none", border: "none", cursor: "pointer" }} />
                  <select value={textFont} onChange={e => setTextFont(e.target.value)} style={{ flex: 2, background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "4px" }}>
                    <option value="Syne">Syne (Title)</option>
                    <option value="Poppins">Poppins (Sans)</option>
                    <option value="Outfit">Outfit (Clean)</option>
                  </select>
                </div>
                <button className="tool-btn" onClick={addTextLayer} style={{ justifyContent: "center", padding: "6px" }}>+ Place Text Layer</button>
              </div>
            </div>

            {/* Add Shape element */}
            <div>
              <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>ADD SHAPE / STICKER</span>
              <div style={{ background: "rgba(212,165,116,0.03)", border: "1px solid rgba(212,165,116,0.1)", borderRadius: "10px", padding: "10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                <button className="tool-btn" onClick={() => addShapeLayer("rect")} style={{ fontSize: "11px", padding: "6px", justifyContent: "center" }}>■ Rectangle</button>
                <button className="tool-btn" onClick={() => addShapeLayer("circle")} style={{ fontSize: "11px", padding: "6px", justifyContent: "center" }}>● Circle</button>
                <button className="tool-btn" onClick={() => addShapeLayer("border")} style={{ fontSize: "11px", padding: "6px", justifyContent: "center" }}>⚃ Border</button>
                <button className="tool-btn" onClick={() => addShapeLayer("star")} style={{ fontSize: "11px", padding: "6px", justifyContent: "center" }}>★ Star</button>
              </div>
            </div>

            {/* Active Layer Editor Panel */}
            {(() => {
              const activeLayer = layers.find(l => l.id === activeLayerId);
              if (!activeLayer) return null;
              return (
                <div style={{ background: "rgba(212,165,116,0.04)", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "10px", color: "#d4a574", display: "block", fontWeight: 700 }}>EDIT SELECTED LAYER</span>
                  
                  {activeLayer.type === "text" && (
                    <>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Text Value</label>
                        <input
                          type="text"
                          value={activeLayer.text || ""}
                          onChange={e => updateActiveLayerProp("text", e.target.value)}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                      
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "10px" }}>
                          <span style={{ color: "#8c8780" }}>Font Size: {activeLayer.size || 24}px</span>
                        </div>
                        <input
                          type="range"
                          min="8"
                          max="120"
                          value={activeLayer.size || 24}
                          onChange={e => updateActiveLayerProp("size", parseInt(e.target.value))}
                          className="filter-slider"
                        />
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Color</label>
                          <input
                            type="color"
                            value={activeLayer.color || "#ffffff"}
                            onChange={e => updateActiveLayerProp("color", e.target.value)}
                            style={{ width: "100%", height: "24px", background: "none", border: "none", cursor: "pointer" }}
                          />
                        </div>
                        <div style={{ flex: 2 }}>
                          <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Font</label>
                          <select
                            value={activeLayer.font || "Poppins"}
                            onChange={e => updateActiveLayerProp("font", e.target.value)}
                            style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "4px" }}
                          >
                            <option value="Syne">Syne</option>
                            <option value="Poppins">Poppins</option>
                            <option value="Outfit">Outfit</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {activeLayer.type === "image" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Width (px)</label>
                        <input
                          type="number"
                          value={activeLayer.width || 0}
                          onChange={e => updateActiveLayerProp("width", parseInt(e.target.value) || 0)}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Height (px)</label>
                        <input
                          type="number"
                          value={activeLayer.height || 0}
                          onChange={e => updateActiveLayerProp("height", parseInt(e.target.value) || 0)}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                    </div>
                  )}

                  {activeLayer.type === "shape" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Shape Color</label>
                        <input
                          type="color"
                          value={activeLayer.color || "#d4a574"}
                          onChange={e => updateActiveLayerProp("color", e.target.value)}
                          style={{ width: "100%", height: "24px", background: "none", border: "none", cursor: "pointer" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Size (px)</label>
                        <input
                          type="number"
                          value={activeLayer.width || 80}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 10;
                            updateActiveLayerProp("width", val);
                            updateActiveLayerProp("height", val);
                          }}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                    </div>
                  )}

                  {activeLayer.type !== "draw" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Pos X</label>
                        <input
                          type="number"
                          value={activeLayer.x || 0}
                          onChange={e => updateActiveLayerProp("x", parseInt(e.target.value) || 0)}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "9px", color: "#5c5650", display: "block", marginBottom: "3px" }}>Pos Y</label>
                        <input
                          type="number"
                          value={activeLayer.y || 0}
                          onChange={e => updateActiveLayerProp("y", parseInt(e.target.value) || 0)}
                          style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px", fontSize: "10px" }}>
                      <span style={{ color: "#8c8780" }}>Layer Opacity: {Math.round((activeLayer.opacity ?? 1) * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={Math.round((activeLayer.opacity ?? 1) * 100)}
                      onChange={e => updateActiveLayerProp("opacity", parseFloat(e.target.value) / 100)}
                      className="filter-slider"
                    />
                  </div>
                </div>
              );
            })()}

            {/* Layers Stack */}
            <div>
              <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>LAYERS LIST</span>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {layers.map((layer, idx) => {
                  const isActive = activeLayerId === layer.id;
                  return (
                    <div key={layer.id} onClick={() => setActiveLayerId(layer.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "8px", background: isActive ? "rgba(212,165,116,0.12)" : "rgba(255,255,255,0.02)", border: `1px solid ${isActive ? "#d4a574" : "rgba(255,255,255,0.05)"}`, cursor: "pointer" }}>
                      <span style={{ fontSize: "12px" }}>{layer.type === "image" ? "🖼️" : layer.type === "text" ? "T" : "🎨"}</span>
                      <span style={{ fontSize: "11px", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{layer.name}</span>
                      
                      {/* Move Order */}
                      <button onClick={(e) => { e.stopPropagation(); moveLayerOrder(idx, 1); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "9px" }}>▲</button>
                      <button onClick={(e) => { e.stopPropagation(); moveLayerOrder(idx, -1); }} style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: "9px" }}>▼</button>
                      
                      {/* Visibility Toggle */}
                      <button onClick={(e) => { e.stopPropagation(); toggleVisibility(layer.id); }} style={{ background: "none", border: "none", color: layer.visible ? "#d4a574" : "#666", cursor: "pointer", fontSize: "11px" }}>
                        {layer.visible ? "👁️" : "✕"}
                      </button>
                      {/* Delete */}
                      <button onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Canvas preview workspace */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", position: "relative" }}>
          
          {/* Header Controls Strip */}
          <div style={{ height: "48px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "5px 12px", fontSize: "11px" }}>Exit</button>
              <div style={{ width: "1px", height: "16px", background: "rgba(212,165,116,0.15)" }} />
              <span style={{ fontFamily: "Syne", fontSize: "15px", fontWeight: 800 }}>ImageStudio</span>
            </div>

            <div style={{ display: "flex", gap: "4px" }}>
              {["select", "brush"].map(t => (
                <button key={t} onClick={() => setActiveTool(t)} className={`tool-btn${activeTool === t ? " active" : ""}`} style={{ textTransform: "capitalize", padding: "5px 12px" }}>
                  {t === "brush" ? "🎨 Paintbrush" : "🖱️ Move Layer"}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {activeLayerId && (
                <div style={{ display: "flex", gap: "4px", marginRight: "8px" }}>
                  <button className="tool-btn" onClick={() => adjustLayerPosition("x", -10)} title="Move Left">◀</button>
                  <button className="tool-btn" onClick={() => adjustLayerPosition("y", -10)} title="Move Up">▲</button>
                  <button className="tool-btn" onClick={() => adjustLayerPosition("y", 10)} title="Move Down">▼</button>
                  <button className="tool-btn" onClick={() => adjustLayerPosition("x", 10)} title="Move Right">▶</button>
                </div>
              )}
              <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} style={{ background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.2)", borderRadius: "6px", fontSize: "11px", padding: "6px", outline: "none", cursor: "pointer" }}>
                <option value="png">PNG Format</option>
                <option value="jpeg">JPEG Format</option>
              </select>
              <button className="tool-btn primary" onClick={triggerExport}>Download</button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto", padding: "20px" }}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.15s" }}>
              <canvas
                ref={canvasRef}
                width={600}
                height={400}
                style={{
                  background: "#121212",
                  borderRadius: "8px",
                  boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
                  cursor: activeTool === "brush" ? "crosshair" : "default"
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
          </div>

          {/* Zoom & Navigation control footer */}
          <div style={{ height: "32px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(10,8,7,0.85)", borderTop: "1px solid rgba(212,165,116,0.08)", gap: "10px", fontSize: "11px" }}>
            <button style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>−</button>
            <span style={{ color: "#d4a574" }}>Zoom: {Math.round(zoom * 100)}%</span>
            <button style={{ background: "none", border: "none", color: "#666", cursor: "pointer" }} onClick={() => setZoom(z => Math.min(2, z + 0.1))}>+</button>
          </div>
        </div>

        {/* Right Side: adjustments and preset LUTs */}
        <div style={{ width: "260px", minWidth: "260px", borderLeft: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", padding: "16px", display: "flex", flexDirection: "column", gap: "20px", overflowY: "auto" }}>
          
          {/* Preset LUT filters */}
          <div>
            <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "10px", fontWeight: 600 }}>COLOR PRESET LUTS</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { id: "reset", name: "Reset LUT" },
                { id: "vintage", name: "Warm Gold" },
                { id: "neon", name: "Neon Cyber" },
                { id: "noir", name: "Mono Noir" }
              ].map(lut => (
                <button key={lut.id} className="tool-btn" onClick={() => applyLUT(lut.id)} style={{ fontSize: "10px", padding: "6px", justifyContent: "center" }}>
                  {lut.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Sliders */}
          <div>
            <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "12px", fontWeight: 600 }}>WEBGL COLOR GRADING</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Brightness", val: brightness, set: setBrightness, min: 0, max: 200 },
                { label: "Contrast", val: contrast, set: setContrast, min: 0, max: 200 },
                { label: "Saturation", val: saturation, set: setSaturation, min: 0, max: 200 },
                { label: "Hue Shift", val: hue, set: setHue, min: -180, max: 180 },
                { label: "Blur Radius", val: blur, set: setBlur, min: 0, max: 15 },
                { label: "Invert Colors", val: invert, set: setInvert, min: 0, max: 100 }
              ].map(slider => (
                <div key={slider.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
                    <span style={{ color: "#8c8780" }}>{slider.label}</span>
                    <span style={{ color: "#d4a574" }}>{slider.val}</span>
                  </div>
                  <input type="range" min={slider.min} max={slider.max} value={slider.val} onChange={e => slider.set(parseFloat(e.target.value))} className="filter-slider" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(12px)" }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎨</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px", letterSpacing: "-0.03em" }}>Save artwork changes?</h3>
            <p style={{ fontSize: "13.5px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px", fontWeight: 300 }}>
              Would you like to save this photo editing session to your past works, or discard your current edits?
            </p>
            
            {/* Input field for project title */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <label style={{ fontSize: "11px", color: "#d4a574", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Artwork Name</label>
              <input 
                type="text" 
                value={projectTitle} 
                onChange={e => setProjectTitle(e.target.value)} 
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.18)", borderRadius: "8px", color: "#fff", padding: "10px 14px", fontSize: "13px", outline: "none" }}
                placeholder="My Awesome Art"
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button className="tool-btn primary" onClick={handleSaveAndExit} style={{ justifyContent: "center", padding: "12px", fontSize: "13px", fontWeight: 500 }}>
                Save & Exit to Dashboard
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="tool-btn danger" onClick={handleDiscardAndExit} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12.5px" }}>
                  Discard Edits
                </button>
                <button className="tool-btn" onClick={() => setShowLeaveModal(false)} style={{ flex: 1, justifyContent: "center", padding: "10px", fontSize: "12.5px" }}>
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
