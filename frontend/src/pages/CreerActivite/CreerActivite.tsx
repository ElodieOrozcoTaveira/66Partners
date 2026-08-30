import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../lib/axios";
import type { ActivityLevel } from "../../lib/activityLabels";
import EtapeInfos from "./etapes/EtapeInfos";
import EtapeLieuDate from "./etapes/EtapeLieuDate";
import EtapeDetails from "./etapes/EtapeDetails";
import EtapeApercu from "./etapes/EtapeApercu";
import EtapeSucces from "./etapes/EtapeSucces";
import "./CreerActivite.scss";

export interface Sport {
  id: string;
  name: string;
}

export interface CreerActiviteForm {
  sportId: string;
  title: string;
  description: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  date: string;
  time: string;
  levelRequired: ActivityLevel;
  maxParticipants: number;
}

const INITIAL_FORM: CreerActiviteForm = {
  sportId: "",
  title: "",
  description: "",
  city: "",
  latitude: null,
  longitude: null,
  date: "",
  time: "",
  levelRequired: "INTERMEDIATE",
  maxParticipants: 8,
};

const STEP_META = [
  { title: "Infos principales", subtitle: "De quel type d'activité s'agit-il ?" },
  { title: "Lieu & date", subtitle: "Où et quand aura lieu l'activité ?" },
  { title: "Détails", subtitle: "Ajoutez le niveau, le nombre de participants" },
  { title: "Aperçu", subtitle: "Vérifiez avant de publier votre activité" },
] as const;

const TOTAL_STEPS = STEP_META.length;

export default function CreerActivite() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [form, setForm] = useState<CreerActiviteForm>(INITIAL_FORM);
  const [sports, setSports] = useState<Sport[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ success: boolean; sports: Sport[] }>("/api/sports")
      .then((res) => setSports(res.data.sports))
      .catch(() => setSports([]));
  }, []);

  function updateForm(patch: Partial<CreerActiviteForm>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  const canGoNext = useMemo(() => {
    switch (step) {
      case 1:
        return form.sportId !== "" && form.title.trim().length > 0;
      case 2:
        return form.city.trim().length > 0 && form.date !== "" && form.time !== "";
      case 3:
        return form.maxParticipants > 1;
      default:
        return true;
    }
  }, [step, form]);

  function handleBack() {
    if (step === 1) {
      navigate(-1);
      return;
    }
    setStep((prev) => prev - 1);
  }

  function handleNext() {
    if (!canGoNext) return;
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }

  async function handlePublish() {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const startDate = new Date(`${form.date}T${form.time}`);

      await api.post("/api/activities", {
        sportId: form.sportId,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        city: form.city.trim(),
        latitude: form.latitude ?? undefined,
        longitude: form.longitude ?? undefined,
        startDate: startDate.toISOString(),
        levelRequired: form.levelRequired,
        maxParticipants: form.maxParticipants,
      });
      setIsSuccess(true);
    } catch (error) {
      const message =
        isAxiosError<{ message?: string }>(error) && error.response?.data?.message
          ? error.response.data.message
          : "Impossible de publier l'activité pour le moment.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedSport = sports.find((sport) => sport.id === form.sportId) ?? null;

  if (isSuccess) {
    return <EtapeSucces title={form.title} />;
  }

  const meta = STEP_META[step - 1];

  return (
    <div className="creer-activite">
      <header className="creer-activite__header">
        <button
          type="button"
          className="creer-activite__back"
          onClick={handleBack}
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="creer-activite__progress">
          <div
            className="creer-activite__progress-fill"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
        <span className="creer-activite__step-count">
          {step}/{TOTAL_STEPS}
        </span>
      </header>

      <div className="creer-activite__intro">
        <h1 className="creer-activite__title">{meta.title}</h1>
        <p className="creer-activite__subtitle">{meta.subtitle}</p>
      </div>

      <div className="creer-activite__content">
        {step === 1 && (
          <EtapeInfos form={form} sports={sports} onChange={updateForm} />
        )}
        {step === 2 && <EtapeLieuDate form={form} onChange={updateForm} />}
        {step === 3 && <EtapeDetails form={form} onChange={updateForm} />}
        {step === 4 && (
          <EtapeApercu form={form} sportName={selectedSport?.name ?? "Sport"} />
        )}

        {submitError && <p className="creer-activite__error">{submitError}</p>}
      </div>

      <footer className="creer-activite__footer">
        {step > 1 && (
          <button
            type="button"
            className="creer-activite__btn creer-activite__btn--ghost"
            onClick={handleBack}
          >
            Retour
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            type="button"
            className="creer-activite__btn creer-activite__btn--primary"
            onClick={handleNext}
            disabled={!canGoNext}
          >
            Suivant
          </button>
        ) : (
          <button
            type="button"
            className="creer-activite__btn creer-activite__btn--primary"
            onClick={handlePublish}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Publication..." : "Publier l'activité"}
          </button>
        )}
      </footer>
    </div>
  );
}
