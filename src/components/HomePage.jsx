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
  const [activeNav, setActiveNav]             = useState("home");
  const [navScrolled, setNavScrolled]         = useState(false);

  // Dynamic Past Works state
  const [pastWorks, setPastWorks] = useState(() => {
    const saved = localStorage.getItem("creatify_past_works");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse past works", e);
      }
    }
    
    // Fallback seed projects
    const defaultWorks = [
      {
        id: "cinema-intro",
        title: "Cinematic Intro Reel",
        category: "Video Edit",
        tool: "Video Editor",
        year: "2026",
        accent: "#8b5a2b",
        gradient: "linear-gradient(135deg, #1e110a 0%, #3a2215 50%, #0c0a09 100%)",
        image: videoPrev,
        tags: ["4K UHD", "LUTs", "15s"],
        desc: "Cinematic intro sequence with warm amber color LUTs and smooth title transitions.",
        data: {
          tracks: [
            { id: "track_v1", type: "video", name: "Video Track 1", clips: [
              { id: "clip_v1", name: "Cinematic Forest", start: 0, duration: 10, type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-forest-stream-in-the-sunlight-529-large.mp4" }
            ]},
            { id: "track_t1", type: "text", name: "Title Overlay", clips: [
              { id: "clip_t1", name: "Main Title", start: 2, duration: 6, type: "text", text: "THE CINEMATIC EXPERIENCE" }
            ]}
          ],
          duration: 15
        }
      },
      {
        id: "pitch-deck",
        title: "Startup Pitch Deck",
        category: "Presentation",
        tool: "Slide Studio",
        year: "2026",
        accent: "#a0522d",
        gradient: "linear-gradient(135deg, #111827 0%, #1f2937 50%, #030712 100%)",
        image: pptPrev,
        tags: ["10 Slides", "Vector", "Pitch"],
        desc: "Modern corporate pitch deck layout with minimalist vector grid alignment.",
        data: {
          themeIdx: 0,
          slides: [
            { id: "s1", layout: "title", title: "Next Gen Platform", subtitle: "Building the future of creation", bulletPoints: ["Empowering millions of creators", "Zero friction deployment", "Fully decentralized platform"], elements: [] },
            { id: "s2", layout: "split", title: "Market Growth", subtitle: "Traction and projections", bulletPoints: ["300% YoY growth", "High user retention", "Profitable from day one"], elements: [] }
          ]
        }
      }
    ];

    localStorage.setItem("creatify_past_works", JSON.stringify(defaultWorks));
    return defaultWorks;
  });

  // Reload past works when component mounts or user session changes
  useEffect(() => {
    const token = localStorage.getItem("creatify_token");
    if (token) {
      fetch("http://localhost:3001/api/projects", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch from DB");
      })
      .then(dbProjects => {
        if (dbProjects) {
          // If we have projects in DB, prioritize them
          if (dbProjects.length > 0) {
            setPastWorks(dbProjects);
            localStorage.setItem("creatify_past_works", JSON.stringify(dbProjects));
          } else {
            // DB is empty, check if we have localStorage work we can sync to DB!
            const localSaved = localStorage.getItem("creatify_past_works");
            if (localSaved) {
              try {
                const parsed = JSON.parse(localSaved);
                if (parsed.length > 0) {
                  setPastWorks(parsed);
                  // Sync local projects to the server DB
                  parsed.forEach(proj => {
                    fetch("http://localhost:3001/api/projects", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                      },
                      body: JSON.stringify(proj)
                    }).catch(e => console.error("Auto-sync project failed:", e));
                  });
                }
              } catch (e) {}
            }
          }
        }
      })
      .catch(err => {
        console.warn("DB load failed, falling back to local:", err.message);
        const saved = localStorage.getItem("creatify_past_works");
        if (saved) {
          try {
            setPastWorks(JSON.parse(saved));
          } catch (e) {}
        }
      });
    } else {
      const saved = localStorage.getItem("creatify_past_works");
      if (saved) {
        try {
          setPastWorks(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to reload past works", e);
        }
      }
    }
  }, [user]);

  const handleDeletePastWork = async (id) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    const token = localStorage.getItem("creatify_token");
    if (token) {
      try {
        await fetch(`http://localhost:3001/api/projects/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        console.log("Deleted project from DB successfully");
      } catch (err) {
        console.error("Failed to delete project from DB:", err.message);
      }
    }

    const saved = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const updated = saved.filter(w => w.id !== id);
    localStorage.setItem("creatify_past_works", JSON.stringify(updated));
    setPastWorks(updated);

    if (user && user.email) {
      const videoKey = `creatify_video_projects_${user.email}`;
      const savedVideos = JSON.parse(localStorage.getItem(videoKey) || "[]");
      localStorage.setItem(videoKey, JSON.stringify(savedVideos.filter(p => p.id !== id)));

      const pptKey = `creatify_presentations_${user.email}`;
      const savedPpts = JSON.parse(localStorage.getItem(pptKey) || "[]");
      localStorage.setItem(pptKey, JSON.stringify(savedPpts.filter(p => p.id !== id)));
    }
  };
  const canvasRef  = useRef(null);
  const profileDropdownRef = useRef(null);

  // Track scroll position for nav shrink effect
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Smooth scroll helper
  const scrollTo = (id, label) => {
    setActiveNav(label);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  // Interactive Gallery State
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [hoveredWork, setHoveredWork]         = useState(null);
  const pastWorkScrollRef = useRef(null);


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



      {/* ── Premium Nav ── */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, width:"100%", zIndex:100, padding: navScrolled ? "0 40px" : "0 48px", height: navScrolled ? "58px" : "68px", display:"flex", alignItems:"center", backdropFilter:"blur(32px) saturate(200%)", background: navScrolled ? (isDark ? "rgba(12,10,9,0.97)" : "rgba(250,248,245,0.97)") : colors.navBg, borderBottom:`1px solid ${navScrolled ? colors.border : "transparent"}`, boxShadow: navScrolled ? (isDark ? "0 4px 40px rgba(0,0,0,0.35)" : "0 4px 40px rgba(139,90,43,0.08)") : "none", transition:"all 0.4s cubic-bezier(0.16,1,0.3,1)" }}>

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

        {/* Spacer to push links to the right */}
        <div style={{ flex: 1 }} />

        {/* Nav links – smooth scroll within homepage */}
        <div style={{ display:"flex", gap:"4px", alignItems:"center" }}>
          {[
            { label:"home",      id:null,                 text:"Home" },
            { label:"tools",     id:"tools-section",      text:"Tools" },
            { label:"about",     id:"about-section",      text:"About" },
            { label:"pipeline",  id:"pipeline-section",   text:"How it works" },
            { label:"pricing",   id:"pricing-section",    text:"Pricing" },
          ].map(({ label, id, text }) => {
            const isActive = activeNav === label;
            return (
              <button
                key={label}
                onClick={() => scrollTo(id, label)}
                style={{
                  background: isActive
                    ? (isDark ? "rgba(212,165,116,0.18)" : "rgba(139,90,43,0.1)")
                    : "transparent",
                  border: isActive
                    ? (isDark ? "1px solid rgba(212,165,116,0.3)" : "1px solid rgba(139,90,43,0.2)")
                    : "1px solid transparent",
                  color: isActive ? (isDark ? "#d4a574" : "#8b5a2b") : colors.textMuted,
                  fontSize:"13px",
                  fontFamily:"'Poppins',sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  padding:"6px 15px",
                  borderRadius:"40px",
                  cursor:"pointer",
                  transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",
                  outline:"none",
                  letterSpacing:"-0.01em",
                  whiteSpace:"nowrap",
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.text;
                    e.currentTarget.style.background = isDark ? "rgba(212,165,116,0.09)" : "rgba(139,90,43,0.05)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = colors.textMuted;
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {text}
              </button>
            );
          })}
        </div>

        {/* Spacer between links and CTAs */}
        <div style={{ width: "32px" }} />

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

        {/* ── Grid overlay – fades away around the center text ── */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: `linear-gradient(${
            isDark ? "rgba(212,165,116,0.07)" : "rgba(139,90,43,0.06)"
          } 1px, transparent 1px), linear-gradient(90deg, ${
            isDark ? "rgba(212,165,116,0.07)" : "rgba(139,90,43,0.06)"
          } 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 0%, black 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 55% 55% at 50% 50%, transparent 0%, black 100%)",
        }} />

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

      {/* ── PAST WORK — Horizontal Scrollable Showcase ── */}
      <section className="reveal" id="past-work-section" style={{
        padding: "96px 0 80px",
        background: isDark ? "#0c0a09" : "#faf8f5",
        opacity: revealedSections.has("past-work-section") ? 1 : 0,
        transform: revealedSections.has("past-work-section") ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.7s, transform 0.7s",
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{ padding: "0 48px", marginBottom: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <div style={{ fontSize: "11px", letterSpacing: "0.16em", color: "#8b5a2b", textTransform: "uppercase", marginBottom: "12px", fontWeight: 600 }}>Made with Creatify</div>
            <h2 style={{ fontFamily: "Syne,sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1, color: colors.text, margin: 0 }}>
              Past Work.
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <p style={{ fontSize: "14px", color: colors.textMuted, maxWidth: "320px", lineHeight: 1.6, fontWeight: 300, margin: 0 }}>
              Projects crafted across every tool in the suite.
            </p>
            <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
              {[{ dir: -1, icon: "←" }, { dir: 1, icon: "→" }].map(({ dir, icon }) => (
                <button key={dir}
                  onClick={() => pastWorkScrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" })}
                  style={{
                    width: "38px", height: "38px", borderRadius: "50%",
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    color: colors.textMuted, fontSize: "16px", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s", outline: "none",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "#8b5a2b"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#8b5a2b"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = colors.textMuted; e.currentTarget.style.borderColor = colors.border; }}
                >{icon}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll rail */}
        <div
          ref={pastWorkScrollRef}
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            padding: "4px 48px 24px",
            cursor: "grab",
          }}
          onMouseDown={e => { e.currentTarget.dataset.down = "1"; e.currentTarget.dataset.startX = e.pageX; e.currentTarget.dataset.scrollLeft = e.currentTarget.scrollLeft; e.currentTarget.style.cursor = "grabbing"; }}
          onMouseMove={e => { if (!e.currentTarget.dataset.down || e.currentTarget.dataset.down !== "1") return; e.currentTarget.scrollLeft = parseInt(e.currentTarget.dataset.scrollLeft) - (e.pageX - parseInt(e.currentTarget.dataset.startX)); }}
          onMouseUp={e => { e.currentTarget.dataset.down = "0"; e.currentTarget.style.cursor = "grab"; }}
          onMouseLeave={e => { e.currentTarget.dataset.down = "0"; e.currentTarget.style.cursor = "grab"; }}
        >
          {/* ──────────────────────────────────────────────────────────────────────
            ADD YOUR WORK HERE.
            Each item in this array becomes one card. Fill in:
              title    — project name
              category — short label shown top-left (e.g. "Video Edit")
              tool     — which Creatify tool was used
              year     — "2024"
              accent   — hex colour for glow / badge
              gradient — card background (CSS gradient string)
              image    — optional image URL; if empty, icon is shown instead
              icon     — emoji fallback when no image
              tags     — array of short feature strings
              desc     — one-sentence description (shown on hover)
          ────────────────────────────────────────────────────────────────────── */}
          {pastWorks.map((work, i) => {
            const isHov = hoveredWork === i;
            return (
              <div key={work.id || i}
                onMouseEnter={() => setHoveredWork(i)}
                onMouseLeave={() => setHoveredWork(null)}
                onClick={() => {
                  if (work.category === "Video Edit") {
                    onNavigate("editor_load", work);
                  } else if (work.category === "Presentation") {
                    onNavigate("presentation_load", work);
                  } else if (work.category === "Image Edit") {
                    onNavigate("image_editor_load", work);
                  } else if (work.category === "Logo Design") {
                    onNavigate("logo_maker_load", work);
                  } else if (work.category === "Social Post") {
                    onNavigate("social_studio_load", work);
                  } else if (work.category === "Document") {
                    onNavigate("documents_load", work);
                  } else if (work.category === "Print Layout") {
                    onNavigate("print_design_load", work);
                  } else if (work.category === "AI Design") {
                    onNavigate("ai_magic_load", work);
                  }
                }}
                style={{
                  flexShrink: 0,
                  width: "240px",
                  height: "300px",
                  borderRadius: "16px",
                  scrollSnapAlign: "start",
                  position: "relative",
                  overflow: "hidden",
                  background: work.gradient || "linear-gradient(135deg,#1a1207,#0c0a09)",
                  border: isHov ? `1px solid ${work.accent || "#8b5a2b"}55` : `1px solid ${colors.border}`,
                  cursor: "pointer",
                  transition: "transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s",
                  transform: isHov ? "translateY(-4px) scale(1.01)" : "none",
                  boxShadow: isHov ? `0 16px 40px ${(work.accent||"#8b5a2b")}20` : "0 4px 15px rgba(0,0,0,0.15)",
                  userSelect: "none",
                }}
              >
                {/* Delete button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePastWork(work.id);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    zIndex: 15,
                    fontSize: "11px",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "rgba(255,255,255,0.6)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                    e.currentTarget.style.background = "rgba(0,0,0,0.6)";
                  }}
                  title="Delete Project"
                >
                  ✕
                </button>

                {/* Accent orb */}
                <div style={{ position:"absolute", width:"120px", height:"120px", borderRadius:"50%", filter:"blur(40px)", background:(work.accent||"#8b5a2b")+"2a", top:"-30px", right:"-30px", opacity: isHov ? 1 : 0.5, transition:"opacity 0.4s", pointerEvents:"none" }} />

                {/* Image or icon */}
                {work.image ? (
                  <img src={work.image} alt={work.title} style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", opacity: isHov ? 0.5 : 0.3, transition:"opacity 0.4s" }} />
                ) : (
                  <div style={{ position:"absolute", top:"50%", left:"50%", transform:`translate(-50%,-50%) scale(${isHov?0.8:1})`, fontSize:"44px", opacity: isHov ? 0.07 : 0.13, transition:"all 0.4s", pointerEvents:"none", userSelect:"none" }}>{work.icon || "🎬"}</div>
                )}

                {/* Top bar */}
                <div style={{ position:"absolute", top:"14px", left:"14px", right:"14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ fontSize:"9px", color: work.accent||"#d4a574", fontWeight:600, letterSpacing:"0.06em", textTransform:"uppercase", background:(work.accent||"#8b5a2b")+"1a", border:`1px solid ${(work.accent||"#8b5a2b")}33`, borderRadius:"30px", padding:"2px 8px" }}>
                    {work.category || "Project"}
                  </div>
                  <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.25)", fontWeight:400 }}>{work.year || ""}</div>
                </div>

                {/* Bottom panel */}
                <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"16px 14px", background:"linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)", transform: isHov ? "none" : "translateY(2px)", opacity: isHov ? 1 : 0.95, transition:"all 0.4s" }}>
                  {work.tool && (
                    <div style={{ fontSize:"8px", fontWeight:700, letterSpacing:"0.07em", textTransform:"uppercase", color: work.accent||"#d4a574", marginBottom:"4px", opacity:0.8 }}>{work.tool}</div>
                  )}
                  <div style={{ fontFamily:"Syne,sans-serif", fontSize:"14px", fontWeight:800, color:"#fff", letterSpacing:"-0.02em", lineHeight:1.2, marginBottom: isHov && work.desc ? "6px" : 0 }}>
                    {work.title || "Untitled Project"}
                  </div>
                  {work.desc && (
                    <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.45)", lineHeight:1.45, fontWeight:300, maxHeight: isHov ? "42px" : "0px", overflow:"hidden", transition:"max-height 0.4s" }}>
                      {work.desc}
                    </div>
                  )}
                  {work.tags && work.tags.length > 0 && (
                    <div style={{ display:"flex", gap:"4px", flexWrap:"wrap", marginTop: isHov ? "8px" : 0, maxHeight: isHov ? "36px" : 0, overflow:"hidden", transition:"max-height 0.4s" }}>
                      {work.tags.map(t => (
                        <span key={t} style={{ fontSize:"8px", color:"rgba(255,255,255,0.35)", background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"3px", padding:"1px 5px", letterSpacing:"0.04em" }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Always-visible empty slot as a visual guide when no work added yet */}
          {pastWorks.length < 3 && ( [
            "Your project here","Add a work","Coming soon"
          ].slice(0, 3 - pastWorks.length) ).map((label, i) => (
            <div key={`empty-${i}`} style={{
              flexShrink: 0, width: "240px", height: "300px", borderRadius: "16px",
              scrollSnapAlign: "start",
              background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.025)",
              border: `1.5px dashed ${colors.border}`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: "10px",
            }}>
              <div style={{ width:"32px", height:"32px", borderRadius:"50%", border:`1.5px dashed ${colors.border}`, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke={isDark?"rgba(212,165,116,0.25)":"rgba(139,90,43,0.2)"} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ fontSize:"11px", color: isDark ? "rgba(212,165,116,0.2)" : "rgba(139,90,43,0.2)", fontWeight:400, letterSpacing:"0.04em" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Scroll indicator line */}
        <div style={{ padding:"0 48px", marginTop:"8px" }}>
          <div style={{ height:"1px", background: isDark ? "rgba(212,165,116,0.08)" : "rgba(139,90,43,0.07)", borderRadius:"1px", position:"relative" }}>
            <div style={{ position:"absolute", left:0, top:0, height:"100%", width:"18%", background: "linear-gradient(90deg,#8b5a2b,#d4a574)", borderRadius:"1px" }} />
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
                  onClick={() => {
                    if (tool.id === "video") onNavigate("editor");
                    else if (tool.id === "ppt") onNavigate("presentation");
                    else if (tool.id === "image") onNavigate("image_editor");
                    else if (tool.id === "logo") onNavigate("logo_maker");
                    else if (tool.id === "social") onNavigate("social_studio");
                    else if (tool.id === "doc") onNavigate("documents");
                    else if (tool.id === "print") onNavigate("print_design");
                    else if (tool.id === "ai") onNavigate("ai_magic");
                    else onNavigate("auth", "signup");
                  }}
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

      {/* ── ABOUT SECTION ── */}
      <section className="reveal" id="about-section" style={{
        opacity: revealedSections.has("about-section") ? 1 : 0,
        transform: revealedSections.has("about-section") ? "translateY(0)" : "translateY(40px)",
        transition: "opacity 0.8s, transform 0.8s",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Top rule */}
        <div style={{ height:"1px", background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)` }} />

        {/* ─ Top editorial band: full-width dark */}
        <div style={{
          background: isDark ? "#080604" : "#0c0a09",
          padding: "80px 48px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Subtle grid */}
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage: `linear-gradient(rgba(212,165,116,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(212,165,116,0.04) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }} />
          {/* Glow */}
          <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", filter:"blur(120px)", background:"rgba(139,90,43,0.1)", top:"-100px", right:"-100px", pointerEvents:"none" }} />

          <div style={{ maxWidth:"1400px", margin:"0 auto", position:"relative" }}>
            {/* Eyebrow */}
            <div style={{ fontSize:"11px", letterSpacing:"0.18em", color:"#8b5a2b", textTransform:"uppercase", fontWeight:600, marginBottom:"32px", display:"flex", alignItems:"center", gap:"12px" }}>
              <div style={{ width:"24px", height:"1px", background:"#8b5a2b" }} /> Our Story
            </div>

            {/* Pull quote */}
            <div style={{ maxWidth:"900px" }}>
              <h2 style={{
                fontFamily: "Syne,sans-serif",
                fontSize: "clamp(36px,5.5vw,72px)",
                fontWeight: 800,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                color: "#f5f0e8",
                margin: 0,
              }}>
                Built for creators,<br/>
                <em style={{ fontFamily:"Instrument Serif,serif", fontWeight:400, color:"#d4a574", fontStyle:"italic" }}>by creators.</em>
              </h2>
              <p style={{ fontSize:"17px", color:"rgba(255,255,255,0.38)", lineHeight:1.7, fontWeight:300, maxWidth:"620px", marginTop:"28px" }}>
                Creatify was born from a simple frustration — professional design tools demanded years of training and steep subscriptions. We built an entirely browser-native suite so anyone can create at a professional level, instantly.
              </p>
            </div>

            {/* Stat strip */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "0",
              marginTop: "64px",
              borderTop: "1px solid rgba(255,255,255,0.07)",
              borderLeft: "1px solid rgba(255,255,255,0.07)",
            }}>
              {[
                { value:"2021", label:"Founded" },
                { value:"3.8M+", label:"Creators worldwide" },
                { value:"120M+", label:"Projects exported" },
                { value:"140", label:"Countries reached" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "32px 28px",
                  borderRight: "1px solid rgba(255,255,255,0.07)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}>
                  <div style={{ fontFamily:"Syne,sans-serif", fontSize:"clamp(28px,3.5vw,44px)", fontWeight:800, letterSpacing:"-0.04em", background:"linear-gradient(135deg,#f5f0e8,#d4a574)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text", lineHeight:1, marginBottom:"8px" }}>{s.value}</div>
                  <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.3)", letterSpacing:"0.04em", fontWeight:400 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─ Bottom split: mission + principles */}
        <div style={{
          background: isDark ? "#0a0807" : "#fff",
          padding: "80px 48px",
          borderTop: `1px solid ${colors.border}`,
        }}>
          <div style={{ maxWidth:"1400px", margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"80px", alignItems:"start" }}>

            {/* Left — Mission statement */}
            <div>
              <div style={{ fontSize:"11px", letterSpacing:"0.16em", color:"#8b5a2b", textTransform:"uppercase", fontWeight:600, marginBottom:"20px", display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"20px", height:"1px", background:"#8b5a2b" }} /> Mission
              </div>
              <p style={{ fontSize:"18px", color:colors.text, lineHeight:1.75, fontWeight:300, margin:0, letterSpacing:"-0.01em" }}>
                We believe creativity is a human right, not a premium feature. Every tool in Creatify is designed to collapse the distance between an idea and a finished, professional piece of work.
              </p>
              <div style={{ marginTop:"36px", paddingTop:"36px", borderTop:`1px solid ${colors.border}` }}>
                <p style={{ fontSize:"14px", color:colors.textMuted, lineHeight:1.7, fontWeight:300, margin:0 }}>
                  From a first-time freelancer to a studio of fifty — Creatify scales with you. Everything runs in your browser. Nothing ever leaves your machine without your say.
                </p>
              </div>
            </div>

            {/* Right — Principles (clean list, no emoji boxes) */}
            <div>
              <div style={{ fontSize:"11px", letterSpacing:"0.16em", color:"#8b5a2b", textTransform:"uppercase", fontWeight:600, marginBottom:"20px", display:"flex", alignItems:"center", gap:"10px" }}>
                <div style={{ width:"20px", height:"1px", background:"#8b5a2b" }} /> Principles
              </div>
              <div style={{ display:"flex", flexDirection:"column" }}>
                {[
                  { num:"01", title:"Browser-native",     body:"Zero downloads. Zero plugins. Your work is always a tab away, on any machine." },
                  { num:"02", title:"Privacy by default",  body:"Raw footage never touches our servers. Rendering happens locally, always." },
                  { num:"03", title:"Radical simplicity",  body:"Professional power, stripped of unnecessary complexity. Opinionated and fast." },
                ].map((p, i, arr) => (
                  <div key={p.num} style={{
                    display:"grid", gridTemplateColumns:"48px 1fr", gap:"16px", alignItems:"start",
                    padding:"24px 0",
                    borderBottom: i < arr.length-1 ? `1px solid ${colors.border}` : "none",
                  }}>
                    <div style={{ fontFamily:"Syne,sans-serif", fontSize:"11px", fontWeight:700, color: isDark ? "rgba(212,165,116,0.3)" : "rgba(139,90,43,0.3)", letterSpacing:"0.06em", paddingTop:"3px" }}>{p.num}</div>
                    <div>
                      <div style={{ fontSize:"15px", fontWeight:600, color:colors.text, marginBottom:"6px", letterSpacing:"-0.01em" }}>{p.title}</div>
                      <div style={{ fontSize:"13px", color:colors.textMuted, lineHeight:1.6, fontWeight:300 }}>{p.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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



      {/* Footer CTA */}
      <section style={{ background:"linear-gradient(135deg,#1a0f0a,#2d1a0f)", padding:"100px 48px", textAlign:"center", width:"100%", position:"relative", overflow:"hidden" }}>
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

      {/* Pricing */}
      <section id="pricing-section" className="reveal" style={{ padding:"100px 48px", background: isDark ? "#0e0c0b" : "#f7f4f0", width:"100%", opacity: revealedSections.has("pricing-section") ? 1 : 0, transform: revealedSections.has("pricing-section") ? "translateY(0)" : "translateY(40px)", transition:"opacity 0.7s, transform 0.7s" }}>
        <div style={{ maxWidth:"1400px", margin:"0 auto" }}>
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
                      <span style={{ color:"#22d3a8", fontWeight:700, fontSize:"14px" }}>✓</span>{f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
