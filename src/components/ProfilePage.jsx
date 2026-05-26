import { useState, useEffect } from "react";

const API_BASE = "http://localhost:3001/api";

export default function ProfilePage({ onBack, onNavigate, user, onSignOut, theme = "light", onToggleTheme }) {
  const [activeTab, setActiveTab] = useState("details");
  const [presentations, setPresentations] = useState([]);
  
  // Change password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  const isDark = theme === "dark";

  // High contrast palette: Sidebar contrasts heavily with details pane
  const colors = {
    bg: isDark ? "#0c0a09" : "#faf8f5",
    text: isDark ? "#f5f0e8" : "#2d2d2d",
    sidebarBg: isDark ? "#161413" : "#f0eae1", 
    cardBg: isDark ? "rgba(23, 21, 20, 0.8)" : "rgba(255, 255, 255, 0.9)",
    border: isDark ? "rgba(212, 165, 116, 0.35)" : "rgba(139, 90, 43, 0.28)",
    accent: "#8b5a2b",
    accentLight: isDark ? "rgba(212,165,116,0.18)" : "rgba(139, 90, 43, 0.08)",
    subtext: isDark ? "#8c8780" : "#666666",
    navHover: isDark ? "rgba(212, 165, 116, 0.1)" : "rgba(139, 90, 43, 0.05)"
  };

  // Load presentations and load sample templates if empty
  useEffect(() => {
    if (user && user.email) {
      const key = `creatify_presentations_${user.email}`;
      let ppts = [];
      try {
        ppts = JSON.parse(localStorage.getItem(key) || "[]");
      } catch (e) {
        ppts = [];
      }
      
      // If user has no presentations, populate some elegant mock past work so the dashboard is complete
      if (ppts.length === 0) {
        ppts = [
          {
            id: "ppt_sample_1",
            name: "Q3 Strategy Presentation Draft",
            updatedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
            themeIdx: 0,
            slides: [
              { id: "s1", layout: "title", title: "Q3 Growth Roadmap", subtitle: "Innovating with limits", bulletPoints: [], elements: [] }
            ]
          },
          {
            id: "ppt_sample_2",
            name: "Product Branding Proposal v2",
            updatedAt: new Date(Date.now() - 3600000 * 28).toISOString(),
            themeIdx: 5,
            slides: [
              { id: "s1", layout: "title", title: "Branding Proposal", subtitle: "Sleek Nordic minimal styling", bulletPoints: [], elements: [] }
            ]
          }
        ];
        localStorage.setItem(key, JSON.stringify(ppts));
      }
      setPresentations(ppts);
    }
  }, [user]);

  const handleDeletePresentation = (id) => {
    if (!user || !user.email) return;
    const confirm = window.confirm("Are you sure you want to delete this presentation draft?");
    if (!confirm) return;

    const key = `creatify_presentations_${user.email}`;
    const updated = presentations.filter(p => p.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    setPresentations(updated);
  };

  const handleOpenPresentation = (ppt) => {
    onNavigate("presentation_load", ppt);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPassError("All password fields are required.");
    }
    if (newPassword !== confirmPassword) {
      return setPassError("New passwords do not match.");
    }
    if (newPassword.length < 6) {
      return setPassError("New password must be at least 6 characters.");
    }

    setPassLoading(true);
    try {
      const token = localStorage.getItem("creatify_token");
      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();

      if (!res.ok) {
        setPassError(data.error || "Failed to update password.");
      } else {
        setPassSuccess("Password updated successfully directly in the database!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setPassError("Could not reach backend API. If offline, password update is not available.");
    } finally {
      setPassLoading(false);
    }
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.bg, color: colors.text }}>
        <div style={{ textAlign: "center" }}>
          <h2>Access Denied</h2>
          <p style={{ color: colors.subtext, marginTop: "8px" }}>Please sign in to view your profile settings dashboard.</p>
          <button onClick={() => onNavigate("auth", "signin")} style={{ marginTop: "16px", padding: "10px 24px", background: colors.accent, border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer" }}>
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // Initials for avatar
  const initials = user.name ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) : user.email[0].toUpperCase();

  return (
    <div style={{
      minHeight: "100vh", background: colors.bg, color: colors.text,
      fontFamily: "'Instrument Sans', sans-serif", display: "flex", transition: "background 0.3s, color 0.3s"
    }}>
      {/* ── Sidebar ── */}
      <aside style={{
        width: "280px", background: colors.sidebarBg, borderRight: `1px solid ${colors.border}`,
        padding: "32px 20px", display: "flex", flexDirection: "column", flexShrink: 0,
        boxShadow: isDark ? "4px 0 30px rgba(0,0,0,0.5)" : "4px 0 24px rgba(139, 90, 43, 0.08)",
        transition: "background 0.3s, border-right 0.3s, box-shadow 0.3s"
      }}>
        {/* Logo/Back Section - clean text click */}
        <button onClick={onBack} style={{
          background: "none", border: "none", color: colors.text, fontSize: "14px",
          display: "flex", alignItems: "center", cursor: "pointer",
          marginBottom: "40px", width: "fit-content", opacity: 0.8, transition: "opacity 0.2s",
          fontFamily: "inherit", fontWeight: 500
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0.8}
        >
          Back to home
        </button>

        {/* User Brief Card */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "36px", padding: "0 6px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "50%",
            background: user.avatar && user.avatar.length > 2 ? "transparent" : "linear-gradient(135deg, #8b5a2b, #d4a574)",
            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "16px", flexShrink: 0, overflow: "hidden",
            boxShadow: "0 4px 12px rgba(139,90,43,0.15)"
          }}>
            {user.avatar && user.avatar.length > 2 ? (
              <img src={user.avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name || "Creator"}</div>
            <div style={{ fontSize: "11px", color: colors.subtext, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        </div>

        {/* Navigation Tabs - clean style, no icons */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
          <button
            onClick={() => setActiveTab("details")}
            style={{
              display: "flex", alignItems: "center", padding: "12px 16px",
              borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
              fontSize: "14px", fontWeight: activeTab === "details" ? 600 : 400,
              background: activeTab === "details" ? colors.accentLight : "transparent",
              color: activeTab === "details" ? colors.accent : colors.text,
              transition: "all 0.2s", fontFamily: "inherit"
            }}
            onMouseEnter={e => { if (activeTab !== "details") e.currentTarget.style.background = colors.navHover; }}
            onMouseLeave={e => { if (activeTab !== "details") e.currentTarget.style.background = "transparent"; }}
          >
            Account Details
          </button>

          <button
            onClick={() => setActiveTab("pastwork")}
            style={{
              display: "flex", alignItems: "center", padding: "12px 16px",
              borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
              fontSize: "14px", fontWeight: activeTab === "pastwork" ? 600 : 400,
              background: activeTab === "pastwork" ? colors.accentLight : "transparent",
              color: activeTab === "pastwork" ? colors.accent : colors.text,
              transition: "all 0.2s", fontFamily: "inherit"
            }}
            onMouseEnter={e => { if (activeTab !== "pastwork") e.currentTarget.style.background = colors.navHover; }}
            onMouseLeave={e => { if (activeTab !== "pastwork") e.currentTarget.style.background = "transparent"; }}
          >
            Past Work
          </button>

          <button
            onClick={() => setActiveTab("system")}
            style={{
              display: "flex", alignItems: "center", padding: "12px 16px",
              borderRadius: "10px", border: "none", cursor: "pointer", textAlign: "left",
              fontSize: "14px", fontWeight: activeTab === "system" ? 600 : 400,
              background: activeTab === "system" ? colors.accentLight : "transparent",
              color: activeTab === "system" ? colors.accent : colors.text,
              transition: "all 0.2s", fontFamily: "inherit"
            }}
            onMouseEnter={e => { if (activeTab !== "system") e.currentTarget.style.background = colors.navHover; }}
            onMouseLeave={e => { if (activeTab !== "system") e.currentTarget.style.background = "transparent"; }}
          >
            System Settings
          </button>
        </nav>
      </aside>

      {/* ── Main Panel ── */}
      <main style={{ flex: 1, padding: "50px 80px", overflowY: "auto" }}>
        
        {/* Header Title */}
        <header style={{ marginBottom: "40px" }}>
          <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: "32px", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {activeTab === "details" ? "Account Details" : activeTab === "pastwork" ? "Past Presentations" : "System Settings"}
          </h1>
          <p style={{ color: colors.subtext, fontSize: "14px", marginTop: "4px" }}>
            {activeTab === "details" ? "View and manage your core identity details." : 
             activeTab === "pastwork" ? "Access, launch or clear your PowerPoint slide drafts." : 
             "Configure passwords, app styles, and log out of the console."}
          </p>
        </header>

        {/* Tab Switcher Area */}
        <div style={{ maxWidth: "680px" }}>
          
          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{
                background: colors.cardBg, border: `1px solid ${colors.border}`,
                borderRadius: "20px", padding: "30px", boxShadow: "0 4px 30px rgba(0,0,0,0.01)"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: colors.subtext, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Full Name</label>
                    <div style={{ fontSize: "16px", fontWeight: 500 }}>{user.name || "Creator User"}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: colors.subtext, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Email Address</label>
                    <div style={{ fontSize: "16px", fontWeight: 500, wordBreak: "break-all" }}>{user.email}</div>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: colors.subtext, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Login Provider</label>
                    <div style={{ fontSize: "14px", fontWeight: 500 }}>
                      {user.provider === "google" ? "Google Identity" : "Password Authenticated"}
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: colors.subtext, letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Account ID</label>
                    <div style={{ fontSize: "13px", fontFamily: "monospace", color: colors.subtext }}>#{user.id || "1"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAST WORK */}
          {activeTab === "pastwork" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {presentations.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "48px 20px", border: `1px dashed ${colors.border}`,
                  borderRadius: "20px", background: colors.cardBg
                }}>
                  <div style={{ fontWeight: 600, fontSize: "16px" }}>No presentations saved yet</div>
                  <p style={{ fontSize: "13px", color: colors.subtext, marginTop: "6px" }}>
                    Once you start working in the presentation maker, drafts will auto-save here.
                  </p>
                  <button onClick={() => onNavigate("presentation")} style={{
                    marginTop: "20px", padding: "10px 24px", background: colors.accent,
                    border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 500
                  }}>
                    Create Presentation
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {presentations.map((ppt) => (
                    <div key={ppt.id} style={{
                      background: colors.cardBg, border: `1px solid ${colors.border}`,
                      borderRadius: "16px", padding: "18px 24px", display: "flex",
                      alignItems: "center", justifyContent: "space-between", gap: "16px",
                      transition: "transform 0.2s, border-color 0.2s"
                    }}
                      className="ppt-item"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", overflow: "hidden" }}>
                        <div style={{ overflow: "hidden" }}>
                          <div style={{ fontWeight: 600, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ppt.name}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.subtext, marginTop: "2px" }}>
                            Slides count: {ppt.slides?.length || 0} · Updated {new Date(ppt.updatedAt).toLocaleString()}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                        <button
                          onClick={() => handleOpenPresentation(ppt)}
                          style={{
                            background: colors.accent, border: "none", color: "#fff",
                            padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                            fontSize: "12px", fontWeight: 500, transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#704822"}
                          onMouseLeave={e => e.currentTarget.style.background = colors.accent}
                        >
                          Open Draft
                        </button>
                        <button
                          onClick={() => handleDeletePresentation(ppt.id)}
                          style={{
                            background: "none", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444",
                            padding: "8px 14px", borderRadius: "8px", cursor: "pointer",
                            fontSize: "12px", transition: "all 0.2s"
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"; e.currentTarget.style.borderColor = "#ef4444"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)"; }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SYSTEM SETTINGS */}
          {activeTab === "system" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              
              {/* Theme Settings Section */}
              <div style={{
                background: colors.cardBg, border: `1px solid ${colors.border}`,
                borderRadius: "20px", padding: "24px"
              }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "14px" }}>Visual Theme System</h3>
                <p style={{ fontSize: "13px", color: colors.subtext, marginBottom: "18px", lineHeight: 1.4 }}>
                  Customize the presentation and workspace console environment styling.
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <button
                    onClick={() => onToggleTheme("light")}
                    style={{
                      flex: 1, padding: "14px", borderRadius: "12px", cursor: "pointer",
                      border: theme === "light" ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                      background: theme === "light" ? colors.accentLight : "transparent",
                      color: colors.text, fontWeight: theme === "light" ? 600 : 400,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      transition: "all 0.2s", fontFamily: "inherit"
                    }}
                  >
                    Light Mode
                  </button>
                  <button
                    onClick={() => onToggleTheme("dark")}
                    style={{
                      flex: 1, padding: "14px", borderRadius: "12px", cursor: "pointer",
                      border: theme === "dark" ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
                      background: theme === "dark" ? colors.accentLight : "transparent",
                      color: colors.text, fontWeight: theme === "dark" ? 600 : 400,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                      transition: "all 0.2s", fontFamily: "inherit"
                    }}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>

              {/* Password Change Section (only if not google oauth user) */}
              {user.provider !== "google" ? (
                <div style={{
                  background: colors.cardBg, border: `1px solid ${colors.border}`,
                  borderRadius: "20px", padding: "24px"
                }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "6px" }}>Change Password</h3>
                  <p style={{ fontSize: "12px", color: colors.subtext, marginBottom: "18px" }}>
                    Update your local auth secret. Changed values save directly to the file DB.
                  </p>
                  
                  {passError && (
                    <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", color: "#ef4444", fontSize: "12px", marginBottom: "14px" }}>
                      {passError}
                    </div>
                  )}
                  {passSuccess && (
                    <div style={{ background: "rgba(34,211,168,0.08)", border: "1px solid rgba(34,211,168,0.2)", borderRadius: "10px", padding: "10px 14px", color: "#22d3a8", fontSize: "12px", marginBottom: "14px" }}>
                      {passSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: colors.subtext, display: "block", marginBottom: "6px" }}>CURRENT PASSWORD</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={e => setCurrentPassword(e.target.value)}
                        style={inputStyle(isDark)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: colors.subtext, display: "block", marginBottom: "6px" }}>NEW PASSWORD</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        style={inputStyle(isDark)}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: "11px", fontWeight: 500, color: colors.subtext, display: "block", marginBottom: "6px" }}>CONFIRM NEW PASSWORD</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        style={inputStyle(isDark)}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passLoading}
                      style={{
                        background: colors.accent, color: "#fff", border: "none",
                        padding: "12px", borderRadius: "10px", cursor: "pointer",
                        fontWeight: 500, fontSize: "13px", marginTop: "6px",
                        transition: "background 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = "#704822"}
                      onMouseLeave={e => e.currentTarget.style.background = colors.accent}
                    >
                      {passLoading ? "Updating..." : "Save Password Changes"}
                    </button>
                  </form>
                </div>
              ) : (
                <div style={{
                  background: colors.cardBg, border: `1px solid ${colors.border}`,
                  borderRadius: "20px", padding: "24px", color: colors.subtext, fontSize: "13px", textAlign: "center"
                }}>
                  You are authenticated via Google OAuth. Password changes are managed through your Google Account settings.
                </div>
              )}

              {/* Log out Card */}
              <div style={{
                background: colors.cardBg, border: `1px solid rgba(239, 68, 68, 0.15)`,
                borderRadius: "20px", padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#ef4444" }}>Log Out of Account</h3>
                  <div style={{ fontSize: "12px", color: colors.subtext, marginTop: "2px" }}>Clears JWT keys and ends the active workspace session.</div>
                </div>
                <button
                  onClick={onSignOut}
                  style={{
                    background: "#ef4444", color: "#fff", border: "none",
                    padding: "12px 24px", borderRadius: "10px", cursor: "pointer",
                    fontWeight: 600, fontSize: "13.5px", transition: "background 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#dc2626"}
                  onMouseLeave={e => e.currentTarget.style.background = "#ef4444"}
                >
                  Log Out
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <style>{`
        .ppt-item:hover {
          transform: translateY(-2px);
          border-color: ${colors.accent}50 !important;
        }
      `}</style>
    </div>
  );
}

const inputStyle = (isDark) => ({
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(139,90,43,0.18)",
  background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
  color: isDark ? "#ffffff" : "#2d2d2d",
  fontSize: "13.5px",
  outline: "none",
  boxSizing: "border-box"
});
