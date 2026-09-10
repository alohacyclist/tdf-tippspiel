export function isPast(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() <= Date.now();
}

const fmt = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLocal(iso: string | null): string {
  if (!iso) return "—";
  return fmt.format(new Date(iso));
}

// Compares in the viewer's local timezone: a stage that starts 22:00 CEST is still
// "today" for someone in Berlin, which is what a start list means by the date.
export function isToday(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function countdown(iso: string | null): string {
  if (!iso) return "Startzeit unbekannt";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "gestartet";
  const mins = Math.floor(ms / 60000);
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `noch ${d}d ${h}h`;
  if (h > 0) return `noch ${h}h ${m}min`;
  return `noch ${m}min`;
}
