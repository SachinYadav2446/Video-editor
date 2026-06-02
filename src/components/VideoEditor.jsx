import { useState, useRef, useEffect, useCallback } from "react";
import { useEditorState } from "../hooks/useEditorState";
import { uid, fmtTime } from "../constants";
import Timeline from "./Timeline";
import ExportModal from "./ExportModal";

export default function VideoEditor({ onBack, user, initialProject }) {
  const [state, dispatch] = useEditorState();
  const [showExport, setShowExport]               = useState(false);
  const [exportUrl, setExportUrl]                 = useState(null);
  const [showAddMenu, setShowAddMenu]             = useState(false);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [leftTab, setLeftTab]                     = useState("media");
  const [activeTool, setActiveTool]               = useState("select"); // select | cut | trim
  const [undoStack, setUndoStack]                 = useState([]);
  const [showLeaveModal, setShowLeaveModal]       = useState(false);
  const [projectTitle, setProjectTitle]           = useState(() => {
    return initialProject ? initialProject.title : "Untitled Video Project";
  });
  const timelineRef      = useRef(null);
  const playIntervalRef  = useRef(null);
  const fileInputRef     = useRef(null);
  const jsonInputRef     = useRef(null);
  const fileInputTypeRef = useRef("video");
  const videoRef         = useRef(null);

  // Load project if provided
  useEffect(() => {
    if (initialProject && initialProject.data) {
      dispatch({ type: "LOAD_PROJECT", projectState: initialProject.data });
      if (initialProject.title) {
        setProjectTitle(initialProject.title);
      }
    }
  }, [initialProject, dispatch]);

  const handleSaveAndExit = () => {
    const savedWorks = JSON.parse(localStorage.getItem("creatify_past_works") || "[]");
    const projectId = initialProject?.id || `video_${Date.now()}`;
    const existingIdx = savedWorks.findIndex(w => w.id === projectId);
    
    const projectData = {
      id: projectId,
      title: projectTitle.trim() || "Untitled Video Project",
      category: "Video Edit",
      tool: "Video Editor",
      year: new Date().getFullYear().toString(),
      accent: "#d4a574",
      gradient: "linear-gradient(135deg, #1e110a 0%, #3a2215 50%, #0c0a09 100%)",
      icon: "🎬",
      tags: ["4K UHD", "LUTs", `${state.tracks.reduce((acc, t) => acc + t.clips.length, 0)} Clips`],
      desc: `Edited project with ${state.tracks.length} tracks.`,
      data: {
        tracks: state.tracks,
        duration: state.duration,
        brightness: state.brightness,
        contrast: state.contrast,
        saturation: state.saturation,
        hue: state.hue,
        opacity: state.opacity,
        playbackSpeed: state.playbackSpeed,
        blur: state.blur,
        sharpen: state.sharpen,
        vignette: state.vignette
      }
    };
    
    if (existingIdx > -1) {
      savedWorks[existingIdx] = projectData;
    } else {
      savedWorks.unshift(projectData);
    }
    
    localStorage.setItem("creatify_past_works", JSON.stringify(savedWorks));
    
    if (user && user.email) {
      const userKey = `creatify_video_projects_${user.email}`;
      const userProjects = JSON.parse(localStorage.getItem(userKey) || "[]");
      const uIdx = userProjects.findIndex(p => p.id === projectId);
      if (uIdx > -1) {
        userProjects[uIdx] = projectData;
      } else {
        userProjects.unshift(projectData);
      }
      localStorage.setItem(userKey, JSON.stringify(userProjects));
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
        console.log("Saved video project to DB successfully");
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

  // ── Active clip at playhead ──────────────────────────────────────────────
  const activeClip = state.tracks.flatMap(t => t.clips).find(c =>
    c.start <= state.playhead && c.start + c.duration > state.playhead && (c.videoEl || c.imageEl)
  );

  // ── Sync video element with timeline ────────────────────────────────────
  useEffect(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    if (activeClip?.videoEl) {
      if (video.src !== activeClip.url) { video.src = activeClip.url; video.load(); }
      const videoTime = state.playhead - activeClip.start;
      if (state.isPlaying) { video.play().catch(() => {}); }
      else { video.pause(); if (Math.abs(video.currentTime - videoTime) > 0.05) video.currentTime = videoTime; }
    } else { video.pause(); }
  }, [state.playhead, state.isPlaying, activeClip]);

  useEffect(() => {
    if (!videoRef.current || !state.isPlaying || !activeClip?.videoEl) return;
    const video = videoRef.current;
    const handleTimeUpdate = () => dispatch({ type: "SET_PLAYHEAD", time: activeClip.start + video.currentTime });
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [state.isPlaying, activeClip, dispatch]);

  // ── Dynamic duration ──────────────────────────────────────────────────
  useEffect(() => {
    let maxEnd = 0;
    state.tracks.forEach(t => t.clips.forEach(c => { if (c.start + c.duration > maxEnd) maxEnd = c.start + c.duration; }));
    const nd = Math.max(60, maxEnd + 10);
    if (Math.abs(nd - state.duration) > 1) dispatch({ type: "SET_DURATION", value: nd });
  }, [state.tracks, state.duration, dispatch]);

  // ── Playback interval for non-video clips ────────────────────────────
  useEffect(() => {
    const hasVideo = state.tracks.some(t => t.clips.some(c => c.videoEl && c.start <= state.playhead && c.start + c.duration > state.playhead));
    if (state.isPlaying && !hasVideo) {
      playIntervalRef.current = setInterval(() => {
        dispatch({ type: "SET_PLAYHEAD", time: state.playhead + 0.033 * state.playbackSpeed });
        if (state.playhead >= state.duration) { dispatch({ type: "SET_PLAYING", value: false }); dispatch({ type: "SET_PLAYHEAD", time: 0 }); }
      }, 33);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [state.isPlaying, state.playhead, state.duration, dispatch, state.tracks, state.playbackSpeed]);

  // ── Audio playback sync engine ──────────────────────────────────────────
  const audioElementsRef = useRef({});

  // Cleanup audios on unmount
  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(audio => {
        audio.pause();
        audio.src = "";
      });
    };
  }, []);

  // Sync audio playback with timeline playhead
  useEffect(() => {
    const audioClips = state.tracks
      .filter(t => t.type === "audio")
      .flatMap(t => t.clips);

    // Remove old audio tags
    const activeClipIds = new Set(audioClips.map(c => c.id));
    Object.keys(audioElementsRef.current).forEach(id => {
      if (!activeClipIds.has(id)) {
        const audio = audioElementsRef.current[id];
        audio.pause();
        audio.src = "";
        delete audioElementsRef.current[id];
      }
    });

    // Sync playhead state with actual HTML5 Audio playback
    audioClips.forEach(clip => {
      let audio = audioElementsRef.current[clip.id];
      if (!audio) {
        audio = new Audio(clip.url);
        audio.crossOrigin = "anonymous";
        audioElementsRef.current[clip.id] = audio;
      }

      // Update volume
      audio.volume = clip.volume ?? 1;

      const offsetTime = state.playhead - clip.start;
      const isWithinClipRange = offsetTime >= 0 && offsetTime < clip.duration;

      if (state.isPlaying && isWithinClipRange) {
        // Sync timecode if off by > 0.15s (prevents stuttering on continuous play)
        if (Math.abs(audio.currentTime - offsetTime) > 0.15) {
          audio.currentTime = offsetTime;
        }
        if (audio.paused) {
          audio.play().catch(e => console.warn("Audio element failed playing:", e.message));
        }
      } else {
        if (!audio.paused) {
          audio.pause();
        }
        if (isWithinClipRange) {
          audio.currentTime = offsetTime;
        } else {
          audio.currentTime = 0;
        }
      }
    });
  }, [state.isPlaying, state.playhead, state.tracks]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      switch (e.key) {
        case " ": e.preventDefault(); dispatch({ type: "SET_PLAYING", value: !state.isPlaying }); break;
        case "ArrowLeft":
          e.preventDefault();
          dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - (e.shiftKey ? 0.033 : 5)) }); break;
        case "ArrowRight":
          e.preventDefault();
          dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + (e.shiftKey ? 0.033 : 5)) }); break;
        case "s": if (e.ctrlKey || e.metaKey) { e.preventDefault(); onSplitClip(); } break;
        case "Delete": case "Backspace": if (state.selectedClip) { e.preventDefault(); onDeleteClip(); } break;
        case "z": if (e.ctrlKey || e.metaKey) { e.preventDefault(); /* undo stub */ } break;
        case "Home": e.preventDefault(); dispatch({ type: "SET_PLAYHEAD", time: 0 }); break;
        case "End": e.preventDefault(); dispatch({ type: "SET_PLAYHEAD", time: state.duration }); break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.selectedClip, state.playhead, state.duration, state.isPlaying, state.tracks, dispatch]);

  // ── Handlers ─────────────────────────────────────────────────────────
  const selectedClipData = state.selectedClip
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip)
    : null;

  useEffect(() => { if (state.selectedClip) setLeftTab("properties"); }, [state.selectedClip]);

  const selectedTextClip = state.selectedClip
    ? state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip && c.type === "text")
    : null;

  const addTextClip = () => {
    let track = state.tracks.find(t => t.type === "text");
    if (!track) { track = { id: uid(), type: "text", name: "Text", clips: [] }; dispatch({ type: "ADD_TRACK", track }); }
    const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { id: uid(), name: "Text Clip", text: "Your Text Here", start: maxStart, duration: 4, type: "text" } });
  };

  const handleFileUpload = (e) => {
    Array.from(e.target.files).forEach(file => {
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
          const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
          dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { id: clipId, name: file.name, start: maxStart, duration: video.duration || 10, url, videoEl: video, type: "video" } });
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
    const sc = timelineRef.current.closest(".timeline-scroll-container");
    const x = e.clientX - rect.left + (sc ? sc.scrollLeft : 0);
    if (x < 0) return;
    dispatch({ type: "SET_PLAYHEAD", time: x / PX_PER_SEC });
  };

  const handleClipMouseDown = (e, trackId, clip) => {
    e.stopPropagation();
    dispatch({ type: "SELECT_CLIP", clipId: clip.id });
    // Cut tool: split on click
    if (activeTool === "cut") {
      const track = state.tracks.find(t => t.id === trackId);
      if (track) dispatch({ type: "SPLIT_CLIP", trackId, clipId: clip.id, time: state.playhead });
      return;
    }
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

  const onSplitClip = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track) dispatch({ type: "SPLIT_CLIP", trackId: track.id, clipId: state.selectedClip, time: state.playhead });
  };

  const onDeleteClip = () => {
    if (!state.selectedClip) return;
    dispatch({ type: "REMOVE_CLIP", clipId: state.selectedClip });
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

  const onTrimInAtPlayhead = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track && state.playhead > clip.start && state.playhead < clip.start + clip.duration) {
      const newDuration = (clip.start + clip.duration) - state.playhead;
      dispatch({ type: "TRIM_CLIP", trackId: track.id, clipId: state.selectedClip, newStart: state.playhead, newDuration });
    }
  };

  const onTrimOutAtPlayhead = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track && state.playhead > clip.start && state.playhead < clip.start + clip.duration) {
      const newDuration = state.playhead - clip.start;
      dispatch({ type: "TRIM_CLIP", trackId: track.id, clipId: state.selectedClip, newStart: clip.start, newDuration });
    }
  };

  const onDuplicateClip = () => {
    if (!state.selectedClip) return;
    const clip = state.tracks.flatMap(t => t.clips).find(c => c.id === state.selectedClip);
    const track = state.tracks.find(t => t.clips.some(c => c.id === state.selectedClip));
    if (clip && track) {
      dispatch({ type: "ADD_CLIP", trackId: track.id, clip: { ...clip, id: uid(), start: clip.start + clip.duration } });
    }
  };

  const onTogglePlay = () => dispatch({ type: "SET_PLAYING", value: !state.isPlaying });
  const onFrameForward = () => dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 0.033) });
  const onFrameBackward = () => dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 0.033) });
  const onSetPlaybackSpeed = (speed) => { dispatch({ type: "SET_PLAYBACK_SPEED", value: speed }); if (videoRef.current) videoRef.current.playbackRate = speed; };
  const onAddTrack = () => { dispatch({ type: "ADD_TRACK", track: { id: uid(), type: "video", name: `Track ${state.tracks.length + 1}`, clips: [] } }); };
  const onResetFilters = () => ["brightness","contrast","saturation","hue","opacity","blur","sharpen","vignette"].forEach(k => dispatch({ type: "SET_FILTER", key: k, value: k==="hue"||k==="blur"||k==="sharpen"||k==="vignette" ? 0 : 100 }));
  const onSetClipVolume = (clipId, volume) => dispatch({ type: "UPDATE_CLIP_VOLUME", clipId, volume });
  const onAddVideo  = () => { fileInputTypeRef.current = "video"; fileInputRef.current.click(); };
  const onAddImage  = () => { fileInputTypeRef.current = "image"; fileInputRef.current.click(); };
  const onAddAudio  = () => { fileInputTypeRef.current = "audio"; fileInputRef.current.click(); };

  const STOCK_MEDIA = [
    { id: "sv1", name: "SaaS Product Intro",   type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-animation-of-a-screen-with-graphs-34356-large.mp4",                    duration: 8,  thumb: "📊" },
    { id: "sv2", name: "Modern Office Loop",    type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-woman-working-on-a-laptop-in-a-bright-office-42323-large.mp4",         duration: 12, thumb: "💻" },
    { id: "sv3", name: "Cinematic Forest",      type: "video", url: "https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-thick-forest-and-river-42358-large.mp4",               duration: 15, thumb: "🌲" },
    { id: "si1", name: "Creatify Hero Art",     type: "image", url: "https://picsum.photos/id/180/800/450",  duration: 5,  thumb: "📸" },
    { id: "si2", name: "Creative Brand Logo",   type: "image", url: "https://picsum.photos/id/200/800/450",  duration: 5,  thumb: "🎨" },
    { id: "sa1", name: "Upbeat Synthwave",      type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3", duration: 30, thumb: "🎵" },
    { id: "sa2", name: "Ambient Piano",         type: "audio", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3", duration: 30, thumb: "🎹" },
  ];

  const addStockMedia = (item) => {
    let track = state.tracks.find(t => t.type === item.type);
    let trackId;
    if (!track) { trackId = uid(); dispatch({ type: "ADD_TRACK", track: { id: trackId, type: item.type, name: item.type.toUpperCase() + " Track", clips: [] } }); }
    else trackId = track.id;
    const clipId = uid();
    const newClip = { id: clipId, name: item.name, start: state.playhead, duration: item.duration, url: item.url, type: item.type };
    if (item.type === "image") { const img = new Image(); img.onload = () => dispatch({ type: "ADD_CLIP", trackId, clip: { ...newClip, imageEl: img } }); img.src = item.url; }
    else if (item.type === "video") { const v = document.createElement("video"); v.src = item.url; v.playsInline = true; v.crossOrigin = "anonymous"; v.onloadedmetadata = () => dispatch({ type: "ADD_CLIP", trackId, clip: { ...newClip, duration: v.duration || item.duration, videoEl: v } }); }
    else dispatch({ type: "ADD_CLIP", trackId, clip: newClip });
  };

  const applyPreset = (name) => {
    const presets = {
      vintage: { brightness:105, contrast:110, saturation:125, hue:6,   vignette:20, blur:0, sharpen:5  },
      cyber:   { brightness:100, contrast:125, saturation:160, hue:310, vignette:15, blur:0, sharpen:20 },
      noir:    { brightness:95,  contrast:135, saturation:0,   hue:0,   vignette:40, blur:0, sharpen:10 },
      cream:   { brightness:110, contrast:90,  saturation:95,  hue:10,  vignette:8,  blur:2, sharpen:0  },
      reset:   { brightness:100, contrast:100, saturation:100, hue:0,   vignette:0,  blur:0, sharpen:0, opacity:100 },
    };
    if (presets[name]) Object.entries(presets[name]).forEach(([key, value]) => dispatch({ type: "SET_FILTER", key, value }));
  };

  const exportProjectJson = () => {
    const projectData = {
      title: projectTitle,
      tracks: state.tracks,
      duration: state.duration,
      brightness: state.brightness,
      contrast: state.contrast,
      saturation: state.saturation,
      hue: state.hue,
      opacity: state.opacity,
      playbackSpeed: state.playbackSpeed,
      blur: state.blur,
      sharpen: state.sharpen,
      vignette: state.vignette
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle.replace(/\s+/g, "_")}_project.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importProjectJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.tracks) {
          dispatch({ type: "LOAD_PROJECT", projectState: data });
          if (data.title) setProjectTitle(data.title);
        }
      } catch (err) {
        alert("Invalid project file: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const performRealExport = async () => {
    setShowExport(true);
    dispatch({ type: "SET_EXPORT_PROGRESS", value: 0 });
    setExportUrl(null);

    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");

    const stream = canvas.captureStream(30);

    // Instantiate client-side Web Audio mixing pipeline
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioDest = audioCtx.createMediaStreamDestination();

    // Merge video track and mixed audio track
    const combinedTracks = [];
    stream.getVideoTracks().forEach(t => combinedTracks.push(t));
    audioDest.stream.getAudioTracks().forEach(t => combinedTracks.push(t));
    const combinedStream = new MediaStream(combinedTracks);
    
    let options = { mimeType: 'video/webm;codecs=vp8,opus' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    
    const chunks = [];
    const recorder = new MediaRecorder(combinedStream, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    
    const activeSources = [];

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setExportUrl(url);
      dispatch({ type: "SET_EXPORT_PROGRESS", value: 100 });

      // Clean up AudioContext & source nodes
      activeSources.forEach(s => { try { s.stop(); } catch(e) {} });
      audioCtx.close();
    };

    recorder.start();

    const totalDuration = Math.min(state.duration || 60, 60); // cap export to max 60s for speed/memory safety
    const fps = 20;
    const totalFrames = Math.ceil(totalDuration * fps);
    const timeStep = 1 / fps;

    const clips = state.tracks.flatMap(t => t.clips);
    const videoClips = clips.filter(c => c.type === 'video');
    const imageClips = clips.filter(c => c.type === 'image');
    const audioClips = clips.filter(c => c.type === 'audio');
    
    const loadedImages = {};
    for (const c of imageClips) {
      if (c.imageEl) {
        loadedImages[c.id] = c.imageEl;
      } else {
        const img = new Image();
        img.src = c.url;
        await new Promise((res) => { img.onload = res; img.onerror = res; });
        loadedImages[c.id] = img;
      }
    }

    const activeVideoElements = {};
    for (const c of videoClips) {
      const v = document.createElement("video");
      v.src = c.url;
      v.muted = true;
      v.playsInline = true;
      v.crossOrigin = "anonymous";
      await new Promise((res) => { 
        v.onloadedmetadata = res; 
        v.onerror = res;
        setTimeout(res, 1000);
      });
      activeVideoElements[c.id] = v;
    }

    // Schedule all audio & video files' audio to compile inside the AudioContext
    const allClipsWithAudio = [...audioClips, ...videoClips];
    for (const c of allClipsWithAudio) {
      try {
        const res = await fetch(c.url);
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const audioBuf = await audioCtx.decodeAudioData(arrayBuf);
          
          const source = audioCtx.createBufferSource();
          source.buffer = audioBuf;
          
          const gainNode = audioCtx.createGain();
          gainNode.gain.value = c.volume ?? 1;
          
          source.connect(gainNode);
          gainNode.connect(audioDest);
          
          // Connect to destination if you want to preview-hear it during export (muted by default)
          // gainNode.connect(audioCtx.destination);
          
          source.start(audioCtx.currentTime + c.start);
          activeSources.push(source);
        }
      } catch (err) {
        console.warn("Could not decode audio channel for clip:", c.name, err.message);
      }
    }

    // Capture frames sequentially
    for (let i = 0; i < totalFrames; i++) {
      const currentTimeCode = i * timeStep;
      dispatch({ type: "SET_EXPORT_PROGRESS", value: (i / totalFrames) * 95 });

      ctx.fillStyle = "#0c0a09";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const currentActiveClips = clips.filter(c => c.start <= currentTimeCode && c.start + c.duration > currentTimeCode);

      for (const c of currentActiveClips) {
        if (c.type === 'image' && loadedImages[c.id]) {
          ctx.save();
          ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%) blur(${state.blur}px)`;
          ctx.drawImage(loadedImages[c.id], 0, 0, canvas.width, canvas.height);
          ctx.restore();
        } else if (c.type === 'video' && activeVideoElements[c.id]) {
          const v = activeVideoElements[c.id];
          const offsetTime = currentTimeCode - c.start;
          v.currentTime = Math.min(v.duration, Math.max(0, offsetTime));
          await new Promise((res) => {
            v.onseeked = res;
            setTimeout(res, 50);
          });
          
          ctx.save();
          ctx.filter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%) blur(${state.blur}px)`;
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          ctx.restore();
        }
      }

      if (state.vignette > 0) {
        const gradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 10,
          canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 1.5
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${state.vignette / 100})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const activeTextClips = clips.filter(c => c.type === 'text' && c.start <= currentTimeCode && c.start + c.duration > currentTimeCode);
      for (const c of activeTextClips) {
        ctx.save();
        ctx.font = `600 32px 'Poppins', sans-serif`;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = canvas.width / 2;
        const textY = canvas.height * 0.86;
        
        const textWidth = ctx.measureText(c.text).width;
        ctx.fillStyle = 'rgba(10, 8, 7, 0.88)';
        ctx.beginPath();
        ctx.roundRect(textX - textWidth / 2 - 20, textY - 25, textWidth + 40, 50, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(c.text, textX, textY);
        ctx.restore();
      }

      await new Promise(r => setTimeout(r, 5));
    }

    recorder.stop();
  };

  // ── CSS filter string ────────────────────────────────────────────────
  const cssFilter = `brightness(${state.brightness}%) contrast(${state.contrast}%) saturate(${state.saturation}%) hue-rotate(${state.hue}deg) opacity(${state.opacity}%) blur(${state.blur}px)`;

  // ── Tool definitions ────────────────────────────────────────────────
  const tools = [
    { id:"select", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0l16 12-7 1 4 7-2 1-4-7-7 6z"/></svg>, label:"Select (V)" },
    { id:"cut",    icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12"/></svg>, label:"Cut (C)" },
    { id:"trim",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3l14 9-14 9V3z"/><line x1="19" y1="3" x2="19" y2="21"/></svg>, label:"Trim (T)" },
  ];

  // ── Edit actions (toolbar) ────────────────────────────────────────
  const editActions = [
    { label:"Split at playhead", icon:"✂", action: onSplitClip,          disabled: !state.selectedClip },
    { label:"Trim In",           icon:"◁|", action: onTrimInAtPlayhead,   disabled: !state.selectedClip },
    { label:"Trim Out",          icon:"|▷", action: onTrimOutAtPlayhead,  disabled: !state.selectedClip },
    { label:"Duplicate",         icon:"⊕",  action: onDuplicateClip,      disabled: !state.selectedClip },
    { label:"Delete clip",       icon:"✕",  action: onDeleteClip,         disabled: !state.selectedClip, danger: true },
  ];

  return (
    <div style={{ background:"#0c0a09", color:"#e5e5e5", fontFamily:"'Instrument Sans',sans-serif", height:"100vh", width:"100vw", display:"flex", flexDirection:"column", overflow:"hidden", userSelect:"none" }}>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&family=Instrument+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        body,html{height:100%;width:100%;overflow:hidden;background:#0c0a09}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#0c0a09}
        ::-webkit-scrollbar-thumb{background:rgba(212,165,116,0.18);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:#d4a574}
        .clip-block{cursor:grab;transition:opacity 0.1s,box-shadow 0.1s}
        .clip-block:hover{opacity:0.88}
        .clip-block.selected{box-shadow:0 0 0 2px #d4a574,inset 0 0 0 1px rgba(212,165,116,0.3);filter:brightness(1.12)}
        .tool-btn{background:rgba(212,165,116,0.05);border:1px solid rgba(212,165,116,0.15);color:#e5e5e5;padding:6px 14px;border-radius:7px;cursor:pointer;font-size:12px;font-family:'Poppins',sans-serif;font-weight:400;display:inline-flex;align-items:center;gap:7px;transition:all 0.18s;white-space:nowrap;flex-shrink:0}
        .tool-btn:hover{background:rgba(212,165,116,0.12);color:#d4a574;border-color:rgba(212,165,116,0.4);transform:translateY(-1px)}
        .tool-btn:disabled{opacity:0.35;cursor:not-allowed;pointer-events:none;transform:none}
        .tool-btn.primary{background:linear-gradient(135deg,#8b5a2b,#d4a574);border:none;color:#fff;box-shadow:0 2px 10px rgba(139,90,43,0.3);font-weight:500}
        .tool-btn.primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(139,90,43,0.45)}
        .tool-btn.danger{color:#ef4444;border-color:rgba(239,68,68,0.2);background:rgba(239,68,68,0.04)}
        .tool-btn.danger:hover{background:rgba(239,68,68,0.14);border-color:#ef4444}
        .tool-btn.active{background:rgba(212,165,116,0.18);color:#d4a574;border-color:#d4a574}
        .filter-slider{width:100%;-webkit-appearance:none;appearance:none;height:3px;background:rgba(212,165,116,0.15);border-radius:2px;outline:none;cursor:pointer}
        .filter-slider::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;background:#d4a574;border-radius:50%;cursor:pointer;box-shadow:0 0 6px rgba(139,90,43,0.35);transition:all 0.1s}
        .filter-slider::-webkit-slider-thumb:hover{transform:scale(1.2)}
        .filter-slider::-moz-range-thumb{width:13px;height:13px;background:#d4a574;border:none;border-radius:50%}
        .track-row{display:flex;align-items:stretch;border-bottom:1px solid rgba(212,165,116,0.07)}
        .track-label{width:140px;min-width:140px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;background:rgba(14,12,11,0.8);border-right:1px solid rgba(212,165,116,0.08);font-size:11px;gap:4px}
        .timeline-area{overflow-x:auto;overflow-y:visible;flex:1}
        .glass-panel{background:rgba(14,12,11,0.85);backdrop-filter:blur(20px) saturate(160%);border:1px solid rgba(212,165,116,0.14);box-shadow:0 8px 32px rgba(0,0,0,0.4)}
        .sidebar-panel{background:rgba(14,12,11,0.85);backdrop-filter:blur(20px) saturate(160%)}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        .rec-dot{animation:blink 1s infinite}
      `}</style>

      <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" style={{ display:"none" }} onChange={handleFileUpload} />



      {/* ── Main Body ─────────────────────────────────────────────────── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", background:"#0c0a09" }}>

        {/* ── Left Sidebar ─────────────────────────────────────────────── */}
        {!leftSidebarCollapsed ? (
          <div className="sidebar-panel" style={{ width:"280px", minWidth:"280px", borderRight:"1px solid rgba(212,165,116,0.1)", display:"flex", flexDirection:"column", height:"100%", zIndex:5, flexShrink:0 }}>
            {/* Tab bar */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(212,165,116,0.08)", background:"rgba(10,8,7,0.5)" }}>
              {[
                { id:"media",   label:"Media",   icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 2H8l-2 4h12z"/></svg> },
                { id:"text",    label:"Text",    icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg> },
                { id:"presets", label:"LUTs",    icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/></svg> },
                { id:"properties", label:"Props", icon:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg> },
              ].map(tab => {
                const active = leftTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setLeftTab(tab.id)} style={{ flex:1, padding:"10px 0 8px", background:"none", border:"none", borderBottom: active ? "2px solid #d4a574" : "2px solid transparent", color: active ? "#d4a574" : "#5c5650", fontWeight: active ? 600 : 400, fontSize:"10px", fontFamily:"'Poppins',sans-serif", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:"5px", transition:"color 0.2s" }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#d4a574"; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#5c5650"; }}
                  >
                    {tab.icon} {tab.label}
                  </button>
                );
              })}
              <button onClick={() => setLeftSidebarCollapsed(true)} style={{ padding:"0 10px", background:"none", border:"none", color:"#5c5650", cursor:"pointer", fontSize:"12px", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#d4a574"} onMouseLeave={e => e.currentTarget.style.color="#5c5650"}>◀</button>
            </div>

            {/* Tab content */}
            <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>

              {/* ─ Media ─ */}
              {leftTab === "media" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>ASSETS LIBRARY</span>
                    <div style={{ display:"flex", gap:"6px" }}>
                      <button className="tool-btn" onClick={onAddVideo} style={{ padding:"4px 9px", fontSize:"10px" }}>📹</button>
                      <button className="tool-btn" onClick={onAddImage} style={{ padding:"4px 9px", fontSize:"10px" }}>🖼</button>
                      <button className="tool-btn" onClick={onAddAudio} style={{ padding:"4px 9px", fontSize:"10px" }}>🎵</button>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px" }}>
                    {STOCK_MEDIA.map(item => (
                      <div key={item.id} onClick={() => addStockMedia(item)}
                        style={{ background:"rgba(139,90,43,0.06)", border:"1px solid rgba(139,90,43,0.14)", borderRadius:"9px", padding:"10px", cursor:"pointer", transition:"all 0.18s" }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor="#d4a574"; e.currentTarget.style.background="rgba(139,90,43,0.12)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(139,90,43,0.14)"; e.currentTarget.style.background="rgba(139,90,43,0.06)"; }}
                      >
                        <div style={{ fontSize:"22px", marginBottom:"6px" }}>{item.thumb}</div>
                        <div style={{ fontSize:"10px", fontWeight:600, color:"#e5e5e5", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.name}</div>
                        <div style={{ fontSize:"9px", color:"#5c5650", textTransform:"uppercase", marginTop:"2px" }}>{item.type} · {item.duration}s</div>
                      </div>
                    ))}
                  </div>
                  <button className="tool-btn" onClick={() => fileInputRef.current.click()} style={{ justifyContent:"center", padding:"9px", fontSize:"11px", marginTop:"4px" }}>
                    + Upload your files
                  </button>
                </div>
              )}

              {/* ─ Text ─ */}
              {leftTab === "text" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
                  <span style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>TEXT OVERLAYS</span>
                  <button className="tool-btn" onClick={addTextClip} style={{ justifyContent:"center", padding:"10px", fontSize:"12px", fontWeight:500 }}>+ Add Title Overlay</button>
                  {selectedTextClip ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:"10px", padding:"12px", border:"1px solid rgba(34,211,168,0.2)", background:"rgba(34,211,168,0.03)", borderRadius:"10px" }}>
                      <div style={{ fontSize:"10px", color:"#22d3a8", fontWeight:700 }}>EDIT TEXT</div>
                      <textarea value={selectedTextClip.text} onChange={e => dispatch({ type:"UPDATE_CLIP_TEXT", clipId:selectedTextClip.id, text:e.target.value })}
                        style={{ width:"100%", height:"72px", background:"#0c0a09", border:"1px solid rgba(139,90,43,0.2)", borderRadius:"8px", color:"#fff", fontSize:"12px", padding:"8px", outline:"none", fontFamily:"inherit", resize:"none" }}
                        placeholder="Type overlay text..." />
                    </div>
                  ) : (
                    <div style={{ padding:"12px", border:"1px dashed rgba(139,90,43,0.15)", borderRadius:"10px", color:"#5c5650", fontSize:"11px" }}>
                      Select a text clip on the timeline to edit it.
                    </div>
                  )}
                </div>
              )}

              {/* ─ Presets / LUTs ─ */}
              {leftTab === "presets" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
                  <span style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>CINEMATIC LUTS</span>
                  {[
                    { id:"vintage", name:"Vintage Gold",    desc:"Warm amber, high sat" },
                    { id:"cyber",   name:"Cyberpunk Mint",  desc:"Neon green hue shift" },
                    { id:"noir",    name:"Moody Noir",      desc:"High-contrast monochrome" },
                    { id:"cream",   name:"Dreamy Sunkissed",desc:"Soft warm cream glow" },
                    { id:"reset",   name:"Reset Grading",   desc:"Restore original colors", danger:true },
                  ].map(lut => (
                    <button key={lut.id} onClick={() => applyPreset(lut.id)}
                      style={{ background: lut.danger ? "rgba(239,68,68,0.05)" : "rgba(139,90,43,0.06)", border: lut.danger ? "1px solid rgba(239,68,68,0.18)" : "1px solid rgba(139,90,43,0.18)", borderRadius:"8px", padding:"10px 12px", cursor:"pointer", transition:"all 0.18s", textAlign:"left", display:"flex", flexDirection:"column", gap:"3px" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = lut.danger ? "#ef4444" : "#d4a574"; e.currentTarget.style.background = lut.danger ? "rgba(239,68,68,0.1)" : "rgba(139,90,43,0.12)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = lut.danger ? "rgba(239,68,68,0.18)" : "rgba(139,90,43,0.18)"; e.currentTarget.style.background = lut.danger ? "rgba(239,68,68,0.05)" : "rgba(139,90,43,0.06)"; }}
                    >
                      <span style={{ fontSize:"11px", fontWeight:600, color: lut.danger ? "#ef4444" : "#e5e5e5" }}>{lut.name}</span>
                      <span style={{ fontSize:"9px", color:"#5c5650" }}>{lut.desc}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ─ Properties ─ */}
              {leftTab === "properties" && (
                <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
                  <span style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>PROPERTIES</span>

                  {/* Playback speed */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"8px", fontSize:"11px", color:"#8c8780" }}>
                      <span>Playback speed</span>
                      <span style={{ color:"#d4a574", fontWeight:600 }}>{state.playbackSpeed}x</span>
                    </div>
                    <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                      {[0.5,0.75,1,1.25,1.5,2].map(s => (
                        <button key={s} onClick={() => onSetPlaybackSpeed(s)} className="tool-btn" style={{ flex:"1 1 28%", justifyContent:"center", padding:"5px 2px", fontSize:"10px", background: state.playbackSpeed===s ? "linear-gradient(135deg,#8b5a2b,#a0522d)" : "none", borderColor: state.playbackSpeed===s ? "transparent" : "rgba(139,90,43,0.2)", color: state.playbackSpeed===s ? "#fff" : "#e5e5e5" }}>{s}x</button>
                      ))}
                    </div>
                  </div>

                  <div style={{ height:"1px", background:"rgba(212,165,116,0.08)" }} />

                  {/* Color grade */}
                  <div style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>COLOR GRADE</div>
                  {[
                    { key:"brightness", label:"Brightness", min:0, max:200, def:100 },
                    { key:"contrast",   label:"Contrast",   min:0, max:300, def:100 },
                    { key:"saturation", label:"Saturation", min:0, max:300, def:100 },
                    { key:"hue",        label:"Hue Shift",  min:-180, max:180, def:0 },
                    { key:"opacity",    label:"Opacity",    min:0, max:100, def:100 },
                  ].map(({ key, label, min, max, def }) => (
                    <div key={key}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px", fontSize:"11px", color:"#8c8780" }}>
                        <span>{label}</span>
                        <span style={{ color: state[key]!==def ? "#d4a574" : "#555", fontVariantNumeric:"tabular-nums", fontWeight:600 }}>{Math.round(state[key])}</span>
                      </div>
                      <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider" onChange={e => dispatch({ type:"SET_FILTER", key, value:parseFloat(e.target.value) })} />
                    </div>
                  ))}

                  <div style={{ height:"1px", background:"rgba(212,165,116,0.08)" }} />

                  {/* Effects */}
                  <div style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700 }}>EFFECTS</div>
                  {[
                    { key:"blur",     label:"Blur",     min:0, max:20  },
                    { key:"sharpen",  label:"Sharpen",  min:0, max:100 },
                    { key:"vignette", label:"Vignette", min:0, max:100 },
                  ].map(({ key, label, min, max }) => (
                    <div key={key}>
                      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px", fontSize:"11px", color:"#8c8780" }}>
                        <span>{label}</span>
                        <span style={{ color: state[key]!==0 ? "#d4a574" : "#555", fontVariantNumeric:"tabular-nums", fontWeight:600 }}>{Math.round(state[key])}</span>
                      </div>
                      <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider" onChange={e => dispatch({ type:"SET_FILTER", key, value:parseFloat(e.target.value) })} />
                    </div>
                  ))}
                  <button className="tool-btn" style={{ justifyContent:"center", fontSize:"11px", borderColor:"rgba(139,90,43,0.2)", color:"#d4a574" }} onClick={onResetFilters}>↺ Reset all filters</button>

                  {/* Selected clip props */}
                  {selectedClipData && (
                    <div style={{ marginTop:"8px", paddingTop:"14px", borderTop:"1px solid rgba(212,165,116,0.1)" }}>
                      <div style={{ fontSize:"10px", letterSpacing:"0.1em", color:"#d4a574", fontWeight:700, marginBottom:"10px" }}>SELECTED CLIP</div>
                      <div style={{ fontSize:"12px", color:"#e5e5e5", fontWeight:600, marginBottom:"10px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{selectedClipData.name}</div>
                      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"8px", marginBottom:"12px" }}>
                        {[{ label:"Start", val:fmtTime(selectedClipData.start) }, { label:"Duration", val:fmtTime(selectedClipData.duration) }].map(x => (
                          <div key={x.label} style={{ background:"#0c0a09", padding:"8px 10px", borderRadius:"7px", border:"1px solid rgba(139,90,43,0.12)" }}>
                            <div style={{ color:"#5c5650", fontSize:"9px", fontWeight:500, marginBottom:"3px" }}>{x.label}</div>
                            <div style={{ color:"#fff", fontVariantNumeric:"tabular-nums", fontWeight:600, fontSize:"12px" }}>{x.val}</div>
                          </div>
                        ))}
                      </div>
                      {selectedClipData.type === "audio" && (
                        <div style={{ marginBottom:"12px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px", fontSize:"11px", color:"#8c8780" }}>
                            <span>Volume</span>
                            <span style={{ color:"#d4a574", fontWeight:600 }}>{Math.round((selectedClipData.volume ?? 1)*100)}%</span>
                          </div>
                          <input type="range" min={0} max={1} step={0.01} value={selectedClipData.volume ?? 1} className="filter-slider" onChange={e => onSetClipVolume(selectedClipData.id, parseFloat(e.target.value))} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ width:36, borderRight:"1px solid rgba(212,165,116,0.1)", display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(10,8,7,0.85)", flexShrink:0 }}>
            <button onClick={() => setLeftSidebarCollapsed(false)} style={{ background:"none", border:"none", color:"#5c5650", cursor:"pointer", padding:"8px", transition:"color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color="#d4a574"} onMouseLeave={e => e.currentTarget.style.color="#5c5650"}>▶</button>
          </div>
        )}

        {/* ── Center: Preview + Toolbar + Timeline ──────────────────────── */}
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", background:"#0c0a09" }}>

          {/* Video Preview — takes 60% of center height */}
          <div style={{ flex:"0 0 58%", position:"relative", background:"#080604", borderBottom:"1px solid rgba(212,165,116,0.1)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            {/* Preview canvas */}
            <div style={{ position:"relative", aspectRatio:"16/9", height:"calc(100% - 24px)", maxWidth:"calc(100% - 24px)", background:"#131110", borderRadius:"10px", overflow:"hidden", border:"1px solid rgba(139,90,43,0.18)", boxShadow:"0 12px 48px rgba(0,0,0,0.6)" }}>

              {activeClip ? (
                activeClip.videoEl ? (
                  <video ref={videoRef} style={{ width:"100%", height:"100%", objectFit:"contain", filter:cssFilter }} playsInline />
                ) : (
                  <img src={activeClip.url} alt="" style={{ width:"100%", height:"100%", objectFit:"contain", filter:cssFilter }} />
                )
              ) : (
                <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"14px" }}>
                  <div style={{ width:"56px", height:"56px", borderRadius:"50%", border:"1.5px solid rgba(139,90,43,0.25)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(139,90,43,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="14" rx="2"/><path d="M16 2H8l-2 4h12z"/></svg>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"14px", color:"rgba(139,90,43,0.6)", fontWeight:500, marginBottom:"6px" }}>No media on timeline</div>
                    <div style={{ fontSize:"11px", color:"#3c3834" }}>Upload or choose stock media from the sidebar</div>
                  </div>
                </div>
              )}

              {/* Text overlays */}
              {state.tracks.filter(t => t.type === "text").map(track =>
                track.clips.filter(c => c.start <= state.playhead && c.start + c.duration > state.playhead).map(clip => (
                  <div key={clip.id} style={{ position:"absolute", bottom:"14%", left:"50%", transform:"translateX(-50%)", background:"rgba(10,8,7,0.88)", color:"#fff", padding:"7px 18px", borderRadius:"8px", fontSize:"14px", fontFamily:"'Poppins',sans-serif", fontWeight:500, whiteSpace:"nowrap", border:"1px solid #d4a574", boxShadow:"0 4px 16px rgba(139,90,43,0.2)" }}>
                    {clip.text}
                  </div>
                ))
              )}

              {/* Timecode overlay bottom-left */}
              <div style={{ position:"absolute", bottom:"10px", left:"12px", background:"rgba(10,8,7,0.82)", color:"#d4a574", fontSize:"11px", padding:"4px 10px", borderRadius:"6px", fontVariantNumeric:"tabular-nums", fontWeight:600, border:"1px solid rgba(139,90,43,0.25)", backdropFilter:"blur(8px)", fontFamily:"'Poppins',sans-serif" }}>
                {fmtTime(state.playhead)} / {fmtTime(state.duration)}
              </div>

              {/* Resolution badge bottom-right */}
              <div style={{ position:"absolute", bottom:"10px", right:"12px", background:"rgba(10,8,7,0.7)", color:"#5c5650", fontSize:"9px", padding:"3px 8px", borderRadius:"5px", border:"1px solid rgba(212,165,116,0.08)", fontWeight:600, letterSpacing:"0.06em" }}>
                1920 × 1080 · 30FPS
              </div>

              {/* Vignette effect overlay */}
              {state.vignette > 0 && (
                <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse at center, transparent ${100-state.vignette}%, rgba(0,0,0,${state.vignette/100}) 100%)`, pointerEvents:"none" }} />
              )}
            </div>

            {/* Floating vertical transport — now right side of preview, not overlapping */}
            <div className="glass-panel" style={{ position:"absolute", right:"16px", top:"50%", transform:"translateY(-50%)", display:"flex", flexDirection:"column", alignItems:"center", gap:"3px", padding:"8px 5px", borderRadius:"20px", zIndex:10 }}>
              {[
                { fn:() => dispatch({type:"SET_PLAYHEAD",time:0}),                                                     icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg>,         title:"Go to start" },
                { fn:() => dispatch({type:"SET_PLAYHEAD",time:Math.max(0,state.playhead-5)}),                          icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6zm.5-6 8.5 6V6z"/></svg>,         title:"Back 5s" },
                { fn:onFrameBackward,                                                                                   icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>, title:"Frame back" },
                { fn:onTogglePlay, primary:true,                                                                        icon: state.isPlaying ? <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" style={{marginLeft:"1.5px"}}><path d="M8 5v14l11-7z"/></svg>, title:"Play / Pause (Space)" },
                { fn:onFrameForward,                                                                                    icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>, title:"Frame forward" },
                { fn:() => dispatch({type:"SET_PLAYHEAD",time:Math.min(state.duration,state.playhead+5)}),             icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6zm9-6 8.5 6V6z"/></svg>,         title:"Forward 5s" },
                { fn:() => { dispatch({type:"SET_PLAYING",value:false}); dispatch({type:"SET_PLAYHEAD",time:state.duration}); }, icon:<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6zm9-12v12h2V6z"/></svg>, title:"Go to end" },
              ].map((btn, i) => (
                <button key={i} onClick={btn.fn} title={btn.title} style={{ width: btn.primary ? "28px" : "24px", height: btn.primary ? "28px" : "24px", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", padding:0, border:"none", background: btn.primary ? "linear-gradient(135deg,#8b5a2b,#d4a574)" : "transparent", color: btn.primary ? "#fff" : "#8c8780", cursor:"pointer", transition:"all 0.18s", boxShadow: btn.primary ? "0 2px 10px rgba(139,90,43,0.4)" : "none" }}
                  onMouseEnter={e => { if (!btn.primary) e.currentTarget.style.color="#d4a574"; }}
                  onMouseLeave={e => { if (!btn.primary) e.currentTarget.style.color="#8c8780"; }}
                >
                  {btn.icon}
                </button>
              ))}
            </div>
          </div>

          {/* ── Editing Toolbar strip ──────────────────────────────────── */}
          <div style={{ height:"44px", display:"flex", alignItems:"center", gap:"0", background:"rgba(10,8,7,0.9)", borderBottom:"1px solid rgba(212,165,116,0.1)", flexShrink:0, padding:"0 12px", overflow:"hidden" }}>
            
            {/* Exit/Back button */}
            <button onClick={() => setShowLeaveModal(true)} className="tool-btn danger" style={{ marginRight:"12px", padding:"5px 12px", gap:"6px", fontSize:"11px" }} title="Exit Studio">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M5 12l7 7M5 12l7-7"/></svg>
              Exit
            </button>

            <input ref={jsonInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={importProjectJson} />
            <button className="tool-btn" onClick={() => jsonInputRef.current.click()} title="Import Project (.json)" style={{ padding: "5px 10px", fontSize: "11px", gap: "5px" }}>
              📥 Import JSON
            </button>
            <button className="tool-btn" onClick={exportProjectJson} title="Backup Project (.json)" style={{ padding: "5px 10px", fontSize: "11px", gap: "5px", marginRight: "8px" }}>
              💾 Export JSON
            </button>

            <div style={{ width:"1px", height:"16px", background:"rgba(212,165,116,0.15)", marginRight:"12px" }} />

            {/* Tool selector group */}
            <div style={{ display:"flex", gap:"2px", padding:"0 8px 0 0", marginRight:"8px", borderRight:"1px solid rgba(212,165,116,0.1)" }}>
              {tools.map(t => (
                <button key={t.id} className={`tool-btn${activeTool===t.id?" active":""}`} onClick={() => setActiveTool(t.id)} title={t.label} style={{ padding:"5px 10px", fontSize:"11px", gap:"5px" }}>
                  {t.icon} {t.label.split(" ")[0]}
                </button>
              ))}
            </div>

            {/* Edit action buttons */}
            <div style={{ display:"flex", gap:"4px", padding:"0 8px", borderRight:"1px solid rgba(212,165,116,0.1)", marginRight:"8px" }}>
              {editActions.map(a => (
                <button key={a.label} className={`tool-btn${a.danger?" danger":""}`} onClick={a.action} disabled={a.disabled} title={a.label} style={{ padding:"5px 10px", fontSize:"11px", gap:"5px" }}>
                  <span>{a.icon}</span> <span style={{ display:"none" }}>{a.label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Zoom control */}
            <div style={{ display:"flex", alignItems:"center", gap:"8px", padding:"0 8px", borderRight:"1px solid rgba(212,165,116,0.1)", marginRight:"8px" }}>
              <span style={{ fontSize:"10px", color:"#5c5650", fontWeight:500 }}>ZOOM</span>
              <button className="tool-btn" onClick={() => dispatch({ type:"SET_ZOOM", value:Math.max(0.25, state.zoom - 0.25) })} style={{ padding:"3px 8px", fontSize:"12px" }}>−</button>
              <span style={{ fontSize:"11px", color:"#d4a574", fontWeight:600, minWidth:"40px", textAlign:"center", fontVariantNumeric:"tabular-nums" }}>{Math.round(state.zoom*100)}%</span>
              <button className="tool-btn" onClick={() => dispatch({ type:"SET_ZOOM", value:Math.min(4, state.zoom + 0.25) })} style={{ padding:"3px 8px", fontSize:"12px" }}>+</button>
            </div>

            {/* Add track */}
            <button className="tool-btn" onClick={onAddTrack} style={{ padding:"5px 12px", fontSize:"11px", gap:"6px" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add track
            </button>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Export button */}
            <button className="tool-btn primary" onClick={performRealExport} style={{ padding:"6px 16px", gap:"6px", fontSize:"12.5px", marginRight:"12px" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Export
            </button>

            <div style={{ width:"1px", height:"16px", background:"rgba(212,165,116,0.15)", marginRight:"12px" }} />

            {/* Right side: keyboard shortcut hints */}
            <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
              {[["Space","Play/Pause"], ["S","Split"], ["Del","Delete"]].map(([key, label]) => (
                <div key={key} style={{ display:"flex", alignItems:"center", gap:"5px", fontSize:"10px", color:"#3c3834" }}>
                  <span style={{ background:"rgba(212,165,116,0.08)", border:"1px solid rgba(212,165,116,0.12)", borderRadius:"4px", padding:"1px 5px", fontFamily:"monospace", color:"#8c8780", fontWeight:600 }}>{key}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Timeline ──────────────────────────────────────────────── */}
          <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minHeight:"0" }}>
            <Timeline state={state} dispatch={dispatch} timelineRef={timelineRef} onTimelineClick={handleTimelineClick} onClipMouseDown={handleClipMouseDown} onResizeMouseDown={handleResizeMouseDown} onAddTrack={onAddTrack} />
          </div>
        </div>
      </div>

      <ExportModal show={showExport} progress={state.exportProgress} downloadUrl={exportUrl} fileName={`${projectTitle.replace(/\s+/g, "_")}.webm`} onClose={() => { setShowExport(false); dispatch({ type:"SET_EXPORT_PROGRESS", value:null }); }} />

      {/* Leave Confirmation Modal */}
      {showLeaveModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:999, backdropFilter:"blur(12px)" }}>
          <div className="glass-panel" style={{ width:"420px", padding:"30px", borderRadius:"24px", textAlign:"center", border:"1px solid rgba(212,165,116,0.25)", background:"#131110" }}>
            <div style={{ fontSize:"40px", marginBottom:"16px" }}>💾</div>
            <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"22px", fontWeight:800, color:"#fff", marginBottom:"10px", letterSpacing:"-0.03em" }}>Save project changes?</h3>
            <p style={{ fontSize:"13.5px", color:"#8c8780", lineHeight:1.6, marginBottom:"24px", fontWeight:300 }}>
              Would you like to save this video editing session to your past works, or discard your current edits?
            </p>
            
            {/* Input field for project title */}
            <div style={{ marginBottom: "24px", textAlign: "left" }}>
              <label style={{ fontSize: "11px", color: "#d4a574", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "8px" }}>Project Name</label>
              <input 
                type="text" 
                value={projectTitle} 
                onChange={e => setProjectTitle(e.target.value)} 
                style={{ width: "100%", background: "#0c0a09", border: "1px solid rgba(212,165,116,0.18)", borderRadius: "8px", color: "#fff", padding: "10px 14px", fontSize: "13px", outline: "none", transition: "border-color 0.2s" }}
                placeholder="My Awesome Video"
              />
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              <button className="tool-btn primary" onClick={handleSaveAndExit} style={{ justifyContent:"center", padding:"12px", fontSize:"13px", fontWeight:500 }}>
                Save & Exit to Dashboard
              </button>
              <div style={{ display:"flex", gap:"10px" }}>
                <button className="tool-btn danger" onClick={handleDiscardAndExit} style={{ flex:1, justifyContent:"center", padding:"10px", fontSize:"12.5px" }}>
                  Discard Edits
                </button>
                <button className="tool-btn" onClick={() => setShowLeaveModal(false)} style={{ flex:1, justifyContent:"center", padding:"10px", fontSize:"12.5px" }}>
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
