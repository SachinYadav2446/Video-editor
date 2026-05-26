import { useState, useEffect } from "react";
import HomePage from "./components/HomePage";
import AuthPage from "./components/AuthPage";
import PresentationPage from "./components/PresentationPage";
import VideoEditor from "./components/VideoEditor";
import ProfilePage from "./components/ProfilePage";

export default function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [authTab, setAuthTab] = useState("signup");
  const [user, setUser] = useState(null);
  const [appTheme, setAppTheme] = useState(() => localStorage.getItem("creatify_theme") || "light");
  const [activePresentation, setActivePresentation] = useState(null);

  // Sync theme setting to body/root styles for seamless app-wide integration
  useEffect(() => {
    document.documentElement.style.setProperty("--app-bg", appTheme === "dark" ? "#0c0a09" : "#faf8f5");
    document.documentElement.style.setProperty("--app-text", appTheme === "dark" ? "#f5f0e8" : "#2d2d2d");
  }, [appTheme]);

  // Load session on startup
  useEffect(() => {
    const savedUser = localStorage.getItem("creatify_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem("creatify_user");
      }
    }

    const token = localStorage.getItem("creatify_token");
    if (token) {
      fetch("http://localhost:3001/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Invalid token");
      })
      .then(data => {
        if (data.user) {
          setUser(data.user);
          localStorage.setItem("creatify_user", JSON.stringify(data.user));
        }
      })
      .catch(err => {
        console.warn("Session verification failed, logging out:", err.message);
        handleSignOut();
      });
    }
  }, []);

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem("creatify_token");
    localStorage.removeItem("creatify_user");
    setCurrentPage("home");
  };

  // Manage body overflow and scroll reset on page changes
  useEffect(() => {
    window.scrollTo(0, 0);
    if (currentPage === "editor" || currentPage === "presentation") {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
  }, [currentPage]);

  const navigate = (page, data) => {
    if (page === "auth") {
      setAuthTab(data || "signup");
      setCurrentPage("auth");
    } else if (page === "presentation_load") {
      setActivePresentation(data);
      setCurrentPage("presentation");
    } else if (page === "presentation") {
      setActivePresentation(null); // Load clean editor
      setCurrentPage("presentation");
    } else {
      setCurrentPage(page);
    }
  };

  if (currentPage === "home") {
    return <HomePage onNavigate={navigate} user={user} onSignOut={handleSignOut} theme={appTheme} />;
  }

  if (currentPage === "auth") {
    return (
      <AuthPage
        initialTab={authTab}
        onBack={() => setCurrentPage("home")}
        onSuccess={(userData) => {
          setUser(userData);
          setCurrentPage("home");
        }}
      />
    );
  }

  if (currentPage === "profile") {
    return (
      <ProfilePage
        onBack={() => setCurrentPage("home")}
        onNavigate={navigate}
        user={user}
        onSignOut={handleSignOut}
        theme={appTheme}
        onToggleTheme={(newTheme) => {
          setAppTheme(newTheme);
          localStorage.setItem("creatify_theme", newTheme);
        }}
      />
    );
  }

  if (currentPage === "presentation") {
    return (
      <PresentationPage
        onBack={() => setCurrentPage("home")}
        user={user}
        initialPresentation={activePresentation}
      />
    );
  }

  // Video Editor (default / "editor" page)
  return (
    <VideoEditor
      onBack={() => setCurrentPage("home")}
      user={user}
    />
  );
}
