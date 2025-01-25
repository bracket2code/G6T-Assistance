import { lazy, Suspense } from "react";
import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useSessionRefresh } from "./hooks/useSessionRefresh";
import { useTheme } from "./hooks/useTheme";
import { useWelcomeSplash } from "./hooks/useWelcomeSplash";
import { supabase } from "./lib/supabase";
import { handleRequest } from "./lib/utils";
import Login from "./components/Login";

// Lazy load components
const WelcomeSplash = lazy(() => import("./components/WelcomeSplash"));
const AdminPanel = lazy(() => import("./components/AdminPanel"));
const AttendanceApp = lazy(() => import("./features/attendance/AttendanceApp"));
const Profile = lazy(() => import("./components/Profile"));
const Settings = lazy(() => import("./components/Settings"));
const Reports = lazy(() => import("./components/Reports"));

type User = {
  id: string;
  email: string;
  role: string;
};

export default function App() {
  const { session, user, loading } = useAuth();
  const { showSplash, setShowWelcomeSplash, welcomeSplashEnabled } =
    useWelcomeSplash(user?.id);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const {
    darkMode,
    setDarkMode,
    themePreference,
    setThemePreference,
    updateTheme,
  } = useTheme("system");

  useSessionRefresh(session);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderContent = () => {
    if (showSplash) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <WelcomeSplash name={user?.name || ""} alias={user?.alias} />
        </Suspense>
      );
    }

    if (showProfile) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Profile user={user} onBack={() => setShowProfile(false)} />
        </Suspense>
      );
    }

    if (showSettings) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Settings
            onBack={() => setShowSettings(false)}
            darkMode={darkMode}
            showWelcomeSplash={welcomeSplashEnabled}
            onWelcomeSplashChange={setShowWelcomeSplash}
            onThemeChange={(preference) => {
              setThemePreference(preference);
              updateTheme(preference);
            }}
          />
        </Suspense>
      );
    }

    if (showReports) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <Reports onBack={() => setShowReports(false)} />
        </Suspense>
      );
    }

    if (showAdmin) {
      return (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <AdminPanel onBack={() => setShowAdmin(false)} />
        </Suspense>
      );
    }

    return (
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        }
      >
        <AttendanceApp
          user={
            user || {
              id: session.user.id,
              email: session.user.email,
              role: "user",
            }
          }
          darkMode={darkMode}
          onShowAdmin={() =>
            (user?.role === "admin" || user?.role === "manager") &&
            setShowAdmin(true)
          }
          onShowProfile={() => setShowProfile(true)}
          onShowSettings={() => setShowSettings(true)}
          onShowReports={() => setShowReports(true)}
          onToggleDarkMode={() => {
            const newMode = !darkMode;
            setDarkMode(newMode);
            setThemePreference(newMode ? "dark" : "light");
          }}
        />
      </Suspense>
    );
  };

  return renderContent();
}
