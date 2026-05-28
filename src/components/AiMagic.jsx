import { useState, useEffect } from "react";

const AI_STYLES = [
  { id: "cyberpunk", name: "Cyberpunk Neon", desc: "High contrast neon glows" },
  { id: "render_3d", name: "3D Claymation", desc: "Cute stylized 3D assets" },
  { id: "watercolor", name: "Watercolor", desc: "Organic fluid sketch art" },
  { id: "minimalist", name: "Corporate Flat", desc: "Clean vector shapes" }
];

const PRESET_BG_IMAGES = {
  rocket: { name: "Futuristic Rocket", src: "🚀", bg: "#1a0b2e", fgColor: "#a855f7" },
  character: { name: "Mech Cyber-Helmet", src: "🦿", bg: "#0d2b45", fgColor: "#20b2aa" },
  bag: { name: "Premium Leather Pack", src: "🎒", bg: "#2c1d11", fgColor: "#d2691e" }
};

export default function AiMagic({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "AI Generative Campaign";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("generator"); // generator | bg_remover | smart_resize
  
  // AI Generator States
  const [prompt, setPrompt] = useState("Cyberpunk tech capsule, floating in an abstract spatial grid, high-resolution octane render, neon gold accents.");
  const [selectedStyle, setSelectedStyle] = useState("cyberpunk");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentActionLog, setCurrentActionLog] = useState("");
  const [generatedResult, setGeneratedResult] = useState(null);

  // Background Remover States
  const [bgRemoveImage, setBgRemoveImage] = useState("rocket");
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [removeProgress, setRemoveProgress] = useState(0);
  const [bgRemoved, setBgRemoved] = useState(false);
  const [maskTolerance, setMaskTolerance] = useState(12);

  // Smart Resize States
  const [resizeLayoutMode, setResizeLayoutMode] = useState("banner"); // banner | square | wallpaper

  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.prompt) setPrompt(d.prompt);
      if (d.selectedStyle) setSelectedStyle(d.selectedStyle);
      if (d.generatedResult) setGeneratedResult(d.generatedResult);
      if (d.bgRemoveImage) setBgRemoveImage(d.bgRemoveImage);
      if (d.bgRemoved) setBgRemoved(d.bgRemoved);
      if (d.maskTolerance) setMaskTolerance(d.maskTolerance);
      if (d.resizeLayoutMode) setResizeLayoutMode(d.resizeLayoutMode);
    }
  }, [initialProject]);

  // AI Generation Simulation
  const triggerAiGeneration = () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedResult(null);
    
    const logs = [
      "Analyzing semantic prompt structure...",
      "Resolving noise matrices in latents...",
      "Interpolating vector path coordinates...",
      "Applying neon shading weights...",
      "Compiling final high-fidelity layers..."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setProgress(currentStep * 20);
      setCurrentActionLog(logs[currentStep - 1] || "Finalizing rendering...");

      if (currentStep >= 5) {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setGeneratedResult({
            style: selectedStyle,
            prompt: prompt,
            bg: selectedStyle === "cyberpunk" ? "#0c0714" : selectedStyle === "render_3d" ? "#151c18" : "#fbf9f6",
            accent: selectedStyle === "cyberpunk" ? "#22d3a8" : "#ec4899",
            layers: [
              { type: "sparkle", glyph: "⚡", x: 50, y: 35, size: 80, col: "#22d3a8" },
              { type: "text", text: "AI GENERATED CAPSULE", x: 50, y: 70, size: 22, col: "#ffffff" }
            ]
          });
        }, 500);
      }
    }, 900);
  };

  // Background Removal Simulation
  const triggerBgRemoval = () => {
    setIsRemovingBg(true);
    setRemoveProgress(0);
    setBgRemoved(false);

    const interval = setInterval(() => {
      setRemoveProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsRemovingBg(false);
            setBgRemoved(true);
          }, 300);
          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `ai_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Generative Asset",
      category: "AI Design",
      tool: "AI Magic",
      year: new Date().getFullYear().toString(),
      accent: "#22d3a8",
      gradient: "linear-gradient(135deg, #071714 0%, #153c34 50%, #0c0a09 100%)",
      image: "",
      icon: "⚡",
      tags: ["Generative AI", selectedStyle.toUpperCase(), "Layer Cutout"],
      desc: `Generative workspace campaign matching prompt: "${prompt.substring(0, 30)}..."`,
      data: {
        prompt,
        selectedStyle,
        generatedResult,
        bgRemoveImage,
        bgRemoved,
        maskTolerance,
        resizeLayoutMode
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
      fetch("http://localhost:3001/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(projectData)
      })
      .then(res => {
        if (!res.ok) throw new Error("Server rejected save");
        console.log("Saved AI project to DB successfully");
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

  const activePresetBg = PRESET_BG_IMAGES[bgRemoveImage];

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header Toolbar */}
      <div style={{ height: "54px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "6px 14px", fontSize: "11px" }}>Exit</button>
          <div style={{ width: "1px", height: "18px", background: "rgba(212,165,116,0.15)" }} />
          <span style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 800, color: "#22d3a8" }}>AIMagic Studio</span>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input 
            type="text" 
            value={projectTitle} 
            onChange={e => setProjectTitle(e.target.value)} 
            style={{ background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "6px 12px", fontSize: "12px", outline: "none", width: "220px" }}
            placeholder="AI Generation Name"
          />
        </div>

        <button onClick={handleSaveAndExit} className="tool-btn primary" style={{ background: "linear-gradient(135deg,#22d3a8,#15803d)", border: "none", color: "#fff", padding: "6px 16px", fontSize: "12px" }}>
          Save AI Asset
        </button>
      </div>

      {/* Main Studio Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Sidebar: Controls & Modes */}
        <div style={{ width: "300px", minWidth: "300px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column", padding: "20px", gap: "20px" }}>
          
          {/* Sub-Tabs selector */}
          <div>
            <span style={{ fontSize: "10px", color: "#22d3a8", fontWeight: 700, letterSpacing: "0.06em", display: "block", marginBottom: "8px" }}>AI TOOL SELECTION</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { id: "generator", label: "✦ AI Design Generator", desc: "Text-to-design vector layouts" },
                { id: "bg_remover", label: "✂️ Background Remover", desc: "Intelligent layout masking" },
                { id: "smart_resize", label: "📐 AI Smart Resize", desc: "Auto-adapt layout aspect ratios" }
              ].map(subTab => (
                <button
                  key={subTab.id}
                  onClick={() => setActiveSubTab(subTab.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    background: activeSubTab === subTab.id ? "rgba(34,211,168,0.15)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${activeSubTab === subTab.id ? "#22d3a8" : "rgba(255,255,255,0.05)"}`,
                    color: activeSubTab === subTab.id ? "#22d3a8" : "#fff",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600 }}>{subTab.label}</div>
                  <div style={{ fontSize: "9px", color: "#8c8780", marginTop: "2px" }}>{subTab.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Generative Tab Controls */}
          {activeSubTab === "generator" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px" }}>AI Design Prompt</label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  style={{ width: "100%", height: "80px", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", color: "#fff", padding: "8px 12px", fontSize: "11px", resize: "none", outline: "none", lineHeight: 1.4 }}
                  placeholder="Enter details about vectors, graphics, colors..."
                />
              </div>

              <div>
                <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px" }}>Styling Vector Preset</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {AI_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      style={{
                        padding: "8px 4px",
                        borderRadius: "6px",
                        background: selectedStyle === style.id ? "rgba(34,211,168,0.12)" : "#0c0a09",
                        border: `1px solid ${selectedStyle === style.id ? "#22d3a8" : "rgba(255,255,255,0.05)"}`,
                        color: selectedStyle === style.id ? "#22d3a8" : "#fff",
                        cursor: "pointer",
                        fontSize: "10px",
                        textAlign: "center"
                      }}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={triggerAiGeneration}
                disabled={isGenerating}
                className="tool-btn primary"
                style={{
                  background: "linear-gradient(135deg,#22d3a8,#15803d)",
                  border: "none",
                  color: "#fff",
                  padding: "10px",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  marginTop: "8px"
                }}
              >
                {isGenerating ? "Processing matrices..." : "⚡ Run Design Generation"}
              </button>
            </div>
          )}

          {/* Background Remover Controls */}
          {activeSubTab === "bg_remover", activeSubTab === "bg_remover" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px" }}>Select Target Image</label>
                <select
                  value={bgRemoveImage}
                  onChange={e => {
                    setBgRemoveImage(e.target.value);
                    setBgRemoved(false);
                  }}
                  style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "8px", fontSize: "11.5px", padding: "8px" }}
                >
                  <option value="rocket">Futuristic Capsule Rocket (Purple)</option>
                  <option value="character">Helmet Mech Goggles (Blue)</option>
                  <option value="bag">Travel Leather Backpack (Amber)</option>
                </select>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "10px" }}>
                  <span style={{ color: "#8c8780" }}>Tolerance Threshold</span>
                  <span style={{ color: "#22d3a8" }}>{maskTolerance}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="30"
                  value={maskTolerance}
                  onChange={e => setMaskTolerance(parseInt(e.target.value))}
                  style={{ width: "100%" }}
                />
              </div>

              <button
                onClick={triggerBgRemoval}
                disabled={isRemovingBg}
                className="tool-btn primary"
                style={{
                  background: "linear-gradient(135deg,#22d3a8,#15803d)",
                  border: "none",
                  color: "#fff",
                  padding: "10px",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  marginTop: "8px"
                }}
              >
                {isRemovingBg ? "Scanning pixels..." : "✂️ Remove Backdrop Now"}
              </button>
            </div>
          )}

          {/* Smart Resize Controls */}
          {activeSubTab === "smart_resize" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "10px", color: "#8c8780" }}>Select Output aspect layouts:</span>
              {[
                { id: "banner", label: "🖥️ Wide Web Banner (16:5)" },
                { id: "square", label: "📱 Square Feed Post (1:1)" },
                { id: "wallpaper", label: "🎬 Vertical Wallpaper (9:16)" }
              ].map(layout => (
                <button
                  key={layout.id}
                  onClick={() => setResizeLayoutMode(layout.id)}
                  style={{
                    padding: "10px",
                    borderRadius: "6px",
                    background: resizeLayoutMode === layout.id ? "rgba(34,211,168,0.12)" : "#0c0a09",
                    border: `1px solid ${resizeLayoutMode === layout.id ? "#22d3a8" : "rgba(255,255,255,0.05)"}`,
                    color: resizeLayoutMode === layout.id ? "#22d3a8" : "#fff",
                    cursor: "pointer",
                    fontSize: "11px",
                    textAlign: "left"
                  }}
                >
                  {layout.label}
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Center Canvas Area: Renders generator animation or result */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", overflowY: "auto", padding: "40px", alignItems: "center", justifyContent: "center" }}>
          
          {/* AI Generator Tab Viewport */}
          {activeSubTab === "generator" && (
            <div style={{ width: "100%", maxWidth: "500px", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              
              {isGenerating ? (
                /* LOADING MATRIX ANIMATION SCREEN */
                <div style={{ width: "100%", height: "100%", background: "#0c0714", border: "1px solid rgba(34,211,168,0.25)", borderRadius: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px", boxSize: "border-box" }}>
                  <div style={{ fontSize: "50px", animation: "spin 2s linear infinite", marginBottom: "20px" }}>⚡</div>
                  <h4 style={{ fontFamily: "Syne", fontSize: "16px", color: "#22d3a8", fontWeight: 700, margin: 0, letterSpacing: "0.08em" }}>GENERATING LAYER MATRIX</h4>
                  <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden", margin: "20px 0" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "#22d3a8", transition: "width 0.4s" }} />
                  </div>
                  <span style={{ fontSize: "11px", color: "#8c8780", fontFamily: "monospace" }}>{currentActionLog}</span>
                </div>
              ) : generatedResult ? (
                /* RENDER GENERATED VECTOR CANVAS RESULT */
                <div style={{ width: "100%", height: "100%", background: generatedResult.bg, borderRadius: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", boxShadow: "0 25px 60px rgba(0,0,0,0.6)", border: `1.5px solid ${generatedResult.accent}40`, transition: "all 0.3s" }}>
                  
                  {/* Neon particles decoration */}
                  <div style={{ position: "absolute", top: "20px", left: "20px", fontSize: "12px", color: generatedResult.accent }}>✦</div>
                  <div style={{ position: "absolute", bottom: "20px", right: "20px", fontSize: "12px", color: generatedResult.accent }}>✦</div>

                  {generatedResult.layers.map((l, idx) => (
                    <div key={idx} style={{ marginTop: "10px" }}>
                      {l.type === "sparkle" ? (
                        <span style={{ fontSize: `${l.size}px`, display: "block", color: l.col, textShadow: `0 0 30px ${l.col}` }}>{l.glyph}</span>
                      ) : (
                        <span style={{ fontSize: `${l.size}px`, fontFamily: "Syne", fontWeight: 800, color: l.col, letterSpacing: "0.06em", display: "block", textAlign: "center" }}>{l.text}</span>
                      )}
                    </div>
                  ))}
                  
                  <div style={{ position: "absolute", bottom: "16px", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "20px", fontSize: "9px", color: generatedResult.accent }}>AI GENERATED IN 4.5S</div>
                </div>
              ) : (
                /* BLANK INITIAL STATE */
                <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(212,165,116,0.15)", borderRadius: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "40px" }}>
                  <div style={{ fontSize: "40px", color: "#666", marginBottom: "16px" }}>⚡</div>
                  <h4 style={{ fontSize: "15px", fontWeight: 600, color: "#fff" }}>AI Design Generative Portal</h4>
                  <p style={{ fontSize: "11px", color: "#5c5650", maxWidth: "280px", marginTop: "6px" }}>Enter design parameters in the prompt input field and trigger generation to output editable layered frames.</p>
                </div>
              )}

            </div>
          )}

          {/* Background Remover Tab Viewport */}
          {activeSubTab === "bg_remover" && (
            <div style={{ width: "100%", maxWidth: "500px", aspectRatio: "1/1", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
              
              <div style={{
                width: "100%",
                flex: 1,
                borderRadius: "24px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                border: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
                // Checkered transparent background pattern when background is removed
                background: bgRemoved ? "repeating-conic-gradient(#141210 0% 25%, #24201c 0% 50%) 0% 0% / 20px 20px" : activePresetBg.bg,
                transition: "background 0.4s"
              }}>
                
                {/* Foreground Object */}
                <div style={{
                  fontSize: "140px",
                  userSelect: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  // CSS border / clipping mask simulation: 
                  // If background is not removed, it renders standard inside the colored wrapper.
                  // If bg removed, we can simulate an isolated sticker by adding a subtle white drop shadow or border outline!
                  filter: bgRemoved ? `drop-shadow(0px 0px ${maskTolerance / 2}px ${activePresetBg.fgColor}) drop-shadow(0 0 1px #fff)` : "none",
                  transition: "filter 0.3s"
                }}>
                  {activePresetBg.src}
                </div>

                {/* Laser scan lines sweeping vertically */}
                {isRemovingBg && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: "100%",
                    pointerEvents: "none",
                    background: "linear-gradient(to bottom, transparent 40%, rgba(34,211,168,0.2) 50%, transparent 60%)",
                    animation: "sweep 1.2s infinite linear"
                  }} />
                )}

                {/* Status indicator */}
                <div style={{ position: "absolute", bottom: "16px", background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.08)", padding: "4px 12px", borderRadius: "20px", fontSize: "9.5px", color: bgRemoved ? "#22d3a8" : "#fff" }}>
                  {bgRemoved ? "✦ BACKDROP EXTRACTED SUCCESSFULLY" : "BACKDROP DETECTED"}
                </div>
              </div>

              {isRemovingBg && (
                <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "#8c8780", marginBottom: "6px" }}>Analyzing channels: {removeProgress}%</span>
                  <div style={{ width: "200px", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${removeProgress}%`, height: "100%", background: "#22d3a8" }} />
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Smart Resize Tab Viewport */}
          {activeSubTab === "smart_resize" && (
            <div style={{ width: "100%", maxWidth: "600px", display: "flex", flexDirection: "column", gap: "20px", alignItems: "center" }}>
              
              <div style={{ fontSize: "11px", color: "#8c8780", alignSelf: "flex-start" }}>
                Active Aspect Ratio: <strong style={{ color: "#fff" }}>{resizeLayoutMode === "banner" ? "16:5 Banner" : resizeLayoutMode === "square" ? "1:1 Square" : "9:16 Vertical"}</strong>
              </div>

              {/* Dynamic Resizing Canvas Wrapper */}
              <div style={{
                background: "linear-gradient(135deg, #0c0714 0%, #170d29 100%)",
                borderRadius: "20px",
                boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
                border: "1.5px solid rgba(34,211,168,0.2)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                
                // Set sizes dynamically based on selection
                width: resizeLayoutMode === "banner" ? "540px" : resizeLayoutMode === "square" ? "360px" : "260px",
                height: resizeLayoutMode === "banner" ? "170px" : resizeLayoutMode === "square" ? "360px" : "460px"
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "20px" }}>
                  <span style={{ fontSize: resizeLayoutMode === "banner" ? "40px" : "60px", textShadow: "0 0 20px #22d3a8" }}>⚡</span>
                  <span style={{ fontSize: resizeLayoutMode === "banner" ? "11px" : "15px", fontFamily: "Syne", fontWeight: 800, letterSpacing: "0.06em", color: "#fff", textAlign: "center" }}>
                    AI SMART RESIZE
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Exit confirmation modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(12px)" }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>⚡</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px" }}>Save AI assets?</h3>
            <p style={{ fontSize: "13px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px" }}>
              Would you like to save your generated design assets to your past works database, or discard your current session edits?
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

      {/* Embedded CSS animations for Scanner laser and Rotate */}
      <style>{`
        @keyframes sweep {
          0% { transform: translateY(-160px); }
          100% { transform: translateY(160px); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
}
