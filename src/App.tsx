import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { getActiveTour } from "./lib/queries";
import type { Tour } from "./lib/types";
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

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center px-6 text-center text-slate-300">
      {children}
    </div>
  );
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
  const [tour, setTour] = useState<Tour | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveTour()
      .then(setTour)
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <Center>{error}</Center>;
  if (!tour) return <Center>Laden…</Center>;

  const ctx = { tour, userId, isAdmin, canEdit, refreshProfile };
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
  const { loading, session, profile, refreshProfile } = useAuth();

  if (loading) return <Center>Laden…</Center>;
  if (!session) return <Login />;
  if (!profile) return <Center>Laden…</Center>;
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
