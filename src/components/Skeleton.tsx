// Loading placeholders. Rendering these instead of an empty list avoids the
// "Noch keine Etappen" flash while the first fetch is still in flight.
export function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-surface2 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonList({
  rows = 6,
  height = "h-16",
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Lädt">
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonLine key={i} className={`${height} w-full`} />
      ))}
    </div>
  );
}
