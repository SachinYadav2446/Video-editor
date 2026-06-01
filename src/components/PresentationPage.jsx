import { useState, useEffect } from "react";

// ── 30 Curated Themes with beautiful color swatches ──────────────────────────
export const PRESENTATION_THEMES = [
  { name: "Onyx Gold",       bg: "linear-gradient(135deg, #131110 0%, #0c0a09 100%)", primary: "#d4a574", secondary: "#8b5a2b", text: "#ffffff", desc: "Dark mode gold", archetype: "minimal" },
  { name: "Champagne Cream",  bg: "linear-gradient(135deg, #f5f0e8 0%, #e8dec9 100%)", primary: "#8b5a2b", secondary: "#d4a574", text: "#2d2d2d", desc: "Elegant light beige", archetype: "editorial" },
  { name: "Royal Violet",    bg: "linear-gradient(135deg, #1f1035 0%, #0d061a 100%)", primary: "#c3b0cc", secondary: "#a88bb3", text: "#ffffff", desc: "Deep dark purple", archetype: "glass" },
  { name: "Forest Sage",     bg: "linear-gradient(135deg, #132219 0%, #08120c 100%)", primary: "#22d3a8", secondary: "#139c7b", text: "#ffffff", desc: "Sage green and mint", archetype: "organic" },
  { name: "Midnight Ocean",  bg: "linear-gradient(135deg, #091220 0%, #03070f 100%)", primary: "#29b6f6", secondary: "#0288d1", text: "#ffffff", desc: "Cool deep navy blue", archetype: "glass" },
  { name: "Nordic Alabaster",bg: "linear-gradient(135deg, #f9f9fb 0%, #ebecf0 100%)", primary: "#2c3e50", secondary: "#7f8c8d", text: "#2c3e50", desc: "Crisp polar white", archetype: "minimal" },
  { name: "Cyber Punk",      bg: "linear-gradient(135deg, #08080c 0%, #151522 100%)", primary: "#f43f5e", secondary: "#eab308", text: "#ffffff", desc: "Neon pink & gold", archetype: "cyber" },
  { name: "Crimson Rose",    bg: "linear-gradient(135deg, #2d0b16 0%, #17040a 100%)", primary: "#fda4af", secondary: "#e11d48", text: "#ffffff", desc: "Dark rich burgundy", archetype: "editorial" },
  { name: "Sunset Glow",     bg: "linear-gradient(135deg, #fbcfe8 0%, #fed7aa 100%)", primary: "#6b21a8", secondary: "#be185d", text: "#2d2d2d", desc: "Warm peach to pink", archetype: "bauhaus" },
  { name: "Moody Slate",     bg: "linear-gradient(135deg, #27272a 0%, #0f0f11 100%)", primary: "#a1a1aa", secondary: "#71717a", text: "#ffffff", desc: "Minimal dark charcoal", archetype: "minimal" },
  { name: "Emerald Luxe",    bg: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)", primary: "#fbbf24", secondary: "#d97706", text: "#ffffff", desc: "Forest green and gold", archetype: "organic" },
  { name: "Sahara Sand",     bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)", primary: "#b45309", secondary: "#d97706", text: "#2d2d2d", desc: "Desert sand light mode", archetype: "bauhaus" },
  { name: "Plum Satin",      bg: "linear-gradient(135deg, #3b0764 0%, #1e1b4b 100%)", primary: "#f472b6", secondary: "#c084fc", text: "#ffffff", desc: "Deep satin plum", archetype: "glass" },
  { name: "Ocean Breeze",    bg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)", primary: "#0891b2", secondary: "#0e7490", text: "#164e63", desc: "Calm turquoise light", archetype: "glass" },
  { name: "Solar Eclipse",   bg: "linear-gradient(135deg, #020202 0%, #121212 100%)", primary: "#f97316", secondary: "#ea580c", text: "#ffffff", desc: "Pitch black & bright orange", archetype: "cyber" },
  { name: "Arctic Mist",     bg: "linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)", primary: "#0f766e", secondary: "#14b8a6", text: "#115e59", desc: "Ice-pale teal mist", archetype: "organic" },
  { name: "Tuscan Sun",      bg: "linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)", primary: "#854d0e", secondary: "#ca8a04", text: "#713f12", desc: "Golden summer yellow", archetype: "editorial" },
  { name: "Lavender Fields", bg: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)", primary: "#6b21a8", secondary: "#7e22ce", text: "#3b0764", desc: "Gentle spring violet", archetype: "glass" },
  { name: "Sweet Peach",     bg: "linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)", primary: "#c53030", secondary: "#e53e3e", text: "#2d3748", desc: "Fresh light coral peach", archetype: "bauhaus" },
  { name: "Charcoal Minimal",bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", primary: "#38bdf8", secondary: "#0ea5e9", text: "#ffffff", desc: "Clean corporate slate", archetype: "minimal" },
  { name: "Electric Lime",   bg: "linear-gradient(135deg, #090d0b 0%, #030403 100%)", primary: "#84cc16", secondary: "#65a30d", text: "#ffffff", desc: "Black and high-key lime", archetype: "cyber" },
  { name: "Vintage Sepia",   bg: "linear-gradient(135deg, #faf7f2 0%, #eee3d3 100%)", primary: "#5c3d2e", secondary: "#865439", text: "#3d241c", desc: "Nostalgic typewriter beige", archetype: "editorial" },
  { name: "Cotton Candy",    bg: "linear-gradient(135deg, #fae8ff 0%, #e0f2fe 100%)", primary: "#a21caf", secondary: "#0369a1", text: "#1e1b4b", desc: "Whimsical pastel pink-blue", archetype: "glass" },
  { name: "Volcanic Ash",    bg: "linear-gradient(135deg, #1c1917 0%, #0c0a09 100%)", primary: "#ef4444", secondary: "#b91c1c", text: "#ffffff", desc: "Ashen grey & volcanic red", archetype: "cyber" },
  { name: "Matcha Latte",    bg: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)", primary: "#166534", secondary: "#22c55e", text: "#14532d", desc: "Soft organic matcha tea", archetype: "organic" },
  { name: "Cherry Blossom",  bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)", primary: "#be123c", secondary: "#fb7185", text: "#4c0519", desc: "Soft sakura floral pink", archetype: "organic" },
  { name: "Bronze Patina",   bg: "linear-gradient(135deg, #111e25 0%, #070d10 100%)", primary: "#e28743", secondary: "#c86b29", text: "#ffffff", desc: "Teal verdigris & cooper bronze", archetype: "minimal" },
  { name: "Holographic Silk",bg: "linear-gradient(135deg, #f5f3ff 0%, #e0e7ff 100%)", primary: "#7c3aed", secondary: "#4f46e5", text: "#1e1b4b", desc: "Soft iridescent purple", archetype: "glass" },
  { name: "Gingerbread",     bg: "linear-gradient(135deg, #fbf7f4 0%, #ebdccb 100%)", primary: "#653b1b", secondary: "#9e6132", text: "#42240d", desc: "Cozy warm brown spiced", archetype: "editorial" },
  { name: "Glacier Blue",    bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", primary: "#0369a1", secondary: "#0284c7", text: "#0c4a6e", desc: "Icy polar alpine blue", archetype: "glass" }
];

import { useRef } from "react";

function renderThemeOrnaments(archetype, primary, secondary, text) {
  if (archetype === "editorial") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: "12px", border: `1px solid ${primary}20` }} />
        <div style={{ position: "absolute", inset: "16px", border: `1px solid ${primary}10` }} />
        <div style={{ position: "absolute", top: "24px", left: "24px", fontSize: "9px", fontFamily: "'Playfair Display', Georgia, serif", fontStyle: "italic", opacity: 0.4, color: primary, letterSpacing: "0.08em" }}>CREATIFY EDITORIAL</div>
      </div>
    );
  }
  if (archetype === "cyber") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${primary}0a 1px, transparent 1px), linear-gradient(90deg, ${primary}0a 1px, transparent 1px)`, backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", top: 12, left: 12, width: 14, height: 14, borderTop: `2px solid ${primary}`, borderLeft: `2px solid ${primary}` }} />
        <div style={{ position: "absolute", top: 12, right: 12, width: 14, height: 14, borderTop: `2px solid ${primary}`, borderRight: `2px solid ${primary}` }} />
        <div style={{ position: "absolute", bottom: 12, left: 12, width: 14, height: 14, borderBottom: `2px solid ${primary}`, borderLeft: `2px solid ${primary}` }} />
        <div style={{ position: "absolute", bottom: 12, right: 12, width: 14, height: 14, borderBottom: `2px solid ${primary}`, borderRight: `2px solid ${primary}` }} />
        <div style={{ position: "absolute", bottom: "16px", left: "24px", fontSize: "8px", fontFamily: "Share Tech Mono, monospace", opacity: 0.4, color: secondary }}>CORE ENGINE // V2.16</div>
      </div>
    );
  }
  if (archetype === "bauhaus") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: 0, top: 0, width: "32%", height: "100%", background: `${secondary}08` }} />
        <div style={{ position: "absolute", left: "10%", top: "0px", width: "40px", height: "8px", background: primary }} />
        <div style={{ position: "absolute", left: "8%", right: "8%", top: "45%", height: "2px", background: `${secondary}15` }} />
      </div>
    );
  }
  if (archetype === "organic") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <svg style={{ position: "absolute", right: "-10%", bottom: "-10%", opacity: 0.1, width: "300px", height: "300px" }} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M150 40 C120 20, 80 50, 60 90 C40 130, 30 170, 70 190 C110 210, 150 160, 170 120 C190 80, 180 60, 150 40 Z" fill={primary} />
        </svg>
        <svg style={{ position: "absolute", left: "-5%", top: "-5%", opacity: 0.06, width: "180px", height: "180px" }} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M120 30 C90 10, 50 40, 40 70 C30 100, 20 140, 50 150 C80 160, 110 130, 130 100 C150 70, 150 50, 120 30 Z" fill={secondary} />
        </svg>
      </div>
    );
  }
  if (archetype === "glass") {
    return (
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-20%", right: "-10%", width: "260px", height: "260px", borderRadius: "50%", background: `radial-gradient(circle, ${primary}20 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "260px", height: "260px", borderRadius: "50%", background: `radial-gradient(circle, ${secondary}20 0%, transparent 70%)`, filter: "blur(40px)" }} />
        <div style={{ position: "absolute", top: "15%", right: "10%", width: "60px", height: "60px", border: `1px solid ${primary}15`, borderRadius: "50%" }} />
      </div>
    );
  }
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${primary}04 1px, transparent 1px), linear-gradient(90deg, ${primary}04 1px, transparent 1px)`, backgroundSize: "40px 40px" }} />
      <div style={{ position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px", background: `linear-gradient(90deg, transparent, ${primary}25, transparent)` }} />
    </div>
  );
}

function getThemeHeaderFont(archetype) {
  if (archetype === "editorial") return "Playfair Display, Georgia, serif";
  if (archetype === "cyber") return "Share Tech Mono, monospace";
  if (archetype === "bauhaus") return "Inter, sans-serif";
  if (archetype === "glass") return "Outfit, sans-serif";
  return "Syne, sans-serif";
}

function getThemeBodyFont(archetype) {
  if (archetype === "cyber") return "Share Tech Mono, monospace";
  if (archetype === "bauhaus") return "Inter, sans-serif";
  if (archetype === "glass") return "Outfit, sans-serif";
  return "Poppins, sans-serif";
}

export default function PresentationPage({ onBack, user, initialPresentation }) {
  const [presentationId] = useState(() => initialPresentation?.id || initialPresentation?.data?.id || `ppt_${Date.now()}`);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialPresentation?.title || initialPresentation?.name || initialPresentation?.data?.name || "Untitled Presentation";
  });
  
  const [slides, setSlides] = useState(() => {
    if (initialPresentation) {
      if (initialPresentation.slides) return initialPresentation.slides;
      if (initialPresentation.data && initialPresentation.data.slides) return initialPresentation.data.slides;
    }
    return [
      {
        id: "slide_1",
        layout: "title",
        title: "Creatify Studio Presentation",
        subtitle: "Design without limits · Beautiful slides in one click",
        bulletPoints: ["Seamless browser-based generation", "GPU-accelerated vector rendering", "30 premium designer themes"],
        quote: "Simplifying creation so you can focus on building beautiful brands.",
        author: "Alex Chen, Creative Director",
        image: "https://picsum.photos/id/180/800/500",
        elements: []
      },
      {
        id: "slide_2",
        layout: "content",
        title: "Core System Capabilities",
        subtitle: "Engineered for designers and innovators alike",
        bulletPoints: [
          "Interactive bento layout with micro-animations",
          "WASM image & video composition directly in client",
          "Zero-latency typography matching and preset LUTs",
          "One-click PDF, PPTX, and high-fidelity video exports"
        ],
        quote: "A tool that matches the speed of thought.",
        author: "",
        image: "https://picsum.photos/id/200/800/500",
        elements: []
      },
      {
        id: "slide_3",
        layout: "quote",
        title: "",
        subtitle: "",
        bulletPoints: [],
        quote: "Design is not just what it looks like and feels like. Design is how it works.",
        author: "Steve Jobs",
        image: "",
        elements: []
      }
    ];
  });

  const [activeSlideId, setActiveSlideId] = useState(() => {
    const s = initialPresentation?.slides || initialPresentation?.data?.slides;
    if (s && s.length > 0) {
      return s[0].id;
    }
    return "slide_1";
  });
  const [themeIdx, setThemeIdx] = useState(() => {
    if (initialPresentation) {
      if (typeof initialPresentation.themeIdx === "number") return initialPresentation.themeIdx;
      if (initialPresentation.data && typeof initialPresentation.data.themeIdx === "number") {
        return initialPresentation.data.themeIdx;
      }
    }
    return 0;
  });

  // Leave handlers
  const handleBackClick = () => {
    // Sync active slide title to projectTitle state
    if (slides[0]?.title) {
      setProjectTitle(slides[0].title);
    }
    setShowLeaveModal(true);
  };

  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialPresentation?.id || initialPresentation?.data?.id || presentationId;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || slides[0]?.title || "Untitled Presentation",
      category: "Presentation",
      tool: "Slide Studio",
      year: new Date().getFullYear().toString(),
      accent: "#a0522d",
      gradient: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #030712 100%)",
      image: initialPresentation?.image || initialPresentation?.data?.image || "", 
      tags: [`${slides.length} Slides`, "Vector", "Pitch"],
      desc: `Modern slide deck presentation with ${slides.length} slides.`,
      data: {
        id: projectId,
        name: projectTitle.trim() || slides[0]?.title || "Untitled Presentation",
        slides: slides,
        themeIdx: themeIdx
      }
    };

    if (existingIdx > -1) {
      savedWorks[existingIdx] = projectData;
    } else {
      savedWorks.unshift(projectData);
    }
    localStorage.setItem("creatify_past_works", JSON.stringify(savedWorks));

    if (user && user.email) {
      const key = `creatify_presentations_${user.email}`;
      const ppts = JSON.parse(localStorage.getItem(key) || "[]");
      const filtered = ppts.filter(p => p.id !== projectId);
      filtered.unshift({
        id: projectId,
        name: projectTitle.trim() || slides[0]?.title || "Untitled Presentation",
        updatedAt: new Date().toISOString(),
        slides: slides,
        themeIdx: themeIdx
      });
      localStorage.setItem(key, JSON.stringify(filtered));
    }

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
        console.log("Saved presentation project to DB successfully");
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

  const [presentMode, setPresentMode] = useState(false);
  const [exportProgress, setExportProgress] = useState(null);
  const [showAddLayoutMenu, setShowAddLayoutMenu] = useState(false);

  // Overhaul custom state
  const [leftTab, setLeftTab] = useState("slides");
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [showLayoutDropdown, setShowLayoutDropdown] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [selectedFieldId, setSelectedFieldId] = useState(null);
  const [transitionStyle, setTransitionStyle] = useState("fade");
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeModal, setShowCodeModal] = useState(false);

  const dragStartRef = useRef(null);
  const resizeStartRef = useRef(null);
  const viewportRef = useRef(null);
  const imageInputRef = useRef(null);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const theme = PRESENTATION_THEMES[themeIdx];

  // ── Keyboard Navigation in Present Mode / Element Deletion in Edit Mode ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (presentMode) {
        const idx = slides.findIndex(s => s.id === activeSlideId);
        if (e.key === "ArrowRight" || e.key === " ") {
          e.preventDefault();
          if (idx < slides.length - 1) setActiveSlideId(slides[idx + 1].id);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          if (idx > 0) setActiveSlideId(slides[idx - 1].id);
        } else if (e.key === "Escape") {
          setPresentMode(false);
        }
      } else {
        if ((e.key === "Delete" || e.key === "Backspace") && selectedElementId) {
          if (document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
            e.preventDefault();
            deleteElement(selectedElementId);
          }
        }
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [presentMode, slides, activeSlideId, selectedElementId]);

  // ── Operations ───────────────────────────────────────────────────────────
  const addSlide = () => {
    const newId = `slide_${Date.now()}`;
    const newSlide = {
      id: newId,
      layout: "blank",
      title: "",
      subtitle: "",
      bulletPoints: [],
      quote: "",
      author: "",
      image: "",
      elements: []
    };
    
    setSlides(prev => {
      const activeIdx = prev.findIndex(s => s.id === activeSlideId);
      const copy = [...prev];
      copy.splice(activeIdx + 1, 0, newSlide);
      return copy;
    });
    setActiveSlideId(newId);
    setSelectedElementId(null);
    setSelectedFieldId(null);
    setShowAddLayoutMenu(false);
  };

  const deleteSlide = (id) => {
    if (slides.length <= 1) {
      alert("Your presentation must contain at least one slide.");
      return;
    }
    const idx = slides.findIndex(s => s.id === id);
    const newSlides = slides.filter(s => s.id !== id);
    setSlides(newSlides);
    
    if (activeSlideId === id) {
      const nextActiveIdx = Math.max(0, idx - 1);
      setActiveSlideId(newSlides[nextActiveIdx].id);
    }
    setSelectedElementId(null);
    setSelectedFieldId(null);
  };

  const duplicateSlide = (slide) => {
    const newId = `slide_${Date.now()}`;
    const dup = {
      ...slide,
      id: newId,
      elements: (slide.elements || []).map(el => ({
        ...el,
        id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      }))
    };
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === slide.id);
      const copy = [...prev];
      copy.splice(idx + 1, 0, dup);
      return copy;
    });
    setActiveSlideId(newId);
    setSelectedElementId(null);
    setSelectedFieldId(null);
  };

  const moveSlide = (idx, direction) => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === slides.length - 1) return;
    
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const copy = [...slides];
    const temp = copy[idx];
    copy[idx] = copy[targetIdx];
    copy[targetIdx] = temp;
    setSlides(copy);
  };

  const updateSlideContent = (key, val) => {
    setSlides(prev => prev.map(s => s.id === activeSlideId ? { ...s, [key]: val } : s));
  };

  const updateBulletPoint = (bulletIdx, val) => {
    const updatedBullets = [...(activeSlide.bulletPoints || [])];
    updatedBullets[bulletIdx] = val;
    updateSlideContent("bulletPoints", updatedBullets);
  };

  const addBulletPoint = () => {
    updateSlideContent("bulletPoints", [...(activeSlide.bulletPoints || []), "New bullet point entry"]);
  };

  const deleteBulletPoint = (bulletIdx) => {
    const updatedBullets = (activeSlide.bulletPoints || []).filter((_, i) => i !== bulletIdx);
    updateSlideContent("bulletPoints", updatedBullets);
  };

  const exportHTMLSlideshow = () => {
    const currentTheme = PRESENTATION_THEMES[themeIdx];
    let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>\${projectTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&family=Inter:wght@400;700;900&family=Outfit:wght@300;600;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body, html {
      background: #000;
      color: #fff;
      font-family: 'Poppins', sans-serif;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .slide-deck {
      width: 100%;
      max-width: 1100px;
      aspect-ratio: 16/9;
      position: relative;
    }
    .slide {
      display: none;
      width: 100%;
      height: 100%;
      border-radius: 20px;
      padding: 8%;
      box-sizing: border-box;
      position: relative;
      background: ${currentTheme.bg};
      color: ${currentTheme.text};
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 30px 80px rgba(0,0,0,0.8);
      flex-direction: column;
      justify-content: space-between;
    }
    .slide.active {
      display: flex;
    }
    .ornament-grid {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .title-layout {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      text-align: center;
      z-index: 2;
    }
    .title-layout h1 {
      font-family: "${getThemeHeaderFont(currentTheme.archetype)}";
      font-size: 3.6rem;
      font-weight: 800;
      color: ${currentTheme.primary};
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 24px;
    }
    .title-layout p {
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
      font-size: 1.4rem;
      opacity: 0.85;
      font-weight: 300;
    }
    .content-layout {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      flex: 1;
      text-align: left;
      z-index: 2;
    }
    .content-layout h2 {
      font-family: "${getThemeHeaderFont(currentTheme.archetype)}";
      font-size: 2.4rem;
      font-weight: 700;
      color: ${currentTheme.primary};
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .content-layout p {
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
      font-size: 1.0rem;
      opacity: 0.7;
      margin-bottom: 32px;
      font-weight: 300;
    }
    .content-layout ul {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-left: 24px;
    }
    .content-layout li {
      font-size: 1.2rem;
      line-height: 1.4;
      opacity: 0.95;
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
    }
    .two-column-layout {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      flex: 1;
      text-align: left;
      z-index: 2;
    }
    .two-column-layout h2 {
      font-family: "${getThemeHeaderFont(currentTheme.archetype)}";
      font-size: 2.4rem;
      font-weight: 700;
      color: ${currentTheme.primary};
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .two-column-layout p {
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
      font-size: 1.0rem;
      opacity: 0.7;
      margin-bottom: 32px;
      font-weight: 300;
    }
    .two-column-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      flex: 1;
    }
    .two-column-col-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
      text-transform: uppercase;
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
    }
    .two-column-text {
      font-size: 1.1rem;
      line-height: 1.5;
      opacity: 0.85;
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
    }
    .quote-layout {
      display: flex;
      flex-direction: column;
      justify-content: center;
      flex: 1;
      text-align: center;
      padding: 0 8%;
      z-index: 2;
    }
    .quote-layout span {
      font-size: 4.5rem;
      color: ${currentTheme.primary};
      line-height: 0.1;
      font-family: serif;
      display: block;
      margin-bottom: 20px;
    }
    .quote-layout blockquote {
      font-size: 1.8rem;
      font-style: italic;
      font-family: "${getThemeHeaderFont(currentTheme.archetype)}";
      font-weight: 400;
      line-height: 1.45;
      margin-bottom: 24px;
    }
    .quote-layout cite {
      font-size: 1.1rem;
      color: ${currentTheme.secondary};
      font-style: normal;
      font-weight: 600;
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
    }
    .image-layout {
      display: grid;
      grid-template-columns: 1fr 1.1fr;
      gap: 40px;
      align-items: center;
      flex: 1;
      z-index: 2;
    }
    .image-layout-img-container {
      border-radius: 16px;
      overflow: hidden;
      height: 100%;
      max-height: 320px;
      border: 1px solid ${currentTheme.primary}20;
    }
    .image-layout img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .image-layout-text {
      text-align: left;
    }
    .image-layout-text h3 {
      font-family: "${getThemeHeaderFont(currentTheme.archetype)}";
      font-size: 2rem;
      font-weight: 700;
      color: ${currentTheme.primary};
      letter-spacing: -0.02em;
      margin-bottom: 12px;
    }
    .image-layout-text p {
      font-family: "${getThemeBodyFont(currentTheme.archetype)}";
      font-size: 1.2rem;
      line-height: 1.45;
      opacity: 0.9;
      font-weight: 300;
      margin-bottom: 20px;
    }
    .floating-element {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: center;
      box-sizing: border-box;
    }
    .branding {
      position: absolute;
      bottom: 24px;
      right: 32px;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0.5;
    }
    .branding-sub {
      font-size: 9px;
      letter-spacing: 0.06em;
      font-weight: 600;
    }
    .branding-main {
      font-size: 12px;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
    }
    .counter {
      position: absolute;
      bottom: 32px;
      left: 32px;
      color: #8c8780;
      font-size: 12px;
    }
    .controls {
      position: absolute;
      top: 24px;
      left: 24px;
      right: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 100;
    }
    .nav-badge {
      font-size: 11px;
      color: #8c8780;
      background: rgba(0,0,0,0.8);
      padding: 6px 12px;
      border-radius: 20px;
    }
  </style>
</head>
<body>
  <div class="controls">
    <span class="nav-badge">Present Mode · Use Arrow keys or Space</span>
  </div>
  
  <div class="slide-deck">
`;

    slides.forEach((slide, idx) => {
      const isActive = idx === 0 ? "active" : "";
      htmlContent += `    <div class="slide \${isActive}" id="slide_\${slide.id}">\n`;
      
      if (currentTheme.archetype === "editorial") {
        htmlContent += `      <div class="ornament-grid" style="border: 1px solid ${currentTheme.primary}20; inset: 12px;"></div>\n`;
      } else if (currentTheme.archetype === "cyber") {
        htmlContent += `      <div class="ornament-grid" style="border-top: 2px solid ${currentTheme.primary}; border-left: 2px solid ${currentTheme.primary}; width: 14px; height: 14px; top: 12px; left: 12px; position: absolute;"></div>\n`;
      }

      if (slide.layout === "title") {
        htmlContent += `      <div class="title-layout">
        <h1>\${slide.title || "Headline Title"}</h1>
        <p>\${slide.subtitle || "Subheading detail block"}</p>
      </div>\n`;
      } else if (slide.layout === "content") {
        htmlContent += `      <div class="content-layout">
        <h2>\${slide.title || "Section Header"}</h2>
        <p>\${slide.subtitle || "Optional section subtitle details..."}</p>
        <ul>
          \${(slide.bulletPoints || []).map(bp => \`<li>\${bp}</li>\`).join("\\n          ")}
        </ul>
      </div>\n`;
      } else if (slide.layout === "two-column") {
        htmlContent += `      <div class="two-column-layout">
        <h2>\${slide.title || "Comparative Columns"}</h2>
        <p>\${slide.subtitle || "Optional section subtitle details..."}</p>
        <div class="two-column-columns">
          <div>
            <div class="two-column-col-title" style="color: ${currentTheme.primary};">COLUMN ALPHA</div>
            <div class="two-column-text">\${slide.bulletPoints?.[0] || ""}</div>
          </div>
          <div>
            <div class="two-column-col-title" style="color: ${currentTheme.secondary};">COLUMN BETA</div>
            <div class="two-column-text">\${slide.bulletPoints?.[2] || ""}</div>
          </div>
        </div>
      </div>\n`;
      } else if (slide.layout === "quote") {
        htmlContent += `      <div class="quote-layout">
        <span>“</span>
        <blockquote>\${slide.quote || ""}</blockquote>
        <cite>— \${slide.author || "Anonymous"}</cite>
      </div>\n`;
      } else if (slide.layout === "image") {
        htmlContent += `      <div class="image-layout">
        <div class="image-layout-img-container">
          <img src="\${slide.image || "https://picsum.photos/id/180/600/400"}" />
        </div>
        <div class="image-layout-text">
          <h3>\${slide.title || ""}</h3>
          <p>\${slide.subtitle || ""}</p>
        </div>
      </div>\n`;
      } else {
        htmlContent += `      <div></div>\n`;
      }

      (slide.elements || []).forEach(el => {
        let elHtml = "";
        if (el.type === "text") {
          elHtml = `<div style="color: \${el.color || currentTheme.text}; font-size: \${(el.fontSize || 16) * 1.3}px; font-family: \${el.fontFamily || getThemeBodyFont(currentTheme.archetype)}; text-align: \${el.align || "center"}; font-weight: \${el.fontWeight || "normal"}; font-style: \${el.fontStyle || "normal"}; width: 100%; height: 100%; word-break: break-word;">\${el.text}</div>`;
        } else if (el.type === "shape") {
          if (el.shapeType === "rect") {
            elHtml = `<div style="width: 100%; height: 100%; background: \${el.color}; border-radius: \${el.borderRadius || 0}px;"></div>`;
          } else if (el.shapeType === "circle") {
            elHtml = `<div style="width: 100%; height: 100%; background: \${el.color}; border-radius: 50%;"></div>`;
          } else if (el.shapeType === "triangle") {
            elHtml = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill="\${el.color}" /></svg>`;
          } else if (el.shapeType === "star") {
            elHtml = `<svg width="100%" height="100%" viewBox="0 0 24 24" fill="\${el.color}"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/></svg>`;
          } else if (el.shapeType === "line") {
            elHtml = `<div style="width: 100%; height: 4px; background: \${el.color};"></div>`;
          }
        } else if (el.type === "sticker") {
          elHtml = `<div style="font-size: \${(el.fontSize || 16) * 3}px; line-height: 1;">\${el.stickerIcon}</div>`;
        } else if (el.type === "image") {
          elHtml = `<div style="width: 100%; height: 100%; border-radius: \${el.borderRadius || 0}px; overflow: hidden;"><img src="\${el.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`;
        }

        htmlContent += `      <div class="floating-element" style="left: \${el.x}%; top: \${el.y}%; width: \${el.w}%; height: \${el.h}%; transform: rotate(\${el.rotation || 0}deg); opacity: \${el.opacity ?? 1}; z-index: \${el.zIndex || 10};">
        \${elHtml}
      </div>\n`;
      });

      htmlContent += `      <div class="branding">
        <span class="branding-sub">POWERED BY</span>
        <span class="branding-main">Creatify</span>
      </div>\n`;

      htmlContent += `      <div class="counter">\${idx + 1} / \${slides.length}</div>\n`;
      htmlContent += `    </div>\n`;
    });

    htmlContent += `  </div>\n`;
    
    htmlContent += `  <script>
    let currentIdx = 0;
    const slides = document.querySelectorAll('.slide');
    function showSlide(idx) {
      slides[currentIdx].classList.remove('active');
      slides[idx].classList.add('active');
      currentIdx = idx;
    }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentIdx < slides.length - 1) showSlide(currentIdx + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIdx > 0) showSlide(currentIdx - 1);
      }
    });
  </script>\n</body>\n</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `\${projectTitle.replace(/\\s+/g, "_")}.html`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerExport = () => {
    window.print();
  };

  // ── Element Engine Operations ─────────────────────────────────────────────
  const addElement = (type, details = {}) => {
    const newElement = {
      id: `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type, // "text" | "shape" | "sticker"
      x: 35 + Math.random() * 10,
      y: 35 + Math.random() * 10,
      w: type === "text" ? 40 : 15,
      h: type === "text" ? 12 : 15,
      text: type === "text" ? "Double click to edit text" : "",
      shapeType: details.shapeType || "rect",
      stickerIcon: details.stickerIcon || "⭐️",
      color: theme.primary,
      bgColor: "transparent",
      borderRadius: type === "shape" && details.shapeType === "circle" ? 50 : 0,
      fontSize: 16,
      fontFamily: getThemeBodyFont(theme.archetype),
      fontWeight: "normal",
      align: "center",
      opacity: 1,
      rotation: 0,
      zIndex: (activeSlide.elements?.length || 0) + 10,
      ...details
    };
    updateSlideContent("elements", [...(activeSlide.elements || []), newElement]);
    setSelectedElementId(newElement.id);
    setSelectedFieldId(null);
  };

  const handleImageImport = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        addElement("image", { imageUrl: url, name: file.name, w: 25, h: 25, color: "transparent" });
      }
    });
    e.target.value = "";
  };

  const updateElementProperty = (elementId, key, val) => {
    setSlides(prev => prev.map(s => {
      if (s.id !== activeSlideId) return s;
      return {
        ...s,
        elements: (s.elements || []).map(el => {
          if (el.id !== elementId) return el;
          return { ...el, [key]: val };
        })
      };
    }));
  };

  const deleteElement = (elementId) => {
    if (!elementId) return;
    updateSlideContent("elements", (activeSlide.elements || []).filter(el => el.id !== elementId));
    setSelectedElementId(null);
  };

  const duplicateElement = (elementId) => {
    const el = (activeSlide.elements || []).find(x => x.id === elementId);
    if (!el) return;
    const newId = `elem_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const dup = { ...el, id: newId, x: Math.min(90, el.x + 4), y: Math.min(90, el.y + 4), zIndex: el.zIndex + 1 };
    updateSlideContent("elements", [...(activeSlide.elements || []), dup]);
    setSelectedElementId(newId);
  };

  // ── Drag & Resize Mouse Handlers ──────────────────────────────────────────
  const handleElementMouseDown = (e, elementId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedElementId(elementId);
    setSelectedFieldId(null);

    const el = (activeSlide.elements || []).find(x => x.id === elementId);
    if (!el) return;

    dragStartRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: el.x,
      startTop: el.y
    };

    const handleMouseMove = (moveEvent) => {
      if (!dragStartRef.current || !viewportRef.current) return;
      const { elementId, startX, startY, startLeft, startTop } = dragStartRef.current;
      const rect = viewportRef.current.getBoundingClientRect();
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      setSlides(prev => prev.map(s => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: (s.elements || []).map(item => {
            if (item.id !== elementId) return item;
            return {
              ...item,
              x: Math.max(0, Math.min(95, startLeft + deltaX)),
              y: Math.max(0, Math.min(95, startTop + deltaY))
            };
          })
        };
      }));
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e, elementId) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const el = (activeSlide.elements || []).find(x => x.id === elementId);
    if (!el) return;

    resizeStartRef.current = {
      elementId,
      startX: e.clientX,
      startY: e.clientY,
      startW: el.w,
      startH: el.h
    };

    const handleMouseMove = (moveEvent) => {
      if (!resizeStartRef.current || !viewportRef.current) return;
      const { elementId, startX, startY, startW, startH } = resizeStartRef.current;
      const rect = viewportRef.current.getBoundingClientRect();
      const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
      const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

      setSlides(prev => prev.map(s => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: (s.elements || []).map(item => {
            if (item.id !== elementId) return item;
            return {
              ...item,
              w: Math.max(2, Math.min(100, startW + deltaX)),
              h: Math.max(2, Math.min(100, startH + deltaY))
            };
          })
        };
      }));
    };

    const handleMouseUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // ── Design-to-Code Exporter ───────────────────────────────────────────────
  const generateReactCode = () => {
    const currentTheme = PRESENTATION_THEMES[themeIdx];
    const layout = activeSlide.layout;
    
    let layoutHtml = "";
    if (layout === "title") {
      layoutHtml = `
      {/* Title Layout */}
      <div className="flex flex-col justify-center flex-1 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight mb-5 text-[${currentTheme.primary}]" style={{ fontFamily: "${getThemeHeaderFont(currentTheme.archetype)}" }}>
          {"${activeSlide.title}"}
        </h1>
        <p className="text-xl font-light opacity-90 text-[${currentTheme.text}]" style={{ fontFamily: "${getThemeBodyFont(currentTheme.archetype)}" }}>
          {"${activeSlide.subtitle}"}
        </p>
      </div>`;
    } else if (layout === "content") {
      layoutHtml = `
      {/* Content List Layout */}
      <div className="flex flex-col justify-start flex-1 text-left">
        <h2 className="text-4xl font-bold tracking-tight mb-2 text-[${currentTheme.primary}]" style={{ fontFamily: "${getThemeHeaderFont(currentTheme.archetype)}" }}>
          {"${activeSlide.title}"}
        </h2>
        <p className="text-sm font-light opacity-75 mb-6 text-[${currentTheme.text}]" style={{ fontFamily: "${getThemeBodyFont(currentTheme.archetype)}" }}>
          {"${activeSlide.subtitle}"}
        </p>
        <ul className="flex flex-col gap-3 list-disc pl-6 text-lg opacity-90 text-[${currentTheme.text}]">
          ${(activeSlide.bulletPoints || []).map(bp => `<li className="leading-relaxed">${bp}</li>`).join("\n          ")}
        </ul>
      </div>`;
    } else if (layout === "two-column") {
      layoutHtml = `
      {/* Two Column Layout */}
      <div className="flex flex-col justify-start flex-1 text-left">
        <h2 className="text-4xl font-bold tracking-tight mb-2 text-[${currentTheme.primary}]" style={{ fontFamily: "${getThemeHeaderFont(currentTheme.archetype)}" }}>
          {"${activeSlide.title}"}
        </h2>
        <p className="text-sm opacity-70 mb-6 text-[${currentTheme.text}]" style={{ fontFamily: "${getThemeBodyFont(currentTheme.archetype)}" }}>
          {"${activeSlide.subtitle}"}
        </p>
        <div className="grid grid-cols-2 gap-8 flex-1">
          <div>
            <div className="text-xs font-bold tracking-wider mb-2 uppercase text-[${currentTheme.primary}]">Column Alpha</div>
            <p className="text-base leading-relaxed opacity-90 text-[${currentTheme.text}]">${activeSlide.bulletPoints[0] || ""}</p>
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider mb-2 uppercase text-[${currentTheme.secondary}]">Column Beta</div>
            <p className="text-base leading-relaxed opacity-90 text-[${currentTheme.text}]">${activeSlide.bulletPoints[2] || ""}</p>
          </div>
        </div>
      </div>`;
    } else if (layout === "quote") {
      layoutHtml = `
      {/* Quote Layout */}
      <div className="flex flex-col justify-center flex-1 text-center px-10">
        <span className="text-6xl text-[${currentTheme.primary}] font-serif block mb-4">“</span>
        <blockquote className="text-2xl italic font-light leading-relaxed mb-4 text-[${currentTheme.text}]">
          "${activeSlide.quote}"
        </blockquote>
        <cite className="text-sm font-semibold not-italic tracking-wide text-[${currentTheme.secondary}]">
          — ${activeSlide.author || "Anonymous"}
        </cite>
      </div>`;
    } else if (layout === "image") {
      layoutHtml = `
      {/* Image + Content Layout */}
      <div className="grid grid-cols-[1fr_1.1fr] gap-8 items-center flex-1">
        <div className="rounded-xl overflow-hidden max-h-60 border border-[${currentTheme.primary}]/20">
          <img src="${activeSlide.image || "https://picsum.photos/id/180/600/400"}" className="w-full h-full object-cover" />
        </div>
        <div className="text-left">
          <h3 className="text-3xl font-bold tracking-tight mb-2 text-[${currentTheme.primary}]" style={{ fontFamily: "${getThemeHeaderFont(currentTheme.archetype)}" }}>
            {"${activeSlide.title}"}
          </h3>
          <p className="text-base font-light opacity-90 leading-relaxed mb-4 text-[${currentTheme.text}]" style={{ fontFamily: "${getThemeBodyFont(currentTheme.archetype)}" }}>
            {"${activeSlide.subtitle}"}
          </p>
        </div>
      </div>`;
    }

    let elementsHtml = "";
    (activeSlide.elements || []).forEach(el => {
      let content = "";
      if (el.type === "text") {
        content = `<div className="text-[${el.color || currentTheme.text}] text-[${el.align}]" style={{ fontSize: "${el.fontSize || 16}px", fontFamily: "${el.fontFamily || getThemeBodyFont(currentTheme.archetype)}", fontWeight: "${el.fontWeight || 'normal'}", fontStyle: "${el.fontStyle || 'normal'}" }}>${el.text}</div>`;
      } else if (el.type === "shape") {
        if (el.shapeType === "rect") {
          content = `<div className="w-full h-full rounded-[${el.borderRadius || 0}px] bg-[${el.color}]" />`;
        } else if (el.shapeType === "circle") {
          content = `<div className="w-full h-full rounded-full bg-[${el.color}]" />`;
        } else if (el.shapeType === "triangle") {
          content = `<svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill="${el.color}" /></svg>`;
        } else if (el.shapeType === "star") {
          content = `<svg className="w-full h-full" viewBox="0 0 24 24" fill="${el.color}"><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/></svg>`;
        } else if (el.shapeType === "line") {
          content = `<div className="w-full h-1 bg-[${el.color}]" />`;
        }
      } else if (el.type === "sticker") {
        content = `<span className="text-[${(el.fontSize || 16) * 2}px] leading-none">${el.stickerIcon || "⭐️"}</span>`;
      } else if (el.type === "image") {
        content = `<img src="${el.imageUrl}" className="w-full h-full object-cover" style={{ borderRadius: "${el.borderRadius || 0}px" }} />`;
      }

      elementsHtml += `
      {/* Floating Element: ${el.type} */}
      <div className="absolute" style={{ left: "${el.x}%", top: "${el.y}%", width: "${el.w}%", height: "${el.h}%", transform: "rotate(${el.rotation || 0}deg)", opacity: ${el.opacity ?? 1}, zIndex: ${el.zIndex || 10} }}>
        ${content}
      </div>`;
    });

    return `// Exported from Creatify Presentation Studio
import React from 'react';

export default function PresentationSlide() {
  return (
    <div className="w-full max-w-[850px] aspect-[16/9] rounded-2xl overflow-hidden relative flex flex-col justify-between p-[8%] select-none box-border shadow-2xl border border-[rgba(212,165,116,0.15)] bg-[${currentTheme.bg}] text-[${currentTheme.text}]"
      style={{ background: "${currentTheme.bg}" }}
    >
      {/* Background Ornament/Theme Archetype: ${currentTheme.styleName} */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Draw background visual structures */}
      </div>

      ${layoutHtml}

      ${elementsHtml}

      {/* Footer Branding */}
      <div className="absolute bottom-4 right-6 flex items-center gap-1.5 opacity-50">
        <span className="text-[8px] tracking-widest font-semibold font-sans">POWERED BY</span>
        <span className="text-[10px] font-extrabold" style={{ fontFamily: 'Syne, sans-serif' }}>Creatify</span>
      </div>
    </div>
  );
}`;
  };

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(generateReactCode());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div 
      onClick={() => { setSelectedElementId(null); setSelectedFieldId(null); setShowLayoutDropdown(false); }}
      style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins', sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none", margin: 0, padding: 0 }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Instrument+Sans:wght@300;400;500;600&family=Syne:wght@700;800&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Share+Tech+Mono&family=Inter:wght@400;700;900&family=Outfit:wght@300;600;800&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body,html{height:100%;width:100%;overflow:hidden;background:#0c0a09}
        @media print {
          body * {
            visibility: hidden;
          }
          .print-presentation-wrapper, .print-presentation-wrapper * {
            visibility: visible;
          }
          .print-presentation-wrapper {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            display: block !important;
          }
          .print-slide {
            page-break-after: always;
            width: 100vw !important;
            height: 56.25vw !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 8% !important;
            box-sizing: border-box;
            position: relative;
          }
        }
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0c0a09}
        ::-webkit-scrollbar-thumb{background:rgba(212,165,116,0.2);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#d4a574}
        
        .tool-btn{background:rgba(212,165,116,0.05);border:1px solid rgba(212,165,116,0.15);color:#e5e5e5;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-family:'Poppins',sans-serif;font-weight:400;display:flex;align-items:center;gap:8px;transition:all 0.2s;white-space:nowrap}
        .tool-btn:hover{background:rgba(212,165,116,0.15);color:#d4a574;border-color:#d4a574;transform:translateY(-1px)}
        .tool-btn.primary{background:linear-gradient(135deg,#8b5a2b,#d4a574);border:none;color:#ffffff;box-shadow:0 2px 10px rgba(139,90,43,0.3);font-weight:500}
        .tool-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(139,90,43,0.45);background:linear-gradient(135deg,#9c6a3b,#e5b685)}
        .tool-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.04)}
        .tool-btn.danger:hover{background:rgba(239,68,68,0.15);color:#ef4444;border-color:#ef4444;transform:translateY(-1px)}
        
        .glass-panel {
          background: rgba(19, 17, 16, 0.75);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(212, 165, 116, 0.12);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        }
        .sidebar-panel {
          background: rgba(19, 17, 16, 0.75);
          backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(212, 165, 116, 0.08);
        }
        .theme-swatch{width:100%;height:46px;border-radius:8px;cursor:pointer;border:2px solid transparent;transition:all 0.2s;display:flex;flex-direction:column;padding:8px;justify-content:center;font-size:11px;font-family:'Poppins',sans-serif}
        .theme-swatch:hover{transform:translateY(-1px);box-shadow:0 4px 10px rgba(0,0,0,0.15)}
        .theme-swatch.active{border-color:#d4a574;box-shadow:0 0 8px rgba(212,165,116,0.3)}
        
        .slide-thumb{border:2px solid transparent;border-radius:12px;overflow:hidden;aspect-ratio:16/9;width:100%;cursor:pointer;background:#1a1a1a;position:relative;transition:all 0.25s}
        .slide-thumb:hover{transform:scale(1.02);border-color:rgba(212,165,116,0.3)}
        .slide-thumb.active{border-color:#d4a574;box-shadow:0 0 12px rgba(212,165,116,0.25)}

        .element-btn{background:rgba(212,165,116,0.03);border:1px dashed rgba(212,165,116,0.2);color:#e5e5e5;padding:12px;border-radius:8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;transition:all 0.2s;font-size:11px;font-family:'Poppins',sans-serif}
        .element-btn:hover{background:rgba(212,165,116,0.1);border-color:#d4a574;color:#d4a574;transform:translateY(-1px)}

        @keyframes slideFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideZoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideLeftIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideGlitchIn {
          0% { opacity: 0; filter: hue-rotate(90deg); transform: skewX(10deg); }
          20% { opacity: 0.8; filter: none; transform: skewX(-5deg); }
          40% { opacity: 0.5; filter: invert(0.2); transform: skewX(0deg); }
          100% { opacity: 1; }
        }
        .slide-transition-fade { animation: slideFadeIn 0.35s ease-out forwards; }
        .slide-transition-zoom { animation: slideZoomIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-transition-slide { animation: slideLeftIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .slide-transition-glitch { animation: slideGlitchIn 0.3s steps(2, end) forwards; }
      `}</style>

      {/* Header bar */}
      <div className="sidebar-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(212,165,116,0.12)", flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Back button */}
          <button onClick={handleBackClick} className="tool-btn" style={{ padding: "6px 14px", fontSize: "12px", gap: "6px" }} title="Back to Home">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
            Back
          </button>

          <div style={{ width: "1px", height: "20px", background: "rgba(212,165,116,0.15)" }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", cursor: "pointer" }} onClick={handleBackClick}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg,#8b5a2b,#d4a574)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8 L8 2 L13 8 L8 14 Z" fill="white" opacity="0.9"/><circle cx="8" cy="8" r="2" fill="white"/></svg>
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.04em", color: "#ffffff" }}>
              Creat<span style={{ color: "#d4a574" }}>ify</span>
            </div>
            <span style={{ fontSize: "9px", background: "rgba(212, 165, 116, 0.12)", border: "1px solid rgba(212, 165, 116, 0.3)", color: "#d4a574", padding: "2px 6px", borderRadius: "8px", fontWeight: 600, fontFamily: "'Poppins', sans-serif", letterSpacing: "0.02em" }}>SLIDES</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
          {/* Present button */}
          <button className="tool-btn primary" onClick={() => setPresentMode(true)} style={{ padding: "8px", width: "34px", height: "34px", justifyContent: "center" }} title="Present Mode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </button>

          {/* Export button (icon only) */}
          <button className="tool-btn" onClick={triggerExport} style={{ padding: "8px", width: "34px", height: "34px", justifyContent: "center" }} title="Export PDF">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>

          <div style={{ width: "1px", height: "20px", background: "rgba(212,165,116,0.15)" }} />

          {/* User profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(212, 165, 116, 0.08)", border: "1px solid rgba(212, 165, 116, 0.2)", padding: "4px 12px 4px 6px", borderRadius: "30px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg, #8b5a2b, #d4a574)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, fontFamily: "'Poppins', sans-serif" }}>
              {user ? user.name[0].toUpperCase() : "C"}
            </div>
            <span style={{ fontSize: "12px", color: "#e5e5e5", fontWeight: 500, fontFamily: "'Poppins', sans-serif" }}>
              {user ? user.name : "Creator Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "#0c0a09" }}>
        
        {/* Left Tabbed Sidebar Container */}
        <div style={{ display: "flex", height: "100%", zIndex: 5, flexShrink: 0 }}>
          
          {/* Narrow 68px Icon Rail */}
          <div className="sidebar-panel" style={{ width: "68px", minWidth: "68px", borderRight: "1px solid rgba(212,165,116,0.12)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "16px", gap: "20px", background: "rgba(19, 17, 16, 0.95)" }}>
            {[
              { id: "slides",   label: "Slides",    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg> },
              { id: "elements", label: "Elements",  icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 22 22 22"/><circle cx="12" cy="12" r="4" opacity="0.4"/></svg> },
              { id: "themes",   label: "Themes",    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" opacity="0.4"/><circle cx="12" cy="12" r="2"/></svg> },
              { id: "code",     label: "Code",      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
            ].map(tab => {
              const active = leftTab === tab.id;
              return (
                <button 
                  key={tab.id} 
                  onClick={() => {
                    if (leftTab === tab.id) {
                      setLeftPanelOpen(!leftPanelOpen);
                    } else {
                      setLeftTab(tab.id);
                      setLeftPanelOpen(true);
                    }
                  }}
                  style={{
                    background: "none", border: "none", color: active && leftPanelOpen ? "#d4a574" : "#8c8780", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", width: "100%", padding: "8px 0", borderLeft: active && leftPanelOpen ? "3px solid #d4a574" : "3px solid transparent", transition: "all 0.2s"
                  }}
                  title={tab.label}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
                  <span style={{ fontSize: "9px", fontWeight: active && leftPanelOpen ? 600 : 400 }}>{tab.label}</span>
                </button>
              );
            })}

            {/* Collapse Trigger Arrow at the bottom */}
            <div style={{ marginTop: "auto", marginBottom: "16px" }}>
              <button 
                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                className="tool-btn"
                style={{ padding: "8px", borderRadius: "50%", width: "32px", height: "32px", justifyContent: "center", background: "rgba(212,165,116,0.05)" }}
                title={leftPanelOpen ? "Collapse Panel" : "Expand Panel"}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: leftPanelOpen ? "rotate(0deg)" : "rotate(180deg)", transition: "transform 0.3s" }}>
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Slide-out Content Panel (260px width) */}
          <div 
            className="sidebar-panel" 
            style={{ 
              width: leftPanelOpen ? "260px" : "0px", 
              minWidth: leftPanelOpen ? "260px" : "0px", 
              opacity: leftPanelOpen ? 1 : 0,
              pointerEvents: leftPanelOpen ? "auto" : "none",
              borderRight: leftPanelOpen ? "1px solid rgba(212,165,116,0.12)" : "none", 
              display: "flex", 
              flexDirection: "column", 
              height: "100%", 
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              background: "rgba(15, 13, 12, 0.95)"
            }}
          >
            {/* Tab Content Header */}
            <div style={{ padding: "16px 16px 8px 16px", display: "flex", alignItems: "center", borderBottom: "1px solid rgba(212,165,116,0.08)" }}>
              <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins', sans-serif", textTransform: "uppercase" }}>
                {leftTab === "slides" ? "Slides Outline" : leftTab === "elements" ? "Elements Panel" : leftTab === "themes" ? "Themes Presets" : "Export Tools"}
              </span>
            </div>

            {/* Tab Content Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              
              {/* 📁 SLIDES Tab */}
              {leftTab === "slides" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ paddingBottom: "12px", borderBottom: "1px solid rgba(212,165,116,0.08)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button className="tool-btn primary" style={{ width: "100%", justifyContent: "center" }} onClick={addSlide}>
                      + Add Slide
                    </button>
                  </div>

                  {/* Slides List Outline */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {slides.map((s, idx) => {
                      const active = s.id === activeSlideId;
                      return (
                        <div key={s.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "10px", color: active ? "#d4a574" : "#8c8780", fontFamily: "'Poppins', sans-serif", fontWeight: 500 }}>Slide {idx + 1}</span>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <button style={{ background: "none", border: "none", color: idx === 0 ? "#444" : "#8c8780", fontSize: "10px", cursor: idx === 0 ? "not-allowed" : "pointer" }} onClick={(e) => { e.stopPropagation(); moveSlide(idx, "up"); }} disabled={idx === 0}>▲</button>
                              <button style={{ background: "none", border: "none", color: idx === slides.length - 1 ? "#444" : "#8c8780", fontSize: "10px", cursor: idx === slides.length - 1 ? "not-allowed" : "pointer" }} onClick={(e) => { e.stopPropagation(); moveSlide(idx, "down"); }} disabled={idx === slides.length - 1}>▼</button>
                              <button style={{ background: "none", border: "none", color: "#ef4444", fontSize: "10px", cursor: "pointer", marginLeft: "4px" }} onClick={(e) => { e.stopPropagation(); deleteSlide(s.id); }}>✕</button>
                            </div>
                          </div>

                          <div className={`slide-thumb ${active ? "active" : ""}`} onClick={() => { setActiveSlideId(s.id); setSelectedElementId(null); setSelectedFieldId(null); }}>
                            {/* Mini Thumbnail Swatch */}
                            <div style={{ width: "100%", height: "100%", background: theme.bg, color: theme.text, padding: "8px", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative" }}>
                              <span style={{ fontSize: "7px", fontWeight: 700, color: theme.primary, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "80%" }}>
                                {s.title || (s.layout === "quote" ? `"${s.quote.substring(0, 10)}..."` : "No Title")}
                              </span>
                              <span style={{ fontSize: "5px", opacity: 0.6, marginTop: "2px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "80%" }}>
                                {s.subtitle || s.author}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 🎨 ELEMENTS Tab */}
              {leftTab === "elements" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* File Upload Importer */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", borderBottom: "1px solid rgba(212,165,116,0.08)", paddingBottom: "14px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780", fontWeight: 500, letterSpacing: "0.03em" }}>MY UPLOADS</label>
                    <button className="tool-btn primary" style={{ justifyContent: "center", width: "100%", gap: "6px" }} onClick={() => imageInputRef.current.click()}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      Import Custom Image
                    </button>
                    <input ref={imageInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageImport} />
                  </div>

                  {/* Text blocks */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780", fontWeight: 500 }}>TEXT LAYERS</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "H1 · Heading", size: 36, weight: "800", text: "Heading 1" },
                        { label: "H2 · Title", size: 30, weight: "700", text: "Heading 2" },
                        { label: "H3 · Subtitle", size: 24, weight: "600", text: "Heading 3" },
                        { label: "H4 · Block Title", size: 20, weight: "600", text: "Heading 4" },
                        { label: "H5 · Bold Text", size: 16, weight: "600", text: "Heading 5" },
                        { label: "H6 · Small Heading", size: 14, weight: "500", text: "Heading 6" },
                        { label: "Paragraph Body", size: 14, weight: "normal", text: "Double click to edit paragraph body text." }
                      ].map(t => (
                        <button 
                          key={t.label} 
                          className="element-btn" 
                          style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", padding: "10px 14px" }}
                          onClick={() => addElement("text", { fontSize: t.size, text: t.text, fontWeight: t.weight })}
                        >
                          <span style={{ fontSize: "12px", fontWeight: t.weight }}>{t.label}</span>
                          <span style={{ fontSize: "10px", opacity: 0.5 }}>{t.size}px</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shapes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780", fontWeight: 500 }}>GEOMETRIC SHAPES</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <button className="element-btn" onClick={() => addElement("shape", { shapeType: "rect", color: theme.primary })}>
                        <div style={{ width: "18px", height: "18px", background: theme.primary }} /> Square
                      </button>
                      <button className="element-btn" onClick={() => addElement("shape", { shapeType: "circle", color: theme.secondary })}>
                        <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: theme.secondary }} /> Circle
                      </button>
                      <button className="element-btn" onClick={() => addElement("shape", { shapeType: "triangle", color: theme.primary })}>
                        <svg width="18" height="18" viewBox="0 0 100 100"><polygon points="50,0 100,100 0,100" fill={theme.primary} /></svg> Triangle
                      </button>
                      <button className="element-btn" onClick={() => addElement("shape", { shapeType: "star", color: theme.secondary })}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill={theme.secondary}><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/></svg> Star
                      </button>
                      <button className="element-btn" style={{ gridColumn: "span 2" }} onClick={() => addElement("shape", { shapeType: "line", color: theme.primary, w: 30, h: 2 })}>
                        <div style={{ width: "50px", height: "3px", background: theme.primary }} /> Line Rule
                      </button>
                    </div>
                  </div>

                  {/* Typography Presets */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780", fontWeight: 500 }}>TYPOGRAPHY PRESETS</label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { name: "Elegant Editorial", font: "Playfair Display", weight: "normal", style: "italic", size: 28 },
                        { name: "Cyber Monospace", font: "Share Tech Mono", weight: "bold", style: "normal", size: 24 },
                        { name: "Bauhaus Bold", font: "Inter", weight: "800", style: "normal", size: 32 },
                        { name: "Minimalist Light", font: "Outfit", weight: "300", style: "normal", size: 20 },
                        { name: "Classic Poppins", font: "Poppins", weight: "500", style: "normal", size: 18 }
                      ].map(preset => (
                        <button 
                          key={preset.name} 
                          className="element-btn" 
                          style={{ width: "100%", alignItems: "flex-start", padding: "10px 14px", display: "flex", flexDirection: "column", gap: "2px" }}
                          onClick={() => addElement("text", { fontSize: preset.size, fontFamily: preset.font, fontWeight: preset.weight, fontStyle: preset.style, text: preset.name })}
                        >
                          <span style={{ fontFamily: preset.font, fontWeight: preset.weight, fontStyle: preset.style, fontSize: "14px", color: "#ffffff" }}>
                            {preset.name}
                          </span>
                          <span style={{ fontSize: "9px", opacity: 0.5, fontFamily: "sans-serif" }}>
                            {preset.font} · {preset.weight} · {preset.size}px
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 🎨 THEMES Tab */}
              {leftTab === "themes" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {PRESENTATION_THEMES.map((t, idx) => (
                      <div 
                        key={idx} 
                        className={`theme-swatch ${themeIdx === idx ? "active" : ""}`}
                        style={{ background: t.bg, color: t.text, border: themeIdx === idx ? `2px solid ${t.primary}` : "2px solid transparent" }} 
                        onClick={() => setThemeIdx(idx)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: "11px" }}>{t.name}</span>
                          <span style={{ fontSize: "8px", background: "rgba(255,255,255,0.15)", padding: "1px 4px", borderRadius: "3px", color: t.primary, fontWeight: 700, textTransform: "uppercase" }}>{t.archetype}</span>
                        </div>
                        <span style={{ fontSize: "8px", opacity: 0.6, marginTop: "2px" }}>{t.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 💻 CODE Tab */}
              {leftTab === "code" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <span style={{ fontSize: "9px", color: "#8c8780" }}>SLIDE TRANSITION</span>
                    <select 
                      value={transitionStyle} 
                      onChange={e => setTransitionStyle(e.target.value)}
                      style={{ ...editorInputStyle, background: "#131110", border: "1px solid rgba(212,165,116,0.2)", cursor: "pointer" }}
                    >
                      <option value="none">No Transition</option>
                      <option value="fade">Elegant Fade</option>
                      <option value="zoom">Scale Zoom</option>
                      <option value="slide">Slide Left</option>
                      <option value="glitch">Glitch</option>
                    </select>
                  </div>

                  <div style={{ width: "100%", height: "1px", background: "rgba(212,165,116,0.1)", margin: "4px 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780" }}>REACT EXPORTER</label>
                    <button className="tool-btn primary" style={{ justifyContent: "center", width: "100%" }} onClick={() => setShowCodeModal(true)}>
                      Export React Code
                    </button>
                  </div>

                  <div style={{ width: "100%", height: "1px", background: "rgba(212,165,116,0.1)", margin: "4px 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <label style={{ fontSize: "9px", color: "#8c8780" }}>DOWNLOAD PRESENTATION</label>
                    <button className="tool-btn primary" style={{ justifyContent: "center", width: "100%", marginBottom: "6px" }} onClick={exportHTMLSlideshow}>
                      Export Offline HTML Deck
                    </button>
                    <button className="tool-btn" style={{ justifyContent: "center", width: "100%" }} onClick={triggerExport}>
                      Compile PDF Deck
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Center Live Slide Preview Canvas */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0c0a09", padding: "24px" }}>
          
          {/* Top Canvas Toolbar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexShrink: 0, gap: "16px", minHeight: "40px" }}>
            <div style={{ position: "relative" }}>
              <button 
                className="tool-btn" 
                onClick={(e) => { e.stopPropagation(); setShowLayoutDropdown(!showLayoutDropdown); }}
                style={{ gap: "6px" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>
                Layout: {
                  activeSlide.layout === "title" ? "Title Slide" :
                  activeSlide.layout === "content" ? "Bullet Points" :
                  activeSlide.layout === "two-column" ? "Two Columns" :
                  activeSlide.layout === "quote" ? "Block Quote" :
                  activeSlide.layout === "image" ? "Image+Text" :
                  activeSlide.layout === "blank" ? "Blank Slide" : activeSlide.layout
                }
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: "4px", transform: showLayoutDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              {showLayoutDropdown && (
                <div className="glass-panel" style={{ position: "absolute", top: "100%", left: 0, marginTop: "6px", borderRadius: "10px", padding: "6px", zIndex: 100, minWidth: "180px" }}>
                  <div style={{ fontSize: "9px", color: "#8c8780", padding: "4px 8px", fontWeight: 600 }}>SELECT LAYOUT</div>
                  {[
                    { id: "blank", label: "Blank Slide", icon: "🔳" },
                    { id: "title", label: "Title Slide", icon: "🏷️" },
                    { id: "content", label: "Bullet Points", icon: "📝" },
                    { id: "two-column", label: "Two Columns", icon: "📊" },
                    { id: "quote", label: "Block Quote", icon: "💬" },
                    { id: "image", label: "Image + Content", icon: "📸" }
                  ].map(l => (
                    <button 
                      key={l.id} 
                      className="tool-btn" 
                      style={{ 
                        width: "100%", 
                        justifyContent: "flex-start", 
                        border: "none", 
                        background: activeSlide.layout === l.id ? "rgba(212,165,116,0.15)" : "none", 
                        padding: "8px 10px", 
                        borderRadius: "6px",
                        color: activeSlide.layout === l.id ? "#d4a574" : "#e5e5e5"
                      }} 
                      onClick={(e) => { e.stopPropagation(); updateSlideContent("layout", l.id); setShowLayoutDropdown(false); }}
                    >
                      <span style={{ marginRight: "8px" }}>{l.icon}</span> {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Formatting Bar for Selected Element */}
            {selectedElementId && (() => {
              const el = activeSlide.elements?.find(x => x.id === selectedElementId);
              if (!el) return null;
              return (
                <div className="glass-panel" style={{ display: "flex", gap: "8px", alignItems: "center", padding: "4px 12px", borderRadius: "8px", border: "1px solid rgba(212,165,116,0.2)" }} onClick={(e) => e.stopPropagation()}>
                  
                  {/* TEXT ELEMENT CONTROLS */}
                  {el.type === "text" && (
                    <>
                      {/* Font Family Dropdown */}
                      <select 
                        value={el.fontFamily || "Poppins"} 
                        onChange={e => updateElementProperty(el.id, "fontFamily", e.target.value)}
                        style={{ background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", outline: "none", cursor: "pointer" }}
                      >
                        <option value="Poppins">Poppins</option>
                        <option value="Syne">Syne</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Share Tech Mono">Share Tech Mono</option>
                        <option value="Inter">Inter</option>
                        <option value="Outfit">Outfit</option>
                        <option value="Georgia">Georgia</option>
                      </select>

                      {/* Font Weight Dropdown */}
                      <select 
                        value={el.fontWeight || "normal"} 
                        onChange={e => updateElementProperty(el.id, "fontWeight", e.target.value)}
                        style={{ background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px 8px", borderRadius: "6px", outline: "none", cursor: "pointer" }}
                      >
                        <option value="300">Light</option>
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="600">Semi-bold</option>
                        <option value="bold">Bold</option>
                        <option value="800">Extra-bold</option>
                      </select>

                      {/* Font Style (Italic) Toggle */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); updateElementProperty(el.id, "fontStyle", el.fontStyle === "italic" ? "normal" : "italic"); }}
                        style={{
                          background: el.fontStyle === "italic" ? "rgba(212,165,116,0.2)" : "none",
                          border: "none", color: el.fontStyle === "italic" ? "#d4a574" : "#8c8780",
                          padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", fontWeight: "bold"
                        }}
                      >
                        I
                      </button>

                      {/* Font Size Input */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>Size:</span>
                        <input 
                          type="number" min="8" max="100" 
                          value={el.fontSize || 16} 
                          onChange={e => updateElementProperty(el.id, "fontSize", parseInt(e.target.value) || 12)} 
                          style={{ width: "45px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", textAlign: "center", outline: "none" }} 
                        />
                      </div>

                      {/* Color Picker */}
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <input 
                          type="color" 
                          value={el.color || theme.text} 
                          onChange={e => updateElementProperty(el.id, "color", e.target.value)} 
                          style={{ background: "none", border: "none", width: "22px", height: "22px", cursor: "pointer", padding: 0 }} 
                        />
                      </div>

                      {/* Alignment */}
                      <div style={{ display: "flex", gap: "2px", background: "rgba(12,10,9,0.3)", padding: "2px", borderRadius: "6px" }}>
                        {["left", "center", "right"].map(align => (
                          <button 
                            key={align} 
                            onClick={(e) => { e.stopPropagation(); updateElementProperty(el.id, "align", align); }}
                            style={{
                              border: "none", background: el.align === align ? "rgba(212,165,116,0.2)" : "none", color: el.align === align ? "#d4a574" : "#8c8780", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", cursor: "pointer"
                            }}
                          >
                            {align[0].toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  {/* SHAPE ELEMENT CONTROLS */}
                  {el.type === "shape" && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>W:</span>
                        <input type="number" min="2" max="100" value={Math.round(el.w) || 15} onChange={e => updateElementProperty(el.id, "w", parseFloat(e.target.value) || 15)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>H:</span>
                        <input type="number" min="2" max="100" value={Math.round(el.h) || 15} onChange={e => updateElementProperty(el.id, "h", parseFloat(e.target.value) || 15)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>Rot:</span>
                        <input type="number" min="-360" max="360" value={el.rotation || 0} onChange={e => updateElementProperty(el.id, "rotation", parseInt(e.target.value) || 0)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                      </div>

                      <input type="color" value={el.color || theme.primary} onChange={e => updateElementProperty(el.id, "color", e.target.value)} style={{ background: "none", border: "none", width: "22px", height: "22px", cursor: "pointer", padding: 0 }} />

                      {el.shapeType === "rect" && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "9px", color: "#8c8780" }}>Radius:</span>
                          <input type="range" min="0" max="40" value={el.borderRadius || 0} onChange={e => updateElementProperty(el.id, "borderRadius", parseInt(e.target.value))} style={{ width: "50px", cursor: "pointer" }} />
                        </div>
                      )}
                    </>
                  )}

                  {/* IMAGE ELEMENT CONTROLS */}
                  {el.type === "image" && (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>W:</span>
                        <input type="number" min="2" max="100" value={Math.round(el.w) || 25} onChange={e => updateElementProperty(el.id, "w", parseFloat(e.target.value) || 25)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>H:</span>
                        <input type="number" min="2" max="100" value={Math.round(el.h) || 25} onChange={e => updateElementProperty(el.id, "h", parseFloat(e.target.value) || 25)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>Rot:</span>
                        <input type="number" min="-360" max="360" value={el.rotation || 0} onChange={e => updateElementProperty(el.id, "rotation", parseInt(e.target.value) || 0)} style={{ width: "42px", background: "#131110", border: "1px solid rgba(212,165,116,0.15)", color: "#fff", fontSize: "11px", padding: "4px", borderRadius: "6px", outline: "none" }} />
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>Radius:</span>
                        <input type="range" min="0" max="100" value={el.borderRadius || 0} onChange={e => updateElementProperty(el.id, "borderRadius", parseInt(e.target.value))} style={{ width: "60px", cursor: "pointer" }} />
                      </div>
                    </>
                  )}

                  {/* GLOBAL CONTROLS FOR ALL ELEMENT TYPES (OPACITY, LAYER ORDER, DUPLICATE, DELETE) */}
                  <div style={{ width: "1px", height: "16px", background: "rgba(212,165,116,0.2)" }} />

                  {/* Opacity */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "9px", color: "#8c8780" }}>Opa:</span>
                    <input type="range" min="0" max="1" step="0.1" value={el.opacity ?? 1} onChange={e => updateElementProperty(el.id, "opacity", parseFloat(e.target.value))} style={{ width: "45px", cursor: "pointer" }} />
                  </div>

                  {/* Layer ordering */}
                  <button onClick={(e) => { e.stopPropagation(); updateElementProperty(el.id, "zIndex", (el.zIndex || 10) + 1); }} style={{ background: "none", border: "none", color: "#8c8780", fontSize: "11px", cursor: "pointer", padding: "2px" }} title="Bring to Front">▲</button>
                  <button onClick={(e) => { e.stopPropagation(); updateElementProperty(el.id, "zIndex", Math.max(1, (el.zIndex || 10) - 1)); }} style={{ background: "none", border: "none", color: "#8c8780", fontSize: "11px", cursor: "pointer", padding: "2px" }} title="Send to Back">▼</button>

                  <div style={{ width: "1px", height: "16px", background: "rgba(212,165,116,0.2)" }} />

                  {/* Duplicate */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }} 
                    style={{ background: "none", border: "none", color: "#d4a574", fontSize: "10px", fontWeight: 500, cursor: "pointer", padding: "2px 4px" }}
                    title="Duplicate Element"
                  >
                    Dup
                  </button>

                  {/* Delete */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} 
                    style={{ background: "none", border: "none", color: "#ef4444", fontSize: "10px", fontWeight: 500, cursor: "pointer", padding: "2px 4px" }}
                    title="Delete Element"
                  >
                    Del
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Central Live Preview Screen (16:9 Aspect Ratio) */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", minHeight: 0 }}>
            <div 
              id="presentation-viewport"
              ref={viewportRef}
              key={activeSlideId}
              className={`slide-transition-${transitionStyle}`}
              style={{
                width: "100%",
                maxWidth: "850px",
                aspectRatio: "16/9",
                background: theme.bg,
                color: theme.text,
                borderRadius: "16px",
                boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                border: "1px solid rgba(212, 165, 116, 0.15)",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "8%",
                boxSizing: "border-box",
                transition: "background 0.5s, color 0.5s",
                cursor: "default"
              }}
            >
              {/* Dynamic Theme Ornaments background layer */}
              {renderThemeOrnaments(theme.archetype, theme.primary, theme.secondary, theme.text)}

              {/* Layout Content (WYSIWYG click-to-edit elements) */}
              {activeSlide.layout === "title" && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", zIndex: 2 }}>
                  {selectedFieldId === "title" ? (
                    <textarea
                      value={activeSlide.title}
                      onChange={(e) => updateSlideContent("title", e.target.value)}
                      onBlur={() => setSelectedFieldId(null)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        fontFamily: getThemeHeaderFont(theme.archetype),
                        fontSize: "2.8rem",
                        fontWeight: 800,
                        color: theme.primary,
                        background: "rgba(255,255,255,0.05)",
                        border: `1.5px dashed ${theme.primary}`,
                        textAlign: "center",
                        width: "100%",
                        resize: "none",
                        outline: "none",
                        lineHeight: 1.1,
                        marginBottom: "20px",
                        padding: "4px",
                        borderRadius: "8px"
                      }}
                    />
                  ) : (
                    <h1 
                      onClick={(e) => { e.stopPropagation(); setSelectedFieldId("title"); setSelectedElementId(null); }}
                      style={{
                        fontFamily: getThemeHeaderFont(theme.archetype),
                        fontSize: "2.8rem",
                        fontWeight: 800,
                        color: theme.primary,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        marginBottom: "20px",
                        border: selectedFieldId === "title" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "8px"
                      }}
                      onMouseEnter={(e) => { if (selectedFieldId !== "title") e.currentTarget.style.borderColor = `${theme.primary}50`; }}
                      onMouseLeave={(e) => { if (selectedFieldId !== "title") e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      {activeSlide.title || "Headline Title"}
                    </h1>
                  )}

                  {selectedFieldId === "subtitle" ? (
                    <textarea
                      value={activeSlide.subtitle}
                      onChange={(e) => updateSlideContent("subtitle", e.target.value)}
                      onBlur={() => setSelectedFieldId(null)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        fontFamily: getThemeBodyFont(theme.archetype),
                        fontSize: "1.2rem",
                        fontWeight: 300,
                        color: theme.text,
                        background: "rgba(255,255,255,0.05)",
                        border: `1.5px dashed ${theme.primary}`,
                        textAlign: "center",
                        width: "100%",
                        resize: "none",
                        outline: "none",
                        opacity: 0.85,
                        padding: "4px",
                        borderRadius: "8px"
                      }}
                    />
                  ) : (
                    <p 
                      onClick={(e) => { e.stopPropagation(); setSelectedFieldId("subtitle"); setSelectedElementId(null); }}
                      style={{
                        fontFamily: getThemeBodyFont(theme.archetype),
                        fontSize: "1.2rem",
                        opacity: 0.85,
                        fontWeight: 300,
                        border: selectedFieldId === "subtitle" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "8px"
                      }}
                      onMouseEnter={(e) => { if (selectedFieldId !== "subtitle") e.currentTarget.style.borderColor = `${theme.primary}50`; }}
                      onMouseLeave={(e) => { if (selectedFieldId !== "subtitle") e.currentTarget.style.borderColor = "transparent"; }}
                    >
                      {activeSlide.subtitle || "Subheading detail block"}
                    </p>
                  )}
                </div>
              )}

              {activeSlide.layout === "content" && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                  <h2 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("title"); setSelectedElementId(null); }}
                    style={{
                      fontFamily: getThemeHeaderFont(theme.archetype),
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: theme.primary,
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                      border: selectedFieldId === "title" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px"
                    }}
                  >
                    {activeSlide.title || "Section Header"}
                  </h2>
                  <p 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("subtitle"); setSelectedElementId(null); }}
                    style={{
                      fontFamily: getThemeBodyFont(theme.archetype),
                      fontSize: "0.9rem",
                      opacity: 0.7,
                      marginBottom: "24px",
                      fontWeight: 300,
                      border: selectedFieldId === "subtitle" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px"
                    }}
                  >
                    {activeSlide.subtitle || "Optional section subtitle details..."}
                  </p>
                  
                  <ul style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "20px" }}>
                    {(activeSlide.bulletPoints || []).map((bp, i) => (
                      <li 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setSelectedFieldId(`bullet_${i}`); setSelectedElementId(null); }}
                        style={{
                          fontSize: "1.05rem",
                          lineHeight: 1.4,
                          opacity: 0.95,
                          fontFamily: getThemeBodyFont(theme.archetype),
                          border: selectedFieldId === `bullet_${i}` ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                          cursor: "pointer",
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}
                      >
                        {bp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeSlide.layout === "two-column" && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                  <h2 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("title"); setSelectedElementId(null); }}
                    style={{
                      fontFamily: getThemeHeaderFont(theme.archetype),
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: theme.primary,
                      letterSpacing: "-0.02em",
                      marginBottom: "6px",
                      border: selectedFieldId === "title" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px"
                    }}
                  >
                    {activeSlide.title || "Comparative Columns"}
                  </h2>
                  <p 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("subtitle"); setSelectedElementId(null); }}
                    style={{
                      fontFamily: getThemeBodyFont(theme.archetype),
                      fontSize: "0.9rem",
                      opacity: 0.7,
                      marginBottom: "24px",
                      fontWeight: 300,
                      border: selectedFieldId === "subtitle" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "4px",
                      borderRadius: "6px"
                    }}
                  >
                    {activeSlide.subtitle || "Optional section subtitle details..."}
                  </p>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", flex: 1 }}>
                    <div onClick={(e) => { e.stopPropagation(); setSelectedFieldId("bullet_0"); setSelectedElementId(null); }} style={{ border: selectedFieldId === "bullet_0" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.primary, letterSpacing: "0.08em", marginBottom: "8px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN ALPHA</div>
                      <p style={{ fontSize: "0.95rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                        {activeSlide.bulletPoints?.[0] || "Provide core statement or data metrics on the left column to build comparison."}
                      </p>
                    </div>
                    <div onClick={(e) => { e.stopPropagation(); setSelectedFieldId("bullet_2"); setSelectedElementId(null); }} style={{ border: selectedFieldId === "bullet_2" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: theme.secondary, letterSpacing: "0.08em", marginBottom: "8px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN BETA</div>
                      <p style={{ fontSize: "0.95rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                        {activeSlide.bulletPoints?.[2] || "Establish contrasting viewpoints, supporting graphs, or summaries on the right column."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSlide.layout === "quote" && (
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 6%", zIndex: 2 }}>
                  <span style={{ fontSize: "3.5rem", color: theme.primary, lineHeight: 0.1, fontFamily: "serif", display: "block", marginBottom: "16px" }}>“</span>
                  <blockquote 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("quote"); setSelectedElementId(null); }}
                    style={{
                      fontSize: "1.45rem",
                      fontStyle: "italic",
                      fontFamily: getThemeHeaderFont(theme.archetype),
                      fontWeight: 400,
                      lineHeight: 1.45,
                      marginBottom: "16px",
                      border: selectedFieldId === "quote" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "6px",
                      borderRadius: "6px"
                    }}
                  >
                    {activeSlide.quote || "This is a key quote..."}
                  </blockquote>
                  <cite 
                    onClick={(e) => { e.stopPropagation(); setSelectedFieldId("author"); setSelectedElementId(null); }}
                    style={{
                      fontSize: "0.95rem",
                      color: theme.secondary,
                      fontStyle: "normal",
                      fontWeight: 600,
                      fontFamily: getThemeBodyFont(theme.archetype),
                      letterSpacing: "0.02em",
                      border: selectedFieldId === "author" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                      cursor: "pointer",
                      padding: "2px 8px",
                      borderRadius: "4px"
                    }}
                  >
                    — {activeSlide.author || "Anonymous Author"}
                  </cite>
                </div>
              )}

              {activeSlide.layout === "image" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "28px", alignItems: "center", flex: 1, zIndex: 2 }}>
                  <div style={{ borderRadius: "12px", overflow: "hidden", height: "100%", maxHeight: "240px", border: `1px solid ${theme.primary}20` }}>
                    <img src={activeSlide.image || "https://picsum.photos/id/180/600/400"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                  
                  <div style={{ textAlign: "left" }}>
                    <h3 
                      onClick={(e) => { e.stopPropagation(); setSelectedFieldId("title"); setSelectedElementId(null); }}
                      style={{
                        fontFamily: getThemeHeaderFont(theme.archetype),
                        fontSize: "1.65rem",
                        fontWeight: 700,
                        color: theme.primary,
                        letterSpacing: "-0.02em",
                        marginBottom: "8px",
                        border: selectedFieldId === "title" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "6px"
                      }}
                    >
                      {activeSlide.title || "Graphic Visuals"}
                    </h3>
                    <p 
                      onClick={(e) => { e.stopPropagation(); setSelectedFieldId("subtitle"); setSelectedElementId(null); }}
                      style={{
                        fontFamily: getThemeBodyFont(theme.archetype),
                        fontSize: "1.0rem",
                        lineHeight: 1.4,
                        opacity: 0.9,
                        fontWeight: 300,
                        marginBottom: "12px",
                        border: selectedFieldId === "subtitle" ? `1.5px dashed ${theme.primary}` : "1.5px dashed transparent",
                        cursor: "pointer",
                        padding: "4px",
                        borderRadius: "6px"
                      }}
                    >
                      {activeSlide.subtitle || "Optional section subtitle details..."}
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Elements Render Layer */}
              {(activeSlide.elements || []).map((el) => {
                const isSelected = selectedElementId === el.id;
                const elementStyle = {
                  position: "absolute",
                  left: `${el.x}%`,
                  top: `${el.y}%`,
                  width: `${el.w}%`,
                  height: `${el.h}%`,
                  zIndex: el.zIndex || 10,
                  opacity: el.opacity ?? 1,
                  transform: `rotate(${el.rotation || 0}deg)`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
                  cursor: "move",
                  userSelect: "none",
                  boxSizing: "border-box"
                };

                return (
                  <div
                    key={el.id}
                    style={elementStyle}
                    onMouseDown={(e) => handleElementMouseDown(e, el.id)}
                    onClick={(e) => { e.stopPropagation(); setSelectedElementId(el.id); setSelectedFieldId(null); }}
                  >
                    {/* Element content based on type */}
                    {el.type === "text" && (
                      <div
                        style={{
                          color: el.color || theme.text,
                          fontSize: `${el.fontSize || 16}px`,
                          fontFamily: el.fontFamily || getThemeBodyFont(theme.archetype),
                          textAlign: el.align || "center",
                          fontWeight: el.fontWeight || "normal",
                          fontStyle: el.fontStyle || "normal",
                          width: "100%",
                          height: "100%",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          wordBreak: "break-word"
                        }}
                      >
                        {el.text || "Type details..."}
                      </div>
                    )}

                    {el.type === "shape" && (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {el.shapeType === "rect" && (
                          <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: `${el.borderRadius || 0}px` }} />
                        )}
                        {el.shapeType === "circle" && (
                          <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: "50%" }} />
                        )}
                        {el.shapeType === "triangle" && (
                          <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <polygon points="50,0 100,100 0,100" fill={el.color} />
                          </svg>
                        )}
                        {el.shapeType === "star" && (
                          <svg width="100%" height="100%" viewBox="0 0 24 24" fill={el.color}>
                            <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/>
                          </svg>
                        )}
                        {el.shapeType === "line" && (
                          <div style={{ width: "100%", height: "4px", background: el.color }} />
                        )}
                      </div>
                    )}

                    {el.type === "sticker" && (
                      <div style={{ fontSize: `${(el.fontSize || 16) * 2.2}px`, lineHeight: 1 }}>
                        {el.stickerIcon || "⭐️"}
                      </div>
                    )}

                    {el.type === "image" && (
                      <div style={{ width: "100%", height: "100%", borderRadius: `${el.borderRadius || 0}px`, overflow: "hidden" }}>
                        <img src={el.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                      </div>
                    )}

                    {/* Resize handle overlay bounds */}
                    {isSelected && (
                      <>
                        <div style={{ position: "absolute", inset: "-4px", border: `2px solid ${theme.primary}`, pointerEvents: "none", borderRadius: "4px", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }} />
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, el.id)}
                          style={{
                            position: "absolute",
                            bottom: "-6px",
                            right: "-6px",
                            width: "12px",
                            height: "12px",
                            background: theme.primary,
                            border: "2px solid #fff",
                            borderRadius: "50%",
                            cursor: "se-resize",
                            zIndex: 1000
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}

              {/* Decorative branding tag bottom-right */}
              <div style={{ position: "absolute", bottom: "16px", right: "24px", display: "flex", alignItems: "center", gap: "6px", opacity: 0.5 }}>
                <span style={{ fontSize: "8px", letterSpacing: "0.06em", fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>POWERED BY</span>
                <span style={{ fontSize: "10px", fontFamily: "Syne, sans-serif", fontWeight: 800 }}>Creatify</span>
              </div>
            </div>
          </div>
        </div>


      </div>

      {/* ── presentModeFullscreen Player ───────────────────────────────────── */}
      {presentMode && (
        <div style={{ position: "fixed", inset: 0, background: "#000", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "40px" }}>
          
          {/* Controls Overlay Header */}
          <div style={{ position: "absolute", top: "24px", left: "24px", right: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10000, opacity: 0.15, transition: "opacity 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.15}>
            <span style={{ fontSize: "11px", color: "#8c8780", fontFamily: "'Poppins', sans-serif", background: "rgba(0,0,0,0.8)", padding: "6px 12px", borderRadius: "20px" }}>
              Present Mode · Use Arrow keys or Space · ESC to exit
            </span>
            <button className="tool-btn danger" style={{ padding: "6px 16px", borderRadius: "20px" }} onClick={() => setPresentMode(false)}>
              Exit Presentation
            </button>
          </div>

          {/* Active slide view */}
          <div style={{ width: "100%", maxWidth: "1100px", aspectRatio: "16/9", background: theme.bg, color: theme.text, borderRadius: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "8%", boxSizing: "border-box", border: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 30px 80px rgba(0,0,0,0.8)", position: "relative" }}>
            {renderThemeOrnaments(theme.archetype, theme.primary, theme.secondary, theme.text)}
            
            {activeSlide.layout === "title" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", zIndex: 2 }}>
                <h1 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "3.6rem", fontWeight: 800, color: theme.primary, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "24px" }}>
                  {activeSlide.title}
                </h1>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.4rem", opacity: 0.85, fontWeight: 300 }}>
                  {activeSlide.subtitle}
                </p>
              </div>
            )}

            {activeSlide.layout === "content" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                <h2 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2.4rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {activeSlide.title}
                </h2>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.0rem", opacity: 0.7, marginBottom: "32px", fontWeight: 300 }}>
                  {activeSlide.subtitle}
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "24px" }}>
                  {activeSlide.bulletPoints.map((bp, i) => (
                    <li key={i} style={{ fontSize: "1.2rem", lineHeight: 1.4, opacity: 0.95, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {activeSlide.layout === "two-column" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                <h2 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2.4rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {activeSlide.title}
                </h2>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.0rem", opacity: 0.7, marginBottom: "32px", fontWeight: 300 }}>
                  {activeSlide.subtitle}
                </p>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: theme.primary, letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN ALPHA</div>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {activeSlide.bulletPoints?.[0] || ""}
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: theme.secondary, letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN BETA</div>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {activeSlide.bulletPoints?.[2] || ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSlide.layout === "quote" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 8%", zIndex: 2 }}>
                <span style={{ fontSize: "4.5rem", color: theme.primary, lineHeight: 0.1, fontFamily: "serif", display: "block", marginBottom: "20px" }}>“</span>
                <blockquote style={{ fontSize: "1.8rem", fontStyle: "italic", fontFamily: getThemeHeaderFont(theme.archetype), fontWeight: 400, lineHeight: 1.45, marginBottom: "24px" }}>
                  {activeSlide.quote}
                </blockquote>
                <cite style={{ fontSize: "1.1rem", color: theme.secondary, fontStyle: "normal", fontWeight: 600, fontFamily: getThemeBodyFont(theme.archetype) }}>
                  — {activeSlide.author || "Anonymous"}
                </cite>
              </div>
            )}

            {activeSlide.layout === "image" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "40px", alignItems: "center", flex: 1, zIndex: 2 }}>
                <div style={{ borderRadius: "16px", overflow: "hidden", height: "100%", maxHeight: "320px", border: `1px solid ${theme.primary}20` }}>
                  <img src={activeSlide.image || "https://picsum.photos/id/180/600/400"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "12px" }}>
                    {activeSlide.title}
                  </h3>
                  <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.2rem", lineHeight: 1.45, opacity: 0.9, fontWeight: 300, marginBottom: "20px" }}>
                    {activeSlide.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Custom Elements Render Layer (Present Mode) */}
            {(activeSlide.elements || []).map((el) => {
              const elementStyle = {
                position: "absolute",
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: el.zIndex || 10,
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
                boxSizing: "border-box"
              };

              return (
                <div key={el.id} style={elementStyle}>
                  {el.type === "text" && (
                    <div style={{ color: el.color || theme.text, fontSize: `${(el.fontSize || 16) * 1.3}px`, fontFamily: el.fontFamily || getThemeBodyFont(theme.archetype), textAlign: el.align || "center", fontWeight: el.fontWeight || "normal", fontStyle: el.fontStyle || "normal", width: "100%", height: "100%", wordBreak: "break-word" }}>
                      {el.text}
                    </div>
                  )}
                  {el.type === "shape" && (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {el.shapeType === "rect" && <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: `${el.borderRadius || 0}px` }} />}
                      {el.shapeType === "circle" && <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: "50%" }} />}
                      {el.shapeType === "triangle" && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill={el.color} /></svg>}
                      {el.shapeType === "star" && <svg width="100%" height="100%" viewBox="0 0 24 24" fill={el.color}><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/></svg>}
                      {el.shapeType === "line" && <div style={{ width: "100%", height: "4px", background: el.color }} />}
                    </div>
                  )}
                  {el.type === "sticker" && (
                    <div style={{ fontSize: `${(el.fontSize || 16) * 3}px`, lineHeight: 1 }}>
                      {el.stickerIcon}
                    </div>
                  )}
                  {el.type === "image" && (
                    <div style={{ width: "100%", height: "100%", borderRadius: `${el.borderRadius || 0}px`, overflow: "hidden" }}>
                      <img src={el.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Decorative branding */}
            <div style={{ position: "absolute", bottom: "24px", right: "32px", display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.06em", fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>POWERED BY</span>
              <span style={{ fontSize: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800 }}>Creatify</span>
            </div>
          </div>
          
          {/* Footer Slide Counter Indicator */}
          <div style={{ position: "absolute", bottom: "32px", color: "#8c8780", fontSize: "12px", fontFamily: "'Poppins', sans-serif" }}>
            {slides.findIndex(s => s.id === activeSlideId) + 1} / {slides.length}
          </div>
        </div>
      )}

      {/* ── Export Progress Overlay Modal ──────────────────────────────────── */}
      {exportProgress !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000 }}>
          <div className="glass-panel" style={{ padding: 40, borderRadius: 20, minWidth: 400, maxWidth: 480, display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: 18, fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: "#ffffff" }}>
              {exportProgress === 100 ? "Slides Export Complete" : "Compiling Presentation..."}
            </div>
            
            <div style={{ fontSize: 13, color: "#8c8780", lineHeight: 1.4 }}>
              {exportProgress === 100
                ? "Your high-fidelity vector PDF presentation has been compiled in-browser via GPU canvas serialization."
                : "Rasterizing layout layers · Injecting TTF web fonts"}
            </div>

            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, height: 8, overflow: "hidden", marginTop: "8px" }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#8b5a2b,#d4a574)", borderRadius: 6, width: `${exportProgress}%`, transition: "width 0.1s" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
              <span style={{ color: "#d4a574", fontWeight: 600 }}>
                {exportProgress === 100 ? "✓ Success" : `${Math.round(exportProgress)}%`}
              </span>
              <span style={{ color: "#8c8780" }}>
                {exportProgress === 100 ? "PDF · Vector Scale" : "Rendering Page Layer..."}
              </span>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: "8px" }}>
              {exportProgress === 100 && (
                <button className="tool-btn primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => alert("Successfully downloaded presentation (demo).")}>
                  ⬇ Download PDF
                </button>
              )}
              <button className="tool-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => setExportProgress(null)}>
                {exportProgress === 100 ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── React Code Codebox Exporter Modal ─────────────────────────────── */}
      {showCodeModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000 }}>
          <div className="glass-panel" style={{ padding: 24, borderRadius: 20, width: "90%", maxWidth: "800px", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 600, fontFamily: "'Poppins', sans-serif", color: "#ffffff" }}>
                React + Tailwind CSS Slide Code
              </div>
              <button className="tool-btn danger" style={{ padding: "4px 10px" }} onClick={() => setShowCodeModal(false)}>✕</button>
            </div>
            
            <p style={{ fontSize: 12, color: "#8c8780", margin: 0 }}>This is compile-ready code representing the active visual template design style and custom coordinates layers.</p>

            <textarea 
              readOnly 
              value={generateReactCode()} 
              style={{
                width: "100%", height: "360px", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.2)", borderRadius: "10px", color: "#a5d6a7", padding: "12px", fontSize: "11px", fontFamily: "monospace", outline: "none", resize: "none"
              }} 
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="tool-btn primary" onClick={copyCodeToClipboard}>
                {copiedCode ? "✓ Copied Code!" : "Copy Code"}
              </button>
              <button className="tool-btn" onClick={() => setShowCodeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100001 }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>💾</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px", letterSpacing: "-0.03em" }}>Save presentation?</h3>
            <p style={{ fontSize: "13.5px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px", fontWeight: 300 }}>
              Would you like to save this presentation draft to your past works, or discard your current edits?
            </p>
            
            {/* Input field for project title */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <label style={{ fontSize: "11px", color: "#d4a574", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Presentation Title</label>
              <input 
                type="text" 
                value={projectTitle} 
                onChange={e => setProjectTitle(e.target.value)} 
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.18)", borderRadius: "8px", color: "#fff", padding: "10px 14px", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
                placeholder="My Awesome Presentation"
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

      {/* Printable slideshow wrapper container */}
      <div className="print-presentation-wrapper" style={{ display: "none" }}>
        {slides.map((slide, idx) => (
          <div 
            key={slide.id} 
            className="print-slide"
            style={{
              width: "100%",
              aspectRatio: "16/9",
              background: theme.bg,
              color: theme.text,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "8%",
              boxSizing: "border-box"
            }}
          >
            {renderThemeOrnaments(theme.archetype, theme.primary, theme.secondary, theme.text)}
            
            {slide.layout === "title" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", zIndex: 2 }}>
                <h1 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "3.6rem", fontWeight: 800, color: theme.primary, letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "24px" }}>
                  {slide.title}
                </h1>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.4rem", opacity: 0.85, fontWeight: 300 }}>
                  {slide.subtitle}
                </p>
              </div>
            )}

            {slide.layout === "content" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                <h2 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2.4rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {slide.title}
                </h2>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.0rem", opacity: 0.7, marginBottom: "32px", fontWeight: 300 }}>
                  {slide.subtitle}
                </p>
                <ul style={{ display: "flex", flexDirection: "column", gap: "16px", paddingLeft: "24px" }}>
                  {(slide.bulletPoints || []).map((bp, i) => (
                    <li key={i} style={{ fontSize: "1.2rem", lineHeight: 1.4, opacity: 0.95, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {bp}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {slide.layout === "two-column" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start", flex: 1, textAlign: "left", zIndex: 2 }}>
                <h2 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2.4rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "8px" }}>
                  {slide.title}
                </h2>
                <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.0rem", opacity: 0.7, marginBottom: "32px", fontWeight: 300 }}>
                  {slide.subtitle}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", flex: 1 }}>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: theme.primary, letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN ALPHA</div>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {slide.bulletPoints?.[0] || ""}
                    </p>
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: theme.secondary, letterSpacing: "0.08em", marginBottom: "10px", textTransform: "uppercase", fontFamily: getThemeBodyFont(theme.archetype) }}>COLUMN BETA</div>
                    <p style={{ fontSize: "1.1rem", lineHeight: 1.5, opacity: 0.85, fontFamily: getThemeBodyFont(theme.archetype) }}>
                      {slide.bulletPoints?.[2] || ""}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {slide.layout === "quote" && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, textAlign: "center", padding: "0 8%", zIndex: 2 }}>
                <span style={{ fontSize: "4.5rem", color: theme.primary, lineHeight: 0.1, fontFamily: "serif", display: "block", marginBottom: "20px" }}>“</span>
                <blockquote style={{ fontSize: "1.8rem", fontStyle: "italic", fontFamily: getThemeHeaderFont(theme.archetype), fontWeight: 400, lineHeight: 1.45, marginBottom: "24px" }}>
                  {slide.quote}
                </blockquote>
                <cite style={{ fontSize: "1.1rem", color: theme.secondary, fontStyle: "normal", fontWeight: 600, fontFamily: getThemeBodyFont(theme.archetype) }}>
                  — {slide.author || "Anonymous"}
                </cite>
              </div>
            )}

            {slide.layout === "image" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "40px", alignItems: "center", flex: 1, zIndex: 2 }}>
                <div style={{ borderRadius: "16px", overflow: "hidden", height: "100%", maxHeight: "320px", border: `1px solid ${theme.primary}20` }}>
                  <img src={slide.image || "https://picsum.photos/id/180/600/400"} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontFamily: getThemeHeaderFont(theme.archetype), fontSize: "2rem", fontWeight: 700, color: theme.primary, letterSpacing: "-0.02em", marginBottom: "12px" }}>
                    {slide.title}
                  </h3>
                  <p style={{ fontFamily: getThemeBodyFont(theme.archetype), fontSize: "1.2rem", lineHeight: 1.45, opacity: 0.9, fontWeight: 300, marginBottom: "20px" }}>
                    {slide.subtitle}
                  </p>
                </div>
              </div>
            )}

            {/* Custom floating elements */}
            {(slide.elements || []).map((el) => {
              const elementStyle = {
                position: "absolute",
                left: `${el.x}%`,
                top: `${el.y}%`,
                width: `${el.w}%`,
                height: `${el.h}%`,
                zIndex: el.zIndex || 10,
                opacity: el.opacity ?? 1,
                transform: `rotate(${el.rotation || 0}deg)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: el.align === "left" ? "flex-start" : el.align === "right" ? "flex-end" : "center",
                boxSizing: "border-box"
              };

              return (
                <div key={el.id} style={elementStyle}>
                  {el.type === "text" && (
                    <div style={{ color: el.color || theme.text, fontSize: `${(el.fontSize || 16) * 1.3}px`, fontFamily: el.fontFamily || getThemeBodyFont(theme.archetype), textAlign: el.align || "center", fontWeight: el.fontWeight || "normal", fontStyle: el.fontStyle || "normal", width: "100%", height: "100%", wordBreak: "break-word" }}>
                      {el.text}
                    </div>
                  )}
                  {el.type === "shape" && (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {el.shapeType === "rect" && <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: `${el.borderRadius || 0}px` }} />}
                      {el.shapeType === "circle" && <div style={{ width: "100%", height: "100%", background: el.color, borderRadius: "50%" }} />}
                      {el.shapeType === "triangle" && <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none"><polygon points="50,0 100,100 0,100" fill={el.color} /></svg>}
                      {el.shapeType === "star" && <svg width="100%" height="100%" viewBox="0 0 24 24" fill={el.color}><path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.784 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"/></svg>}
                      {el.shapeType === "line" && <div style={{ width: "100%", height: "4px", background: el.color }} />}
                    </div>
                  )}
                  {el.type === "sticker" && (
                    <div style={{ fontSize: `${(el.fontSize || 16) * 3}px`, lineHeight: 1 }}>
                      {el.stickerIcon}
                    </div>
                  )}
                  {el.type === "image" && (
                    <div style={{ width: "100%", height: "100%", borderRadius: `${el.borderRadius || 0}px`, overflow: "hidden" }}>
                      <img src={el.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    </div>
                  )}
                </div>
              );
            })}

            <div style={{ position: "absolute", bottom: "24px", right: "32px", display: "flex", alignItems: "center", gap: "8px", opacity: 0.5 }}>
              <span style={{ fontSize: "9px", letterSpacing: "0.06em", fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}>POWERED BY</span>
              <span style={{ fontSize: "12px", fontFamily: "Syne, sans-serif", fontWeight: 800 }}>Creatify</span>
            </div>
            <div style={{ position: "absolute", bottom: "32px", left: "32px", color: "#8c8780", fontSize: "12px" }}>
              {idx + 1} / {slides.length}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

const editorInputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: "8px",
  border: "1px solid rgba(212, 165, 116, 0.15)",
  background: "rgba(12, 10, 9, 0.5)",
  fontSize: "12px",
  color: "#ffffff",
  outline: "none",
  fontFamily: "inherit",
  transition: "all 0.2s"
};
