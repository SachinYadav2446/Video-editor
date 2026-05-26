import { useState, useRef, useEffect } from "react";
import { useEditorState } from "../hooks/useEditorState";
import { uid, fmtTime } from "../constants";
import Timeline from "./Timeline";
import ExportModal from "./ExportModal";

const editorInputStyle = {
  background: "#0c0a09",
  border: "1px solid rgba(212,165,116,0.2)",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "12px",
  padding: "8px 10px",
  outline: "none",
  fontFamily: "'Poppins', sans-serif",
  width: "100%",
};

export default function VideoEditor({ onBack, user }) {
  const [state, dispatch] = useEditorState();
  const [showExport, setShowExport] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const timelineRef = useRef(null);
  const playIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputTypeRef = useRef("video");
  const videoRef = useRef(null);

  const [leftTab, setLeftTab] = useState("media");
  const [aiPrompt, setAiPrompt] = useState("");
  const [generatedScript, setGeneratedScript] = useState("");
  const [aiTyping, setAiTyping] = useState(false);

  // ── Active clip at playhead ───────────────────────────────────────────────
  const activeClip = state.tracks.flatMap(t => t.clips).find(c =>
    c.start <= state.playhead && c.start + c.duration > state.playhead && (c.videoEl || c.imageEl)
  );

  // ── Sync video element with timeline ─────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (activeClip?.videoEl) {
      if (video.src !== activeClip.url) {
        video.src = activeClip.url;
        video.load();
      }
      const videoTime = state.playhead - activeClip.start;
      if (state.isPlaying) {
        video.play().catch(() => {});
      } else {
        video.pause();
        if (Math.abs(video.currentTime - videoTime) > 0.05) {
          video.currentTime = videoTime;
        }
      }
    } else {
      video.pause();
    }
  }, [state.playhead, state.isPlaying, activeClip]);

  // ── Update timeline from video time during playback ───────────────────────
  useEffect(() => {
    if (!videoRef.current || !state.isPlaying || !activeClip?.videoEl) return;
    const video = videoRef.current;
    const handleTimeUpdate = () => {
      const newPlayhead = activeClip.start + video.currentTime;
      dispatch({ type: "SET_PLAYHEAD", time: newPlayhead });
    };
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [state.isPlaying, activeClip, dispatch]);

  // ── Dynamic duration based on clips ──────────────────────────────────────
  useEffect(() => {
    let maxEnd = 0;
    state.tracks.forEach(track => {
      track.clips.forEach(clip => {
        const end = clip.start + clip.duration;
        if (end > maxEnd) maxEnd = end;
      });
    });
    const newDuration = Math.max(60, maxEnd + 10);
    if (Math.abs(newDuration - state.duration) > 1) {
      dispatch({ type: "SET_DURATION", value: newDuration });
    }
  }, [state.tracks, state.duration, dispatch]);

  // ── Playback interval for non-video clips ─────────────────────────────────
  useEffect(() => {
    const hasVideo = state.tracks.some(t =>
      t.clips.some(c => c.videoEl && c.start <= state.playhead && c.start + c.duration > state.playhead)
    );
    if (state.isPlaying && !hasVideo) {
      playIntervalRef.current = setInterval(() => {
        dispatch({ type: "SET_PLAYHEAD", time: state.playhead + 0.033 * state.playbackSpeed });
        if (state.playhead >= state.duration) {
          dispatch({ type: "SET_PLAYING", value: false });
          dispatch({ type: "SET_PLAYHEAD", time: 0 });
        }
      }, 33);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [state.isPlaying, state.playhead, state.duration, dispatch, state.tracks, state.playbackSpeed]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ":
          e.preventDefault();
          dispatch({ type: "SET_PLAYING", value: !state.isPlaying });
          break;
        case "ArrowLeft":
          e.preventDefault();
          if (e.shiftKey) {
            dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 0.033) });
          } else {
            dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 5) });
          }
          break;
        case "ArrowRight":
          e.preventDefault();
          if (e.shiftKey) {
            dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 0.033) });
          } else {
            dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 5) });
          }
          break;
        case "s":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
            if (clip) {
              const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
              if (track) dispatch({ type: "SPLIT_CLIP", trackId: track.id, clipId: state.selectedClip, time: state.playhead });
            }
          }
          break;
        case "Delete":
        case "Backspace":
          if (state.selectedClip) {
            e.preventDefault();
            dispatch({ type: "REMOVE_CLIP", clipId: state.selectedClip });
          }
          break;
        case "Home":
          e.preventDefault();
          dispatch({ type: "SET_PLAYHEAD", time: 0 });
          break;
        case "End":
          e.preventDefault();
          dispatch({ type: "SET_PLAYHEAD", time: state.duration });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedClip, state.playhead, state.duration, state.isPlaying, state.tracks, dispatch]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const selectedClipData = state.selectedClip
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip)
    : null;

  // Auto-switch to properties tab when a clip is selected
  useEffect(() => {
    if (state.selectedClip) {
      setLeftTab("properties");
    }
  }, [state.selectedClip]);

  const selectedTextClip = state.selectedClip
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip && c.type === "text")
    : null;

  const addTextClip = () => {
    let track = state.tracks.find(t => t.type === "text");
    if (!track) {
      track = { id: uid(), type: "text", name: "Text", clips: [] };
      dispatch({ type: "ADD_TRACK", track });
    }
    const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    dispatch({
      type: "ADD_CLIP",
      trackId: track.id,
      clip: { id: uid(), name: "Text Clip", text: "Your Text Here", start: maxStart, duration: 4, type: "text" },
    });
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const type = fileInputTypeRef.current;
      const url = URL.createObjectURL(file);
      const clipId = uid();
      if (type === "image" || file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          let track = state.tracks.find(t => t.type === "image");
          if (!track) { track = { id: uid(), type: "image", name: "Images", clips: [] }; dispatch({ type: "ADD_TRACK", track }); }
          const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
          dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { id: clipId, name: file.name, start: maxStart, duration: 5, url, imageEl: img, type: "image" } });
        };
        img.src = url;
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = url; video.playsInline = true; video.crossOrigin = "anonymous";
        video.onloadedmetadata = () => {
          let track = state.tracks.find(t => t.type === "video");
          if (!track) { track = { id: uid(), type: "video", name: "Video", clips: [] }; dispatch({ type: "ADD_TRACK", track }); }
          const dur = video.duration || 10;
          const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
          dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { id: clipId, name: file.name, start: maxStart, duration: dur, url, videoEl: video, type: "video" } });
        };
      } else if (file.type.startsWith("audio/")) {
        let track = state.tracks.find(t => t.type === "audio");
        if (!track) { track = { id: uid(), type: "audio", name: "Audio", clips: [] }; dispatch({ type: "ADD_TRACK", track }); }
        const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
        dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { id: clipId, name: file.name, start: maxStart, duration: 30, url, type: "audio" } });
      }
    });
    e.target.value = "";
  };

  const PX_PER_SEC = 80 * state.zoom;

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const scrollContainer = timelineRef.current.closest(".timeline-scroll-container");
    const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
    const x = e.clientX - rect.left + scrollLeft;
    if (x < 0) return;
    dispatch({ type: "SET_PLAYHEAD", time: x / PX_PER_SEC });
  };

  const handleClipMouseDown = (e, trackId, clip) => {
    e.stopPropagation();
    dispatch({ type: "SELECT_CLIP", clipId: clip.id });
    const startX = e.clientX, startPos = clip.start;
    const onMove = me => dispatch({ type: "MOVE_CLIP", trackId, clipId: clip.id, start: startPos + (me.clientX - startX) / PX_PER_SEC });
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const handleResizeMouseDown = (e, trackId, clip) => {
    e.stopPropagation();
    const startX = e.clientX, startDur = clip.duration;
    const onMove = me => dispatch({ type: "RESIZE_CLIP", trackId, clipId: clip.id, duration: startDur + (me.clientX - startX) / PX_PER_SEC });
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const simulateExport = () => {
    setShowExport(true);
    let p = 0;
    dispatch({ type: "SET_EXPORT_PROGRESS", value: 0 });
    const iv = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) { p = 100; clearInterval(iv); }
      dispatch({ type: "SET_EXPORT_PROGRESS", value: Math.min(100, p) });
    }, 120);
  };

  const onAddVideo = () => { fileInputTypeRef.current = "video"; fileInputRef.current.click(); };
  const onAddImage = () => { fileInputTypeRef.current = "image"; fileInputRef.current.click(); };
  const onAddAudio = () => { fileInputTypeRef.current = "audio"; fileInputRef.current.click(); };
  const onAddText = addTextClip;
  const onTogglePlay = () => dispatch({ type: "SET_PLAYING", value: !state.isPlaying });
  const onFrameForward = () => dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 0.033) });
  const onFrameBackward = () => dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 0.033) });
  const onSetPlaybackSpeed = (speed) => { dispatch({ type: "SET_PLAYBACK_SPEED", value: speed }); if (videoRef.current) videoRef.current.playbackRate = speed; };
  const onAddTrack = () => { const t = { id: uid(), type: "video", name: `Track ${state.tracks.length + 1}`, clips: [] }; dispatch({ type: "ADD_TRACK", track: t }); };
  const onResetFilters = () => ["brightness","contrast","saturation","hue","opacity","blur","sharpen","vignette"].forEach(k => dispatch({ type: "SET_FILTER", key: k, value: k === "hue" || k === "blur" || k === "sharpen" || k === "vignette" ? 0 : k === "opacity" ? 100 : 100 }));
  const onSetClipVolume = (clipId, volume) => dispatch({ type: "UPDATE_CLIP_VOLUME", clipId, volume });
  const onSplitClip = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track) dispatch({ type: "SPLIT_CLIP", trackId: track.id, clipId: state.selectedClip, time: state.playhead });
  };
  const onTrimClip = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track) {
      const trim = clip.duration * 0.1;
      dispatch({ type: "TRIM_CLIP", trackId: track.id, clipId: state.selectedClip, newStart: clip.start + trim, newDuration: clip.duration - trim * 2 });
    }
  };

  const STOCK_MEDIA = [
    { id: "stock_vid_1", name: "SaaS Product Intro", type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-animation-of-a-screen-with-graphs-34356-large.mp4", duration: 8, thumb: "📊" },
    { id: "stock_vid_2", name: "Modern Office Loop", type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42323-large.mp4", duration: 12, thumb: "💻" },
    { id: "stock_vid_3", name: "Cinematic Forest", type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-forest-and-river-42358-large.mp4", duration: 15, thumb: "🌲" },
    { id: "stock_img_1", name: "Creatify Hero Art", type: "image", url: "https://picsum.photos/id/180/800/450", duration: 5, thumb: "📸" },
    { id: "stock_img_2", name: "Creative Brand Logo", type: "image", url: "https://picsum.photos/id/200/800/450", duration: 5, thumb: "🎨" },
    { id: "stock_aud_1", name: "Upbeat Synthwave", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 30, thumb: "🎵" },
    { id: "stock_aud_2", name: "Ambient Piano", type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 30, thumb: "🎹" },
  ];

  const addStockMedia = (item) => {
    let track = state.tracks.find(t => t.type === item.type);
    let trackId;
    if (!track) { trackId = uid(); dispatch({ type: "ADD_TRACK", track: { id: trackId, type: item.type, name: item.type.toUpperCase() + " Track", clips: [] } }); }
    else { trackId = track.id; }
    const clipId = uid();
    const newClip = { id: clipId, name: item.name, start: state.playhead, duration: item.duration, url: item.url, type: item.type };
    if (item.type === "image") {
      const img = new Image();
      img.onload = () => dispatch({ type: "ADD_CLIP", trackId, clip: { ...newClip, imageEl: img } });
      img.src = item.url;
    } else if (item.type === "video") {
      const video = document.createElement("video");
      video.src = item.url; video.playsInline = true; video.crossOrigin = "anonymous";
      video.onloadedmetadata = () => dispatch({ type: "ADD_CLIP", trackId, clip: { ...newClip, duration: video.duration || item.duration, videoEl: video } });
    } else {
      dispatch({ type: "ADD_CLIP", trackId, clip: newClip });
    }
  };

  const applyPreset = (name) => {
    const presets = {
      vintage: { brightness: 105, contrast: 110, saturation: 125, hue: 6, vignette: 20, blur: 0, sharpen: 5 },
      cyber:   { brightness: 100, contrast: 125, saturation: 160, hue: 310, vignette: 15, blur: 0, sharpen: 20 },
      noir:    { brightness: 95, contrast: 135, saturation: 0, hue: 0, vignette: 40, blur: 0, sharpen: 10 },
      cream:   { brightness: 110, contrast: 90, saturation: 95, hue: 10, vignette: 8, blur: 2, sharpen: 0 },
      reset:   { brightness: 100, contrast: 100, saturation: 100, hue: 0, vignette: 0, blur: 0, sharpen: 0, opacity: 100 },
    };
    if (presets[name]) Object.entries(presets[name]).forEach(([key, value]) => dispatch({ type: "SET_FILTER", key, value }));
  };

  const handleAIScriptGenerate = () => {
    if (!aiPrompt) return;
    setGeneratedScript(""); setAiTyping(true);
    const demoScript = `[Skincare commercial - Honey Serum]\n\nSCENE 1: Liquid honey cascading.\nNARRATOR: "Nature's gold in a bottle."\n\nSCENE 2: Apply Honey Serum.\nNARRATOR: "Glow. Naturally."`;
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < demoScript.length) { setGeneratedScript(p => p + demoScript[idx]); idx++; }
      else { clearInterval(interval); setAiTyping(false); }
    }, 15);
  };

  const handleAutoSubtitles = () => {
    let track = state.tracks.find(t => t.type === "text");
    let trackId;
    if (!track) { trackId = uid(); dispatch({ type: "ADD_TRACK", track: { id: trackId, type: "text", name: "AI Subtitles", clips: [] } }); }
    else { trackId = track.id; }
    [
      { text: "Welcome to Creatify Studio", start: 1, duration: 3 },
      { text: "Where design meets simplicity", start: 4.5, duration: 3 },
      { text: "Rendered at 60FPS in your browser", start: 8, duration: 4 }
    ].forEach(s => dispatch({ type: "ADD_CLIP", trackId, clip: { id: uid(), name: "Subtitle", text: s.text, start: s.start, duration: s.duration, type: "text" } }));
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0c0a09", color: "#e5e5e5", fontFamily: "'Instrument Sans', sans-serif", height: "100vh", width: "100vw", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none", margin: 0, padding: 0 }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Instrument+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body,html{height:100%;width:100%;overflow:hidden;background:#0c0a09}
        ::-webkit-scrollbar{width:6px;height:6px}
        ::-webkit-scrollbar-track{background:#0c0a09}
        ::-webkit-scrollbar-thumb{background:rgba(212,165,116,0.2);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#d4a574}
        .clip-block{cursor:grab;transition:opacity 0.1s}
        .clip-block:hover{opacity:0.9}
        .clip-block.selected{box-shadow:0 0 0 2px #d4a574;filter:brightness(1.15)}
        .tool-btn{background:rgba(212,165,116,0.05);border:1px solid rgba(212,165,116,0.15);color:#e5e5e5;padding:8px 16px;border-radius:8px;cursor:pointer;font-size:12px;font-family:'Poppins',sans-serif;font-weight:400;display:flex;align-items:center;gap:8px;transition:all 0.2s;white-space:nowrap}
        .tool-btn:hover{background:rgba(212,165,116,0.15);color:#d4a574;border-color:#d4a574;transform:translateY(-1px)}
        .tool-btn.primary{background:linear-gradient(135deg,#8b5a2b,#d4a574);border:none;color:#ffffff;box-shadow:0 2px 10px rgba(139,90,43,0.3);font-weight:500}
        .tool-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(139,90,43,0.45);background:linear-gradient(135deg,#9c6a3b,#e5b685)}
        .tool-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.04)}
        .tool-btn.danger:hover{background:rgba(239,68,68,0.15);color:#ef4444;border-color:#ef4444;transform:translateY(-1px)}
        .filter-slider{width:100%;-webkit-appearance:none;appearance:none;height:4px;background:rgba(212,165,116,0.15);border-radius:2px;outline:none;cursor:pointer}
        .filter-slider::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;background:#d4a574;border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(139,90,43,0.4);transition:all 0.1s}
        .filter-slider::-webkit-slider-thumb:hover{transform:scale(1.15);background:#8b5a2b}
        .filter-slider::-moz-range-thumb{width:14px;height:14px;background:#d4a574;border:none;border-radius:50%;cursor:pointer}
        .track-row{display:flex;align-items:stretch;border-bottom:1px solid rgba(212,165,116,0.08)}
        .track-label{width:140px;min-width:140px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;background:rgba(19,17,16,0.75);border-right:1px solid rgba(212,165,116,0.08);font-size:11px;gap:4px}
        .timeline-area{overflow-x:auto;overflow-y:visible;flex:1}
        .glass-panel{background:rgba(19,17,16,0.75);backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(212,165,116,0.12);box-shadow:0 10px 40px rgba(0,0,0,0.4)}
        .sidebar-panel{background:rgba(19,17,16,0.75);backdrop-filter:blur(24px) saturate(180%);border:1px solid rgba(212,165,116,0.08)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>

      <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" style={{ display: "none" }} onChange={handleFileUpload} />

      {/* ── Header Bar ───────────────────────────────────────────────────────── */}
      <div className="sidebar-panel" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", borderBottom: "1px solid rgba(212,165,116,0.12)", flexShrink: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Back button */}
          <button onClick={onBack} className="tool-btn" style={{ padding: "6px 14px", fontSize: "12px", gap: "6px" }} title="Back to Home">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
            Back
          </button>

          <div style={{ width: "1px", height: "20px", background: "rgba(212,165,116,0.15)" }} />

          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg,#8b5a2b,#d4a574)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M3 8 L8 2 L13 8 L8 14 Z" fill="white" opacity="0.9"/><circle cx="8" cy="8" r="2" fill="white"/></svg>
            </div>
            <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "18px", letterSpacing: "-0.04em", color: "#ffffff" }}>
              Creat<span style={{ color: "#d4a574" }}>ify</span>
            </div>
            <span style={{ fontSize: "9px", background: "rgba(212,165,116,0.12)", border: "1px solid rgba(212,165,116,0.3)", color: "#d4a574", padding: "2px 6px", borderRadius: "8px", fontWeight: 600, fontFamily: "'Poppins',sans-serif", letterSpacing: "0.02em" }}>STUDIO</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginLeft: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#8c8780", fontFamily: "'Poppins',sans-serif" }}>
            <span style={{ width: "6px", height: "6px", background: "#22d3a8", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #22d3a8" }} />
            <span>WASM Render Engine Active</span>
          </div>
          <div style={{ width: "1px", height: "18px", background: "rgba(139,90,43,0.15)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(139,90,43,0.08)", border: "1px solid rgba(139,90,43,0.2)", padding: "4px 12px 4px 6px", borderRadius: "30px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "linear-gradient(135deg,#8b5a2b,#d4a574)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, fontFamily: "'Poppins',sans-serif" }}>
              {user ? user.name[0].toUpperCase() : "C"}
            </div>
            <span style={{ fontSize: "12px", color: "#e5e5e5", fontWeight: 500, fontFamily: "'Poppins',sans-serif" }}>{user ? user.name : "Creator Mode"}</span>
            <span style={{ fontSize: "9px", background: "linear-gradient(135deg,#8b5a2b,#a0522d)", color: "#fff", padding: "1px 5px", borderRadius: "6px", fontWeight: 700, letterSpacing: "0.03em", fontFamily: "'Poppins',sans-serif" }}>PRO</span>
          </div>
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", background: "#0c0a09" }}>

        {/* Left Sidebar */}
        {!leftSidebarCollapsed ? (
          <div className="sidebar-panel" style={{ width: "320px", minWidth: "320px", borderRight: "1px solid rgba(212,165,116,0.12)", display: "flex", flexDirection: "column", height: "100%", zIndex: 5, flexShrink: 0 }}>
            {/* Tab selectors */}
            <div style={{ display: "flex", borderBottom: "1px solid rgba(212,165,116,0.08)", background: "rgba(12,10,9,0.4)", alignItems: "center" }}>
              <div style={{ display: "flex", flex: 1 }}>
                {[
                  { id: "media",   label: "Media",      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
                  { id: "text",    label: "Text",       icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
                  { id: "presets", label: "Presets",    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" opacity="0.4"/><circle cx="12" cy="12" r="2"/></svg> },
                  { id: "properties", label: "Properties", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
                ].map(tab => {
                  const active = leftTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setLeftTab(tab.id)}
                      style={{ flex: 1, padding: "12px 0", background: "none", border: "none", borderBottom: active ? "2px solid #d4a574" : "2px solid transparent", color: active ? "#d4a574" : "#8c8780", fontWeight: active ? 600 : 400, fontSize: "11px", fontFamily: "'Poppins',sans-serif", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", transition: "all 0.2s" }}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#d4a574"; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#8c8780"; }}
                    >
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>
              <button className="tool-btn" style={{ padding: "6px 10px", fontSize: 12, background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", color: "#d4a574", marginRight: "8px" }} onClick={() => setLeftSidebarCollapsed(true)} title="Collapse Sidebar">
                ◀
              </button>
            </div>

            {/* Tab Content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* 📁 Media Tab */}
              {leftTab === "media" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "12px", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>ASSETS LIBRARY</span>
                    <button className="tool-btn primary" onClick={() => fileInputRef.current.click()} style={{ padding: "6px 12px", fontSize: "11px" }}>+ Upload</button>
                  </div>
                  <p style={{ fontSize: "11px", color: "#8c8780", lineHeight: "1.4", margin: 0 }}>Click any asset to add it to the timeline at the playhead.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                    {STOCK_MEDIA.map(item => (
                      <div key={item.id} onClick={() => addStockMedia(item)}
                        style={{ background: "rgba(139,90,43,0.06)", border: "1px solid rgba(139,90,43,0.15)", borderRadius: "10px", padding: "12px", cursor: "pointer", transition: "all 0.2s", display: "flex", flexDirection: "column", gap: "8px" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a574"; e.currentTarget.style.background = "rgba(139,90,43,0.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(139,90,43,0.15)"; e.currentTarget.style.background = "rgba(139,90,43,0.06)"; }}
                      >
                        <div style={{ fontSize: "24px" }}>{item.thumb}</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span style={{ fontSize: "11px", fontWeight: 600, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                          <span style={{ fontSize: "9px", color: "#8c8780", textTransform: "uppercase" }}>{item.type} · {item.duration}s</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 📝 Text Tab */}
              {leftTab === "text" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span style={{ fontSize: "12px", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>TEXT PRESETS</span>
                  <p style={{ fontSize: "11px", color: "#8c8780", margin: 0, lineHeight: "1.4" }}>Insert sleek typography overlays to highlight your visual narrative.</p>
                  <button className="tool-btn" onClick={addTextClip} style={{ padding: "12px", justifyContent: "center", fontSize: "13px", fontWeight: 500 }}>Add Dynamic Title Overlay</button>
                  {selectedTextClip ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", padding: "12px", border: "1px solid rgba(34,211,168,0.25)", background: "rgba(34,211,168,0.03)", borderRadius: "10px" }}>
                      <div style={{ fontSize: "11px", color: "#22d3a8", fontWeight: 600 }}>📝 EDIT SELECTED TEXT</div>
                      <textarea value={selectedTextClip.text} onChange={e => dispatch({ type: "UPDATE_CLIP_TEXT", clipId: selectedTextClip.id, text: e.target.value })}
                        style={{ width: "100%", height: "80px", background: "#0c0a09", border: "1px solid rgba(139,90,43,0.2)", borderRadius: "8px", color: "#fff", fontSize: "12px", padding: "8px", outline: "none", fontFamily: "inherit", resize: "none" }}
                        placeholder="Type overlay text here..." />
                    </div>
                  ) : (
                    <div style={{ padding: "12px", border: "1px dashed rgba(139,90,43,0.2)", borderRadius: "10px", color: "#8c8780", fontSize: "11px" }}>
                      💡 Select a text clip on the timeline to edit it here.
                    </div>
                  )}
                </div>
              )}

              {/* 🎬 Presets Tab */}
              {leftTab === "presets" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <span style={{ fontSize: "12px", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>CINEMATIC LUT PRESETS</span>
                  <p style={{ fontSize: "11px", color: "#8c8780", margin: 0, lineHeight: "1.4" }}>One-click color grading templates.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { id: "vintage", name: "Vintage Gold 🍂", desc: "Warm amber tone, high saturation" },
                      { id: "cyber",   name: "Cyberpunk Mint 🧪", desc: "Neon greens, shifted hue" },
                      { id: "noir",    name: "Moody Noir 🎬", desc: "High-contrast dark room silver" },
                      { id: "cream",   name: "Dreamy Sunkissed ☀️", desc: "Soft warm cream glow" },
                      { id: "reset",   name: "Reset Grading ↺", desc: "Restore original colors" }
                    ].map(lut => (
                      <button key={lut.id} onClick={() => applyPreset(lut.id)}
                        style={{ background: lut.id === "reset" ? "rgba(239,68,68,0.06)" : "rgba(139,90,43,0.06)", border: lut.id === "reset" ? "1px solid rgba(239,68,68,0.2)" : "1px solid rgba(139,90,43,0.2)", borderRadius: "8px", padding: "12px", cursor: "pointer", transition: "all 0.2s", textAlign: "left", display: "flex", flexDirection: "column", gap: "4px" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a574"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = lut.id === "reset" ? "rgba(239,68,68,0.2)" : "rgba(139,90,43,0.2)"; }}
                      >
                        <span style={{ fontSize: "12px", fontWeight: 600, color: lut.id === "reset" ? "#ef4444" : "#fff" }}>{lut.name}</span>
                        <span style={{ fontSize: "9px", color: "#8c8780" }}>{lut.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ⚙️ Properties Tab */}
              {leftTab === "properties" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <span style={{ fontSize: "12px", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>PROPERTIES</span>
                  
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>PLAYBACK</div>
                  <div style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#8c8780", fontFamily: "'Poppins',sans-serif" }}>
                      <span style={{ fontWeight: 500 }}>Speed</span>
                      <span style={{ color: "#d4a574", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{state.playbackSpeed}x</span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                        <button key={speed} className="tool-btn" style={{ flex: "1 1 28%", justifyContent: "center", padding: "6px 2px", fontSize: 10, background: state.playbackSpeed === speed ? "linear-gradient(135deg,#8b5a2b,#a0522d)" : "none", borderColor: state.playbackSpeed === speed ? "transparent" : "rgba(139,90,43,0.2)", color: state.playbackSpeed === speed ? "#fff" : "#e5e5e5" }} onClick={() => onSetPlaybackSpeed(speed)}>{speed}x</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>COLOR GRADE</div>
                  {[
                    { key: "brightness", label: "Brightness", min: 0, max: 200, default: 100 },
                    { key: "contrast",   label: "Contrast",   min: 0, max: 300, default: 100 },
                    { key: "saturation", label: "Saturation", min: 0, max: 300, default: 100 },
                    { key: "hue",        label: "Hue Shift",  min: -180, max: 180, default: 0 },
                    { key: "opacity",    label: "Opacity",    min: 0, max: 100, default: 100 },
                  ].map(({ key, label, min, max, default: def }) => (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#8c8780" }}>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span style={{ color: state[key] !== def ? "#d4a574" : "#666", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{Math.round(state[key])}</span>
                      </div>
                      <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider" onChange={e => dispatch({ type: "SET_FILTER", key, value: parseFloat(e.target.value) })} />
                    </div>
                  ))}

                  <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#d4a574", fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>EFFECTS</div>
                  {[
                    { key: "blur",     label: "Blur",     min: 0, max: 20,  default: 0 },
                    { key: "sharpen",  label: "Sharpen",  min: 0, max: 100, default: 0 },
                    { key: "vignette", label: "Vignette", min: 0, max: 100, default: 0 },
                  ].map(({ key, label, min, max }) => (
                    <div key={key} style={{ marginBottom: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#8c8780" }}>
                        <span style={{ fontWeight: 500 }}>{label}</span>
                        <span style={{ color: state[key] !== 0 ? "#d4a574" : "#666", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{Math.round(state[key])}</span>
                      </div>
                      <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider" onChange={e => dispatch({ type: "SET_FILTER", key, value: parseFloat(e.target.value) })} />
                    </div>
                  ))}
                  <button className="tool-btn" style={{ width: "100%", justifyContent: "center", marginTop: 4, border: "1px solid rgba(139,90,43,0.25)", color: "#d4a574", background: "rgba(139,90,43,0.08)" }} onClick={onResetFilters}>↺ Reset all</button>

                  {selectedClipData && (
                    <div style={{ marginTop: 12, borderTop: "1px solid rgba(139,90,43,0.15)", paddingTop: 16 }}>
                      <div style={{ fontSize: 11, letterSpacing: "0.12em", color: "#d4a574", marginBottom: 12, fontWeight: 600, fontFamily: "'Poppins',sans-serif" }}>CLIP PROPERTIES</div>
                      <div style={{ fontSize: 12, color: "#e5e5e5", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{selectedClipData.name}</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 12 }}>
                        <div style={{ background: "#0c0a09", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(139,90,43,0.12)" }}>
                          <div style={{ color: "#8c8780", marginBottom: 4, fontSize: 10, fontWeight: 500 }}>Start</div>
                          <div style={{ color: "#ffffff", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "13px" }}>{fmtTime(selectedClipData.start)}</div>
                        </div>
                        <div style={{ background: "#0c0a09", padding: "10px 12px", borderRadius: 8, border: "1px solid rgba(139,90,43,0.12)" }}>
                          <div style={{ color: "#8c8780", marginBottom: 4, fontSize: 10, fontWeight: 500 }}>Duration</div>
                          <div style={{ color: "#ffffff", fontVariantNumeric: "tabular-nums", fontWeight: 600, fontSize: "13px" }}>{fmtTime(selectedClipData.duration)}</div>
                        </div>
                      </div>
                      {selectedClipData.type === "audio" && (
                        <div style={{ marginTop: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: "#8c8780" }}>
                            <span style={{ fontWeight: 500 }}>Volume</span>
                            <span style={{ color: "#d4a574", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{Math.round((selectedClipData.volume ?? 1) * 100)}%</span>
                          </div>
                          <input type="range" min={0} max={1} step={0.01} value={selectedClipData.volume ?? 1} className="filter-slider" onChange={e => onSetClipVolume(selectedClipData.id, parseFloat(e.target.value))} />
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button className="tool-btn" style={{ flex: 1, justifyContent: "center", border: "1px solid rgba(139,90,43,0.2)" }} onClick={onSplitClip}>✂ Split</button>
                        <button className="tool-btn" style={{ flex: 1, justifyContent: "center", border: "1px solid rgba(139,90,43,0.2)" }} onClick={onTrimClip}>✂ Trim</button>
                      </div>
                      <button className="tool-btn danger" style={{ width: "100%", justifyContent: "center", marginTop: 8 }} onClick={() => dispatch({ type: "REMOVE_CLIP", clipId: selectedClipData.id })}>✕ Remove clip</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {leftSidebarCollapsed && (
          <div className="sidebar-panel" style={{ width: 40, borderRight: "1px solid rgba(212,165,116,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <button className="tool-btn" style={{ padding: "8px", fontSize: 12, background: "rgba(212,165,116,0.08)", border: "1px solid rgba(212,165,116,0.2)", color: "#d4a574" }} onClick={() => setLeftSidebarCollapsed(false)}>▶</button>
          </div>
        )}

        {/* Center Area - Preview and Timeline */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0c0a09" }}>
          {/* Preview */}
          <div style={{ flex: "1 1 45%", maxHeight: "50%", minHeight: "220px", padding: "12px 20px", background: "#0c0a09", borderBottom: "1px solid rgba(139,90,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", background: "#131110", aspectRatio: "16/9", height: "100%", maxHeight: "100%", maxWidth: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(139,90,43,0.15)", boxShadow: "0 10px 40px rgba(0,0,0,0.4)" }}>
              {activeClip ? (
                activeClip.videoEl ? (
                  <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "contain", filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%)` }} playsInline />
                ) : (
                  <img src={activeClip.url} alt="" style={{ width: "100%", height: "100%", objectFit: "contain", filter: `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%)` }} />
                )
              ) : (
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(139,90,43,0.2)" }}>
                  <div style={{ fontSize: 32 }}>🎬</div>
                  <span style={{ fontSize: 13, color: "#8c8780", fontWeight: 500, fontFamily: "'Poppins',sans-serif" }}>Add media or upload to start editing</span>
                </div>
              )}
              {state.tracks.filter(t => t.type === "text").map(track =>
                track.clips.filter(c => c.start <= state.playhead && c.start + c.duration > state.playhead).map(clip => (
                  <div key={clip.id} style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", background: "rgba(12,10,9,0.92)", color: "#ffffff", padding: "8px 18px", borderRadius: "10px", fontSize: 15, fontFamily: "'Poppins',sans-serif", fontWeight: 500, whiteSpace: "nowrap", border: "1px solid #d4a574", boxShadow: "0 4px 20px rgba(139,90,43,0.25)" }}>
                    {clip.text}
                  </div>
                ))
              )}
              <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(12,10,9,0.85)", color: "#d4a574", fontSize: 12, padding: "5px 14px", borderRadius: "8px", fontVariantNumeric: "tabular-nums", fontWeight: 500, border: "1px solid rgba(139,90,43,0.3)", backdropFilter: "blur(8px)", fontFamily: "'Poppins',sans-serif" }}>
                {fmtTime(state.playhead)} / {fmtTime(state.duration)}
              </div>
              <button className="tool-btn primary" onClick={simulateExport} style={{ position: "absolute", top: 12, left: 12, padding: "8px 18px", fontSize: 12, backdropFilter: "blur(12px)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>⬆</span> Export
              </button>
              <div style={{ position: "absolute", bottom: 12, right: 12 }}>
                <div style={{ position: "relative" }}>
                  <button className="tool-btn primary" onClick={() => setShowAddMenu(!showAddMenu)} style={{ padding: "8px 18px", fontSize: 12, backdropFilter: "blur(12px)" }}>
                    <span>+</span> Add Media
                  </button>
                  {showAddMenu && (
                    <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 6, background: "#131110", border: "1px solid rgba(139,90,43,0.25)", borderRadius: "10px", overflow: "hidden", zIndex: 50, minWidth: 120, boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
                      {[{ fn: onAddVideo, icon: "📹", label: "Video" }, { fn: onAddImage, icon: "🖼️", label: "Image" }, { fn: onAddAudio, icon: "🎵", label: "Audio" }, { fn: onAddText, icon: "T", label: "Text" }].map((item, i) => (
                        <button key={item.label} className="tool-btn" onClick={() => { setShowAddMenu(false); item.fn(); }} style={{ width: "100%", justifyContent: "flex-start", padding: "10px 14px", border: "none", borderRadius: 0, background: "none", borderTop: i === 0 ? "none" : "1px solid rgba(139,90,43,0.12)" }}>
                          <span style={{ marginRight: 8 }}>{item.icon}</span> {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Floating Vertical Transport Controls */}
              <div className="glass-panel" style={{
                position: "absolute",
                left: 8,
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "8px 4px",
                borderRadius: "24px",
                zIndex: 50,
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                border: "1px solid rgba(212,165,116,0.22)"
              }}>
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: 0 })} title="Start"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg></button>
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 5) })} title="Back 5s"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/></svg></button>
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={onFrameBackward} title="Frame Back"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg></button>
                
                <button className="tool-btn primary" style={{ width: "26px", height: "26px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }} onClick={onTogglePlay}>
                  {state.isPlaying ? <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: "1.5px" }}><path d="M8 5v14l11-7z"/></svg>}
                </button>
                
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={onFrameForward} title="Frame Forward"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg></button>
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 5) })} title="Forward 5s"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6zm9-6l8.5 6V6z"/></svg></button>
                <button className="tool-btn" style={{ padding: "4px", border: "none", background: "none", color: "#8c8780" }} onClick={() => { dispatch({ type: "SET_PLAYING", value: false }); dispatch({ type: "SET_PLAYHEAD", time: state.duration }); }} title="End"><svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6zm9-12v12h2V6z"/></svg></button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ flex: "1 1 55%", display: "flex", flexDirection: "column", overflow: "hidden", minHeight: "240px" }}>
            <Timeline state={state} dispatch={dispatch} timelineRef={timelineRef} onTimelineClick={handleTimelineClick} onClipMouseDown={handleClipMouseDown} onResizeMouseDown={handleResizeMouseDown} onAddTrack={onAddTrack} />
          </div>
        </div>


      </div>

      <ExportModal show={showExport} progress={state.exportProgress} onClose={() => { setShowExport(false); dispatch({ type: "SET_EXPORT_PROGRESS", value: null }); }} />
    </div>
  );
}
