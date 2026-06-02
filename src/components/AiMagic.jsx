import { useState, useRef, useEffect } from "react";

const STOCK_IMAGES = [
  { id: "ai_stock1", name: "Modern Portrait", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80" },
  { id: "ai_stock2", name: "Neon Street", url: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80" },
  { id: "ai_stock3", name: "Scenic Mountain", url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=600&q=80" }
];

const ASPECT_RATIOS = [
  { id: "1:1", name: "Square (1:1)", width: 600, height: 600, icon: "⏹️" },
  { id: "16:9", name: "Landscape (16:9)", width: 800, height: 450, icon: "📺" },
  { id: "9:16", name: "Portrait/Story (9:16)", width: 450, height: 800, icon: "📱" },
  { id: "4:3", name: "Standard (4:3)", width: 800, height: 600, icon: "🖼️" }
];

const ART_STYLES = [
  { id: "none", name: "Original Photo", desc: "No AI styling filters", emoji: "📸" },
  { id: "cyberpunk", name: "Cyberpunk Neon", desc: "Saturated cyans, magentas & high contrast", emoji: "🌆" },
  { id: "sketch", name: "Pencil Sketch", desc: "Edge-detection based black & white sketch", emoji: "✏️" },
  { id: "watercolor", name: "Watercolor Bleed", desc: "Soft borders, color bleeding & textures", emoji: "🎨" },
  { id: "anime", name: "Ghibli Anime", desc: "Posterized cel shading & high vibrance", emoji: "🌸" },
  { id: "oil", name: "Oil Painting", desc: "Kuwahara-style paint clustering brush strokes", emoji: "🎭" }
];

export default function AiMagic({ onBack, user }) {
  const [selectedImgUrl, setSelectedImgUrl] = useState(STOCK_IMAGES[0].url);
  const [aspectRatio, setAspectRatio] = useState(ASPECT_RATIOS[0]); // Default 1:1
  const [activeStyle, setActiveStyle] = useState("none");
  const [promptText, setPromptText] = useState("");
  const [bgRemoved, setBgRemoved] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [toastMessage, setToastMessage] = useState("");

  // Refine tool states
  const [isRefining, setIsRefining] = useState(false);
  const [brushMode, setBrushMode] = useState("erase"); // erase | restore
  const [brushSize, setBrushSize] = useState(25);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageElRef = useRef(null);
  const refineCanvasRef = useRef(null); // transparent mask overlay
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Load image element
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageElRef.current = img;
      resetRefineMask();
      renderCanvas();
    };
    img.src = selectedImgUrl;
  }, [selectedImgUrl]);

  // Redraw when aspect ratio, style, or background-removal state changes
  useEffect(() => {
    renderCanvas();
  }, [aspectRatio, activeStyle, bgRemoved, isScanning, scanProgress]);

  // Helper to trigger transient popup alerts
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Reset/initialize the refinement transparency mask canvas
  const resetRefineMask = () => {
    const mask = refineCanvasRef.current;
    if (!mask) return;
    mask.width = aspectRatio.width;
    mask.height = aspectRatio.height;
    const mctx = mask.getContext("2d");
    // Default: solid white (fully visible image)
    mctx.fillStyle = "#ffffff";
    mctx.fillRect(0, 0, mask.width, mask.height);
  };

  // Perform client-side background removal simulation
  const handleBgRemoval = () => {
    if (bgRemoved) {
      setBgRemoved(false);
      resetRefineMask();
      triggerToast("Background restored.");
      return;
    }

    setIsScanning(true);
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsScanning(false);
            setBgRemoved(true);
            applyChromaKeyBgRemoval();
            triggerToast("Background removed successfully!");
          }, 300);
          return 100;
        }
        return prev + 5;
      });
    }, 80);
  };

  // Generate artwork style with progress loader
  const handleGenerateStyle = (styleId) => {
    setIsGenerating(true);
    setGenerateProgress(0);

    const interval = setInterval(() => {
      setGenerateProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsGenerating(false);
            setActiveStyle(styleId);
            triggerToast(`Styled with ${ART_STYLES.find(s => s.id === styleId).name}!`);
          }, 200);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  // Chroma key simulation: scan pixels and make the light background values transparent
  const applyChromaKeyBgRemoval = () => {
    const mask = refineCanvasRef.current;
    const img = imageElRef.current;
    if (!mask || !img) return;

    const mctx = mask.getContext("2d");
    // Draw the image temporary to read pixels
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = aspectRatio.width;
    tempCanvas.height = aspectRatio.height;
    const tempCtx = tempCanvas.getContext("2d");

    // Contain/cover draw image
    drawFitImage(tempCtx, img, aspectRatio.width, aspectRatio.height);
    const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const pixels = imgData.data;

    const maskData = mctx.getImageData(0, 0, mask.width, mask.height);
    const maskPixels = maskData.data;

    // Detect white/light background or simple color distance threshold
    // Let's check for pixels that are very bright (RGB > 200) or very uniform (sky/backdrop)
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate brightness
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // If pixel is near-white (background in studio portrait or light sky)
      if (brightness > 205 && Math.abs(r-g) < 25 && Math.abs(g-b) < 25) {
        maskPixels[i] = 0;     // Red
        maskPixels[i+1] = 0;   // Green
        maskPixels[i+2] = 0;   // Blue
        maskPixels[i+3] = 0;   // Alpha (Transparent)
      } else {
        maskPixels[i] = 255;
        maskPixels[i+1] = 255;
        maskPixels[i+2] = 255;
        maskPixels[i+3] = 255; // Solid
      }
    }

    mctx.putImageData(maskData, 0, 0);
  };

  // Render scaling helper (cover style)
  const drawFitImage = (ctx, img, canvasW, canvasH) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasW / canvasH;
    let drawW, drawH, drawX, drawY;

    if (imgRatio > canvasRatio) {
      drawH = canvasH;
      drawW = canvasH * imgRatio;
      drawX = (canvasW - drawW) / 2;
      drawY = 0;
    } else {
      drawW = canvasW;
      drawH = canvasW / imgRatio;
      drawX = 0;
      drawY = (canvasH - drawH) / 2;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  };

  // Main canvas renderer with pixel shader filters
  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = imageElRef.current;
    if (!canvas || !img) return;

    canvas.width = aspectRatio.width;
    canvas.height = aspectRatio.height;
    const ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Create a temporary workspace canvas to isolate styles before applying alpha mask
    const workspaceCanvas = document.createElement("canvas");
    workspaceCanvas.width = canvas.width;
    workspaceCanvas.height = canvas.height;
    const wctx = workspaceCanvas.getContext("2d");

    // 1. Draw base image fitted to canvas
    drawFitImage(wctx, img, canvas.width, canvas.height);

    // 2. Apply Custom Javascript Pixel Shader Art Styles
    if (activeStyle !== "none") {
      const imgData = wctx.getImageData(0, 0, workspaceCanvas.width, workspaceCanvas.height);
      
      if (activeStyle === "cyberpunk") {
        applyCyberpunkStyle(imgData);
      } else if (activeStyle === "sketch") {
        applySobelSketchStyle(imgData);
      } else if (activeStyle === "watercolor") {
        applyWatercolorStyle(wctx, imgData);
      } else if (activeStyle === "anime") {
        applyAnimeStyle(imgData);
      } else if (activeStyle === "oil") {
        applyKuwaharaOilStyle(imgData);
      }

      if (activeStyle !== "watercolor") {
        wctx.putImageData(imgData, 0, 0);
      }
    }

    // 3. Apply Background removal mask (if enabled)
    if (bgRemoved && refineCanvasRef.current) {
      const maskCanvas = refineCanvasRef.current;
      const maskCtx = maskCanvas.getContext("2d");
      const maskImgData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const wImgData = wctx.getImageData(0, 0, workspaceCanvas.width, workspaceCanvas.height);
      
      // Multiply opacity
      for (let i = 3; i < wImgData.data.length; i += 4) {
        wImgData.data[i] = Math.min(wImgData.data[i], maskImgData.data[i]);
      }
      wctx.putImageData(wImgData, 0, 0);
    }

    // 4. Draw workspace onto screen
    ctx.drawImage(workspaceCanvas, 0, 0);

    // 5. Draw laser scanline overlay (if scanning background removal)
    if (isScanning) {
      const scanY = (scanProgress / 100) * canvas.height;
      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.moveTo(0, scanY);
      ctx.lineTo(canvas.width, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Light shade overlay
      ctx.fillStyle = "rgba(168, 85, 247, 0.05)";
      ctx.fillRect(0, 0, canvas.width, scanY);
    }
  };

  // Cyberpunk filter implementation
  const applyCyberpunkStyle = (imgData) => {
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Boost contrast
      r = ((r - 128) * 1.3) + 128;
      g = ((g - 128) * 1.2) + 128;
      b = ((b - 128) * 1.4) + 128;

      // Color mapping: shadows blue/cyan, highlights hot pink/magenta
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness < 110) {
        // Cyan shadow tint
        r = Math.max(0, r - 30);
        g = Math.min(255, g + 25);
        b = Math.min(255, b + 45);
      } else {
        // Magenta highlight tint
        r = Math.min(255, r + 45);
        g = Math.max(0, g - 25);
        b = Math.min(255, b + 25);
      }

      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }
  };

  // Sobel Edge Detection Pencil Sketch
  const applySobelSketchStyle = (imgData) => {
    const data = imgData.data;
    const w = imgData.width;
    const h = imgData.height;

    // Create grayscale buffer
    const gray = new Uint8Array(w * h);
    for (let i = 0; i < data.length; i += 4) {
      gray[i / 4] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    // Sobel kernels
    const kx = [
      -1, 0, 1,
      -2, 0, 2,
      -1, 0, 1
    ];
    const ky = [
      -1, -2, -1,
       0,  0,  0,
       1,  2,  1
    ];

    const out = new Uint8Array(w * h);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        let valX = 0;
        let valY = 0;

        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const pixelVal = gray[(y + dy) * w + (x + dx)];
            const kIdx = (dy + 1) * 3 + (dx + 1);
            valX += pixelVal * kx[kIdx];
            valY += pixelVal * ky[kIdx];
          }
        }

        const mag = Math.sqrt(valX * valX + valY * valY);
        // Invert and threshold to create pencil edge look (white background, dark lines)
        let edge = 255 - mag * 1.5;
        if (edge < 0) edge = 0;
        if (edge > 255) edge = 255;
        
        // High contrast line filter
        out[y * w + x] = edge > 220 ? 255 : edge;
      }
    }

    // Write back to imgData
    for (let i = 0; i < data.length; i += 4) {
      const g = out[Math.floor(i / 4)];
      data[i] = g;
      data[i + 1] = g;
      data[i + 2] = g;
    }
  };

  // Watercolor painting filter with blur bleed
  const applyWatercolorStyle = (wctx, imgData) => {
    const data = imgData.data;
    // Box blur simulation to create paint bleed
    const w = imgData.width;
    const h = imgData.height;

    // Apply color saturation boost first
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i+1];
      let b = data[i+2];
      // Boost saturation
      const mx = Math.max(r, g, b);
      const mn = Math.min(r, g, b);
      const d = (mx - mn) / 255;
      if (d > 0) {
        r = r + (r - 128) * 0.4;
        g = g + (g - 128) * 0.4;
        b = b + (b - 128) * 0.4;
      }
      data[i] = Math.max(0, Math.min(255, r));
      data[i+1] = Math.max(0, Math.min(255, g));
      data[i+2] = Math.max(0, Math.min(255, b));
    }
    wctx.putImageData(imgData, 0, 0);

    // Apply native canvas blur to bleed colors
    wctx.save();
    wctx.filter = "blur(4px) contrast(110%)";
    wctx.drawImage(wctx.canvas, 0, 0);
    wctx.restore();

    // Draw a subtle watercolor paper texture pattern on top using additive blending
    wctx.save();
    wctx.globalAlpha = 0.08;
    wctx.globalCompositeOperation = "multiply";
    // Draw fine grid texture
    wctx.fillStyle = "#e8dfd5";
    wctx.fillRect(0, 0, w, h);
    wctx.restore();
  };

  // Anime Posterized Cel Shading filter
  const applyAnimeStyle = (imgData) => {
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Posterize colors: reduce gradients to 5 blocks
      r = Math.round(r / 51) * 51;
      g = Math.round(g / 51) * 51;
      b = Math.round(b / 51) * 51;

      // Brighten & boost saturation for warm anime look
      r = Math.min(255, r * 1.1 + 10);
      g = Math.min(255, g * 1.1 + 8);
      b = Math.min(255, b * 1.05 + 5);

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  };

  // Oil Painting Kuwahara filter style (local color neighborhood grouping)
  const applyKuwaharaOilStyle = (imgData) => {
    const data = imgData.data;
    const w = imgData.width;
    const h = imgData.height;
    
    // Copy original pixels
    const src = new Uint8ClampedArray(data);
    const radius = 2; // window radius size (5x5 filter)

    // Helper to calculate mean and variance in a sub-quadrant
    const getRegionStats = (xStart, xEnd, yStart, yEnd) => {
      let sumR = 0, sumG = 0, sumB = 0;
      let sqSumR = 0, sqSumG = 0, sqSumB = 0;
      let count = 0;

      for (let y = yStart; y <= yEnd; y++) {
        if (y < 0 || y >= h) continue;
        for (let x = xStart; x <= xEnd; x++) {
          if (x < 0 || x >= w) continue;
          
          const i = (y * w + x) * 4;
          const r = src[i];
          const g = src[i + 1];
          const b = src[i + 2];

          sumR += r; sumG += g; sumB += b;
          sqSumR += r * r; sqSumG += g * g; sqSumB += b * b;
          count++;
        }
      }

      if (count === 0) return { mean: [0, 0, 0], variance: Infinity };

      const meanR = sumR / count;
      const meanG = sumG / count;
      const meanB = sumB / count;

      const varR = (sqSumR / count) - (meanR * meanR);
      const varG = (sqSumG / count) - (meanG * meanG);
      const varB = (sqSumB / count) - (meanB * meanB);
      const variance = varR + varG + varB;

      return {
        mean: [meanR, meanG, meanB],
        variance
      };
    };

    // Process every pixel
    for (let y = 0; y < h; y += 2) { // Step by 2 to keep rendering speed high
      for (let x = 0; x < w; x += 2) {
        // Divide neighborhood into 4 quadrants
        const q1 = getRegionStats(x - radius, x, y - radius, y);
        const q2 = getRegionStats(x, x + radius, y - radius, y);
        const q3 = getRegionStats(x - radius, x, y, y + radius);
        const q4 = getRegionStats(x, x + radius, y, y + radius);

        // Pick quadrant with lowest variance (most uniform color block)
        let minQ = q1;
        if (q2.variance < minQ.variance) minQ = q2;
        if (q3.variance < minQ.variance) minQ = q3;
        if (q4.variance < minQ.variance) minQ = q4;

        // Apply mean color to the 2x2 patch
        const color = minQ.mean;
        for (let py = 0; py < 2; py++) {
          if (y + py >= h) continue;
          for (let px = 0; px < 2; px++) {
            if (x + px >= w) continue;
            const idx = ((y + py) * w + (x + px)) * 4;
            data[idx] = color[0];
            data[idx + 1] = color[1];
            data[idx + 2] = color[2];
          }
        }
      }
    }
  };

  // Handle uploaded images from local disk
  const handleLocalUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setSelectedImgUrl(url);
      setBgRemoved(false);
      setActiveStyle("none");
      triggerToast("Custom image imported.");
    }
  };

  // Bounding box / coordinates calculation for refinement brush drawing
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Support mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Proportional coordinates mapping
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    return { x, y };
  };

  // Mask brush paint events (erase background or restore background manually)
  const handleDrawingStart = (e) => {
    if (!isRefining) return;
    drawingRef.current = true;
    const pos = getCanvasCoords(e);
    lastPosRef.current = pos;
    paintOnMask(pos.x, pos.y);
  };

  const handleDrawingMove = (e) => {
    if (!isRefining || !drawingRef.current) return;
    const pos = getCanvasCoords(e);
    drawMaskLine(lastPosRef.current.x, lastPosRef.current.y, pos.x, pos.y);
    lastPosRef.current = pos;
  };

  const handleDrawingEnd = () => {
    drawingRef.current = false;
    renderCanvas();
  };

  // Apply brush stroke on the refinement canvas mask
  const paintOnMask = (x, y) => {
    const mask = refineCanvasRef.current;
    if (!mask) return;
    const mctx = mask.getContext("2d");
    mctx.fillStyle = brushMode === "restore" ? "#ffffff" : "rgba(0,0,0,0)";
    
    mctx.save();
    // Erase means setting alpha to 0. We use destination-out composite mode
    if (brushMode === "erase") {
      mctx.globalCompositeOperation = "destination-out";
    } else {
      mctx.globalCompositeOperation = "source-over";
    }

    mctx.beginPath();
    mctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    mctx.fill();
    mctx.restore();
  };

  // Draw continuous brush strokes on the refinement mask
  const drawMaskLine = (x1, y1, x2, y2) => {
    const mask = refineCanvasRef.current;
    if (!mask) return;
    const mctx = mask.getContext("2d");

    mctx.save();
    mctx.lineWidth = brushSize;
    mctx.lineCap = "round";
    mctx.lineJoin = "round";

    if (brushMode === "erase") {
      mctx.globalCompositeOperation = "destination-out";
      mctx.strokeStyle = "rgba(0,0,0,1)";
    } else {
      mctx.globalCompositeOperation = "source-over";
      mctx.strokeStyle = "#ffffff";
    }

    mctx.beginPath();
    mctx.moveTo(x1, y1);
    mctx.lineTo(x2, y2);
    mctx.stroke();
    mctx.restore();
  };

  // Save the canvas artwork onto disk
  const downloadArtwork = (format) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mime = format === "jpeg" ? "image/jpeg" : "image/png";
    const extension = format === "jpeg" ? "jpg" : "png";
    
    const a = document.createElement("a");
    a.href = canvas.toDataURL(mime, 0.95);
    a.download = `AI_Magic_Studio_Export_${Date.now()}.${extension}`;
    a.click();
    triggerToast(`Downloaded ${format.toUpperCase()} artwork!`);
  };

  const isGeneratingStyle = isGenerating;

  return (
    <div style={{ background: "#0c0a09", color: "#f5f0e8", fontFamily: "'Instrument Sans', sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Instrument+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #0c0a09; }
        ::-webkit-scrollbar-thumb { background: rgba(212,165,116,0.18); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #d4a574; }
        .glass-panel { background: rgba(14,12,11,0.85); backdrop-filter: blur(20px) saturate(160%); border: 1px solid rgba(212,165,116,0.14); box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
        .sidebar-panel { background: rgba(14,12,11,0.85); backdrop-filter: blur(20px) saturate(160%); }
        .control-btn { background: rgba(212,165,116,0.05); border: 1px solid rgba(212,165,116,0.15); color: #e5e5e5; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 12.5px; font-family: 'Poppins', sans-serif; display: inline-flex; align-items: center; gap: 7px; transition: all 0.18s; white-space: nowrap; }
        .control-btn:hover { background: rgba(212,165,116,0.12); color: #d4a574; border-color: rgba(212,165,116,0.4); transform: translateY(-1px); }
        .control-btn.active { background: rgba(212,165,116,0.18); color: #d4a574; border-color: #d4a574; }
        .control-btn.primary { background: linear-gradient(135deg, #8b5a2b, #d4a574); border: none; color: #fff; box-shadow: 0 2px 10px rgba(139,90,43,0.3); font-weight: 500; }
        .control-btn.primary:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(139,90,43,0.45); }
        .control-btn.danger { color: #ef4444; border-color: rgba(239,68,68,0.2); background: rgba(239,68,68,0.04); }
        .control-btn.danger:hover { background: rgba(239,68,68,0.14); border-color: #ef4444; }
        .style-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(212,165,116,0.1); border-radius: 12px; padding: 12px; cursor: pointer; transition: all 0.2s; text-align: left; }
        .style-card:hover { border-color: #d4a574; background: rgba(212,165,116,0.06); transform: translateY(-1px); }
        .style-card.selected { border-color: #a855f7; background: rgba(168,85,247,0.08); box-shadow: 0 0 12px rgba(168,85,247,0.18); }
        .ratio-btn { border: 1px solid rgba(212,165,116,0.12); padding: 10px; border-radius: 10px; background: none; color: #e5e5e5; cursor: pointer; flex: 1; transition: all 0.18s; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .ratio-btn:hover { border-color: #d4a574; background: rgba(212,165,116,0.04); }
        .ratio-btn.active { border-color: #d4a574; background: rgba(212,165,116,0.12); color: #d4a574; }
        .stock-img { width: 68px; height: 68px; border-radius: 8px; cursor: pointer; object-fit: cover; border: 2px solid transparent; transition: all 0.2s; }
        .stock-img:hover { border-color: rgba(212,165,116,0.5); transform: scale(1.03); }
        .stock-img.active { border-color: #d4a574; transform: scale(1.05); }
      `}</style>

      {/* ── Top Bar Header ── */}
      <div style={{ height: "64px", borderBottom: "1px solid rgba(212,165,116,0.14)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(10,8,7,0.9)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={onBack} className="control-btn" style={{ padding: "6px 12px", gap: "6px" }} title="Go Back">
            ← Exit Studio
          </button>
          <div style={{ width: "1px", height: "20px", background: "rgba(212,165,116,0.18)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>✨</span>
            <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: "16.5px", color: "#fff", letterSpacing: "-0.02em" }}>
              AI Magic Studio <span style={{ color: "#a855f7", fontSize: "10px", verticalAlign: "middle", background: "rgba(168,85,247,0.15)", padding: "2px 8px", borderRadius: "10px", marginLeft: "6px" }}>BETA</span>
            </div>
          </div>
        </div>

        {/* Generate / Action trigger */}
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "rgba(245,240,232,0.3)" }}>Exports strictly browser-native</span>
          <button className="control-btn" onClick={() => downloadArtwork("png")} style={{ padding: "6px 14px" }} disabled={isScanning || isGenerating}>
            Download PNG
          </button>
          <button className="control-btn primary" onClick={() => downloadArtwork("jpeg")} style={{ padding: "6px 16px" }} disabled={isScanning || isGenerating}>
            Export HQ JPEG
          </button>
        </div>
      </div>

      {/* ── Workspace ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Side: Image selection & AI styles prompt */}
        <div className="sidebar-panel" style={{ width: "340px", borderRight: "1px solid rgba(212,165,116,0.1)", display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", padding: "20px", gap: "24px" }}>
          
          {/* Section 1: Stock/Uploaded assets */}
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>1. SELECT SOURCE IMAGE</div>
            <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
              {STOCK_IMAGES.map(img => (
                <img 
                  key={img.id}
                  src={img.url} 
                  alt={img.name} 
                  className={`stock-img${selectedImgUrl === img.url ? " active" : ""}`}
                  onClick={() => setSelectedImgUrl(img.url)}
                />
              ))}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLocalUpload} />
            <button className="control-btn" onClick={() => fileInputRef.current.click()} style={{ width: "100%", justifyContent: "center" }}>
              📤 Upload Custom Photo
            </button>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Section 2: AI Background removal */}
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>2. BACKDROP MAGIC</div>
            <button 
              className={`control-btn${bgRemoved ? " danger" : " primary"}`} 
              onClick={handleBgRemoval} 
              style={{ width: "100%", justifyContent: "center", gap: "8px" }}
              disabled={isScanning || isGenerating}
            >
              {isScanning ? (
                <>⏳ Scanning Photo ({scanProgress}%)</>
              ) : bgRemoved ? (
                <>↺ Restore Background</>
              ) : (
                <>✂️ Remove Image Background</>
              )}
            </button>
            <p style={{ fontSize: "11px", color: "rgba(245,240,232,0.4)", marginTop: "8px", lineHeight: "1.4" }}>
              Removes white/studio backdrops and lets you manually refine edges with our precision brush eraser.
            </p>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Section 3: Generative AI style prompt */}
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>3. AI GENERATIVE STYLES</div>
            <textarea 
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              placeholder="e.g. detailed cyberpunk warrior with cybernetic visor, glowing lights, anime key art..."
              style={{ width: "100%", height: "80px", background: "#060505", border: "1px solid rgba(212,165,116,0.18)", borderRadius: "8px", color: "#fff", padding: "10px", fontSize: "12px", resize: "none", outline: "none", fontFamily: "inherit", marginBottom: "12px" }}
            />
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ART_STYLES.map(style => (
                <div 
                  key={style.id}
                  className={`style-card${activeStyle === style.id ? " selected" : ""}`}
                  onClick={() => handleGenerateStyle(style.id)}
                >
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "20px" }}>{style.emoji}</span>
                    <div>
                      <div style={{ fontSize: "12.5px", fontWeight: 600, color: "#fff" }}>{style.name}</div>
                      <div style={{ fontSize: "10px", color: "rgba(245,240,232,0.4)" }}>{style.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Canvas area */}
        <div style={{ flex: 1, background: "#080604", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", padding: "32px", overflow: "hidden" }}>
          
          {/* Main viewport frame */}
          <div style={{
            position: "relative",
            width: `${aspectRatio.width}px`,
            height: `${aspectRatio.height}px`,
            maxWidth: "90%",
            maxHeight: "80%",
            background: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\"><rect width=\"10\" height=\"10\" fill=\"%23131110\"/><rect x=\"10\" y=\"10\" width=\"10\" height=\"10\" fill=\"%23131110\"/><rect x=\"10\" width=\"10\" height=\"10\" fill=\"%230c0a09\"/><rect y=\"10\" width=\"10\" height=\"10\" fill=\"%230c0a09\"/></svg>') repeat",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 20px 80px rgba(0,0,0,0.8)",
            border: "1px solid rgba(212,165,116,0.22)",
            cursor: isRefining ? "crosshair" : "default"
          }}>
            
            {/* Visual Canvas containing rendering */}
            <canvas 
              ref={canvasRef} 
              onMouseDown={handleDrawingStart}
              onMouseMove={handleDrawingMove}
              onMouseUp={handleDrawingEnd}
              onMouseLeave={handleDrawingEnd}
              onTouchStart={handleDrawingStart}
              onTouchMove={handleDrawingMove}
              onTouchEnd={handleDrawingEnd}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} 
            />

            {/* Invisible refinement mask overlay canvas (hidden from view, kept in memory) */}
            <canvas ref={refineCanvasRef} style={{ display: "none" }} />

            {/* Simulated AI Style Progress Overlay */}
            {isGeneratingStyle && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(10,8,7,0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 15, backdropFilter: "blur(8px)" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "50px", height: "50px", border: "3px solid rgba(168, 85, 247, 0.2)", borderTopColor: "#a855f7", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <style>{`
                    @keyframes spin { to { transform: rotate(360deg); } }
                  `}</style>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "Syne", fontSize: "16px", fontWeight: 800, color: "#fff" }}>AI Diffusion Style Rendering...</div>
                    <div style={{ fontSize: "12px", color: "#a855f7", fontWeight: 600, marginTop: "4px" }}>{generateProgress}% Complete</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Active styling label bottom */}
          <div style={{ display: "flex", gap: "8px", marginTop: "20px", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "rgba(245,240,232,0.4)" }}>Format bounds:</span>
            <span style={{ background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.18)", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", color: "#d4a574", fontWeight: 600 }}>
              {aspectRatio.name}
            </span>
            {activeStyle !== "none" && (
              <span style={{ background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.3)", padding: "3px 10px", borderRadius: "6px", fontSize: "11px", color: "#c084fc", fontWeight: 600 }}>
                AI Filter: {ART_STYLES.find(s => s.id === activeStyle).name}
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Aspect ratios & Manual brush refinement */}
        <div className="sidebar-panel" style={{ width: "300px", borderLeft: "1px solid rgba(212,165,116,0.1)", display: "flex", flexDirection: "column", height: "100%", padding: "20px", gap: "24px" }}>
          
          {/* Section 4: Aspect Ratio Selector */}
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 700, textTransform: "uppercase", marginBottom: "12px" }}>4. ASPECT RATIO</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {ASPECT_RATIOS.map(ratio => (
                <button
                  key={ratio.id}
                  className={`ratio-btn${aspectRatio.id === ratio.id ? " active" : ""}`}
                  onClick={() => setAspectRatio(ratio)}
                >
                  <span style={{ fontSize: "16px" }}>{ratio.icon}</span>
                  <span style={{ fontSize: "11px", fontWeight: 500 }}>{ratio.id}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: "1px", background: "rgba(212,165,116,0.08)" }} />

          {/* Section 5: Manual eraser refinement (active only if background is removed) */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ fontSize: "10.5px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 700, textTransform: "uppercase" }}>5. BRUSH ERASER REFINE</div>
              <span style={{ fontSize: "9px", color: bgRemoved ? "#22d3a8" : "rgba(245,240,232,0.3)" }}>● {bgRemoved ? "ACTIVE" : "STANDBY"}</span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", opacity: bgRemoved ? 1 : 0.35, pointerEvents: bgRemoved ? "auto" : "none" }}>
              
              <button 
                className={`control-btn${isRefining ? " active" : ""}`} 
                onClick={() => setIsRefining(!isRefining)}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {isRefining ? "🎨 Stop Edge Drawing" : "✏️ Draw Refine Mask"}
              </button>

              {/* Mode switch */}
              <div style={{ display: "flex", gap: "4px" }}>
                <button 
                  className={`control-btn${brushMode === "erase" ? " active" : ""}`} 
                  onClick={() => setBrushMode("erase")} 
                  style={{ flex: 1, justifyContent: "center", fontSize: "11px" }}
                >
                  🧽 Erase BG
                </button>
                <button 
                  className={`control-btn${brushMode === "restore" ? " active" : ""}`} 
                  onClick={() => setBrushMode("restore")} 
                  style={{ flex: 1, justifyContent: "center", fontSize: "11px" }}
                >
                  🖌️ Restore BG
                </button>
              </div>

              {/* Brush size */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", color: "rgba(245,240,232,0.6)" }}>
                  <span>Brush size</span>
                  <span style={{ color: "#d4a574" }}>{brushSize}px</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={brushSize} 
                  onChange={e => setBrushSize(parseInt(e.target.value))} 
                  style={{ width: "100%", accentColor: "#d4a574" }}
                />
              </div>

              <div style={{ background: "rgba(212,165,116,0.03)", padding: "10px", borderRadius: "8px", border: "1px solid rgba(212,165,116,0.08)" }}>
                <p style={{ fontSize: "10.5px", color: "rgba(245,240,232,0.4)", lineHeight: "1.4", margin: 0 }}>
                  💡 <strong>How to use:</strong> Select "Draw Refine Mask" and click/drag on the central photo view to erase excess background blocks or paint back details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Translucent Toast Notification */}
      {toastMessage && (
        <div style={{ position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", background: "rgba(10,8,7,0.9)", border: "1px solid #d4a574", padding: "10px 24px", borderRadius: "30px", color: "#fff", zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", fontSize: "12px", fontFamily: "Poppins, sans-serif", fontWeight: 500 }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
