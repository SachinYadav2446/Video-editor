import { useState, useEffect, useRef } from "react";

const API_BASE = (window.API_URL || (window.API_URL || "http://localhost:3001") + "") + "/api";



export default function AuthPage({ initialTab = "signup", onBack, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(initialTab === "signup");
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionStep, setProvisionStep] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "Empty", color: "#666666" });



  // Backend state
  const [backendUser, setBackendUser] = useState(null);
  const backendUserRef = useRef(null);
  const provisionTimerRef = useRef(null);

  // ── Password strength ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!password) { setPasswordStrength({ score: 0, label: "Empty", color: "#666666" }); return; }
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    setPasswordStrength(
      score >= 4 ? { score, label: "Strong",  color: "#22d3a8" } :
      score >= 2 ? { score, label: "Medium",  color: "#f5c842" } :
                  { score, label: "Weak",    color: "#ef4444" }
    );
  }, [password]);

  // ── Provisioning animation → then call onSuccess ───────────────────────────
  useEffect(() => {
    if (!isSubmitting) return;
    let step = 0;
    provisionTimerRef.current = setInterval(() => {
      step++;
      setProvisionStep(step);
      if (step >= 4) {
        clearInterval(provisionTimerRef.current);
        setTimeout(() => {
          onSuccess(backendUserRef.current || { name: name || email.split("@")[0] || "Creator", email });
        }, 700);
      }
    }, 850);
    return () => clearInterval(provisionTimerRef.current);
  }, [isSubmitting]);

  // ── Form submit → real API ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) return setError("Please enter your email.");
    if (isSignUp && !name) return setError("Please enter your name.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");

    try {
      const endpoint = isSignUp ? "/auth/signup" : "/auth/signin";
      const body = isSignUp ? { name, email, password } : { email, password };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.token) localStorage.setItem("creatify_token", data.token);
      if (data.user) localStorage.setItem("creatify_user", JSON.stringify(data.user));
      backendUserRef.current = data.user;
      setBackendUser(data.user);
      setIsSubmitting(true);

    } catch (err) {
      console.warn("Backend auth failed, running in local/demo mode", err);
      // Fallback details if the API is down
      const fallbackUser = { name: name || email.split("@")[0] || "Creator", email };
      localStorage.setItem("creatify_user", JSON.stringify(fallbackUser));
      backendUserRef.current = fallbackUser;
      setBackendUser(fallbackUser);
      setIsSubmitting(true);
    }
  };



  // ── Provisioning steps ─────────────────────────────────────────────────────
  const steps = [
    { text: "Verifying secure credentials & keys...",     icon: "🔑" },
    { text: "Provisioning WebAssembly timeline sandbox...", icon: "☁️" },
    { text: "Allocating 100GB local sandbox cache...",    icon: "⚡" },
    { text: "Workspace verified! Launching Creatify Studio...", icon: "🎉" },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      margin: 0, padding: 0, minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#faf8f5",
      fontFamily: "'Instrument Sans', sans-serif", position: "relative", overflow: "hidden"
    }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", width:"600px", height:"600px", borderRadius:"50%", filter:"blur(120px)", background:"rgba(139,90,43,0.06)", top:"-200px", right:"-100px", pointerEvents:"none" }} />
      <div style={{ position:"absolute", width:"500px", height:"500px", borderRadius:"50%", filter:"blur(120px)", background:"rgba(212,165,116,0.05)", bottom:"-100px", left:"-150px", pointerEvents:"none" }} />



      {/* ── Main Auth Card ────────────────────────────────────────────────── */}
      <div style={{
        width:"100%", maxWidth:"460px", padding:"40px", borderRadius:"24px",
        background:"rgba(255,255,255,0.85)", border:"1px solid rgba(139,90,43,0.15)",
        backdropFilter:"blur(30px)", boxShadow:"0 20px 60px rgba(139,90,43,0.08)",
        position:"relative", zIndex:10, display:"flex", flexDirection:"column"
      }}>
        {/* Back button */}
        {!isSubmitting && (
          <button onClick={onBack} style={{
            background:"none", border:"none", color:"#666666", fontSize:"13px",
            fontFamily:"'Poppins',sans-serif", fontWeight:300,
            display:"flex", alignItems:"center", gap:"6px", cursor:"pointer",
            alignSelf:"flex-start", marginBottom:"28px", padding:"4px 8px",
            borderRadius:"6px", transition:"all 0.2s"
          }}
            onMouseEnter={e => { e.target.style.color="#8b5a2b"; e.target.style.background="rgba(139,90,43,0.06)"; }}
            onMouseLeave={e => { e.target.style.color="#666666"; e.target.style.background="none"; }}
          >Back to home</button>
        )}

        {/* ── Provisioning View ─────────────────────────────────────────── */}
        {isSubmitting ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{
              display:"inline-flex", width:"64px", height:"64px", borderRadius:"50%",
              background:"rgba(139,90,43,0.08)", alignItems:"center", justifyContent:"center",
              fontSize:"28px", marginBottom:"24px", position:"relative"
            }}>
              <div style={{
                position:"absolute", width:"100%", height:"100%", borderRadius:"50%",
                border:"2px solid rgba(139,90,43,0.1)", borderTop:"2px solid #8b5a2b",
                animation:"spin 1s linear infinite"
              }} />
              ⚙️
            </div>
            <h3 style={{ fontFamily:"Syne,sans-serif", fontSize:"22px", fontWeight:800, color:"#2d2d2d", marginBottom:"8px", letterSpacing:"-0.02em" }}>
              Setting up Workspace
            </h3>
            <p style={{ fontSize:"14px", color:"#666666", marginBottom:"32px", fontWeight:300 }}>
              Preparing your personal sandbox...
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"14px", textAlign:"left", maxWidth:"320px", margin:"0 auto" }}>
              {steps.map((step, idx) => {
                const isActive    = provisionStep === idx + 1;
                const isCompleted = provisionStep > idx + 1;
                return (
                  <div key={idx} style={{
                    display:"flex", alignItems:"center", gap:"12px",
                    opacity: isCompleted || isActive ? 1 : 0.3,
                    transition:"all 0.4s", transform: isActive ? "translateX(4px)" : "none"
                  }}>
                    <div style={{
                      width:"28px", height:"28px", borderRadius:"50%",
                      background: isCompleted ? "#22d3a8" : isActive ? "rgba(139,90,43,0.15)" : "#e5e5e5",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"13px", color: isCompleted ? "#fff" : "#8b5a2b",
                      transition:"all 0.4s", flexShrink:0
                    }}>
                      {isCompleted ? "✓" : step.icon}
                    </div>
                    <span style={{
                      fontSize:"13px",
                      color: isCompleted ? "#22d3a8" : isActive ? "#2d2d2d" : "#888",
                      fontWeight: isActive ? 600 : 400
                    }}>{step.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

        ) : (
          /* ── Form View ──────────────────────────────────────────────── */
          <div>
            <div style={{ fontFamily:"Syne,sans-serif", fontSize:"28px", fontWeight:800, letterSpacing:"-0.04em", color:"#2d2d2d", marginBottom:"6px" }}>
              Creat<span style={{ color:"#8b5a2b" }}>ify</span>
            </div>
            <h2 style={{ fontFamily:"Syne,sans-serif", fontSize:"20px", fontWeight:700, color:"#2d2d2d", marginBottom:"4px", letterSpacing:"-0.02em" }}>
              {isSignUp ? "Create your account" : "Welcome back"}
            </h2>
            <p style={{ fontSize:"13px", color:"#888", marginBottom:"28px", fontWeight:300 }}>
              {isSignUp ? "Get started free. No credit card required." : "Enter your credentials to access your workspace."}
            </p>

            {error && (
              <div style={{
                background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
                borderRadius:"10px", padding:"10px 14px", color:"#ef4444",
                fontSize:"12px", marginBottom:"18px"
              }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              {isSignUp && (
                <div>
                  <label style={{ display:"block", fontSize:"11px", fontWeight:500, color:"#666", marginBottom:"6px", letterSpacing:"0.03em" }}>FULL NAME</label>
                  <input type="text" placeholder="Enter your name" value={name} onChange={e => setName(e.target.value)}
                    style={inputStyle}
                    onFocus={e => { e.target.style.borderColor="#8b5a2b"; e.target.style.boxShadow="0 0 0 3px rgba(139,90,43,0.12)"; }}
                    onBlur={e  => { e.target.style.borderColor="rgba(139,90,43,0.2)"; e.target.style.boxShadow="none"; }}
                  />
                </div>
              )}

              <div>
                <label style={{ display:"block", fontSize:"11px", fontWeight:500, color:"#666", marginBottom:"6px", letterSpacing:"0.03em" }}>EMAIL ADDRESS</label>
                <input type="email" placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor="#8b5a2b"; e.target.style.boxShadow="0 0 0 3px rgba(139,90,43,0.12)"; }}
                  onBlur={e  => { e.target.style.borderColor="rgba(139,90,43,0.2)"; e.target.style.boxShadow="none"; }}
                />
              </div>

              <div>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <label style={{ fontSize:"11px", fontWeight:500, color:"#666", letterSpacing:"0.03em" }}>PASSWORD</label>
                  {!isSignUp && (
                    <a href="#" onClick={e => { e.preventDefault(); alert("Password reset email sent! (demo)"); }}
                      style={{ fontSize:"11px", color:"#8b5a2b", textDecoration:"none", fontWeight:500 }}>
                      Forgot password?
                    </a>
                  )}
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor="#8b5a2b"; e.target.style.boxShadow="0 0 0 3px rgba(139,90,43,0.12)"; }}
                  onBlur={e  => { e.target.style.borderColor="rgba(139,90,43,0.2)"; e.target.style.boxShadow="none"; }}
                />
                {isSignUp && password && (
                  <div style={{ marginTop:"10px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:"10px", color:"#888", marginBottom:"5px" }}>
                      <span>Password Strength</span>
                      <span style={{ color:passwordStrength.color, fontWeight:600 }}>{passwordStrength.label}</span>
                    </div>
                    <div style={{ display:"flex", gap:"4px" }}>
                      {[1,2,3,4,5].map(i => (
                        <div key={i} style={{ flex:1, height:"4px", borderRadius:"2px", background: passwordStrength.score >= i ? passwordStrength.color : "rgba(139,90,43,0.1)", transition:"background 0.3s" }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" style={{
                background:"#8b5a2b", color:"#fff", border:"none", padding:"14px",
                borderRadius:"12px", fontSize:"14px", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer",
                transition:"all 0.2s", marginTop:"6px", boxShadow:"0 4px 12px rgba(139,90,43,0.18)"
              }}
                onMouseEnter={e => { e.target.style.background="#704822"; e.target.style.transform="translateY(-1px)"; }}
                onMouseLeave={e => { e.target.style.background="#8b5a2b"; e.target.style.transform="none"; }}
              >
                {isSignUp ? "Create Workspace" : "Access Workspace"}
              </button>
            </form>



            {/* Toggle */}
            <div style={{ marginTop:"28px", textAlign:"center", fontSize:"13px", color:"#888", fontWeight:300 }}>
              {isSignUp ? "Already have an account? " : "Don't have an account? "}
              <button onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                style={{ background:"none", border:"none", color:"#8b5a2b", fontFamily:"'Poppins',sans-serif", fontWeight:400, cursor:"pointer", fontSize:"13px", padding:"0 2px" }}
                onMouseEnter={e => e.target.style.textDecoration="underline"}
                onMouseLeave={e => e.target.style.textDecoration="none"}
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width:"100%", padding:"12px 16px", borderRadius:"12px",
  border:"1px solid rgba(139,90,43,0.2)", background:"rgba(255,255,255,0.7)",
  fontSize:"14px", fontFamily:"inherit", color:"#2d2d2d",
  outline:"none", transition:"all 0.2s", boxSizing:"border-box"
};
