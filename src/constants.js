export const TRACK_COLORS = {
  video: { bg: "rgba(139,90,43,0.12)", border: "rgba(139,90,43,0.4)", label: "#d4a574" },
  image: { bg: "rgba(196,154,108,0.1)", border: "rgba(196,154,108,0.35)", label: "#c49a6c" },
  text: { bg: "rgba(34,211,168,0.08)", border: "rgba(34,211,168,0.3)", label: "#22d3a8" },
  audio: { bg: "rgba(168,139,179,0.08)", border: "rgba(168,139,179,0.3)", label: "#c3b0cc" },
};

export const INITIAL_STATE = {
  tracks: [],
  playhead: 0,
  isPlaying: false,
  duration: 60,
  zoom: 1,
  selectedClip: null,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  opacity: 100,
  exportProgress: null,
  previewMode: false,
  playbackSpeed: 1,
  blur: 0,
  sharpen: 0,
  vignette: 0,
  history: [],
  future: [],
};

let _id = 1;
export const uid = () => `id_${_id++}`;

export const fmtTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2,"0")}.${ms}`;
};
