import { useReducer } from "react";
import { INITIAL_STATE, uid } from "../constants";

function editorReducer(state, action) {
  switch (action.type) {
    case "UNDO":
      if (state.history.length === 0) return state;
      const previousState = state.history[state.history.length - 1];
      return {
        ...previousState,
        history: state.history.slice(0, -1),
        future: [state, ...state.future],
      };
    case "REDO":
      if (state.future.length === 0) return state;
      const nextState = state.future[0];
      return {
        ...nextState,
        history: [...state.history, state],
        future: state.future.slice(1),
      };
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
    case "SET_PLAYBACK_SPEED":
      return { ...state, playbackSpeed: action.value };
    case "SPLIT_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) => {
          if (t.id !== action.trackId) return t;
          const splitTime = action.time;
          return {
            ...t,
            clips: t.clips.flatMap((c) => {
              if (c.id !== action.clipId) return c;
              if (splitTime <= c.start || splitTime >= c.start + c.duration) return c;
              const firstDuration = splitTime - c.start;
              const secondDuration = c.duration - firstDuration;
              return [
                { ...c, duration: firstDuration },
                { ...c, id: uid(), start: splitTime, duration: secondDuration }
              ];
            }),
          };
        }),
      };
    case "TRIM_CLIP":
      return {
        ...state,
        tracks: state.tracks.map((t) => {
          if (t.id !== action.trackId) return t;
          return {
            ...t,
            clips: t.clips.map((c) => {
              if (c.id !== action.clipId) return c;
              return { ...c, start: action.newStart, duration: action.newDuration };
            }),
          };
        }),
      };
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
    case "UPDATE_CLIP_VOLUME":
      return {
        ...state,
        tracks: state.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) =>
            c.id === action.clipId ? { ...c, volume: action.volume } : c
          ),
        })),
      };
    default:
      return state;
  }
}

export const useEditorState = () => {
  return useReducer(editorReducer, INITIAL_STATE);
};
