import { useEffect, useRef, useCallback } from "react";

export const useWebGL = (canvasRef, state) => {
  const glRef = useRef(null);
  const animationFrameRef = useRef(null);

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
  }, [canvasRef]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

    let drawnAny = false;
    for (const track of state.tracks) {
      for (const clip of track.clips) {
        if (clip.start <= state.playhead && clip.start + clip.duration > state.playhead) {
          if (clip.videoEl) {
            // Seek video to current playhead position when not playing (scrubbing)
            if (!state.isPlaying) {
              const videoTime = state.playhead - clip.start;
              if (Math.abs(clip.videoEl.currentTime - videoTime) > 0.05) {
                clip.videoEl.currentTime = videoTime;
              }
            }
            // Ensure video is ready
            if (clip.videoEl.readyState >= 2) {
              const tex = gl.createTexture();
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
              gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, clip.videoEl);
              gl.drawArrays(gl.TRIANGLES, 0, 6);
              gl.deleteTexture(tex);
              drawnAny = true;
              break;
            }
          } else if (clip.imageEl) {
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

    // Continue animation loop if playing
    if (state.isPlaying) {
      animationFrameRef.current = requestAnimationFrame(drawPreview);
    }
  }, [state, canvasRef]);

  return { drawPreview };
};
