import { NavLink, Outlet } from "react-router-dom";
import { signOut } from "../lib/supabase";
import type { AppCtx } from "../lib/appContext";
import { stagesNounPlural } from "../lib/stageLabel";
import { tourTheme } from "../lib/theme";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm ${isActive ? "text-accent" : "text-muted hover:text-ink"}`;

export function Layout({ ctx }: { ctx: AppCtx }) {
  const isGrandTour = ctx.tour.kind === "grand_tour";
  const gradient = tourTheme(ctx.tour.pcs_slug).titleGradient;
  const tabs = [
    { to: "/", label: stagesNounPlural(ctx.tour.kind), end: true },
    ...(isGrandTour
      ? [{ to: "/specials", label: "Wertungen", end: false }]
      : []),
    { to: "/rangliste", label: "Rangliste", end: false },
  ];

  return (
    <div className="mx-auto flex min-h-full max-w-xl flex-col md:max-w-4xl">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur">
        {/* races without a single identity colour (rainbow jersey) get a gradient rule */}
        {gradient && (
          <span
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-0.5"
            style={{ background: gradient }}
          />
        )}
        <div className="flex min-w-0 items-center gap-2">
          {ctx.tours.length > 1 ? (
            <select
              value={ctx.tour.id}
              onChange={(e) => ctx.setTour(e.target.value)}
              className="max-w-[11rem] truncate rounded-lg border border-line bg-surface px-2 py-1 text-sm font-bold text-accent"
              aria-label="Tour wählen"
            >
              {ctx.tours.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`font-display truncate text-xl font-bold uppercase tracking-tight ${gradient ? "bg-clip-text text-transparent" : "text-ink"}`}
              style={gradient ? { backgroundImage: gradient } : undefined}
            >
              {ctx.tour.name}
            </span>
          )}
          {!ctx.tour.is_active &&
            (() => {
              const upcoming =
                !!ctx.tour.starts_at &&
                Date.parse(ctx.tour.starts_at) > Date.now();
              return (
                <span className="label shrink-0 border border-line px-1.5 py-0.5 text-muted">
                  {upcoming ? "Vorschau" : "Archiv"}
                </span>
              );
            })()}
        </div>

        <div className="flex items-center gap-4">
          {/* main nav lives in the header on desktop, in the bottom bar on mobile */}
          <nav className="hidden items-center gap-4 md:flex">
            {tabs.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end} className={navClass}>
                {t.label}
              </NavLink>
            ))}
            <span className="h-4 w-px bg-surface2" />
          </nav>
          {ctx.canEdit && (
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          )}
          <NavLink to="/profil" className={navClass}>
            Profil
          </NavLink>
          <button
            className="text-sm text-muted hover:text-ink"
            onClick={() => signOut()}
          >
            Abmelden
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-24 md:pb-8">
        <Outlet context={ctx} />
      </main>

      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-xl border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm ${
                isActive ? "text-accent" : "text-muted"
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
