import { useState, useEffect, useRef } from "react";

// Import generated preview images
import videoPrev  from "../assets/images/video_preview.png";
import aiPrev     from "../assets/images/ai_preview.png";
import pptPrev    from "../assets/images/ppt_preview.png";
import socialPrev from "../assets/images/social_preview.png";
import imagePrev  from "../assets/images/image_preview.png";

export default function HomePage({ onNavigate, user, onSignOut, theme = "light" }) {
  const [hoveredCard, setHoveredCard]         = useState(null);
  const [mousePosition, setMousePosition]     = useState({ x: 0, y: 0 });
  const [cursorHovered, setCursorHovered]     = useState(false);
  const [revealedSections, setRevealedSections] = useState(new Set());
  const [animatedStats, setAnimatedStats]     = useState(new Set());
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const canvasRef  = useRef(null);
  const profileDropdownRef = useRef(null);

  const isDark = theme === "dark";

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileDropdown(false);
      }
    };
    if (showProfileDropdown) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [showProfileDropdown]);

  // Interactive state for card micro-animations
  const [timelinePlayhead, setTimelinePlayhead] = useState(15);
  const [aiPromptText, setAiPromptText]         = useState("");
  const [promptIdx, setPromptIdx]               = useState(0);
  const [logoAngle, setLogoAngle]               = useState(0);
  const [activeSlide, setActiveSlide]           = useState(0);
  const [imageSliderPos, setImageSliderPos]     = useState(50);

  // Sandbox Playground State
  const [sandboxContrast, setSandboxContrast] = useState(100);
  const [sandboxSaturation, setSandboxSaturation] = useState(100);
  const [sandboxLut, setSandboxLut] = useState("reset");
  const [sandboxRatio, setSandboxRatio] = useState("16/9");
  const [sandboxText, setSandboxText] = useState("Your Cinematic Vision");

  // Interactive Gallery State
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  const prompts = [
    "cinematic retro synthwave skyline, 3d render...",
    "elegant minimalist swan logo, vector...",
    "modern dark-mode presentation layout slide...",
    "premium neon-glow color-grading LUT template...",
  ];

  useEffect(() => {
    if (hoveredCard !== "video") return;
    const t = setInterval(() => setTimelinePlayhead(p => p >= 95 ? 5 : p + 1.2), 25);
    return () => clearInterval(t);
  }, [hoveredCard]);

  useEffect(() => {
    if (hoveredCard !== "ai") { setAiPromptText(""); return; }
    const full = prompts[promptIdx]; let i = 0; setAiPromptText("");
    const t = setInterval(() => {
      if (i < full.length) { setAiPromptText(full.substring(0, i + 1)); i++; }
      else { clearInterval(t); setTimeout(() => setPromptIdx(p => (p + 1) % prompts.length), 1500); }
    }, 40);
    return () => clearInterval(t);
  }, [hoveredCard, promptIdx]);

  useEffect(() => {
    if (hoveredCard !== "logo") { setLogoAngle(0); return; }
    const t = setInterval(() => setLogoAngle(p => (p + 1) % 360), 16);
    return () => clearInterval(t);
  }, [hoveredCard]);

  useEffect(() => {
    if (hoveredCard !== "ppt") return;
    const t = setInterval(() => setActiveSlide(p => (p + 1) % 3), 1500);
    return () => clearInterval(t);
  }, [hoveredCard]);

  useEffect(() => {
    if (hoveredCard !== "image") { setImageSliderPos(50); return; }
    let dir = 1;
    const t = setInterval(() => setImageSliderPos(p => { if (p >= 85) dir = -1; if (p <= 15) dir = 1; return p + dir * 1.5; }), 30);
    return () => clearInterval(t);
  }, [hoveredCard]);

  useEffect(() => {
    const h = e => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  // Scroll-reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setRevealedSections(s => new Set([...s, e.target.id])); }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Stats counter
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animatedStats.has("stats")) {
          setAnimatedStats(s => new Set([...s, "stats"]));
          const nums = entry.target.querySelectorAll(".stat-num");
          [[12000000,"+"],[3800000,""],[500000,"+"],[180,"+"]].forEach(([t,s],i) => animateCount(nums[i],t,s));
        }
      });
    }, { threshold: 0.3 });
    const el = document.querySelector(".stats-inner");
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, [animatedStats]);

  const animateCount = (el, target, suffix) => {
    if (!el) return;
    const dur = 1800, start = performance.now();
    const isM = target >= 1e6, isK = target >= 1000 && !isM;
    const disp = isM ? target / 1e6 : isK ? target / 1000 : target;
    const step = ts => {
      const p = Math.min((ts - start) / dur, 1), ease = 1 - Math.pow(1 - p, 3);
      el.textContent = (disp * ease).toFixed(1) + (isM ? "M" : isK ? "K" : "") + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = disp.toFixed(1) + (isM ? "M" : isK ? "K" : "") + suffix;
    };
    requestAnimationFrame(step);
  };

  // Three.js background (Plexus Particle Network)
  useEffect(() => {
    if (!canvasRef.current) return;
    let cleanup;
    (async () => {
      try {
        const THREE = (await import("three")).default;
        const canvas   = canvasRef.current;
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 0);

        const scene  = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 0, 15);

        // 120 particles
        const particleCount = 120;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
          const x = (Math.random() - 0.5) * 35;
          const y = (Math.random() - 0.5) * 20;
          const z = (Math.random() - 0.5) * 15;
          positions[i * 3] = x;
          positions[i * 3 + 1] = y;
          positions[i * 3 + 2] = z;
          
          velocities.push({
            x: (Math.random() - 0.5) * 0.015,
            y: (Math.random() - 0.5) * 0.015,
            z: (Math.random() - 0.5) * 0.01
          });
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Create canvas-based particle texture for soft glowing circles
        const pCanvas = document.createElement('canvas');
        pCanvas.width = 16;
        pCanvas.height = 16;
        const ctx = pCanvas.getContext('2d');
        const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8);
        grad.addColorStop(0, 'rgba(212, 165, 116, 1)');
        grad.addColorStop(1, 'rgba(212, 165, 116, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 16, 16);
        const pTexture = new THREE.CanvasTexture(pCanvas);

        const particleMaterial = new THREE.PointsMaterial({
          size: 0.28,
          map: pTexture,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        scene.add(particles);

        // Dynamic Line Segments
        const maxLines = 400;
        const linePositions = new Float32Array(maxLines * 6);
        const lineColors = new Float32Array(maxLines * 6);
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
        
        const lineMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          opacity: 0.35
        });
        
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
        scene.add(lines);

        let mx = 0, my = 0, targetMx = 0, targetMy = 0;
        const mm = e => {
          targetMx = (e.clientX / window.innerWidth - 0.5) * 2;
          targetMy = (e.clientY / window.innerHeight - 0.5) * 2;
        };
        window.addEventListener("mousemove", mm);

        let animationFrameId;
        const animate = () => {
          animationFrameId = requestAnimationFrame(animate);
          
          mx += (targetMx - mx) * 0.08;
          my += (targetMy - my) * 0.08;

          const posAttr = particleGeometry.attributes.position;
          let lineIndex = 0;

          // Mouse coordinate projected coordinates
          const mouse3D = new THREE.Vector3(mx * 16, -my * 10, 0);

          for (let i = 0; i < particleCount; i++) {
            let px = posAttr.getX(i);
            let py = posAttr.getY(i);
            let pz = posAttr.getZ(i);

            px += velocities[i].x;
            py += velocities[i].y;
            pz += velocities[i].z;

            const boxX = 22, boxY = 13, boxZ = 10;
            if (px > boxX || px < -boxX) velocities[i].x *= -1;
            if (py > boxY || py < -boxY) velocities[i].y *= -1;
            if (pz > boxZ || pz < -boxZ) velocities[i].z *= -1;

            const dx = px - mouse3D.x;
            const dy = py - mouse3D.y;
            const dz = pz - mouse3D.z;
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dist < 5) {
              const force = (5 - dist) * 0.02;
              px += (dx / dist) * force;
              py += (dy / dist) * force;
              pz += (dz / dist) * force;
            }

            posAttr.setXYZ(i, px, py, pz);
          }
          posAttr.needsUpdate = true;

          const lp = lineGeometry.attributes.position.array;
          const lc = lineGeometry.attributes.color.array;
          
          for (let i = 0; i < particleCount; i++) {
            const ix = posAttr.getX(i);
            const iy = posAttr.getY(i);
            const iz = posAttr.getZ(i);

            for (let j = i + 1; j < particleCount; j++) {
              if (lineIndex >= maxLines) break;

              const jx = posAttr.getX(j);
              const jy = posAttr.getY(j);
              const jz = posAttr.getZ(j);

              const dx = ix - jx;
              const dy = iy - jy;
              const dz = iz - jz;
              const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

              if (dist < 6) {
                const alpha = (6 - dist) / 6;
                
                lp[lineIndex * 6] = ix;
                lp[lineIndex * 6 + 1] = iy;
                lp[lineIndex * 6 + 2] = iz;
                lp[lineIndex * 6 + 3] = jx;
                lp[lineIndex * 6 + 4] = jy;
                lp[lineIndex * 6 + 5] = jz;

                lc[lineIndex * 6] = 212/255 * alpha;
                lc[lineIndex * 6 + 1] = 165/255 * alpha;
                lc[lineIndex * 6 + 2] = 116/255 * alpha;

                lc[lineIndex * 6 + 3] = 139/255 * alpha;
                lc[lineIndex * 6 + 4] = 90/255 * alpha;
                lc[lineIndex * 6 + 5] = 43/255 * alpha;

                lineIndex++;
              }
            }
          }

          for (let i = lineIndex; i < maxLines; i++) {
            lp[i * 6] = 0; lp[i * 6 + 1] = 0; lp[i * 6 + 2] = 0;
            lp[i * 6 + 3] = 0; lp[i * 6 + 4] = 0; lp[i * 6 + 5] = 0;
          }
          lineGeometry.attributes.position.needsUpdate = true;
          lineGeometry.attributes.color.needsUpdate = true;

          camera.position.x += (mx * 4 - camera.position.x) * 0.05;
          camera.position.y += (-my * 3 - camera.position.y) * 0.05;
          camera.lookAt(0, 0, 0);

          renderer.render(scene, camera);
        };
        animate();

        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);
        
        cleanup = () => {
          window.removeEventListener("mousemove", mm);
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animationFrameId);
          renderer.dispose();
        };
      } catch(e) { console.log("Three.js error:", e); }
    })();
    return () => cleanup && cleanup();
  }, []);

  // ── Tool definitions (ordered for Bento layout) ──────────────────────────
  // Grid: 4 columns. Video=2×2, Image=1×1, Logo=1×1, PPT=2×1, Social=1×2, AI=2×2, Doc=1×1, Print=1×1
  const tools = [
    { id:"video",  name:"Video Editor",    desc:"Full multi-track timeline with WebGL color grading, audio mixing & in-browser rendering. No uploads needed.", icon:"🎬", color:"#8b5a2b",  tag:"WebGL · WASM",       colSpan:2, rowSpan:2, image: videoPrev  },
    { id:"image",  name:"Image Editor",    desc:"Layers, masks, filters, blend modes. Pro-grade photo editing in your browser.",                               icon:"🖼️", color:"#d4a574",  tag:"Canvas API",          colSpan:1, rowSpan:1, image: imagePrev  },
    { id:"logo",   name:"Logo Maker",      desc:"Vector-based logo studio. AI suggestions, custom icons, SVG export.",                                         icon:"✦",  color:"#f5c842",  tag:"SVG · AI-assisted",   colSpan:1, rowSpan:1, image: null       },
    { id:"ppt",    name:"Presentations",   desc:"Slides that animate. Real-time collaboration, 500+ templates, one-click export.",                             icon:"📊", color:"#a0522d",  tag:"PPTX · PDF · HTML5",  colSpan:2, rowSpan:1, image: pptPrev    },
    { id:"social", name:"Social Studio",   desc:"All platform sizes at once. Schedule and auto-publish when you're done.",                                     icon:"📱", color:"#c49a6c",  tag:"Stories · Reels",     colSpan:1, rowSpan:2, image: socialPrev },
    { id:"ai",     name:"AI Magic",        desc:"Describe it, watch it appear. Text-to-design, background removal, smart resize.",                             icon:"⚡", color:"#22d3a8",  tag:"Generative AI",       colSpan:2, rowSpan:2, image: aiPrev,    special: true },
    { id:"doc",    name:"Documents",       desc:"Rich docs with embedded media, tables, charts. Beautiful by default.",                                        icon:"📄", color:"#deb887",  tag:"DOCX · PDF",          colSpan:1, rowSpan:1, image: null       },
    { id:"print",  name:"Print Design",    desc:"Flyers, posters, business cards. CMYK-ready, bleed lines included.",                                          icon:"🖨️", color:"#8b5a2b",  tag:"Print-ready PDF",     colSpan:1, rowSpan:1, image: null       },
  ];

  const pricing = [
    { name:"Free",  price:0,  period:"forever free",              popular:false, features:["5 active projects","Basic templates","2GB storage","Export PNG & PDF","Community support"] },
    { name:"Pro",   price:16, period:"per month, billed annually", popular:true,  features:["Unlimited projects","500K+ premium templates","100GB storage","All export formats","AI design tools","Brand kit","Priority support"] },
    { name:"Team",  price:42, period:"per month, up to 5 seats",  popular:false, features:["Everything in Pro","Real-time collaboration","Shared brand assets","Admin controls","1TB storage","Dedicated support"] },
  ];

  // ── Gradient fallbacks for cards without images ──────────────────────────
  const cardGradients = {
    logo:  "linear-gradient(135deg, #1a1608 0%, #3d2e07 40%, #f5c84220 100%)",
    doc:   "linear-gradient(135deg, #0f1a14 0%, #1b3325 50%, #deb88720 100%)",
    print: "linear-gradient(135deg, #1a0f0f 0%, #3d1a1a 50%, #8b5a2b30 100%)",
  };

  const colors = {
    bg: isDark ? "#0c0a09" : "#faf8f5",
    text: isDark ? "#f5f0e8" : "#2d2d2d",
    textMuted: isDark ? "#a8a29e" : "#666",
    navBg: isDark ? "rgba(12, 10, 9, 0.94)" : "rgba(250, 248, 245, 0.94)",
    border: isDark ? "rgba(212, 165, 116, 0.22)" : "rgba(139, 90, 43, 0.1)",
    btnBg: isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139, 90, 43, 0.1)",
    btnBorder: isDark ? "rgba(212, 165, 116, 0.25)" : "rgba(139, 90, 43, 0.2)",
    marqueeBg: isDark ? "#171514" : "#f5f0e8",
    logoGlow: isDark ? "rgba(212, 165, 116, 0.2)" : "rgba(139, 90, 43, 0.35)",
    cardBorder: isDark ? "rgba(212, 165, 116, 0.22)" : "rgba(139, 90, 43, 0.15)",
    cardShadow: isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(139, 90, 43, 0.08)",
  };

  return (
    <div style={{ margin:0, padding:0, width:"100%", background:colors.bg, color:colors.text, fontFamily:"'Instrument Sans',sans-serif", overflowX:"hidden", transition:"background 0.3s, color 0.3s" }}>

      {/* Custom cursor */}
      <div style={{ position:"fixed", width:cursorHovered?"20px":"12px", height:cursorHovered?"20px":"12px", background:"#8b5a2b", borderRadius:"50%", pointerEvents:"none", zIndex:9999, transform:"translate(-50%,-50%)", transition:"width 0.3s,height 0.3s", left:mousePosition.x, top:mousePosition.y, mixBlendMode: isDark ? "screen" : "multiply" }} />
      <div style={{ position:"fixed", width:cursorHovered?"60px":"40px", height:cursorHovered?"60px":"40px", border: isDark ? "1px solid rgba(212,165,116,0.5)" : "1px solid rgba(139,90,43,0.5)", borderRadius:"50%", pointerEvents:"none", zIndex:9998, transform:"translate(-50%,-50%)", transition:"width 0.3s,height 0.3s", left:mousePosition.x, top:mousePosition.y }} />

      {/* ── Premium Nav ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, width:"100%", zIndex:100, padding:"0 48px", height:"68px", display:"flex", alignItems:"center", backdropFilter:"blur(24px) saturate(180%)", background:colors.navBg, borderBottom:`1px solid ${colors.border}`, boxShadow: isDark ? "0 1px 32px rgba(0,0,0,0.2)" : "0 1px 32px rgba(139,90,43,0.05)", transition:"all 0.3s" }}>

        {/* Logo mark + wordmark */}
        <div style={{ display:"flex", alignItems:"center", gap:"10px", cursor:"pointer", flexShrink:0 }} onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>
          {/* Icon mark */}
          <div style={{ width:"32px", height:"32px", borderRadius:"9px", background:"linear-gradient(135deg,#8b5a2b,#d4a574)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:`0 2px 10px ${colors.logoGlow}` }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8 L8 2 L13 8 L8 14 Z" fill="white" opacity="0.9"/>
              <circle cx="8" cy="8" r="2" fill="white"/>
            </svg>
          </div>
          {/* Wordmark */}
          <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:"20px", letterSpacing:"-0.04em", color:colors.text }}>
            Creat<span style={{ color:"#8b5a2b" }}>ify</span>
          </div>
        </div>

        {/* Nav links with animated underline */}
        <div style={{ display:"flex", marginLeft:"40px", flex:1, gap:"2px", alignItems:"center" }}>
          <button onClick={() => onNavigate("editor")} style={{ background:"none", border:"none", color:colors.textMuted, fontSize:"13.5px", fontFamily:"'Poppins',sans-serif", fontWeight:400, padding:"6px 14px", borderRadius:"8px", cursor:"pointer", transition:"all 0.2s", outline:"none" }}
            onMouseEnter={e => { e.currentTarget.style.color=colors.text; e.currentTarget.style.background= isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139,90,43,0.06)"; setCursorHovered(true); }}
            onMouseLeave={e => { e.currentTarget.style.color=colors.textMuted; e.currentTarget.style.background="transparent"; setCursorHovered(false); }}
          >Video Editor</button>
          
          <button onClick={() => onNavigate("presentation")} style={{ background:"none", border:"none", color:colors.textMuted, fontSize:"13.5px", fontFamily:"'Poppins',sans-serif", fontWeight:400, padding:"6px 14px", borderRadius:"8px", cursor:"pointer", transition:"all 0.2s", outline:"none" }}
            onMouseEnter={e => { e.currentTarget.style.color=colors.text; e.currentTarget.style.background= isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139,90,43,0.06)"; setCursorHovered(true); }}
            onMouseLeave={e => { e.currentTarget.style.color=colors.textMuted; e.currentTarget.style.background="transparent"; setCursorHovered(false); }}
          >Presentation Maker</button>
          
          {["Templates","Pricing","Features","Enterprise"].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color:colors.textMuted, fontSize:"13.5px", fontWeight:400, textDecoration:"none", padding:"6px 14px", borderRadius:"8px", transition:"all 0.2s", position:"relative", letterSpacing:"-0.01em" }}
              onMouseEnter={e => { e.currentTarget.style.color=colors.text; e.currentTarget.style.background= isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139,90,43,0.06)"; setCursorHovered(true); }}
              onMouseLeave={e => { e.currentTarget.style.color=colors.textMuted; e.currentTarget.style.background="transparent"; setCursorHovered(false); }}
            >{item}</a>
          ))}
        </div>

        {/* Right side CTAs */}
        <div style={{ display:"flex", gap:"10px", alignItems:"center", flexShrink:0 }}>
          {user ? (
            <button
              onClick={() => onNavigate("profile")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                background: isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139,90,43,0.06)",
                border: isDark ? "1px solid rgba(212, 165, 116, 0.25)" : "1px solid rgba(139,90,43,0.15)",
                padding: "5px 14px 5px 6px",
                borderRadius: "40px",
                cursor: "pointer",
                transition: "all 0.3s",
                outline: "none"
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = isDark ? "rgba(212, 165, 116, 0.22)" : "rgba(139,90,43,0.1)";
                setCursorHovered(true);
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = isDark ? "rgba(212, 165, 116, 0.12)" : "rgba(139,90,43,0.06)";
                setCursorHovered(false);
              }}
            >
              {/* Avatar */}
              <div style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: user.avatar && user.avatar.length > 2 ? "transparent" : "linear-gradient(135deg, #8b5a2b, #d4a574)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
                boxShadow: "0 2px 8px rgba(139,90,43,0.2)",
                overflow: "hidden"
              }}>
                {user.avatar && user.avatar.length > 2 ? (
                  <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : user.avatar ? (
                  user.avatar.toUpperCase()
                ) : (
                  user.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : user.email[0].toUpperCase()
                )}
              </div>

              <span style={{ fontSize: "13px", fontWeight: 500, color: colors.text, maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.name || "Creator"}
              </span>
            </button>
          ) : (
            <>
              <button
                style={{ background:"none", border:`1px solid ${colors.btnBorder}`, color:colors.textMuted, padding:"8px 20px", borderRadius:"40px", fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:300, cursor:"pointer", transition:"all 0.2s", letterSpacing:"-0.01em" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="#8b5a2b"; e.currentTarget.style.color="#8b5a2b"; setCursorHovered(true); }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=colors.btnBorder; e.currentTarget.style.color=colors.textMuted; setCursorHovered(false); }}
                onClick={() => onNavigate("auth","signin")}>Sign in</button>
              <button
                style={{ background:"linear-gradient(135deg,#8b5a2b,#a0522d)", border:"none", color:"#fff", padding:"9px 22px", borderRadius:"40px", fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer", transition:"all 0.2s", letterSpacing:"-0.01em", boxShadow:"0 2px 12px rgba(139,90,43,0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(139,90,43,0.4)"; setCursorHovered(true); }}
                onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 2px 12px rgba(139,90,43,0.3)"; setCursorHovered(false); }}
                onClick={() => onNavigate("auth","signup")}>Start for free</button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position:"relative", height:"100vh", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
        <canvas ref={canvasRef} style={{ position:"absolute", inset:0, zIndex:0 }} />
        <div style={{ position:"absolute", width:"600px", height:"600px", borderRadius:"50%", filter:"blur(80px)", background:"rgba(139,90,43,0.08)", top:"-200px", right:"-100px", pointerEvents:"none", zIndex:0 }} />
        <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", filter:"blur(80px)", background:"rgba(212,165,116,0.07)", bottom:"-100px", left:"-150px", pointerEvents:"none", zIndex:0 }} />

        <div style={{ position:"relative", zIndex:2, textAlign:"center", maxWidth:"900px", padding:"0 24px" }}>
          {/* Spacer to make up for removed badge layout height */}
          <div style={{ height: "40px" }} />
          <h1 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(52px,8vw,96px)", fontWeight:800, lineHeight:0.95, letterSpacing:"-0.04em", marginBottom:"24px", animation:"fadeUp 0.8s 0.4s both" }}>
            <span style={{ display:"block", color:colors.text }}>Design Without</span>
            <span style={{ display:"block", fontStyle:"italic", fontFamily:"Instrument Serif,serif", background:"linear-gradient(135deg,#8b5a2b,#d4a574,#c49a6c)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>Limits.</span>
          </h1>
          <p style={{ fontSize:"18px", color:colors.textMuted, maxWidth:"520px", margin:"0 auto 40px", lineHeight:1.6, fontWeight:300, animation:"fadeUp 0.8s 0.6s both" }}>
            Videos, logos, presentations, social posts — all in one powerful browser-based studio. No installs, no friction.
          </p>
          <div style={{ display:"flex", gap:"12px", justifyContent:"center", animation:"fadeUp 0.8s 0.8s both" }}>
            <button style={{ background:"#8b5a2b", color:"#fff", border:"none", padding:"16px 36px", borderRadius:"50px", fontSize:"16px", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer", transition:"all 0.25s" }}
              onMouseEnter={e => { e.currentTarget.style.background="#704822"; e.currentTarget.style.transform="translateY(-2px)"; setCursorHovered(true); }}
              onMouseLeave={e => { e.currentTarget.style.background="#8b5a2b"; e.currentTarget.style.transform="none"; setCursorHovered(false); }}
              onClick={() => onNavigate("auth","signup")}>Start designing free</button>
            <button style={{ background: isDark ? "rgba(212,165,116,0.12)" : "rgba(139,90,43,0.1)", color:colors.text, border: isDark ? "1px solid rgba(212,165,116,0.25)" : "1px solid rgba(139,90,43,0.2)", padding:"16px 32px", borderRadius:"50px", fontSize:"16px", fontFamily:"'Poppins',sans-serif", fontWeight:300, cursor:"pointer", transition:"all 0.25s", backdropFilter:"blur(8px)" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(139,90,43,0.15)"; setCursorHovered(true); }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(139,90,43,0.1)"; setCursorHovered(false); }}
              onClick={() => onNavigate("auth","signup")}>Watch a demo</button>
          </div>
        </div>
        <div style={{ position:"absolute", bottom:"40px", left:"50%", transform:"translateX(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"8px", color:"#999", fontSize:"11px", letterSpacing:"0.1em", animation:"fadeIn 1s 1.5s both" }}>
          <div style={{ width:"1px", height:"40px", background:"linear-gradient(#999,transparent)", animation:"scrollAnim 2s infinite" }} />
          <span>SCROLL</span>
        </div>
      </section>

      {/* Marquee */}
      <div style={{ padding:"28px 0", borderTop:`1px solid ${colors.border}`, borderBottom:`1px solid ${colors.border}`, overflow:"hidden", background:colors.marqueeBg, transition:"background 0.3s, border-color 0.3s" }}>
        <div style={{ display:"flex", whiteSpace:"nowrap", animation:"marquee 25s linear infinite" }}>
          {[...Array(2)].flatMap(() => ["Video Editor","Logo Maker","Presentations","Social Media","Brand Kit","AI Generate","Print Design","Documents","Mockups","Infographics"].map((item,i) => (
            <span key={item+i} style={{ display:"inline-flex", alignItems:"center", gap:"12px", padding:"0 40px", fontSize:"12px", color:colors.textMuted, letterSpacing:"0.06em", textTransform:"uppercase", fontWeight:500 }}>
              <span style={{ width:"4px", height:"4px", background:"#8b5a2b", borderRadius:"50%", flexShrink:0 }} />{item}
            </span>
          )))}
        </div>
      </div>

      {/* ── INTERACTIVE DESIGN SANDBOX PLAYGROUND ── */}
      <section className="reveal" id="sandbox-section" style={{
        padding: "100px 48px",
        maxWidth: "1400px",
        margin: "0 auto",
        opacity: revealedSections.has("sandbox-section") ? 1 : 0,
        transform: revealedSections.has("sandbox-section") ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s, transform 0.7s"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "56px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#8b5a2b", textTransform: "uppercase", marginBottom: "14px", fontWeight: 500 }}>Live Testing</div>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: colors.text }}>Creative Sandbox.</h2>
          </div>
          <p style={{ fontSize: "16px", color: colors.textMuted, maxWidth: "440px", lineHeight: 1.65, fontWeight: 300 }}>
            Don't take our word for it. Test our core real-time color grading, overlay engines, and aspect scaling features directly inside this mock studio.
          </p>
        </div>

        {/* Sandbox Editor Layout */}
        <div style={{
          display: "flex",
          gap: "40px",
          alignItems: "stretch",
          background: isDark ? "rgba(12, 10, 9, 0.7)" : "rgba(250, 248, 245, 0.7)",
          border: `1px solid ${colors.border}`,
          borderRadius: "32px",
          padding: "40px",
          backdropFilter: "blur(24px)",
          boxShadow: colors.cardShadow,
          flexDirection: "row",
          flexWrap: "wrap"
        }}>
          {/* Left Side: Mock Editor Viewport */}
          <div style={{
            flex: "1 1 500px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0c0a09",
            borderRadius: "20px",
            padding: "24px",
            border: "1px solid rgba(212, 165, 116, 0.12)",
            minHeight: "450px",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Editor Top Bar Mockup */}
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "36px",
              background: "#131110",
              borderBottom: "1px solid rgba(212, 165, 116, 0.08)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              justifyContent: "space-between",
              zIndex: 10
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f5c842" }} />
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#22d3a8" }} />
              </div>
              <span style={{ fontSize: "9px", color: "#8c8780", fontWeight: 600, letterSpacing: "0.06em" }}>MONITOR_CINE_01.MP4</span>
              <div style={{ width: "24px" }} />
            </div>

            {/* Sizable Canvas Container */}
            <div style={{
              position: "relative",
              background: "#131110",
              borderRadius: "12px",
              overflow: "hidden",
              border: "1px solid rgba(212, 165, 116, 0.15)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
              aspectRatio: sandboxRatio,
              width: sandboxRatio === "16/9" ? "100%" : sandboxRatio === "9/16" ? "250px" : "360px",
              maxHeight: "360px"
            }}>
              {/* Sample Background Video Image */}
              <img src={videoPrev} alt="Mock clip" style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: `
                  contrast(${sandboxContrast}%)
                  saturate(${sandboxSaturation}%)
                  ${sandboxLut === "vintage" ? "sepia(0.45) saturate(1.4) hue-rotate(-10deg)" : ""}
                  ${sandboxLut === "cyber" ? "hue-rotate(90deg) saturate(1.8) contrast(1.2)" : ""}
                  ${sandboxLut === "noir" ? "grayscale(1) contrast(1.5) brightness(0.9)" : ""}
                  ${sandboxLut === "dreamy" ? "brightness(1.1) saturate(1.3) sepia(0.12)" : ""}
                `,
                transition: "filter 0.3s ease"
              }} />

              {/* Dynamic Overlay Text */}
              {sandboxText && (
                <div style={{
                  position: "absolute",
                  bottom: "16%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "rgba(12, 10, 9, 0.88)",
                  border: "1px solid #d4a574",
                  color: "#fff",
                  padding: sandboxRatio === "9/16" ? "6px 10px" : "8px 18px",
                  borderRadius: "8px",
                  fontSize: sandboxRatio === "9/16" ? "10px" : "14px",
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  boxShadow: "0 4px 20px rgba(139, 90, 43, 0.25)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  maxWidth: "90%",
                  overflow: "hidden",
                  textOverflow: "ellipsis"
                }}>
                  {sandboxText}
                </div>
              )}

              {/* Monitor overlays */}
              <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", borderRadius: "4px", padding: "2px 6px", fontSize: "8px", color: "#fff", fontFamily: "monospace" }}>
                {sandboxRatio === "16/9" ? "3840×2160 (16:9)" : sandboxRatio === "9/16" ? "2160×3840 (9:16)" : "2160×2160 (1:1)"}
              </div>
            </div>

            {/* Simulated Timeline Track at bottom */}
            <div style={{
              width: "100%",
              marginTop: "20px",
              background: "#131110",
              border: "1px solid rgba(212, 165, 116, 0.08)",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              <div style={{ color: "#d4a574", fontSize: "11px", fontWeight: 700 }}>▶</div>
              <div style={{ flex: 1, position: "relative", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px" }}>
                <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, right: 0, background: "rgba(212,165,116,0.15)", borderRadius: "2px" }} />
                <div style={{ position: "absolute", left: "45%", top: "-4px", width: "12px", height: "12px", background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 6px rgba(239,68,68,0.5)" }} />
              </div>
              <div style={{ fontSize: "9px", color: "#8c8780", fontFamily: "monospace" }}>00:04:12</div>
            </div>
          </div>

          {/* Right Side: Editor Controls Panel */}
          <div style={{
            flex: "1 1 380px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            justifyContent: "center"
          }}>
            {/* Aspect Ratio Selector */}
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 600, marginBottom: "12px", textTransform: "uppercase" }}>Aspect Ratio</div>
              <div style={{ display: "flex", gap: "10px" }}>
                {[
                  { ratio: "16/9", label: "Landscape (16:9)", icon: "📺" },
                  { ratio: "9/16", label: "Portrait (9:16)", icon: "📱" },
                  { ratio: "1/1", label: "Square (1:1)", icon: "🔳" }
                ].map(r => (
                  <button
                    key={r.ratio}
                    onClick={() => { setSandboxRatio(r.ratio); setCursorHovered(true); }}
                    style={{
                      flex: 1,
                      padding: "12px 6px",
                      borderRadius: "12px",
                      background: sandboxRatio === r.ratio ? "linear-gradient(135deg,#8b5a2b,#a0522d)" : "rgba(139,90,43,0.06)",
                      border: sandboxRatio === r.ratio ? "1px solid transparent" : `1px solid ${colors.border}`,
                      color: sandboxRatio === r.ratio ? "#fff" : colors.text,
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 600,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.25s",
                      outline: "none"
                    }}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                  >
                    <span style={{ fontSize: "16px" }}>{r.icon}</span>
                    {r.label.split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Color LUT Presets */}
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 600, marginBottom: "12px", textTransform: "uppercase" }}>Cinematic Color Preset (LUT)</div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {[
                  { id: "reset", name: "Standard ↺" },
                  { id: "vintage", name: "Vintage Gold 🍂" },
                  { id: "cyber", name: "Cyber Mint 🧪" },
                  { id: "noir", name: "Classic Noir 🎬" },
                  { id: "dreamy", name: "Dreamy Sun ☀️" }
                ].map(lut => (
                  <button
                    key={lut.id}
                    onClick={() => { setSandboxLut(lut.id); setCursorHovered(true); }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: sandboxLut === lut.id ? "rgba(212,165,116,0.18)" : "none",
                      border: sandboxLut === lut.id ? "1px solid #d4a574" : `1px solid ${colors.border}`,
                      color: sandboxLut === lut.id ? "#d4a574" : colors.textMuted,
                      cursor: "pointer",
                      fontSize: "11px",
                      fontWeight: 500,
                      transition: "all 0.2s",
                      outline: "none"
                    }}
                    onMouseEnter={() => setCursorHovered(true)}
                    onMouseLeave={() => setCursorHovered(false)}
                  >
                    {lut.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Sliders */}
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 600, marginBottom: "16px", textTransform: "uppercase" }}>Fine-Tuning Filters</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", color: colors.textMuted }}>
                    <span>Contrast</span>
                    <span style={{ fontWeight: 600, color: colors.text }}>{sandboxContrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="200"
                    value={sandboxContrast}
                    onChange={e => setSandboxContrast(parseInt(e.target.value))}
                    style={{ width: "100%", height: "4px", borderRadius: "2px", accentColor: "#d4a574", cursor: "pointer" }}
                  />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "12px", color: colors.textMuted }}>
                    <span>Saturation</span>
                    <span style={{ fontWeight: 600, color: colors.text }}>{sandboxSaturation}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={sandboxSaturation}
                    onChange={e => setSandboxSaturation(parseInt(e.target.value))}
                    style={{ width: "100%", height: "4px", borderRadius: "2px", accentColor: "#d4a574", cursor: "pointer" }}
                  />
                </div>
              </div>
            </div>

            {/* Custom Overlay Text */}
            <div>
              <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "#d4a574", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>Text Overlay Title</div>
              <input
                type="text"
                value={sandboxText}
                onChange={e => setSandboxText(e.target.value)}
                maxLength={24}
                placeholder="Type dynamic watermark..."
                style={{
                  width: "100%",
                  background: isDark ? "#0c0a09" : "#fff",
                  border: `1px solid ${colors.border}`,
                  borderRadius: "10px",
                  color: colors.text,
                  fontSize: "13px",
                  padding: "10px 14px",
                  outline: "none",
                  transition: "border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor = "#d4a574"}
                onBlur={e => e.target.style.borderColor = colors.border}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── BENTO GRID TOOLS SECTION ─────────────────────────────────────── */}
      <div id="tools">
        <div className="reveal" id="tools-section" style={{
          padding:"100px 48px", maxWidth:"1400px", margin:"0 auto",
          opacity: revealedSections.has("tools-section") ? 1 : 0,
          transform: revealedSections.has("tools-section") ? "translateY(0)" : "translateY(40px)",
          transition:"opacity 0.7s, transform 0.7s"
        }}>
          {/* Section header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:"56px", flexWrap:"wrap", gap:"16px" }}>
            <div>
              <div style={{ fontSize:"11px", letterSpacing:"0.14em", color:"#8b5a2b", textTransform:"uppercase", marginBottom:"14px", fontWeight:500 }}>Everything you need</div>
              <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1, color:colors.text }}>One studio.<br/>All formats.</h2>
            </div>
            <p style={{ fontSize:"16px", color:colors.textMuted, maxWidth:"440px", lineHeight:1.65, fontWeight:300 }}>
              From a quick social post to a full brand identity — Creatify handles every format your ideas demand.
            </p>
          </div>

          {/* Bento Grid */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gridTemplateRows:"repeat(4, 200px)", gap:"16px" }}>
            {tools.map(tool => {
              const isHovered = hoveredCard === tool.id;
              return (
                <div
                  key={tool.id}
                  onMouseEnter={() => { setHoveredCard(tool.id); setCursorHovered(true); }}
                  onMouseLeave={() => { setHoveredCard(null); setCursorHovered(false); }}
                  onClick={() => onNavigate(tool.id === "video" ? "editor" : tool.id === "ppt" ? "presentation" : "auth", "signup")}
                  style={{
                    gridColumn: `span ${tool.colSpan}`,
                    gridRow:    `span ${tool.rowSpan}`,
                    position:"relative", borderRadius:"24px", overflow:"hidden",
                    cursor:"pointer", transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)",
                    transform: isHovered ? "translateY(-4px) scale(1.01)" : "none",
                    boxShadow: isHovered ? `0 28px 70px ${tool.color}30` : "0 4px 20px rgba(139,90,43,0.08)",
                    border: `1px solid ${isHovered ? tool.color + "60" : "rgba(139,90,43,0.15)"}`,
                  }}
                >
                  {/* Background: image or gradient */}
                  {tool.image ? (
                    <div style={{ position:"absolute", inset:0 }}>
                      <img src={tool.image} alt={tool.name} style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center top", display:"block" }} />
                      {/* Dark overlay that lightens on hover */}
                      <div style={{ position:"absolute", inset:0, background: isHovered ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.62)", transition:"background 0.4s" }} />
                    </div>
                  ) : (
                    <div style={{ position:"absolute", inset:0, background: cardGradients[tool.id] || `linear-gradient(135deg, #111318, ${tool.color}20)` }}>
                      {/* Subtle pattern for no-image cards */}
                      <div style={{ position:"absolute", inset:0, opacity:0.06, backgroundImage:`radial-gradient(${tool.color} 1px, transparent 1px)`, backgroundSize:"28px 28px" }} />
                    </div>
                  )}

                  {/* Accent glow on hover */}
                  <div style={{ position:"absolute", inset:0, background:`radial-gradient(circle at 30% 20%, ${tool.color}25, transparent 60%)`, opacity: isHovered ? 1 : 0, transition:"opacity 0.4s", pointerEvents:"none" }} />

                  {/* Content */}
                  <div style={{ position:"relative", zIndex:2, padding:"28px", height:"100%", display:"flex", flexDirection:"column", justifyContent:"flex-end" }}>
                    {/* Tag chip */}
                    <div style={{ alignSelf:"flex-start", background:"rgba(255,255,255,0.12)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.18)", borderRadius:"20px", padding:"3px 12px", fontSize:"10px", color:"rgba(255,255,255,0.8)", letterSpacing:"0.04em", marginBottom:"auto", marginTop:"0" }}>
                      {tool.tag}
                    </div>

                    {/* Icon + name + desc */}
                    <div>
                      {/* Interactive micro-animation for logo card (no image) */}
                      {tool.id === "logo" && (
                        <div style={{ marginBottom:"14px" }}>
                          <svg width="44" height="44" viewBox="0 0 100 100" style={{ transform:`rotate(${logoAngle}deg)`, transition:"transform 0.05s linear", display:"block" }}>
                            <circle cx="50" cy="50" r="35" fill="none" stroke="#f5c842" strokeWidth="2.5" strokeDasharray="15,10"/>
                            <polygon points="50,18 78,66 22,66" fill="none" stroke="#f5c842" strokeWidth="3" strokeLinejoin="round"/>
                            <circle cx="50" cy="50" r="8" fill="#f5c842"/>
                          </svg>
                        </div>
                      )}

                      {/* AI typing prompt for ai card */}
                      {tool.id === "ai" && isHovered && (
                        <div style={{ marginBottom:"12px", background:"rgba(0,0,0,0.5)", backdropFilter:"blur(8px)", borderRadius:"10px", padding:"8px 12px", border:"1px solid rgba(34,211,168,0.3)" }}>
                          <span style={{ fontSize:"9px", color:"#22d3a8", fontWeight:700 }}>✦ Generating: </span>
                          <span style={{ fontSize:"9px", color:"#e5e5e5", fontFamily:"monospace" }}>
                            {aiPromptText}<span style={{ animation:"pulse 0.8s infinite", color:"#22d3a8" }}>|</span>
                          </span>
                        </div>
                      )}

                      {/* Doc card decoration */}
                      {tool.id === "doc" && (
                        <div style={{ marginBottom:"14px", display:"flex", flexDirection:"column", gap:"4px" }}>
                          <div style={{ width:"50%", height:"5px", background:tool.color, borderRadius:"2px", opacity:0.9 }} />
                          <div style={{ width:"80%", height:"3px", background:"rgba(255,255,255,0.2)", borderRadius:"2px" }} />
                          <div style={{ width:"70%", height:"3px", background:"rgba(255,255,255,0.15)", borderRadius:"2px" }} />
                        </div>
                      )}

                      {/* Print card decoration */}
                      {tool.id === "print" && (
                        <div style={{ marginBottom:"14px" }}>
                          <div style={{ width:"56px", height:"38px", border:`1.5px dashed ${tool.color}`, borderRadius:"4px", background:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:"7px", color:tool.color, fontWeight:700, letterSpacing:"0.06em" }}>CMYK</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"6px" }}>
                        <span style={{ fontSize:"22px" }}>{tool.icon}</span>
                        <span style={{ fontFamily:"Syne,sans-serif", fontSize: tool.colSpan >= 2 ? "22px" : "16px", fontWeight:800, color:"#fff", letterSpacing:"-0.03em" }}>{tool.name}</span>
                      </div>
                      <p style={{ fontSize:"13px", color:"rgba(255,255,255,0.7)", lineHeight:1.55, fontWeight:300, margin:0, maxWidth: tool.colSpan >= 2 ? "340px" : "none" }}>
                        {tool.desc}
                      </p>

                      {/* CTA arrow */}
                      <div style={{ marginTop:"14px", display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:tool.color, fontFamily:"'Poppins',sans-serif", fontWeight:400, opacity: isHovered ? 1 : 0, transform: isHovered ? "translateX(0)" : "translateX(-8px)", transition:"all 0.3s" }}>
                        <span>Open {tool.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Video playhead overlay */}
                  {tool.id === "video" && isHovered && (
                    <div style={{ position:"absolute", bottom:"100px", left:"28px", right:"28px", zIndex:3 }}>
                      <div style={{ background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", borderRadius:"10px", padding:"10px", border:"1px solid rgba(139,90,43,0.3)" }}>
                        <div style={{ fontSize:"8px", color:"#22d3a8", fontWeight:700, marginBottom:"6px" }}>● LIVE PLAYBACK</div>
                        <div style={{ position:"relative", height:"6px", background:"rgba(255,255,255,0.1)", borderRadius:"3px" }}>
                          <div style={{ position:"absolute", left:0, top:0, bottom:0, width:`${timelinePlayhead}%`, background:`linear-gradient(90deg, #8b5a2b, #d4a574)`, borderRadius:"3px", transition:"width 0.05s" }} />
                          <div style={{ position:"absolute", top:"-3px", width:"12px", height:"12px", borderRadius:"50%", background:"#ef4444", boxShadow:"0 0 8px #ef4444", transition:"left 0.05s", left:`calc(${timelinePlayhead}% - 6px)` }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PPT slides overlay */}
                  {tool.id === "ppt" && isHovered && (
                    <div style={{ position:"absolute", top:"24px", right:"24px", zIndex:3, display:"flex", gap:"6px" }}>
                      {[0,1,2].map(idx => {
                        const off = (idx - activeSlide + 3) % 3;
                        return (
                          <div key={idx} style={{ width:"48px", height:"32px", borderRadius:"4px", background:"rgba(255,255,255,0.15)", backdropFilter:"blur(6px)", border:`1.5px solid rgba(255,255,255,${0.6 - off*0.2})`, opacity: 1 - off*0.3, transform:`translateY(${off*-4}px) scale(${1-off*0.06})`, transition:"all 0.4s" }}>
                            <div style={{ width:"40%", height:"3px", background:"#a0522d", borderRadius:"1px", margin:"5px 4px 3px" }} />
                            <div style={{ display:"flex", gap:"2px", alignItems:"flex-end", padding:"0 4px 4px", height:"12px" }}>
                              {[8,13,6,10].map((h,i) => <div key={i} style={{ flex:1, height:`${h}px`, background:"rgba(160,82,45,0.6)", borderRadius:"1px" }} />)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ background:colors.marqueeBg, borderTop:`1px solid ${colors.border}`, borderBottom:`1px solid ${colors.border}`, padding:"64px 48px", transition:"background 0.3s, border-color 0.3s" }}>
        <div className="stats-inner reveal" id="stats-section" style={{ maxWidth:"1400px", margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"32px", opacity: revealedSections.has("stats-section") ? 1 : 0, transform: revealedSections.has("stats-section") ? "translateY(0)" : "translateY(40px)", transition:"opacity 0.7s, transform 0.7s" }}>
          {[
            { value:"12M+", label:"Designs created daily",    color:"#8b5a2b" },
            { value:"3.8M", label:"Active creators",          color:"#d4a574" },
            { value:"500K+",label:"Templates available",      color:"#22d3a8" },
            { value:"180+", label:"Countries represented",    color:"#c49a6c" },
          ].map((s,i) => (
            <div key={i} style={{ textAlign:"center" }}>
              <div className="stat-num" style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(36px,4vw,56px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:"14px", color:colors.textMuted, marginTop:"6px", fontWeight:300 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features showcase */}
      <section className="reveal" id="features-section" style={{ background:colors.marqueeBg, borderBottom:`1px solid ${colors.border}`, opacity: revealedSections.has("features-section") ? 1 : 0, transform: revealedSections.has("features-section") ? "translateY(0)" : "translateY(40px)", transition:"opacity 0.7s, transform 0.7s, background 0.3s, border-color 0.3s" }}>
        <div style={{ maxWidth:"1400px", margin:"0 auto", padding:"100px 48px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"80px", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"11px", letterSpacing:"0.14em", color:"#8b5a2b", textTransform:"uppercase", marginBottom:"16px", fontWeight:500 }}>The Editor</div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(36px,5vw,60px)", fontWeight:800, letterSpacing:"-0.04em", lineHeight:1, marginBottom:"20px", color:colors.text }}>A canvas<br/>built for<br/><em style={{ fontFamily:"Instrument Serif,serif", color:"#8b5a2b" }}>flow.</em></h2>
            <p style={{ fontSize:"16px", color:colors.textMuted, lineHeight:1.7, margin:"0 0 32px", fontWeight:300 }}>Every tool is one click away. No buried menus. No learning curve. Just your ideas, amplified.</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {[
                { icon:"🎨", title:"Smart layers & artboards",  desc:"Unlimited layers with blend modes and masks",      color:"#8b5a2b" },
                { icon:"⚡", title:"Real-time collaboration",   desc:"Edit with your team simultaneously",               color:"#22d3a8" },
                { icon:"📤", title:"Export anywhere",           desc:"PNG, SVG, MP4, PPTX, PDF — all from browser",     color:"#d4a574" },
              ].map((f,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:"14px", padding:"16px 18px", background: isDark ? "rgba(212,165,116,0.06)" : "rgba(139,90,43,0.05)", border: isDark ? "1px solid rgba(212,165,116,0.15)" : "1px solid rgba(139,90,43,0.1)", borderRadius:"12px" }}>
                  <div style={{ width:"36px", height:"36px", background:`${f.color}20`, borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{f.icon}</div>
                  <div><div style={{ fontSize:"14px", fontWeight:500, marginBottom:"2px", color:colors.text }}>{f.title}</div><div style={{ fontSize:"12px", color:colors.textMuted }}>{f.desc}</div></div>
                </div>
              ))}
            </div>
          </div>
          {/* Visual mockup */}
          <div style={{ position:"relative", aspectRatio:"4/3", borderRadius:"24px", overflow:"hidden", background:"#111318", border:"1px solid rgba(139,90,43,0.15)" }}>
            <div style={{ position:"absolute", inset:0, background:"linear-gradient(135deg, rgba(139,90,43,0.12), rgba(34,211,168,0.06))" }} />
            <div style={{ position:"absolute", width:"52px", top:0, bottom:0, left:0, background:"rgba(255,255,255,0.03)", borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", alignItems:"center", padding:"16px 0", gap:"8px" }}>
              {["↖","✏","▭","○","T"].map((ic,i) => <div key={i} style={{ width:"32px", height:"32px", borderRadius:"8px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", background:i===0?"#8b5a2b":"rgba(255,255,255,0.05)", color:i===0?"#fff":"rgba(255,255,255,0.5)" }}>{ic}</div>)}
            </div>
            <div style={{ position:"absolute", inset:0, left:"52px", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:"28px", fontWeight:800, color:"rgba(255,255,255,0.06)", letterSpacing:"-0.04em" }}>CREATIFY</div>
            </div>
            <div style={{ position:"absolute", width:"120px", height:"80px", top:"20px", left:"80px", borderRadius:"12px", background:"linear-gradient(135deg,rgba(212,165,116,0.3),rgba(196,154,108,0.2))", border:"1px solid rgba(212,165,116,0.3)", animation:"float1 4s ease-in-out infinite" }} />
            <div style={{ position:"absolute", width:"80px", height:"100px", top:"40px", right:"30px", borderRadius:"12px", background:"linear-gradient(135deg,rgba(139,90,43,0.3),rgba(245,200,66,0.2))", border:"1px solid rgba(139,90,43,0.3)", animation:"float2 5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ── HIGH-FIDELITY PRODUCTION PIPELINE ── */}
      <section className="reveal" id="pipeline-section" style={{
        background: colors.bg,
        borderBottom: `1px solid ${colors.border}`,
        opacity: revealedSections.has("pipeline-section") ? 1 : 0,
        transform: revealedSections.has("pipeline-section") ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s, transform 0.7s, background 0.3s, border-color 0.3s"
      }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "100px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#8b5a2b", textTransform: "uppercase", marginBottom: "16px", fontWeight: 500 }}>High-Performance Engine</div>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(36px,5vw,56px)", fontWeight: 800, letterSpacing: "-0.04em", color: colors.text, lineHeight: 1 }}>How it compiles.</h2>
            <p style={{ fontSize: "16px", color: colors.textMuted, maxWidth: "540px", margin: "16px auto 0", lineHeight: 1.6, fontWeight: 300 }}>
              Running natively inside your browser. No remote servers processing your raw footage — everything compiles locally.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "40px", position: "relative" }}>
            {/* Step 1 */}
            <div style={{
              background: isDark ? "rgba(23, 21, 20, 0.4)" : "rgba(139, 90, 43, 0.03)",
              border: `1px solid ${colors.border}`,
              borderRadius: "20px",
              padding: "36px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.3s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "64px", fontStyle: "italic", color: "#d4a574", lineHeight: 1, marginBottom: "20px" }}>01</div>
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 800, marginBottom: "12px", color: colors.text }}>Local Asset Ingestion</h3>
              <p style={{ fontSize: "13.5px", color: colors.textMuted, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                Direct file system access via File System Access API. Video clips, audio tracks, and images load instantly into memory. Zero upload buffering.
              </p>
              {/* Micro decoration: simulated files importing */}
              <div style={{ display: "flex", gap: "8px", marginTop: "24px" }}>
                {["📹 MOV", "🎵 WAV", "🖼️ PNG"].map((ext, idx) => (
                  <div key={idx} style={{ padding: "4px 8px", background: "rgba(212, 165, 116, 0.08)", border: "1px solid rgba(212, 165, 116, 0.2)", borderRadius: "6px", fontSize: "9px", color: "#d4a574", fontWeight: 600 }}>
                    {ext}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div style={{
              background: isDark ? "rgba(23, 21, 20, 0.4)" : "rgba(139, 90, 43, 0.03)",
              border: `1px solid ${colors.border}`,
              borderRadius: "20px",
              padding: "36px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.3s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "64px", fontStyle: "italic", color: "#d4a574", lineHeight: 1, marginBottom: "20px" }}>02</div>
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 800, marginBottom: "12px", color: colors.text }}>GPU Shader Compositing</h3>
              <p style={{ fontSize: "13.5px", color: colors.textMuted, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                WebGL fragment shaders process contrast, exposure, and color grades. High-speed filters, transitions, and overlays calculate frame-by-frame on your GPU at a locked 60fps.
              </p>
              {/* Micro decoration: dynamic grid visual */}
              <div style={{ display: "flex", gap: "3px", marginTop: "28px", height: "16px", alignItems: "flex-end" }}>
                {[6, 12, 8, 14, 10, 16, 11, 7, 13, 9, 15, 8].map((h, idx) => (
                  <div key={idx} style={{ flex: 1, height: `${h}px`, background: "linear-gradient(to top, #8b5a2b, #22d3a8)", borderRadius: "1px" }} />
                ))}
              </div>
            </div>

            {/* Step 3 */}
            <div style={{
              background: isDark ? "rgba(23, 21, 20, 0.4)" : "rgba(139, 90, 43, 0.03)",
              border: `1px solid ${colors.border}`,
              borderRadius: "20px",
              padding: "36px",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.3s"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "none"}
            >
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "64px", fontStyle: "italic", color: "#d4a574", lineHeight: 1, marginBottom: "20px" }}>03</div>
              <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "18px", fontWeight: 800, marginBottom: "12px", color: colors.text }}>Local WebAssembly Render</h3>
              <p style={{ fontSize: "13.5px", color: colors.textMuted, lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
                A multi-threaded WebAssembly build of FFmpeg compiles final tracks directly to an MP4 video bundle. No network charges, no server waiting queues.
              </p>
              {/* Micro decoration: progress indicator */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #22d3a8", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "10px", color: "#22d3a8", fontWeight: 700, letterSpacing: "0.04em" }}>COMPILING MP4 DIRECT...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE TEMPLATES SHOWCASE GALLERY ── */}
      <section className="reveal" id="templates-showcase" style={{
        padding: "100px 48px",
        maxWidth: "1400px",
        margin: "0 auto",
        opacity: revealedSections.has("templates-showcase") ? 1 : 0,
        transform: revealedSections.has("templates-showcase") ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s, transform 0.7s"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "56px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.14em", color: "#8b5a2b", textTransform: "uppercase", marginBottom: "14px", fontWeight: 500 }}>High-end starting points</div>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: colors.text }}>Creative presets.</h2>
          </div>
          <p style={{ fontSize: "16px", color: colors.textMuted, maxWidth: "440px", lineHeight: 1.65, fontWeight: 300 }}>
            Choose from a catalog of premium designs. Launch directly into the studio workspace with pre-configured timelines.
          </p>
        </div>

        {/* Templates Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
          {[
            { id: "cinema", name: "Cinematic Intro", desc: "Warm amber color LUT, cinematic aspect ratio, title fades.", ratio: "16:9", stats: "4K UHD · 24 FPS · 15s", image: videoPrev, color: "#8b5a2b", type: "editor" },
            { id: "pitch", name: "Startup Pitch Deck", desc: "Minimalist slide architecture, charts, dynamic animations.", ratio: "16:9", stats: "10 Slides · Vector · 30 FPS", image: pptPrev, color: "#a0522d", type: "presentation" },
            { id: "reel", name: "Social Glitch Reel", desc: "Glitch transition overlays, text safe zone grids.", ratio: "9:16", stats: "1080p · 60 FPS · 30s", image: socialPrev, color: "#c49a6c", type: "editor" },
            { id: "brand", name: "Branding Kit Studio", desc: "Vector grids, matching fonts, dynamic color guides.", ratio: "1:1", stats: "Vectors · SVG · CMYK", image: imagePrev, color: "#d4a574", type: "auth" }
          ].map(tpl => {
            const isHovered = hoveredTemplate === tpl.id;
            return (
              <div
                key={tpl.id}
                onMouseEnter={() => { setHoveredTemplate(tpl.id); setCursorHovered(true); }}
                onMouseLeave={() => { setHoveredTemplate(null); setCursorHovered(false); }}
                onClick={() => onNavigate(tpl.type, "signup")}
                style={{
                  background: isDark ? "rgba(12, 10, 9, 0.6)" : "rgba(255, 255, 255, 0.6)",
                  border: `1px solid ${isHovered ? tpl.color : colors.border}`,
                  borderRadius: "24px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                  transform: isHovered ? "translateY(-4px)" : "none",
                  boxShadow: isHovered ? `0 20px 40px ${tpl.color}15` : colors.cardShadow,
                  display: "flex",
                  flexDirection: "column",
                  height: "100%"
                }}
              >
                {/* Mockup Preview Area */}
                <div style={{
                  position: "relative",
                  aspectRatio: "16/10",
                  borderRadius: "16px",
                  overflow: "hidden",
                  background: "#131110",
                  marginBottom: "20px"
                }}>
                  <img src={tpl.image} alt={tpl.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: isHovered ? "scale(1.05)" : "none" }} />
                  <div style={{ position: "absolute", inset: 0, background: isHovered ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)", transition: "background 0.35s" }} />
                  {/* Badge */}
                  <div style={{ position: "absolute", top: 12, left: 12, padding: "4px 8px", borderRadius: "20px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)", fontSize: "9px", color: tpl.color, fontWeight: 700, border: `1px solid ${tpl.color}40` }}>
                    {tpl.ratio} Format
                  </div>
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                  <h3 style={{ fontFamily: "Syne,sans-serif", fontSize: "16px", fontWeight: 800, color: colors.text, marginBottom: "8px", letterSpacing: "-0.02em" }}>{tpl.name}</h3>
                  <p style={{ fontSize: "12.5px", color: colors.textMuted, lineHeight: 1.5, fontWeight: 300, margin: "0 0 16px 0", flex: 1 }}>
                    {tpl.desc}
                  </p>
                  
                  {/* Stats & Launch CTA */}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: `1px solid ${colors.border}`,
                    paddingTop: "12px",
                    marginTop: "auto"
                  }}>
                    <span style={{ fontSize: "10px", color: colors.textMuted, fontWeight: 500, fontFamily: "monospace" }}>{tpl.stats}</span>
                    <span style={{
                      fontSize: "11px",
                      color: tpl.color,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      opacity: isHovered ? 1 : 0.7,
                      transform: isHovered ? "translateX(4px)" : "none",
                      transition: "all 0.3s"
                    }}>
                      Use ➔
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing-section" className="reveal" style={{ padding:"100px 48px", maxWidth:"1400px", margin:"0 auto", opacity: revealedSections.has("pricing-section") ? 1 : 0, transform: revealedSections.has("pricing-section") ? "translateY(0)" : "translateY(40px)", transition:"opacity 0.7s, transform 0.7s" }}>
        <div style={{ textAlign:"center", marginBottom:"60px" }}>
          <div style={{ fontSize:"11px", letterSpacing:"0.14em", color:"#8b5a2b", textTransform:"uppercase", marginBottom:"16px", fontWeight:500 }}>Simple pricing</div>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(36px,5vw,56px)", fontWeight:800, letterSpacing:"-0.04em", color:colors.text }}>Start free.<br/>Scale when ready.</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"20px" }}>
          {pricing.map((plan,i) => (
            <div key={i} style={{ background: plan.popular ? "#8b5a2b" : (isDark ? "#171514" : "#fff"), border: plan.popular ? "none" : `1px solid ${colors.border}`, borderRadius:"24px", padding:"36px 32px", position:"relative", boxShadow: plan.popular ? "0 24px 60px rgba(139,90,43,0.3)" : colors.cardShadow, transition:"all 0.3s" }}>
              {plan.popular && <div style={{ position:"absolute", top:"-12px", left:"50%", transform:"translateX(-50%)", background:"#f5c842", color:"#0c0a09", fontSize:"11px", fontWeight:700, padding:"4px 16px", borderRadius:"20px", letterSpacing:"0.04em" }}>MOST POPULAR</div>}
              <div style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:800, color: plan.popular ? "#fff" : colors.text, marginBottom:"8px" }}>{plan.name}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:"4px", marginBottom:"6px" }}>
                <span style={{ fontFamily:"Syne,sans-serif", fontSize:"44px", fontWeight:800, color: plan.popular ? "#fff" : colors.text }}>${plan.price}</span>
                {plan.price > 0 && <span style={{ fontSize:"13px", color: plan.popular ? "rgba(255,255,255,0.7)" : colors.textMuted }}>/mo</span>}
              </div>
              <div style={{ fontSize:"12px", color: plan.popular ? "rgba(255,255,255,0.65)" : colors.textMuted, marginBottom:"28px" }}>{plan.period}</div>
              <button style={{ width:"100%", padding:"13px", borderRadius:"12px", background: plan.popular ? "rgba(255,255,255,0.15)" : "#8b5a2b", color:"#fff", border: plan.popular ? "1px solid rgba(255,255,255,0.25)" : "none", fontSize:"14px", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer", marginBottom:"28px", transition:"all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity="1"}
                onClick={() => onNavigate("auth","signup")}
              >Get started {plan.price === 0 ? "free" : "now"}</button>
              <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                {plan.features.map((f,j) => (
                  <div key={j} style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"13px", color: plan.popular ? "rgba(255,255,255,0.85)" : colors.text }}>
                    <span style={{ color: plan.popular ? "#22d3a8" : "#22d3a8", fontWeight:700, fontSize:"14px" }}>✓</span>{f}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section style={{ background:"linear-gradient(135deg,#1a0f0a,#2d1a0f)", padding:"100px 48px", textAlign:"center", width:"100%" }}>
        {/* Glowing orb background */}
        <div style={{ position:"absolute", width:"600px", height:"600px", borderRadius:"50%", filter:"blur(120px)", background:"rgba(139,90,43,0.15)", top:"50%", left:"50%", transform:"translate(-50%,-50%)", pointerEvents:"none" }} />
        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:"8px", background:"rgba(212,165,116,0.12)", border:"1px solid rgba(212,165,116,0.2)", borderRadius:"40px", padding:"6px 16px", fontSize:"12px", color:"#d4a574", marginBottom:"28px", letterSpacing:"0.02em" }}>
            <span style={{ width:"5px", height:"5px", background:"#22d3a8", borderRadius:"50%", display:"inline-block", animation:"pulse 2s infinite" }} />
            3.8M creators and counting
          </div>
          <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(40px,6vw,72px)", fontWeight:800, letterSpacing:"-0.04em", color:"#fff", marginBottom:"20px", lineHeight:0.95 }}>
            Ready to create<br/><em style={{ fontFamily:"Instrument Serif,serif", color:"#d4a574", fontWeight:400 }}>something great?</em>
          </h2>
          <p style={{ fontSize:"16px", color:"rgba(255,255,255,0.45)", marginBottom:"44px", fontWeight:300, maxWidth:"420px", margin:"0 auto 44px", lineHeight:1.6 }}>Join millions of creators. Free forever, no credit card required.</p>
          <div style={{ display:"flex", gap:"14px", justifyContent:"center", flexWrap:"wrap" }}>
            <button style={{ background:"linear-gradient(135deg,#8b5a2b,#d4a574)", color:"#fff", border:"none", padding:"18px 48px", borderRadius:"50px", fontSize:"17px", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer", transition:"all 0.3s", boxShadow:"0 8px 40px rgba(139,90,43,0.5)", letterSpacing:"-0.02em" }}
              onMouseEnter={e => { e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow="0 16px 60px rgba(139,90,43,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="0 8px 40px rgba(139,90,43,0.5)"; }}
              onClick={() => onNavigate("auth","signup")}>Start for free</button>
            <button style={{ background:"rgba(255,255,255,0.06)", color:"rgba(255,255,255,0.8)", border:"1px solid rgba(255,255,255,0.12)", padding:"18px 36px", borderRadius:"50px", fontSize:"17px", fontFamily:"'Poppins',sans-serif", fontWeight:300, cursor:"pointer", transition:"all 0.3s", backdropFilter:"blur(8px)", letterSpacing:"-0.02em" }}
              onMouseEnter={e => { e.currentTarget.style.background="rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.25)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; }}
              onClick={() => onNavigate("auth","signin")}>Sign in instead</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background:"#111", padding:"36px 48px", borderTop:"1px solid rgba(255,255,255,0.05)", width:"100%" }}>
        <div style={{ maxWidth:"1400px", margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
            <div style={{ width:"24px", height:"24px", borderRadius:"6px", background:"linear-gradient(135deg,#8b5a2b,#d4a574)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8 L8 2 L13 8 L8 14 Z" fill="white" opacity="0.9"/><circle cx="8" cy="8" r="2" fill="white"/></svg>
            </div>
            <div style={{ fontFamily:"Syne,sans-serif", fontWeight:800, fontSize:"16px", color:"#fff", letterSpacing:"-0.03em" }}>Creat<span style={{ color:"#d4a574" }}>ify</span></div>
          </div>
          <div style={{ display:"flex", gap:"32px" }}>
            {["Privacy","Terms","Support","Blog"].map(l => <a key={l} href="#" style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", textDecoration:"none", transition:"color 0.2s" }} onMouseEnter={e=>e.target.style.color="rgba(255,255,255,0.7)"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,0.3)"}>{l}</a>)}
          </div>
          <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.25)" }}>© 2025 Creatify Inc. All rights reserved.</div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Instrument+Sans:wght@300;400;500;600&family=Instrument+Serif:ital@0;1&family=Poppins:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp     { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:none; } }
        @keyframes fadeIn     { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse      { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes marquee    { from { transform:translateX(0); } to { transform:translateX(-50%); } }
        @keyframes scrollAnim { 0% { transform:scaleY(0); transform-origin:top; } 50% { transform:scaleY(1); transform-origin:top; } 51% { transform:scaleY(1); transform-origin:bottom; } 100% { transform:scaleY(0); transform-origin:bottom; } }
        @keyframes float1     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-12px);} }
        @keyframes float2     { 0%,100%{transform:translateY(0);} 50%{transform:translateY(-8px);} }
        @keyframes spin       { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
