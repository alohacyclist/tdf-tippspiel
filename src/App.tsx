import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { listTours } from "./lib/queries";
import type { Tour } from "./lib/types";
import { tourTheme } from "./lib/theme";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { Stages } from "./pages/Stages";
import { StageDetail } from "./pages/StageDetail";
import { Specials } from "./pages/Specials";
import { Leaderboard } from "./pages/Leaderboard";
import { PlayerTips } from "./pages/PlayerTips";
import { Profil } from "./pages/Profil";
import { Admin } from "./pages/Admin";

const TOUR_KEY = "grandtour-tour";

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 text-center text-muted">
      {children}
    </div>
  );
}

function readStored(): string | null {
  try {
    return localStorage.getItem(TOUR_KEY);
  } catch {
    return null;
  }
}

// default = last chosen (if still present), else the active tour, else newest.
function pickInitial(tours: Tour[]): string | null {
  if (tours.length === 0) return null;
  const stored = readStored();
  if (stored && tours.some((t) => t.id === stored)) return stored;
  return (tours.find((t) => t.is_active) ?? tours[0]).id;
}

function ActiveApp({
  userId,
  isAdmin,
  canEdit,
  refreshProfile,
}: {
  userId: string;
  isAdmin: boolean;
  canEdit: boolean;
  refreshProfile: () => Promise<void>;
}) {
  const [tours, setTours] = useState<Tour[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTours()
      .then((ts) => {
        setTours(ts);
        setSelectedId((cur) => cur ?? pickInitial(ts));
      })
      .catch((e) => setError(e.message));
  }, []);

  const tour = tours.find((t) => t.id === selectedId) ?? null;

  // Apply the per-tour accent + document title. Set on <html> so it cascades to
  // everything, including the fixed confetti canvas.
  useEffect(() => {
    if (!tour) return;
    const theme = tourTheme(tour.pcs_slug);
    const root = document.documentElement;
    // only the raw inputs are set inline; index.css decides which one becomes the
    // text accent per theme (an inline --accent-ink would outrank the dark block).
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-ink-light", theme.accentInk);
    root.style.setProperty("--accent-contrast", theme.accentContrast);
    document.title = tour.name;
  }, [tour]);

  function setTour(tourId: string) {
    setSelectedId(tourId);
    try {
      localStorage.setItem(TOUR_KEY, tourId);
    } catch {
      /* storage unavailable — selection just won't persist */
    }
  }

  if (error) return <Center>{error}</Center>;
  if (!tour) return <Center>Laden…</Center>;

  const ctx = {
    tour,
    tours,
    setTour,
    userId,
    isAdmin,
    canEdit,
    refreshProfile,
  };
  return (
    <Routes>
      <Route element={<Layout ctx={ctx} />}>
        <Route index element={<Stages />} />
        <Route path="stage/:stageId" element={<StageDetail />} />
        <Route path="specials" element={<Specials />} />
        <Route path="rangliste" element={<Leaderboard />} />
        <Route path="spieler/:userId" element={<PlayerTips />} />
        <Route path="profil" element={<Profil />} />
        {canEdit && <Route path="admin" element={<Admin />} />}
        <Route path="*" element={<Stages />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  const { loading, session, profile, expired, error, refreshProfile } =
    useAuth();

  if (loading) return <Center>Laden…</Center>;
  if (!session) return <Login expired={expired} />;
  if (!profile) return <Center>{error ? `Fehler: ${error}` : "Laden…"}</Center>;
  if (!profile.display_name) return <Onboarding onDone={refreshProfile} />;
  if (profile.status === "blocked") return <Center>Account gesperrt.</Center>;
  if (profile.status === "pending")
    return <Center>Danke! Warte auf Freischaltung durch den Admin.</Center>;
  return (
    <ActiveApp
      userId={session.user.id}
      isAdmin={profile.role === "admin"}
      canEdit={profile.role === "editor" || profile.role === "admin"}
      refreshProfile={refreshProfile}
    />
  );
}
