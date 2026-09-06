import { useEffect, useState } from "react";
import { useApp } from "../lib/appContext";
import {
  listClassifications,
  listMyClassificationTips,
  listMyAnswers,
  listQuestions,
  listRiders,
  type QuestionWithOptions,
} from "../lib/queries";
import type {
  Classification,
  ClassificationTip,
  QuestionAnswer,
  Rider,
} from "../lib/types";
import { ClassificationCard } from "../components/ClassificationCard";
import { QuestionCard } from "../components/QuestionCard";

export function Specials() {
  const { tour, userId } = useApp();
  const [cls, setCls] = useState<Classification[]>([]);
  const [tips, setTips] = useState<ClassificationTip[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [questions, setQuestions] = useState<QuestionWithOptions[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      listClassifications(tour.id),
      listMyClassificationTips(tour.id, userId),
      listRiders(tour.id),
      listQuestions(tour.id),
      listMyAnswers(tour.id, userId),
    ])
      .then(([c, t, r, q, a]) => {
        setCls(c);
        setTips(t);
        setRiders(r);
        setQuestions(q);
        setAnswers(a);
      })
      .catch((e) => setError(e.message));
  }, [tour.id, userId]);

  if (error) return <p className="py-4 text-miss">{error}</p>;

  const tourClassifications = cls.filter((c) => c.stage_id === null);
  const tourQuestions = questions.filter((q) => q.stage_id === null);

  return (
    <div className="flex flex-col gap-3 py-3">
      <p className="text-sm text-muted">
        Sonderwertungen — tippbar bis zur jeweiligen Deadline.
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

      {tourQuestions.length > 0 && (
        <>
          <h2 className="mt-4 font-semibold text-ink">Fragen</h2>
          {tourQuestions.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              myAnswer={answers.find((a) => a.question_id === q.id) ?? null}
              tourId={tour.id}
              userId={userId}
            />
          ))}
        </>
      )}
    </div>
  );
}
