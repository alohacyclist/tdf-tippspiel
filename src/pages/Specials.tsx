import { useEffect, useState } from "react";
import { useApp } from "../lib/appContext";
import {
  listClassifications,
  listMyClassificationTips,
  listRiders,
} from "../lib/queries";
import type { Classification, ClassificationTip, Rider } from "../lib/types";
import { ClassificationCard } from "../components/ClassificationCard";

export function Specials() {
  const { tour, userId } = useApp();
  const [cls, setCls] = useState<Classification[]>([]);
  const [tips, setTips] = useState<ClassificationTip[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listClassifications(tour.id),
      listMyClassificationTips(tour.id, userId),
      listRiders(tour.id),
    ])
      .then(([c, t, r]) => {
        setCls(c);
        setTips(t);
        setRiders(r);
      })
      .catch((e) => setError(e.message));
  }, [tour.id, userId]);

  if (error) return <p className="py-4 text-miss">{error}</p>;

  const tourClassifications = cls.filter((c) => c.stage_id === null);

  return (
    <div className="flex flex-col gap-3 py-3">
      <p className="text-sm text-muted">
        Wertungen — tippbar bis zur jeweiligen Deadline. Zählen nicht für den Rang.
      </p>
      {tourClassifications.map((c) => (
        <ClassificationCard
          key={c.id}
          classification={c}
          riders={riders}
          myTips={tips.filter((t) => t.classification_id === c.id)}
          tourId={tour.id}
          userId={userId}
        />
      ))}
      {tourClassifications.length === 0 && (
        <p className="text-muted">Noch keine Wertungen.</p>
      )}
    </div>
  );
}
