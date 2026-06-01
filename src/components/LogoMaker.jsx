import { useState, useEffect, useRef } from "react";

const BRAND_PALETTES = [
  { name: "Gold Obsidian", bg: "#0c0a09", primary: "#d4a574", secondary: "#8b5a2b", text: "#f5f0e8" },
  { name: "Cyber Neon", bg: "#030712", primary: "#22d3a8", secondary: "#3b82f6", text: "#f3f4f6" },
  { name: "Nordic Forest", bg: "#faf8f5", primary: "#2d5a27", secondary: "#8fbc8f", text: "#2d2d2d" },
  { name: "Royal Violet", bg: "#0f0728", primary: "#a855f7", secondary: "#ec4899", text: "#fdf2ff" }
];

const PRESET_ICONS = {
  rocket: "M12 2S4.5 8.5 4.5 14.5A7.5 7.5 0 0 0 12 22a7.5 7.5 0 0 0 7.5-7.5C19.5 8.5 12 2 12 2zm0 18a5.5 5.5 0 0 1-5.5-5.5c0-4.4 5.5-9.5 5.5-9.5s5.5 5.1 5.5 9.5A5.5 5.5 0 0 1 12 20z",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  leaf: "M12 2C6.48 2 2 6.48 2 12c0 3.06 1.38 5.8 3.56 7.66l.07.06C7.54 18.23 10 16 12 16c2 0 4.46 2.23 6.37 3.72a9.96 9.96 0 0 0 3.63-7.72c0-5.52-4.48-10-10-10zm-1 12V8h2v6h-2z",
  crown: "M2 4l3 7 7-7 7 7 3-7-3 14H5L2 4z",
  gear: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
  helix: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"
};

export default function LogoMaker({ onBack, user, initialProject }) {
  const [projectTitle, setProjectTitle] = useState(() => {
    return initialProject ? initialProject.title : "My Brand Identity";
  });
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState("ai"); // ai | editor | mockups
  const [activeMockup, setActiveMockup] = useState("card"); // card | mug | sticker

  // AI Generator Panel states
  const [brandName, setBrandName] = useState("CineCut");
  const [tagline, setTagline] = useState("Create without limits");
  const [styleKeyword, setStyleKeyword] = useState("tech startup");
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Editor states
  const [logoElements, setLogoElements] = useState([
    { id: "el_icon", type: "icon", shape: "rocket", x: 150, y: 110, size: 70, color: "#d4a574", opacity: 1, rotate: 0, fillType: "solid", strokeColor: "#d4a574", strokeWidth: 0, strokeType: "none" },
    { id: "el_brand", type: "text", text: "CINECUT", x: 150, y: 220, size: 32, font: "Syne", color: "#f5f0e8", letterSpacing: 3, rotate: 0, fillType: "solid", strokeColor: "#d4a574", strokeWidth: 0, strokeType: "none", opacity: 1 },
    { id: "el_tag", type: "text", text: "Create without limits", x: 150, y: 260, size: 12, font: "Poppins", color: "#8c8780", letterSpacing: 1, rotate: 0, fillType: "solid", strokeColor: "#d4a574", strokeWidth: 0, strokeType: "none", opacity: 1 }
  ]);
  const [canvasBg, setCanvasBg] = useState("#0c0a09");
  const [lastCanvasColor, setLastCanvasColor] = useState("#0c0a09");
  const [activeElementId, setActiveElementId] = useState("el_icon");

  const [activePaletteIdx, setActivePaletteIdx] = useState(0);

  const svgRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Initialize if loaded from project
  useEffect(() => {
    if (initialProject && initialProject.data) {
      const d = initialProject.data;
      if (d.elements) setLogoElements(d.elements);
      if (d.canvasBg) {
        setCanvasBg(d.canvasBg);
        if (d.canvasBg !== "transparent") {
          setLastCanvasColor(d.canvasBg);
        }
      }
      if (d.brandName) setBrandName(d.brandName);
      if (d.tagline) setTagline(d.tagline);
    }
  }, [initialProject]);

  // Mouse event handlers for SVG dragging
  const handleSvgElementMouseDown = (e, id) => {
    e.stopPropagation();
    setActiveElementId(id);
    isDraggingRef.current = true;
    
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 300;
    const clickY = ((e.clientY - rect.top) / rect.height) * 300;
    
    const element = logoElements.find(el => el.id === id);
    if (element) {
      dragOffsetRef.current = { x: clickX - element.x, y: clickY - element.y };
    }
  };

  const handleSvgMouseMove = (e) => {
    if (!isDraggingRef.current || !activeElementId) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 300;
    const y = ((e.clientY - rect.top) / rect.height) * 300;
    
    setLogoElements(prev => prev.map(el => {
      if (el.id === activeElementId) {
        const newX = Math.round(x - dragOffsetRef.current.x);
        const newY = Math.round(y - dragOffsetRef.current.y);
        return { ...el, x: newX, y: newY };
      }
      return el;
    }));
  };

  const handleSvgMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Suggest / Mock AI Generator
  const generateAISuggestions = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const suggestions = [
        {
          name: "Emblem Fusion",
          elements: [
            { id: "el_icon", type: "icon", shape: "shield", x: 150, y: 100, size: 80, color: "#22d3a8", opacity: 1, rotate: 0 },
            { id: "el_brand", type: "text", text: brandName.toUpperCase(), x: 150, y: 220, size: 30, font: "Syne", color: "#ffffff", letterSpacing: 4, rotate: 0 },
            { id: "el_tag", type: "text", text: tagline, x: 150, y: 260, size: 11, font: "Outfit", color: "#a8a29e", letterSpacing: 2, rotate: 0 }
          ],
          bg: "#030712"
        },
        {
          name: "Linear Synthwave",
          elements: [
            { id: "el_icon", type: "icon", shape: "helix", x: 150, y: 110, size: 70, color: "#ec4899", opacity: 1, rotate: 45 },
            { id: "el_brand", type: "text", text: brandName.toUpperCase(), x: 150, y: 215, size: 32, font: "Poppins", color: "#fdf2ff", letterSpacing: 2, rotate: 0 },
            { id: "el_tag", type: "text", text: tagline, x: 150, y: 255, size: 10, font: "Poppins", color: "#a855f7", letterSpacing: 3, rotate: 0 }
          ],
          bg: "#0f0728"
        },
        {
          name: "Organic Eco",
          elements: [
            { id: "el_icon", type: "icon", shape: "leaf", x: 150, y: 110, size: 75, color: "#2d5a27", opacity: 1, rotate: 0 },
            { id: "el_brand", type: "text", text: brandName, x: 150, y: 220, size: 28, font: "Outfit", color: "#2d2d2d", letterSpacing: 1, rotate: 0 },
            { id: "el_tag", type: "text", text: tagline, x: 150, y: 255, size: 12, font: "Poppins", color: "#8fbc8f", letterSpacing: 0, rotate: 0 }
          ],
          bg: "#faf8f5"
        },
        {
          name: "Modern Stellar",
          elements: [
            { id: "el_icon", type: "icon", shape: "rocket", x: 150, y: 100, size: 85, color: "#d4a574", opacity: 1, rotate: -30 },
            { id: "el_brand", type: "text", text: brandName.toUpperCase(), x: 150, y: 220, size: 30, font: "Syne", color: "#f5f0e8", letterSpacing: 3, rotate: 0 },
            { id: "el_tag", type: "text", text: tagline, x: 150, y: 260, size: 10, font: "Poppins", color: "#8b5a2b", letterSpacing: 1, rotate: 0 }
          ],
          bg: "#0c0a09"
        }
      ];
      setAiSuggestions(suggestions);
      setIsGenerating(false);
    }, 1200);
  };

  // Load a generated mockup layout into active editor workspace
  const loadSuggestion = (sug) => {
    setLogoElements(sug.elements);
    setCanvasBg(sug.bg);
    setActiveTab("editor");
    if (sug.elements.length > 0) setActiveElementId(sug.elements[0].id);
  };

  // Shape insert
  const addShape = (shapeType) => {
    const id = `shape_${Date.now()}`;
    const newElement = {
      id,
      type: "shape",
      shapeType, // circle | box | star | triangle | hexagon | shield | ring | badge
      x: 150,
      y: 150,
      size: 60,
      color: "#d4a574",
      opacity: 1,
      rotate: 0,
      fillType: "solid",
      strokeColor: "#d4a574",
      strokeWidth: 0,
      strokeType: "none"
    };
    setLogoElements(prev => [...prev, newElement]);
    setActiveElementId(id);
  };

  // Insert Icon
  const addIcon = (iconName) => {
    const id = `icon_${Date.now()}`;
    const newElement = {
      id,
      type: "icon",
      shape: iconName,
      x: 150,
      y: 150,
      size: 70,
      color: "#d4a574",
      opacity: 1,
      rotate: 0,
      fillType: "solid",
      strokeColor: "#d4a574",
      strokeWidth: 0,
      strokeType: "none"
    };
    setLogoElements(prev => [...prev, newElement]);
    setActiveElementId(id);
  };

  // Insert Text layer
  const addText = () => {
    const id = `text_${Date.now()}`;
    const newElement = {
      id,
      type: "text",
      text: "NEW BRAND",
      x: 150,
      y: 180,
      size: 24,
      font: "Syne",
      color: "#ffffff",
      letterSpacing: 2,
      rotate: 0,
      fillType: "solid",
      strokeColor: "#d4a574",
      strokeWidth: 0,
      strokeType: "none",
      opacity: 1
    };
    setLogoElements(prev => [...prev, newElement]);
    setActiveElementId(id);
  };

  // Delete Element
  const deleteElement = (id) => {
    setLogoElements(prev => prev.filter(el => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  // Modify Element property
  const updateElementProp = (prop, val) => {
    setLogoElements(prev => prev.map(el => {
      if (el.id === activeElementId) {
        return { ...el, [prop]: val };
      }
      return el;
    }));
  };

  // Alignment utilities
  const alignElementCenter = () => {
    if (activeElementId) {
      updateElementProp("x", 150);
    }
  };

  const alignElementMiddle = () => {
    if (activeElementId) {
      updateElementProp("y", 150);
    }
  };

  const resetElementRotation = () => {
    if (activeElementId) {
      updateElementProp("rotate", 0);
    }
  };

  // Depth sorting
  const bringToFront = () => {
    if (!activeElementId) return;
    setLogoElements(prev => {
      const activeEl = prev.find(el => el.id === activeElementId);
      if (!activeEl) return prev;
      const filtered = prev.filter(el => el.id !== activeElementId);
      return [...filtered, activeEl];
    });
  };

  const sendToBack = () => {
    if (!activeElementId) return;
    setLogoElements(prev => {
      const activeEl = prev.find(el => el.id === activeElementId);
      if (!activeEl) return prev;
      const filtered = prev.filter(el => el.id !== activeElementId);
      return [activeEl, ...filtered];
    });
  };

  // Apply Theme Palette
  const applyBrandPalette = (pal, idx) => {
    setActivePaletteIdx(idx);
    setCanvasBg(pal.bg);
    setLastCanvasColor(pal.bg);
    setLogoElements(prev => prev.map(el => {
      if (el.type === "icon" || el.type === "shape") {
        return { ...el, color: pal.primary };
      }
      if (el.type === "text" && el.id === "el_tag") {
        return { ...el, color: pal.secondary };
      }
      if (el.type === "text") {
        return { ...el, color: pal.text };
      }
      return el;
    }));
  };

  // Save changes
  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `logo_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);

    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Logo Design",
      category: "Logo Design",
      tool: "Logo Maker",
      year: new Date().getFullYear().toString(),
      accent: "#f5c842",
      gradient: "linear-gradient(135deg, #1a1608 0%, #3d2e07 40%, #0c0a09 100%)",
      image: "", // We can render a fallback icon since it's vector
      icon: "✦",
      tags: ["SVG Vector", `${logoElements.length} Shapes`, "Mockups"],
      desc: `Geometric brand logo design containing ${logoElements.length} vector nodes.`,
      data: {
        canvasBg,
        brandName,
        tagline,
        elements: logoElements
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
        console.log("Saved logo project to DB successfully");
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

  // Export SVG
  const triggerSVGExport = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    if(!source.match(/^<svg[^>]+xmlns="http\/\/www\.w3\.org\/2000\/svg"/)){
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }
    // Remove active selection border overlays from output vector files
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*><\/rect>/g, "");
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*\/>/g, "");

    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const link = document.createElement("a");
    link.download = `${projectTitle.replace(/\s+/g, "_")}.svg`;
    link.href = url;
    link.click();
  };

  const triggerPNGExport = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    
    // Remove active selection border overlays from output files
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*><\/rect>/g, "");
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*\/>/g, "");

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      
      if (canvasBg === "transparent") {
        ctx.clearRect(0, 0, 1200, 1200);
      } else {
        ctx.fillStyle = canvasBg;
        ctx.fillRect(0, 0, 1200, 1200);
      }

      ctx.drawImage(img, 0, 0, 1200, 1200);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${projectTitle.replace(/\s+/g, "_")}.png`;
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
  };

  const triggerMockupExport = () => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgEl);
    
    // Remove active selection border overlays
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*><\/rect>/g, "");
    source = source.replace(/<rect[^>]*stroke-dasharray="4,?\s*3"[^>]*\/>/g, "");

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext("2d");
      
      if (activeMockup === "card") {
        ctx.fillStyle = "#111111";
        ctx.fillRect(0, 0, 1200, 900);
        
        ctx.save();
        ctx.translate(600, 450);
        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 40;
        ctx.shadowOffsetX = 10;
        ctx.shadowOffsetY = 20;
        
        ctx.transform(1, -0.05, 0.1, 0.9, 0, 0);
        
        ctx.fillStyle = "#1c1917";
        ctx.strokeStyle = "#292524";
        ctx.lineWidth = 4;
        const cardW = 600;
        const cardH = 340;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-cardW/2, -cardH/2, cardW, cardH, 20);
        } else {
          ctx.rect(-cardW/2, -cardH/2, cardW, cardH);
        }
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        const logoSz = 240;
        ctx.drawImage(img, -logoSz/2, -logoSz/2, logoSz, logoSz);
        ctx.restore();
      } else if (activeMockup === "mug") {
        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(0, 0, 1200, 900);
        
        ctx.save();
        ctx.translate(600, 450);
        
        ctx.beginPath();
        ctx.ellipse(0, 240, 200, 30, 0, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fill();
        
        ctx.strokeStyle = "#fcfaf2";
        ctx.lineWidth = 45;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(120, 40, 90, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();
        
        ctx.strokeStyle = "#f0ede0";
        ctx.lineWidth = 15;
        ctx.beginPath();
        ctx.arc(120, 40, 90, -Math.PI / 2.2, Math.PI / 2.2);
        ctx.stroke();

        ctx.fillStyle = "#fcfaf2";
        ctx.beginPath();
        ctx.ellipse(0, -200, 180, 25, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-180, -200);
        ctx.lineTo(-180, 200);
        ctx.quadraticCurveTo(-180, 240, 0, 240);
        ctx.quadraticCurveTo(180, 240, 180, 200);
        ctx.lineTo(180, -200);
        ctx.closePath();
        ctx.fill();
        
        const grad = ctx.createLinearGradient(-180, 0, 180, 0);
        grad.addColorStop(0, "rgba(0,0,0,0.12)");
        grad.addColorStop(0.2, "rgba(255,255,255,0.2)");
        grad.addColorStop(0.5, "rgba(0,0,0,0)");
        grad.addColorStop(0.8, "rgba(0,0,0,0.05)");
        grad.addColorStop(1, "rgba(0,0,0,0.2)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-180, -200);
        ctx.lineTo(-180, 200);
        ctx.quadraticCurveTo(-180, 240, 0, 240);
        ctx.quadraticCurveTo(180, 240, 180, 200);
        ctx.lineTo(180, -200);
        ctx.ellipse(0, -200, 180, 25, 0, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = "#e2dfd5";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(0, -200, 180, 25, 0, 0, 2 * Math.PI);
        ctx.stroke();
        
        const logoSz = 200;
        ctx.drawImage(img, -logoSz/2, -60, logoSz, logoSz);
        
        ctx.restore();
      } else if (activeMockup === "sticker") {
        ctx.fillStyle = "#2d3748";
        ctx.fillRect(0, 0, 1200, 900);
        
        ctx.save();
        ctx.translate(600, 450);
        
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 15;
        
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, 280, 0, 2 * Math.PI);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        ctx.fillStyle = canvasBg === "transparent" ? lastCanvasColor : canvasBg;
        ctx.beginPath();
        ctx.arc(0, 0, 250, 0, 2 * Math.PI);
        ctx.fill();
        
        const logoSz = 340;
        ctx.drawImage(img, -logoSz/2, -logoSz/2, logoSz, logoSz);
        
        ctx.restore();
      }
      
      URL.revokeObjectURL(url);
      
      const mockupUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${projectTitle.replace(/\s+/g, "_")}_mockup_${activeMockup}.png`;
      link.href = mockupUrl;
      link.click();
    };
    img.src = url;
  };

  // Render SVG Elements
  const renderSVGNodes = () => {
    // Helper for star points calculation
    const getStarPoints = (size) => {
      const spikes = 5;
      const outerRadius = size / 2;
      const innerRadius = size / 4.5;
      let rot = Math.PI / 2 * 3;
      let x = 0;
      let y = 0;
      const step = Math.PI / spikes;
      let pts = [];
      for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius;
        y = Math.sin(rot) * outerRadius;
        pts.push(`${x},${y}`);
        rot += step;

        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        pts.push(`${x},${y}`);
        rot += step;
      }
      return pts.join(" ");
    };

    // Helper for hexagon points calculation
    const getHexagonPoints = (size) => {
      const r = size / 2;
      let pts = [];
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i + Math.PI / 6; // rotated 30 deg for flat top
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        pts.push(`${x},${y}`);
      }
      return pts.join(" ");
    };

    const shieldPath = "M 0,-50 C 30,-50 50,-40 50,-10 C 50,20 20,45 0,50 C -20,45 -50,20 -50,-10 C -50,-40 -30,-50 0,-50 Z";

    return logoElements.map(el => {
      const transform = `translate(${el.x}, ${el.y}) rotate(${el.rotate ?? 0})`;
      const opacity = el.opacity ?? 1;
      const isActive = el.id === activeElementId;

      const fillVal = el.fillType === "none" ? "none" : el.color;
      const strokeVal = el.strokeType === "none" ? "none" : el.strokeColor || el.color;
      const strokeWidthVal = el.strokeType === "none" ? 0 : el.strokeWidth ?? 1.5;
      const strokeDashVal = el.strokeType === "dashed" ? "3 3" : "none";

      let border = null;
      if (isActive) {
        if (el.type === "icon" || el.type === "shape") {
          const half = el.size / 2;
          border = (
            <rect
              x={-half - 6}
              y={-half - 6}
              width={el.size + 12}
              height={el.size + 12}
              fill="none"
              stroke="#f5c842"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              style={{ pointerEvents: "none" }}
            />
          );
        } else if (el.type === "text") {
          const textWidth = (el.text || "").length * el.size * 0.55;
          const textHeight = el.size;
          border = (
            <rect
              x={-textWidth / 2 - 6}
              y={-textHeight / 2 - 6}
              width={textWidth + 12}
              height={textHeight + 12}
              fill="none"
              stroke="#f5c842"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              style={{ pointerEvents: "none" }}
            />
          );
        }
      }

      if (el.type === "icon") {
        const path = PRESET_ICONS[el.shape] || PRESET_ICONS.rocket;
        return (
          <g key={el.id} transform={transform} opacity={opacity} style={{ cursor: "grab" }} onMouseDown={(e) => handleSvgElementMouseDown(e, el.id)}>
            <path d={path} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} transform={`scale(${el.size / 24}) translate(-12, -12)`} />
            {border}
          </g>
        );
      } else if (el.type === "text") {
        return (
          <g key={el.id} transform={transform} opacity={opacity} style={{ cursor: "grab" }} onMouseDown={(e) => handleSvgElementMouseDown(e, el.id)}>
            <text
              fill={fillVal}
              stroke={strokeVal}
              strokeWidth={strokeWidthVal}
              strokeDasharray={strokeDashVal}
              fontSize={el.size}
              fontFamily={el.font === "Syne" ? "Syne, sans-serif" : el.font === "Outfit" ? "Outfit, sans-serif" : el.font === "Cinzel" ? "Cinzel, serif" : el.font === "Pacifico" ? "Pacifico, cursive" : el.font === "Montserrat" ? "Montserrat, sans-serif" : "Poppins, sans-serif"}
              fontWeight="bold"
              letterSpacing={el.letterSpacing || 0}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {el.text}
            </text>
            {border}
          </g>
        );
      } else if (el.type === "shape") {
        return (
          <g key={el.id} transform={transform} opacity={opacity} style={{ cursor: "grab" }} onMouseDown={(e) => handleSvgElementMouseDown(e, el.id)}>
            {el.shapeType === "circle" && <circle cx={0} cy={0} r={el.size / 2} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} />}
            {el.shapeType === "box" && <rect x={-el.size / 2} y={-el.size / 2} width={el.size} height={el.size} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} rx={8} />}
            {el.shapeType === "triangle" && <polygon points={`0,${-el.size/2} ${el.size/2},${el.size/2} ${-el.size/2},${el.size/2}`} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} />}
            {el.shapeType === "star" && <polygon points={getStarPoints(el.size)} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} />}
            {el.shapeType === "hexagon" && <polygon points={getHexagonPoints(el.size)} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} />}
            {el.shapeType === "shield" && <path d={shieldPath} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} transform={`scale(${el.size / 100})`} />}
            {el.shapeType === "ring" && <circle cx={0} cy={0} r={el.size / 2} fill="none" stroke={strokeVal || el.color} strokeWidth={strokeWidthVal || 2} strokeDasharray={strokeDashVal} />}
            {el.shapeType === "badge" && (
              <g>
                <circle cx={0} cy={0} r={el.size / 2} fill={fillVal} stroke={strokeVal} strokeWidth={strokeWidthVal} strokeDasharray={strokeDashVal} />
                <circle cx={0} cy={0} r={el.size / 2 - 4} fill="none" stroke={strokeVal} strokeWidth={1} strokeDasharray="3 2" />
              </g>
            )}
            {border}
          </g>
        );
      }
      return null;
    });
  };

  const activeElement = logoElements.find(el => el.id === activeElementId);

  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Poppins',sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Syne:wght@700;800&family=Outfit:wght@400;600&family=Cinzel:wght@600;800&family=Pacifico&family=Montserrat:wght@400;700&display=swap" rel="stylesheet" />

      {/* Main Studio Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Panel: Tabs */}
        <div style={{ width: "320px", minWidth: "320px", borderRight: "1px solid rgba(212,165,116,0.12)", background: "rgba(10,8,7,0.5)", display: "flex", flexDirection: "column" }}>
          
          {/* Tabs bar */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(212,165,116,0.08)" }}>
            {[
              { id: "ai", label: "AI Suggestions" },
              { id: "editor", label: "Vector Layers" },
              { id: "mockups", label: "Real Mockups" }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "12px 0 10px", background: "none", border: "none", borderBottom: isActive ? "2px solid #f5c842" : "2px solid transparent", color: isActive ? "#f5c842" : "#666", fontWeight: isActive ? 600 : 400, fontSize: "11px", cursor: "pointer", transition: "all 0.2s" }}>
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "18px" }}>
            
            {/* AI Generator Panel */}
            {activeTab === "ai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ fontSize: "10px", color: "#f5c842", fontWeight: 700, letterSpacing: "0.06em" }}>AI BRAND ENGINE</span>
                
                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px" }}>Brand / Company Name</label>
                  <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "8px 12px", fontSize: "12px" }} />
                </div>

                <div>
                  <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px" }}>Slogan / Tagline</label>
                  <input type="text" value={tagline} onChange={e => setTagline(e.target.value)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "8px 12px", fontSize: "12px" }} />
                </div>

                <button className="tool-btn primary" onClick={generateAISuggestions} disabled={isGenerating} style={{ justifyContent: "center", padding: "10px", background: "linear-gradient(135deg,#8b5a2b,#f5c842)", border: "none", color: "#fff" }}>
                  {isGenerating ? "Processing design matrices..." : "✦ Generate Design Suggestions"}
                </button>

                {/* AI Mock options */}
                {aiSuggestions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#5c5650", fontWeight: 600 }}>SELECT SUGGESTED LOGO</span>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      {aiSuggestions.map((sug, i) => (
                        <div key={i} onClick={() => loadSuggestion(sug)} style={{ background: "#0c0a09", border: "1px solid rgba(212,165,116,0.12)", borderRadius: "10px", padding: "12px", cursor: "pointer", textAlign: "center", transition: "all 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "#f5c842"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(212,165,116,0.12)"}>
                          <div style={{ fontSize: "28px", marginBottom: "4px" }}>✦</div>
                          <span style={{ fontSize: "11px", fontWeight: 500 }}>{sug.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Editor Vector Nodes Panel */}
            {activeTab === "editor" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Brand color kits */}
                <div>
                  <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>BRAND COLOR THEMES</span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                    {BRAND_PALETTES.map((pal, idx) => (
                      <button key={pal.name} onClick={() => applyBrandPalette(pal, idx)} style={{ height: "24px", borderRadius: "6px", background: pal.bg, border: idx === activePaletteIdx ? "2px solid #f5c842" : "1px solid rgba(255,255,255,0.15)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "2px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pal.primary }} />
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: pal.secondary }} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add elements */}
                <div>
                  <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>INSERT VECTOR NODES</span>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", rowGap: "8px" }}>
                    <button className="tool-btn" onClick={addText} style={{ padding: "5px 10px", fontSize: "10px" }}>+ Add Text</button>
                    <button className="tool-btn" onClick={() => addShape("circle")} style={{ padding: "5px 10px", fontSize: "10px" }}>● Circle</button>
                    <button className="tool-btn" onClick={() => addShape("box")} style={{ padding: "5px 10px", fontSize: "10px" }}>■ Box</button>
                    <button className="tool-btn" onClick={() => addShape("triangle")} style={{ padding: "5px 10px", fontSize: "10px" }}>▲ Triangle</button>
                    <button className="tool-btn" onClick={() => addShape("star")} style={{ padding: "5px 10px", fontSize: "10px" }}>★ Star</button>
                    <button className="tool-btn" onClick={() => addShape("hexagon")} style={{ padding: "5px 10px", fontSize: "10px" }}>⬢ Hexagon</button>
                    <button className="tool-btn" onClick={() => addShape("shield")} style={{ padding: "5px 10px", fontSize: "10px" }}>🛡️ Shield</button>
                    <button className="tool-btn" onClick={() => addShape("ring")} style={{ padding: "5px 10px", fontSize: "10px" }}>○ Ring</button>
                    <button className="tool-btn" onClick={() => addShape("badge")} style={{ padding: "5px 10px", fontSize: "10px" }}>🏵️ Badge</button>
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                    {Object.keys(PRESET_ICONS).map(ic => (
                      <button key={ic} className="tool-btn" onClick={() => addIcon(ic)} style={{ padding: "4px 8px", fontSize: "10px", textTransform: "capitalize" }}>
                        {ic} Icon
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

                {/* Element properties */}
                {activeElement && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "10px", color: "#f5c842", fontWeight: 700 }}>EDIT NODE: {activeElement.id}</span>
                      <button onClick={() => deleteElement(activeElement.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>Delete Node</button>
                    </div>

                    {activeElement.type === "text" && (
                      <>
                        <div>
                          <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Text Value</label>
                          <input type="text" value={activeElement.text} onChange={e => updateElementProp("text", e.target.value)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px 10px", fontSize: "12px" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Font Family</label>
                            <select value={activeElement.font || "Poppins"} onChange={e => updateElementProp("font", e.target.value)} style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "6px" }}>
                              <option value="Syne">Syne</option>
                              <option value="Outfit">Outfit</option>
                              <option value="Poppins">Poppins</option>
                              <option value="Montserrat">Montserrat</option>
                              <option value="Cinzel">Cinzel (Serif)</option>
                              <option value="Pacifico">Pacifico (Script)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Letter Spacing</label>
                            <input type="number" min="0" max="15" value={activeElement.letterSpacing ?? 0} onChange={e => updateElementProp("letterSpacing", parseInt(e.target.value) || 0)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }} />
                          </div>
                        </div>
                      </>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Position X</label>
                        <input type="number" value={activeElement.x} onChange={e => updateElementProp("x", parseInt(e.target.value) || 0)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }} />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Position Y</label>
                        <input type="number" value={activeElement.y} onChange={e => updateElementProp("y", parseInt(e.target.value) || 0)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
                        <span style={{ color: "#8c8780" }}>Element Size</span>
                        <span style={{ color: "#f5c842" }}>{activeElement.size}px</span>
                      </div>
                      <input type="range" min="8" max="150" value={activeElement.size} onChange={e => updateElementProp("size", parseInt(e.target.value))} className="filter-slider" />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
                        <span style={{ color: "#8c8780" }}>Rotation</span>
                        <span style={{ color: "#f5c842" }}>{activeElement.rotate ?? 0}°</span>
                      </div>
                      <input type="range" min="-180" max="180" value={activeElement.rotate ?? 0} onChange={e => updateElementProp("rotate", parseInt(e.target.value))} className="filter-slider" />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "11px" }}>
                        <span style={{ color: "#8c8780" }}>Opacity</span>
                        <span style={{ color: "#f5c842" }}>{Math.round((activeElement.opacity ?? 1) * 100)}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={Math.round((activeElement.opacity ?? 1) * 100)} onChange={e => updateElementProp("opacity", parseFloat(e.target.value) / 100)} className="filter-slider" />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Fill Type</label>
                        <select value={activeElement.fillType || "solid"} onChange={e => updateElementProp("fillType", e.target.value)} style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "6px" }}>
                          <option value="solid">Solid Fill</option>
                          <option value="none">Outline / None</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Fill Color</label>
                        <input type="color" value={activeElement.color} onChange={e => updateElementProp("color", e.target.value)} disabled={activeElement.fillType === "none"} style={{ width: "100%", height: "24px", background: "none", border: "none", cursor: "pointer", opacity: activeElement.fillType === "none" ? 0.3 : 1 }} />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Stroke Style</label>
                        <select value={activeElement.strokeType || "none"} onChange={e => updateElementProp("strokeType", e.target.value)} style={{ width: "100%", background: "#0c0a09", color: "#fff", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", fontSize: "11px", padding: "6px" }}>
                          <option value="none">No Border</option>
                          <option value="solid">Solid Border</option>
                          <option value="dashed">Dashed Border</option>
                        </select>
                      </div>
                      {activeElement.strokeType !== "none" && (
                        <div>
                          <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Stroke Width</label>
                          <input type="number" min="1" max="20" value={activeElement.strokeWidth ?? 2} onChange={e => updateElementProp("strokeWidth", parseInt(e.target.value) || 1)} style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.15)", borderRadius: "6px", color: "#fff", padding: "6px", fontSize: "11px" }} />
                        </div>
                      )}
                    </div>

                    {activeElement.strokeType !== "none" && (
                      <div>
                        <label style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "4px" }}>Stroke Color</label>
                        <input type="color" value={activeElement.strokeColor || activeElement.color} onChange={e => updateElementProp("strokeColor", e.target.value)} style={{ width: "100%", height: "24px", background: "none", border: "none", cursor: "pointer" }} />
                      </div>
                    )}

                    <div style={{ height: "1px", background: "rgba(212,165,116,0.08)", margin: "4px 0" }} />

                    <div>
                      <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px", fontWeight: 600 }}>ALIGN ELEMENT</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="tool-btn" onClick={alignElementCenter} style={{ flex: 1, padding: "5px", fontSize: "10px", justifyContent: "center" }}>Center X</button>
                        <button className="tool-btn" onClick={alignElementMiddle} style={{ flex: 1, padding: "5px", fontSize: "10px", justifyContent: "center" }}>Center Y</button>
                        <button className="tool-btn" onClick={resetElementRotation} style={{ flex: 1, padding: "5px", fontSize: "10px", justifyContent: "center" }}>Reset Rot</button>
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "6px", fontWeight: 600 }}>ORDER DEPTH</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button className="tool-btn" onClick={bringToFront} style={{ flex: 1, padding: "5px", fontSize: "10px", justifyContent: "center" }}>Bring to Front</button>
                        <button className="tool-btn" onClick={sendToBack} style={{ flex: 1, padding: "5px", fontSize: "10px", justifyContent: "center" }}>Send to Back</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nodes Stack List */}
                <div>
                  <span style={{ fontSize: "10px", color: "#5c5650", display: "block", marginBottom: "8px", fontWeight: 600 }}>VECTOR HIERARCHY</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {logoElements.map(el => {
                      const isActive = activeElementId === el.id;
                      return (
                        <div key={el.id} onClick={() => setActiveElementId(el.id)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 10px", borderRadius: "6px", background: isActive ? "rgba(245,200,66,0.12)" : "rgba(255,255,255,0.02)", border: `1px solid ${isActive ? "#f5c842" : "rgba(255,255,255,0.05)"}`, cursor: "pointer", fontSize: "11px" }}>
                          <span>{el.type === "icon" ? "✦" : el.type === "text" ? "T" : "●"}</span>
                          <span style={{ flex: 1 }}>{el.id}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Real World Mockup switcher */}
            {activeTab === "mockups" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <span style={{ fontSize: "10px", color: "#5c5650", fontWeight: 600 }}>MOCKUP SELECTION</span>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {[
                    { id: "card", name: "Premium Black Card", desc: "Minimalist business layout" },
                    { id: "mug", name: "Ceramic Coffee Mug", desc: "Centered cylinder product stamp" },
                    { id: "sticker", name: "Modern Laptop Sticker", desc: "Glow background laptop skin" }
                  ].map(mock => {
                    const isActive = activeMockup === mock.id;
                    return (
                      <div key={mock.id} onClick={() => setActiveMockup(mock.id)} style={{ padding: "12px", borderRadius: "10px", background: isActive ? "rgba(245,200,66,0.12)" : "rgba(255,255,255,0.02)", border: `1px solid ${isActive ? "#f5c842" : "rgba(255,255,255,0.05)"}`, cursor: "pointer", transition: "all 0.2s" }}>
                        <div style={{ fontSize: "12px", fontWeight: 600, color: isActive ? "#f5c842" : "#fff" }}>{mock.name}</div>
                        <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>{mock.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Vector Canvas OR Mockup preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#080604", position: "relative" }}>
          
          {/* Header toolbar */}
          <div style={{ height: "48px", background: "rgba(10,8,7,0.95)", borderBottom: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", padding: "0 20px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ padding: "5px 12px", fontSize: "11px" }}>Exit</button>
              <div style={{ width: "1px", height: "16px", background: "rgba(212,165,116,0.15)" }} />
              <span style={{ fontFamily: "Syne", fontSize: "15px", fontWeight: 800 }}>LogoStudio</span>
            </div>

            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <label style={{ fontSize: "11px", color: "#8c8780", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", userSelect: "none" }}>
                <input
                  type="checkbox"
                  checked={canvasBg === "transparent"}
                  onChange={e => {
                    if (e.target.checked) {
                      setCanvasBg("transparent");
                    } else {
                      setCanvasBg(lastCanvasColor);
                    }
                  }}
                  style={{ accentColor: "#f5c842", cursor: "pointer", width: "13px", height: "13px" }}
                />
                Transparent Canvas
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "11px", color: "#8c8780" }}>Canvas BG</span>
                <input
                  type="color"
                  value={canvasBg === "transparent" ? lastCanvasColor : canvasBg}
                  onChange={e => {
                    setCanvasBg(e.target.value);
                    setLastCanvasColor(e.target.value);
                  }}
                  disabled={canvasBg === "transparent"}
                  style={{ width: "24px", height: "20px", border: "none", background: "none", cursor: canvasBg === "transparent" ? "not-allowed" : "pointer", padding: 0, opacity: canvasBg === "transparent" ? 0.3 : 1 }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {activeTab === "mockups" ? (
                <button className="tool-btn primary" onClick={triggerMockupExport} style={{ background: "linear-gradient(135deg,#8b5a2b,#f5c842)", border: "none", color: "#fff", padding: "5px 12px", fontSize: "11px" }}>
                  Download Mockup PNG
                </button>
              ) : (
                <>
                  <button className="tool-btn" onClick={triggerSVGExport} style={{ border: "1px solid rgba(212,165,116,0.25)", color: "#fff", background: "rgba(255,255,255,0.02)", padding: "5px 12px", fontSize: "11px" }}>
                    Export SVG
                  </button>
                  <button className="tool-btn primary" onClick={triggerPNGExport} style={{ background: "linear-gradient(135deg,#8b5a2b,#f5c842)", border: "none", color: "#fff", padding: "5px 12px", fontSize: "11px" }}>
                    Export PNG
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Active Canvas Panel */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyCenter: "center", padding: "40px", justifyContent: "center" }}>
            {activeTab === "mockups" ? (
              /* RENDER MOCKUP CONTAINER */
              <div style={{ width: "100%", maxWidth: "600px", height: "100%", maxHeight: "400px", borderRadius: "20px", overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", background: activeMockup === "card" ? "#111" : activeMockup === "mug" ? "#e5e7eb" : "#2d3748", position: "relative" }}>
                
                {/* Mockup Card layout */}
                {activeMockup === "card" && (
                  <div style={{ width: "380px", height: "210px", background: "#1c1917", borderRadius: "12px", border: "1px solid #292524", boxShadow: "0 10px 30px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", transform: "rotateX(20deg) rotateY(-20deg)", transformStyle: "preserve-3d" }}>
                    <svg width="220" height="150" viewBox="0 0 300 300">
                      {renderSVGNodes()}
                    </svg>
                  </div>
                )}

                {/* Mockup Mug layout */}
                {activeMockup === "mug" && (
                  <div style={{ width: "160px", height: "220px", background: "#fcfaf2", borderRadius: "0 0 40px 40px", borderTop: "2px solid #e5e5e5", boxShadow: "0 15px 35px rgba(0,0,0,0.15)", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* Handle */}
                    <div style={{ position: "absolute", right: "-35px", top: "50px", width: "45px", height: "110px", borderRadius: "0 40px 40px 0", border: "16px solid #fcfaf2", borderLeft: "none", zIndex: -1 }} />
                    <svg width="100" height="120" viewBox="0 0 300 300">
                      {renderSVGNodes()}
                    </svg>
                  </div>
                )}

                {/* Mockup Sticker layout */}
                {activeMockup === "sticker" && (
                  <div style={{ width: "240px", height: "240px", borderRadius: "50%", background: "#ffffff", padding: "10px", boxShadow: "0 10px 30px rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: canvasBg, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      <svg width="140" height="140" viewBox="0 0 300 300">
                        {renderSVGNodes()}
                      </svg>
                    </div>
                  </div>
                )}

                {/* Live Badge indicator */}
                <div style={{ position: "absolute", top: "16px", left: "16px", background: "rgba(0,0,0,0.6)", padding: "4px 10px", borderRadius: "20px", fontSize: "10px", border: "1px solid rgba(255,255,255,0.12)", color: "#f5c842", fontWeight: 600 }}>MOCKUP SIMULATION</div>
              </div>
            ) : (
              /* RENDER STANDARD SVG CANVAS */
              <div style={{ background: canvasBg === "transparent" ? "repeating-conic-gradient(#141210 0% 25%, #24201c 0% 50%) 0% 0% / 24px 24px" : canvasBg, width: "100%", maxWidth: "500px", aspectRatio: "1/1", borderRadius: "24px", boxShadow: "0 25px 60px rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: "background 0.3s" }}>
                <svg
                  ref={svgRef}
                  width="100%"
                  height="100%"
                  viewBox="0 0 300 300"
                  style={{ display: "block" }}
                  onMouseMove={handleSvgMouseMove}
                  onMouseUp={handleSvgMouseUp}
                  onMouseLeave={handleSvgMouseUp}
                >
                  {renderSVGNodes()}
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exit confirmation modal */}
      {showLeaveModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, backdropFilter: "blur(12px)" }}>
          <div className="glass-panel" style={{ width: "420px", padding: "30px", borderRadius: "24px", textAlign: "center", border: "1px solid rgba(212,165,116,0.25)", background: "#131110" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>✦</div>
            <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "22px", fontWeight: 800, color: "#fff", marginBottom: "10px", letterSpacing: "-0.03em" }}>Save brand identity?</h3>
            <p style={{ fontSize: "13.5px", color: "#8c8780", lineHeight: 1.6, marginBottom: "24px", fontWeight: 300 }}>
              Would you like to save this brand logo design to your past works, or discard your current edits?
            </p>
            
            {/* Input field for project title */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <label style={{ fontSize: "11px", color: "#f5c842", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Brand Identity Name</label>
              <input 
                type="text" 
                value={projectTitle} 
                onChange={e => setProjectTitle(e.target.value)} 
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.18)", borderRadius: "8px", color: "#fff", padding: "10px 14px", fontSize: "13px", outline: "none" }}
                placeholder="My Brand Name"
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
