import { NavLink, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { AppCtx } from "../lib/appContext";

const tabs = [
  { to: "/", label: "Etappen", end: true },
  { to: "/specials", label: "Wertungen", end: false },
  { to: "/rangliste", label: "Rangliste", end: false },
];

export function Layout({ ctx }: { ctx: AppCtx }) {
  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-yellow-400">
          Tour-Tippspiel
        </span>
        <button
          className="text-sm text-slate-400 hover:text-slate-200"
          onClick={() => supabase.auth.signOut()}
        >
          Abmelden
        </button>
      </header>

      <main className="flex-1 px-4 pb-24">
        <Outlet context={ctx} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl border-t border-slate-800 bg-slate-950/95 backdrop-blur">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${
                isActive ? "text-yellow-400" : "text-slate-400"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
