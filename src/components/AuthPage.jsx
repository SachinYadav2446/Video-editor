import { useState, useEffect, useRef } from "react";

const API_BASE = (window.API_URL || (window.API_URL || "http://localhost:3001") + "") + "/api";

// ── Google mock accounts for demo selector ──────────────────────────────────
const MOCK_GOOGLE_ACCOUNTS = [
  { name: "Alex Chen",       email: "alex.chen@gmail.com",      avatar: "AC", color: "#4285f4" },
  { name: "Sarah Williams",  email: "sarah.w@gmail.com",        avatar: "SW", color: "#34a853" },
  { name: "James O'Brien",   email: "james.obrien@gmail.com",   avatar: "JO", color: "#ea4335" },
  { name: "Priya Sharma",    email: "priya.sharma@gmail.com",   avatar: "PS", color: "#fbbc05" },
];

export default function AuthPage({ initialTab = "signup", onBack, onSuccess }) {
  const [isSignUp, setIsSignUp] = useState(initialTab === "signup");
  const [email, setEmail]       = useState("");
  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisionStep, setProvisionStep] = useState(0);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "Empty", color: "#666666" });

  // Google selector modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleSelectedIdx, setGoogleSelectedIdx] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

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

  // ── Google sign-in via API ─────────────────────────────────────────────────
  const handleGoogleSignIn = async (account) => {
    setGoogleLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     account.name,
          email:    account.email,
          googleId: `google_${account.email}`,
          avatar:   account.avatar,
        })
      });
      const data = await res.json();
      const finalUser = data.user || account;

      if (data.token) localStorage.setItem("creatify_token", data.token);
      localStorage.setItem("creatify_user", JSON.stringify(finalUser));
      backendUserRef.current = finalUser;
      setBackendUser(finalUser);
    } catch (err) {
      console.warn("Google backend auth failed, running in local/demo mode", err);
      const fallbackUser = { name: account.name, email: account.email, avatar: account.avatar };
      localStorage.setItem("creatify_user", JSON.stringify(fallbackUser));
      backendUserRef.current = fallbackUser;
      setBackendUser(fallbackUser);
    }

    setGoogleLoading(false);
    setShowGoogleModal(false);
    setIsSubmitting(true);
  };

  const handleCustomGoogle = async () => {
    if (!customGoogleEmail.includes("@")) return;
    const account = {
      name:   customGoogleEmail.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      email:  customGoogleEmail,
      avatar: customGoogleEmail[0].toUpperCase(),
      color:  "#4285f4",
    };
    await handleGoogleSignIn(account);
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

      {/* ── Google Account Selector Modal ─────────────────────────────────── */}
      {showGoogleModal && (
        <div style={{
          position:"fixed", inset:0, zIndex:1000,
          background:"rgba(0,0,0,0.45)", backdropFilter:"blur(8px)",
          display:"flex", alignItems:"center", justifyContent:"center"
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGoogleModal(false); }}
        >
          <div style={{
            background:"#fff", borderRadius:"28px", width:"100%", maxWidth:"400px",
            padding:"28px 24px", boxShadow:"0 24px 80px rgba(0,0,0,0.2)",
            animation:"fadeUp 0.25s ease both"
          }}>
            {/* Google header */}
            <div style={{ textAlign:"center", marginBottom:"24px" }}>
              <div style={{ marginBottom:"12px" }}>
                {/* Google G logo */}
                <svg width="40" height="40" viewBox="0 0 48 48" style={{ display:"block", margin:"0 auto" }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              </div>
              <div style={{ fontSize:"20px", fontWeight:600, color:"#202124", marginBottom:"4px" }}>Sign in with Google</div>
              <div style={{ fontSize:"13px", color:"#5f6368" }}>Choose an account to continue to Creatify</div>
            </div>

            {/* Account list */}
            <div style={{ display:"flex", flexDirection:"column", gap:"4px", marginBottom:"16px" }}>
              {MOCK_GOOGLE_ACCOUNTS.map((account, idx) => (
                <button
                  key={idx}
                  onClick={() => !googleLoading && handleGoogleSignIn(account)}
                  style={{
                    display:"flex", alignItems:"center", gap:"14px", padding:"12px 16px",
                    borderRadius:"12px", border:"1px solid #e8eaed", background: googleSelectedIdx === idx ? "#f0f4ff" : "#fff",
                    cursor: googleLoading ? "wait" : "pointer", transition:"all 0.15s", textAlign:"left",
                    outline:"none"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f8f9fa"}
                  onMouseLeave={e => e.currentTarget.style.background = googleSelectedIdx === idx ? "#f0f4ff" : "#fff"}
                >
                  {/* Avatar circle */}
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"50%", background:account.color,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    color:"#fff", fontWeight:700, fontSize:"14px", flexShrink:0
                  }}>
                    {account.avatar}
                  </div>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:500, color:"#202124" }}>{account.name}</div>
                    <div style={{ fontSize:"12px", color:"#5f6368" }}>{account.email}</div>
                  </div>
                  {googleLoading && <div style={{ marginLeft:"auto", fontSize:"16px" }}>⏳</div>}
                </button>
              ))}

              {/* Custom email option */}
              {showCustomInput ? (
                <div style={{ padding:"8px 16px", display:"flex", gap:"8px" }}>
                  <input
                    autoFocus
                    type="email"
                    placeholder="Enter your Google email..."
                    value={customGoogleEmail}
                    onChange={e => setCustomGoogleEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCustomGoogle()}
                    style={{
                      flex:1, padding:"10px 14px", borderRadius:"10px",
                      border:"1px solid #4285f4", outline:"none", fontSize:"13px", color:"#202124"
                    }}
                  />
                  <button onClick={handleCustomGoogle} style={{
                    background:"#4285f4", color:"#fff", border:"none", borderRadius:"10px",
                    padding:"10px 16px", cursor:"pointer", fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:400
                  }}>Go</button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  style={{
                    display:"flex", alignItems:"center", gap:"14px", padding:"12px 16px",
                    borderRadius:"12px", border:"1px dashed #dadce0", background:"#fff",
                    cursor:"pointer", color:"#1a73e8", fontSize:"13px", fontWeight:500
                  }}
                >
                  <div style={{
                    width:"40px", height:"40px", borderRadius:"50%", background:"#f1f3f4",
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px"
                  }}>+</div>
                  Use another account
                </button>
              )}
            </div>

            {/* Footer */}
            <div style={{ borderTop:"1px solid #e8eaed", paddingTop:"16px", display:"flex", justifyContent:"space-between" }}>
              <button onClick={() => setShowGoogleModal(false)} style={{
                background:"none", border:"none", color:"#1a73e8", cursor:"pointer", fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:400
              }}>Cancel</button>
              <div style={{ fontSize:"11px", color:"#5f6368", alignSelf:"center" }}>
                Powered by Google Identity
              </div>
            </div>
          </div>
        </div>
      )}

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

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:"10px", margin:"22px 0" }}>
              <div style={{ flex:1, height:"1px", background:"rgba(139,90,43,0.15)" }} />
              <span style={{ fontSize:"11px", color:"#aaa", letterSpacing:"0.04em" }}>OR CONTINUE WITH</span>
              <div style={{ flex:1, height:"1px", background:"rgba(139,90,43,0.15)" }} />
            </div>

            {/* Social buttons */}
            <div style={{ display:"flex", gap:"10px" }}>
              {/* Google button */}
              <button
                onClick={() => setShowGoogleModal(true)}
                style={{
                  flex:1, padding:"11px 14px", borderRadius:"12px",
                  background:"#fff", border:"1px solid rgba(139,90,43,0.2)",
                  fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:300, color:"#444",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  cursor:"pointer", transition:"all 0.2s", boxShadow:"0 2px 6px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(66,133,244,0.15)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,0.04)"}
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Google
              </button>

              {/* GitHub button */}
              <button
                onClick={() => {
                  const ghAccount = { name:"GitHub User", email:"user@github.com", avatar:"GH", color:"#333" };
                  setShowGoogleModal(false);
                  setBackendUser(ghAccount);
                  setIsSubmitting(true);
                }}
                style={{
                  flex:1, padding:"11px 14px", borderRadius:"12px",
                  background:"#fff", border:"1px solid rgba(139,90,43,0.2)",
                  fontSize:"13px", fontFamily:"'Poppins',sans-serif", fontWeight:300, color:"#444",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"10px",
                  cursor:"pointer", transition:"all 0.2s", boxShadow:"0 2px 6px rgba(0,0,0,0.04)"
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 16px rgba(0,0,0,0.1)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow="0 2px 6px rgba(0,0,0,0.04)"}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#333">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
                </svg>
                GitHub
              </button>
            </div>

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
