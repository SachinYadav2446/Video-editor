import { useState, useRef, useEffect, useCallback, useReducer } from "react";

const TRACK_COLORS = {
  video: { bg: "#1a3a5c", border: "#2d6fa8", label: "#5baee8" },
  image: { bg: "#1a3d2b", border: "#2d8a52", label: "#5bc98a" },
  text: { bg: "#3d2a1a", border: "#a06030", label: "#e8a05b" },
  audio: { bg: "#2a1a3d", border: "#7030a0", label: "#b05be8" },
};

const initialState = {
  tracks: [],
  playhead: 0,
  isPlaying: false,
  duration: 30,
  zoom: 1,
  selectedClip: null,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  opacity: 100,
  exportProgress: null,
  previewMode: false,
};

function editorReducer(state, action) {
  switch (action.type) {
    case "ADD_TRACK":
      return { ...state, tracks: [...state.tracks, action.track] };
    case "ADD_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === action.trackId
            ? { ...t, clips: [...t.clips, action.clip] }
            : t
        ),
      };
    case "REMOVE_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== action.clipId),
        })),
        selectedClip: state.selectedClip === action.clipId ? null : state.selectedClip,
      };
    case "MOVE_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === action.trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === action.clipId ? { ...c, start: Math.max(0, action.start) } : c
                ),
              }
            : t
        ),
      };
    case "RESIZE_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) =>
          t.id === action.trackId
            ? {
                ...t,
                clips: t.clips.map((c) =>
                  c.id === action.clipId
                    ? { ...c, duration: Math.max(0.5, action.duration) }
                    : c
                ),
              }
            : t
        ),
      };
    case "SET_PLAYHEAD":
      return { ...state, playhead: Math.min(action.time, state.duration) };
    case "SET_PLAYING":
      return { ...state, isPlaying: action.value };
    case "SELECT_CLIP":
      return { ...state, selectedClip: action.clipId };
    case "SET_FILTER":
      return { ...state, [action.key]: action.value };
    case "SET_DURATION":
      return { ...state, duration: action.value };
    case "SET_ZOOM":
      return { ...state, zoom: Math.max(0.3, Math.min(4, action.value)) };
    case "REMOVE_TRACK":
      return {
        ...state,
        tracks: state.tracks.filter((t) => t.id !== action.trackId),
      };
    case "SET_EXPORT_PROGRESS":
      return { ...state, exportProgress: action.value };
    case "UPDATE_CLIP_TEXT":
      return {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === action.clipId ? { ...c, text: action.text } : c
          ),
        })),
      };
    default:
      return state;
  }
}

let _id = 1;
const uid = () => `id_${_id++}`;

export default function VideoEditor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [dragState, setDragState] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [editingText, setEditingText] = useState(null);
  const timelineRef = useRef(null);
  const playIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputTypeRef = useRef("video");
  const glRef = useRef(null);

  const PX_PER_SEC = 80 * state.zoom;

  // WebGL canvas setup for preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) return;
    glRef.current = gl;

    const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        gl_Position = vec4(a_pos, 0.0, 1.0);
        v_uv = a_uv;
      }
    `;
    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_hue;
      uniform float u_opacity;

      vec3 rgb2hsl(vec3 c) {
        float mx = max(max(c.r,c.g),c.b), mn = min(min(c.r,c.g),c.b);
        float h=0.0, s=0.0, l=(mx+mn)/2.0;
        if(mx!=mn) {
          float d=mx-mn;
          s = l>0.5 ? d/(2.0-mx-mn) : d/(mx+mn);
          if(mx==c.r) h=(c.g-c.b)/d + (c.g<c.b?6.0:0.0);
          else if(mx==c.g) h=(c.b-c.r)/d+2.0;
          else h=(c.r-c.g)/d+4.0;
          h/=6.0;
        }
        return vec3(h,s,l);
      }
      float hue2rgb(float p,float q,float t){
        if(t<0.0)t+=1.0; if(t>1.0)t-=1.0;
        if(t<1.0/6.0)return p+(q-p)*6.0*t;
        if(t<1.0/2.0)return q;
        if(t<2.0/3.0)return p+(q-p)*(2.0/3.0-t)*6.0;
        return p;
      }
      vec3 hsl2rgb(vec3 c){
        if(c.y==0.0) return vec3(c.z);
        float q=c.z<0.5?c.z*(1.0+c.y):c.z+c.y-c.z*c.y;
        float p=2.0*c.z-q;
        return vec3(hue2rgb(p,q,c.x+1.0/3.0),hue2rgb(p,q,c.x),hue2rgb(p,q,c.x-1.0/3.0));
      }
      void main() {
        vec4 color = texture2D(u_tex, v_uv);
        vec3 rgb = color.rgb;
        rgb = (rgb - 0.5) * u_contrast + 0.5;
        rgb = clamp(rgb * u_brightness, 0.0, 1.0);
        vec3 hsl = rgb2hsl(rgb);
        hsl.x = fract(hsl.x + u_hue);
        hsl.y = clamp(hsl.y * u_saturation, 0.0, 1.0);
        rgb = hsl2rgb(hsl);
        gl_FragColor = vec4(rgb, color.a * u_opacity);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1,-1, 0,1,  1,-1, 1,1,  -1,1, 0,0,
       1,-1, 1,1,  1, 1, 1,0,  -1,1, 0,0,
    ]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, "a_pos");
    const aUv = gl.getAttribLocation(prog, "a_uv");
    gl.enableVertexAttribArray(aPos);
    gl.enableVertexAttribArray(aUv);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.vertexAttribPointer(aUv, 2, gl.FLOAT, false, 16, 8);

    gl.uniform1i(gl.getUniformLocation(prog, "u_tex"), 0);
    glRef.current = { gl, prog };
  }, []);

  // Draw preview frame
  const drawPreview = useCallback(() => {
    if (!glRef.current || !canvasRef.current) return;
    const { gl, prog } = glRef.current;
    gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
    gl.clearColor(0.05, 0.05, 0.08, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const { brightness, contrast, saturation, hue, opacity } = state;
    gl.uniform1f(gl.getUniformLocation(prog, "u_brightness"), brightness / 100);
    gl.uniform1f(gl.getUniformLocation(prog, "u_contrast"), contrast / 100);
    gl.uniform1f(gl.getUniformLocation(prog, "u_saturation"), saturation / 100);
    gl.uniform1f(gl.getUniformLocation(prog, "u_hue"), hue / 360);
    gl.uniform1f(gl.getUniformLocation(prog, "u_opacity"), opacity / 100);

    // Find active clip at playhead
    let drawnAny = false;
    for (const track of state.tracks) {
      for (const clip of track.clips) {
        if (clip.start <= state.playhead && clip.start + clip.duration > state.playhead) {
          if (clip.imageEl) {
            const tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, clip.imageEl);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            gl.deleteTexture(tex);
            drawnAny = true;
            break;
          }
        }
      }
      if (drawnAny) break;
    }
  }, [state]);

  useEffect(() => { drawPreview(); }, [drawPreview]);

  // Playback
  useEffect(() => {
    if (state.isPlaying) {
      playIntervalRef.current = setInterval(() => {
        dispatch({ type: "SET_PLAYHEAD", time: state.playhead + 0.1 });
        if (state.playhead >= state.duration) {
          dispatch({ type: "SET_PLAYING", value: false });
          dispatch({ type: "SET_PLAYHEAD", time: 0 });
        }
      }, 100);
    }
    return () => clearInterval(playIntervalRef.current);
  }, [state.isPlaying, state.playhead, state.duration]);

  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const type = fileInputTypeRef.current;
      const url = URL.createObjectURL(file);
      const clipId = uid();

      if (type === "image" || file.type.startsWith("image/")) {
        const img = new Image();
        img.onload = () => {
          // Find or create image track
          let track = state.tracks.find((t) => t.type === "image");
          if (!track) {
            track = { id: uid(), type: "image", name: "Images", clips: [] };
            dispatch({ type: "ADD_TRACK", track });
          }
          const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
          dispatch({
            type: "ADD_CLIP",
            trackId: track.id,
            clip: { id: clipId, name: file.name, start: maxStart, duration: 5, url, imageEl: img, type: "image" },
          });
          if (maxStart + 5 > state.duration) dispatch({ type: "SET_DURATION", value: maxStart + 5 + 5 });
        };
        img.src = url;
      } else if (file.type.startsWith("video/")) {
        const video = document.createElement("video");
        video.src = url;
        video.onloadedmetadata = () => {
          let track = state.tracks.find((t) => t.type === "video");
          if (!track) {
            track = { id: uid(), type: "video", name: "Video", clips: [] };
            dispatch({ type: "ADD_TRACK", track });
          }
          const dur = video.duration || 10;
          const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
          dispatch({
            type: "ADD_CLIP",
            trackId: track.id,
            clip: { id: clipId, name: file.name, start: maxStart, duration: dur, url, videoEl: video, type: "video" },
          });
          if (maxStart + dur > state.duration) dispatch({ type: "SET_DURATION", value: maxStart + dur + 5 });
        };
      } else if (file.type.startsWith("audio/")) {
        let track = state.tracks.find((t) => t.type === "audio");
        if (!track) {
          track = { id: uid(), type: "audio", name: "Audio", clips: [] };
          dispatch({ type: "ADD_TRACK", track });
        }
        const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
        dispatch({
          type: "ADD_CLIP",
          trackId: track.id,
          clip: { id: clipId, name: file.name, start: maxStart, duration: 30, url, type: "audio" },
        });
      }
    });
    e.target.value = "";
  }, [state.tracks, state.duration]);

  const addTextClip = () => {
    let track = state.tracks.find((t) => t.type === "text");
    if (!track) {
      track = { id: uid(), type: "text", name: "Text", clips: [] };
      dispatch({ type: "ADD_TRACK", track });
    }
    const maxStart = track.clips.reduce((m, c) => Math.max(m, c.start + c.duration), 0);
    const clipId = uid();
    dispatch({
      type: "ADD_CLIP",
      trackId: track.id,
      clip: { id: clipId, name: "Text Clip", text: "Your Text Here", start: maxStart, duration: 4, type: "text" },
    });
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 140;
    if (x < 0) return;
    dispatch({ type: "SET_PLAYHEAD", time: x / PX_PER_SEC });
  };

  const handleClipMouseDown = (e, trackId, clip) => {
    e.stopPropagation();
    dispatch({ type: "SELECT_CLIP", clipId: clip.id });
    const startX = e.clientX;
    const startPos = clip.start;
    const onMove = (me) => {
      const dx = (me.clientX - startX) / PX_PER_SEC;
      dispatch({ type: "MOVE_CLIP", trackId, clipId: clip.id, start: startPos + dx });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleResizeMouseDown = (e, trackId, clip) => {
    e.stopPropagation();
    const startX = e.clientX;
    const startDur = clip.duration;
    const onMove = (me) => {
      const dx = (me.clientX - startX) / PX_PER_SEC;
      dispatch({ type: "RESIZE_CLIP", trackId, clipId: clip.id, duration: startDur + dx });
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m}:${String(sec).padStart(2,"0")}.${ms}`;
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

  const selectedClipData = state.selectedClip
    ? state.tracks.flatMap((t) => t.clips).find((c) => c.id === state.selectedClip)
    : null;

  const timeMarkers = [];
  const step = state.zoom < 0.5 ? 10 : state.zoom < 1 ? 5 : 2;
  for (let i = 0; i <= state.duration; i += step) timeMarkers.push(i);

  return (
    <div style={{ background: "#0d0f14", color: "#cdd6f4", fontFamily: "'DM Mono', 'Fira Code', monospace", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", userSelect: "none" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0d0f14}
        ::-webkit-scrollbar-thumb{background:#2a2d3a;border-radius:2px}
        .clip-block{cursor:grab;transition:opacity 0.1s}
        .clip-block:hover{opacity:0.9}
        .clip-block.selected{box-shadow:0 0 0 2px #7eb3f0}
        .tool-btn{background:none;border:0.5px solid #2a2d3a;color:#8892a4;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:11px;font-family:inherit;display:flex;align-items:center;gap:6px;transition:all 0.15s;white-space:nowrap}
        .tool-btn:hover{background:#1a1d26;color:#cdd6f4;border-color:#4a5068}
        .tool-btn.primary{background:#1e3a5f;border-color:#2d6fa8;color:#7eb3f0}
        .tool-btn.primary:hover{background:#264d7a;color:#a8cff5}
        .tool-btn.danger{color:#f38ba8;border-color:#5a2030}
        .tool-btn.danger:hover{background:#2a1020;color:#f38ba8}
        .filter-slider{width:100%;-webkit-appearance:none;appearance:none;height:3px;background:#2a2d3a;border-radius:2px;outline:none;cursor:pointer}
        .filter-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:#7eb3f0;border-radius:50%;cursor:pointer}
        .filter-slider::-moz-range-thumb{width:12px;height:12px;background:#7eb3f0;border:none;border-radius:50%;cursor:pointer}
        .track-row{display:flex;align-items:stretch;border-bottom:1px solid #1a1d26}
        .track-label{width:140px;min-width:140px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;background:#111318;border-right:1px solid #1a1d26;font-size:11px;gap:4px}
        .timeline-area{overflow-x:auto;overflow-y:visible;flex:1}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .recording-dot{animation:pulse 1s infinite}
      `}</style>

      {/* TOPBAR */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "#111318", borderBottom: "1px solid #1a1d26", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 8 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg,#264d7a,#1a3a5c)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</div>
          <span style={{ fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", color: "#e4e8f5", letterSpacing: "-0.02em" }}>CINÉCUT</span>
          <span style={{ fontSize: 10, color: "#4a5068", marginLeft: 4 }}>v0.1</span>
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <button className="tool-btn" onClick={() => { fileInputTypeRef.current = "video"; fileInputRef.current.click(); }}>
            <span>⬜</span> Add Video
          </button>
          <button className="tool-btn" onClick={() => { fileInputTypeRef.current = "image"; fileInputRef.current.click(); }}>
            <span>🖼</span> Add Image
          </button>
          <button className="tool-btn" onClick={() => { fileInputTypeRef.current = "audio"; fileInputRef.current.click(); }}>
            <span>♪</span> Add Audio
          </button>
          <button className="tool-btn" onClick={addTextClip}>
            <span>T</span> Add Text
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#4a5068" }}>
          <span>ZOOM</span>
          <input type="range" min="0.3" max="4" step="0.1" value={state.zoom} onChange={(e) => dispatch({ type: "SET_ZOOM", value: parseFloat(e.target.value) })} className="filter-slider" style={{ width: 70 }} />
          <span style={{ minWidth: 28, color: "#8892a4" }}>{state.zoom.toFixed(1)}x</span>
        </div>

        <button className="tool-btn primary" onClick={simulateExport} style={{ marginLeft: 8 }}>
          ⬆ Export
        </button>
        <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" style={{ display: "none" }} onChange={handleFileUpload} />
      </div>

      {/* MAIN AREA */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* PREVIEW PANEL */}
        <div style={{ width: 340, minWidth: 260, display: "flex", flexDirection: "column", borderRight: "1px solid #1a1d26", background: "#0d0f14" }}>
          <div style={{ padding: "8px 12px", borderBottom: "1px solid #1a1d26", fontSize: 10, color: "#4a5068", letterSpacing: "0.12em" }}>PREVIEW</div>

          {/* Canvas preview */}
          <div style={{ position: "relative", background: "#050608", aspectRatio: "16/9", width: "100%" }}>
            <canvas ref={canvasRef} width={640} height={360} style={{ width: "100%", height: "100%", display: "block" }} />
            {state.tracks.length === 0 && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#2a2d3a" }}>
                <div style={{ fontSize: 32 }}>▶</div>
                <span style={{ fontSize: 11 }}>Upload media to preview</span>
              </div>
            )}
            {/* Overlaid text clips */}
            {state.tracks.filter((t) => t.type === "text").map((track) =>
              track.clips
                .filter((c) => c.start <= state.playhead && c.start + c.duration > state.playhead)
                .map((clip) => (
                  <div key={clip.id} style={{ position: "absolute", bottom: "15%", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "#fff", padding: "6px 14px", borderRadius: 4, fontSize: 14, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, whiteSpace: "nowrap" }}>
                    {clip.text}
                  </div>
                ))
            )}
            {/* Playback overlay */}
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "#7eb3f0", fontSize: 11, padding: "2px 8px", borderRadius: 4, fontVariantNumeric: "tabular-nums" }}>
              {fmtTime(state.playhead)} / {fmtTime(state.duration)}
            </div>
          </div>

          {/* Transport controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "10px 12px", borderBottom: "1px solid #1a1d26" }}>
            <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: 0 })}>⏮</button>
            <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.max(0, state.playhead - 5) })}>⏪</button>
            <button className="tool-btn primary" style={{ padding: "8px 16px", fontSize: 16 }}
              onClick={() => dispatch({ type: "SET_PLAYING", value: !state.isPlaying })}>
              {state.isPlaying ? "⏸" : "▶"}
            </button>
            <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => dispatch({ type: "SET_PLAYHEAD", time: Math.min(state.duration, state.playhead + 5) })}>⏩</button>
            <button className="tool-btn" style={{ padding: "6px 10px" }} onClick={() => { dispatch({ type: "SET_PLAYING", value: false }); dispatch({ type: "SET_PLAYHEAD", time: state.duration }); }}>⏭</button>
          </div>

          {/* Color grading */}
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#4a5068", marginBottom: 12 }}>COLOR GRADE</div>
            {[
              { key: "brightness", label: "Brightness", min: 0, max: 200, default: 100 },
              { key: "contrast", label: "Contrast", min: 0, max: 300, default: 100 },
              { key: "saturation", label: "Saturation", min: 0, max: 300, default: 100 },
              { key: "hue", label: "Hue Shift", min: -180, max: 180, default: 0 },
              { key: "opacity", label: "Opacity", min: 0, max: 100, default: 100 },
            ].map(({ key, label, min, max, def }) => (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 11, color: "#8892a4" }}>
                  <span>{label}</span>
                  <span style={{ color: state[key] !== (def ?? 100) ? "#7eb3f0" : "#4a5068", fontVariantNumeric: "tabular-nums" }}>{Math.round(state[key])}</span>
                </div>
                <input type="range" min={min} max={max} step="1" value={state[key]} className="filter-slider"
                  onChange={(e) => dispatch({ type: "SET_FILTER", key, value: parseFloat(e.target.value) })} />
              </div>
            ))}
            <button className="tool-btn" style={{ width: "100%", justifyContent: "center", marginTop: 4 }}
              onClick={() => ["brightness","contrast","saturation","hue","opacity"].forEach(k =>
                dispatch({ type: "SET_FILTER", key: k, value: k === "hue" ? 0 : k === "opacity" ? 100 : 100 })
              )}>
              ↺ Reset all
            </button>

            {/* Selected clip properties */}
            {selectedClipData && (
              <div style={{ marginTop: 16, borderTop: "1px solid #1a1d26", paddingTop: 14 }}>
                <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#4a5068", marginBottom: 10 }}>CLIP PROPERTIES</div>
                <div style={{ fontSize: 11, color: "#8892a4", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedClipData.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 11 }}>
                  <div style={{ background: "#111318", padding: "6px 8px", borderRadius: 4 }}>
                    <div style={{ color: "#4a5068", marginBottom: 2 }}>Start</div>
                    <div style={{ color: "#cdd6f4", fontVariantNumeric: "tabular-nums" }}>{fmtTime(selectedClipData.start)}</div>
                  </div>
                  <div style={{ background: "#111318", padding: "6px 8px", borderRadius: 4 }}>
                    <div style={{ color: "#4a5068", marginBottom: 2 }}>Duration</div>
                    <div style={{ color: "#cdd6f4", fontVariantNumeric: "tabular-nums" }}>{fmtTime(selectedClipData.duration)}</div>
                  </div>
                </div>
                {selectedClipData.type === "text" && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, color: "#4a5068", marginBottom: 4 }}>Text content</div>
                    {editingText === selectedClipData.id ? (
                      <input
                        autoFocus
                        defaultValue={selectedClipData.text}
                        style={{ width: "100%", background: "#1a1d26", border: "1px solid #2d6fa8", color: "#cdd6f4", padding: "5px 8px", borderRadius: 4, fontSize: 12, fontFamily: "inherit", boxSizing: "border-box" }}
                        onBlur={(e) => { dispatch({ type: "UPDATE_CLIP_TEXT", clipId: selectedClipData.id, text: e.target.value }); setEditingText(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      />
                    ) : (
                      <div style={{ background: "#111318", padding: "5px 8px", borderRadius: 4, fontSize: 12, cursor: "text", color: "#cdd6f4" }} onClick={() => setEditingText(selectedClipData.id)}>
                        {selectedClipData.text || "Click to edit"}
                      </div>
                    )}
                  </div>
                )}
                <button className="tool-btn danger" style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
                  onClick={() => dispatch({ type: "REMOVE_CLIP", clipId: selectedClipData.id })}>
                  ✕ Remove clip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE SECTION */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", borderBottom: "1px solid #1a1d26", background: "#111318", flexShrink: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: "0.12em", color: "#4a5068" }}>TIMELINE</span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#7eb3f0", fontVariantNumeric: "tabular-nums" }}>{fmtTime(state.playhead)}</span>
              <span style={{ fontSize: 11, color: "#2a2d3a" }}>/</span>
              <span style={{ fontSize: 11, color: "#4a5068", fontVariantNumeric: "tabular-nums" }}>{fmtTime(state.duration)}</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="tool-btn" style={{ padding: "3px 8px", fontSize: 10 }}
                onClick={() => { const t = { id: uid(), type: "video", name: `Track ${state.tracks.length + 1}`, clips: [] }; dispatch({ type: "ADD_TRACK", track: t }); }}>
                + Track
              </button>
            </div>
          </div>

          {/* Timeline ruler + tracks */}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Ruler */}
            <div style={{ display: "flex", flexShrink: 0, position: "sticky", top: 0, zIndex: 10, background: "#0d0f14", borderBottom: "1px solid #1a1d26" }}>
              <div style={{ width: 140, minWidth: 140, background: "#0d0f14", borderRight: "1px solid #1a1d26" }} />
              <div
                ref={timelineRef}
                style={{ flex: 1, position: "relative", height: 28, cursor: "crosshair", overflowX: "hidden" }}
                onClick={handleTimelineClick}
              >
                <div style={{ width: state.duration * PX_PER_SEC + 200, height: "100%", position: "relative" }}>
                  {timeMarkers.map((t) => (
                    <div key={t} style={{ position: "absolute", left: t * PX_PER_SEC, top: 0, height: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ width: 1, height: t % (step * 2) === 0 ? 12 : 6, background: "#2a2d3a" }} />
                      {t % (step * 2) === 0 && <span style={{ fontSize: 9, color: "#4a5068", paddingLeft: 3, marginTop: 1 }}>{fmtTime(t)}</span>}
                    </div>
                  ))}
                  {/* Playhead */}
                  <div style={{ position: "absolute", left: state.playhead * PX_PER_SEC, top: 0, width: 1, height: "100%", background: "#f38ba8", zIndex: 20, pointerEvents: "none" }}>
                    <div style={{ position: "absolute", top: 0, left: -4, width: 9, height: 9, background: "#f38ba8", clipPath: "polygon(50% 100%, 0 0, 100% 0)" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Empty state */}
            {state.tracks.length === 0 && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#2a2d3a" }}>
                <div style={{ fontSize: 36 }}>◈</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, color: "#4a5068", marginBottom: 4 }}>No media on timeline</div>
                  <div style={{ fontSize: 11, color: "#2a2d3a" }}>Add video, images, audio, or text above</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="tool-btn primary" onClick={() => { fileInputTypeRef.current = "video"; fileInputRef.current.click(); }}>Add media</button>
                  <button className="tool-btn" onClick={addTextClip}>Add text</button>
                </div>
              </div>
            )}

            {/* Tracks */}
            {state.tracks.map((track) => {
              const colors = TRACK_COLORS[track.type] || TRACK_COLORS.video;
              return (
                <div key={track.id} className="track-row" style={{ minHeight: 52 }}>
                  <div className="track-label">
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <div style={{ fontSize: 10, color: colors.label, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>{track.type}</div>
                      <div style={{ fontSize: 11, color: "#8892a4", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</div>
                    </div>
                    <button className="tool-btn danger" style={{ padding: "2px 5px", fontSize: 10, flexShrink: 0 }}
                      onClick={() => dispatch({ type: "REMOVE_TRACK", trackId: track.id })}>✕</button>
                  </div>

                  <div
                    style={{ flex: 1, position: "relative", overflowX: "hidden", cursor: "crosshair" }}
                    onClick={handleTimelineClick}
                  >
                    <div style={{ width: state.duration * PX_PER_SEC + 200, height: "100%", minHeight: 52, position: "relative" }}>
                      {track.clips.map((clip) => (
                        <div
                          key={clip.id}
                          className={`clip-block${state.selectedClip === clip.id ? " selected" : ""}`}
                          style={{
                            position: "absolute",
                            left: clip.start * PX_PER_SEC,
                            width: Math.max(clip.duration * PX_PER_SEC - 2, 8),
                            top: 6,
                            height: 40,
                            background: colors.bg,
                            border: `1px solid ${colors.border}`,
                            borderRadius: 4,
                            overflow: "hidden",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseDown={(e) => handleClipMouseDown(e, track.id, clip)}
                        >
                          {clip.imageEl && (
                            <img src={clip.url} alt="" style={{ height: "100%", width: "auto", opacity: 0.5, pointerEvents: "none" }} />
                          )}
                          {clip.type === "audio" && (
                            <div style={{ flex: 1, height: "100%", display: "flex", alignItems: "center", padding: "0 6px" }}>
                              {Array.from({ length: Math.floor(clip.duration * PX_PER_SEC / 4) }).map((_, i) => (
                                <div key={i} style={{ width: 1, height: `${20 + Math.sin(i * 2.1) * 14}px`, background: colors.border, marginRight: 3, borderRadius: 1 }} />
                              ))}
                            </div>
                          )}
                          <div style={{ position: "absolute", left: 0, right: 0, padding: "2px 6px", display: "flex", alignItems: "flex-end", bottom: 0 }}>
                            <span style={{ fontSize: 9, color: colors.label, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90%" }}>
                              {clip.type === "text" ? `"${clip.text}"` : clip.name}
                            </span>
                          </div>
                          {/* Resize handle */}
                          <div
                            style={{ position: "absolute", right: 0, top: 0, width: 6, height: "100%", cursor: "ew-resize", background: colors.border, opacity: 0.5 }}
                            onMouseDown={(e) => handleResizeMouseDown(e, track.id, clip)}
                          />
                        </div>
                      ))}
                      {/* Playhead line in track */}
                      <div style={{ position: "absolute", left: state.playhead * PX_PER_SEC, top: 0, width: 1, height: "100%", background: "rgba(243,139,168,0.4)", pointerEvents: "none", zIndex: 5 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* EXPORT MODAL */}
      {showExport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#111318", border: "1px solid #2a2d3a", borderRadius: 12, padding: 32, minWidth: 360, maxWidth: 420 }}>
            <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif", marginBottom: 6, color: "#e4e8f5" }}>
              {state.exportProgress === 100 ? "Export complete" : "Exporting video…"}
            </div>
            <div style={{ fontSize: 12, color: "#4a5068", marginBottom: 20 }}>
              {state.exportProgress === 100
                ? "Your video has been rendered in-browser via WebAssembly."
                : `Processing ${state.tracks.length} track${state.tracks.length !== 1 ? "s" : ""} · ${Math.round(state.duration)}s timeline`}
            </div>
            <div style={{ background: "#0d0f14", borderRadius: 4, height: 6, overflow: "hidden", marginBottom: 8 }}>
              <div style={{ height: "100%", background: "linear-gradient(90deg,#1e3a5f,#2d6fa8)", borderRadius: 4, width: `${state.exportProgress ?? 0}%`, transition: "width 0.1s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 11, color: "#4a5068" }}>
                {state.exportProgress === 100 ? "✓ Done" : `${Math.round(state.exportProgress ?? 0)}%`}
              </span>
              <span style={{ fontSize: 11, color: "#4a5068" }}>
                {state.exportProgress === 100 ? "MP4 · H.264" : "ffmpeg.wasm"}
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {state.exportProgress === 100 && (
                <button className="tool-btn primary" style={{ flex: 1, justifyContent: "center" }}>⬇ Download MP4</button>
              )}
              <button className="tool-btn" style={{ flex: 1, justifyContent: "center" }} onClick={() => { setShowExport(false); dispatch({ type: "SET_EXPORT_PROGRESS", value: null }); }}>
                {state.exportProgress === 100 ? "Close" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}