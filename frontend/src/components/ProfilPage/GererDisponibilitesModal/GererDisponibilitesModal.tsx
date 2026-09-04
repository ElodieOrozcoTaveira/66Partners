import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isAxiosError } from "axios";
import api from "../../../lib/axios";
import { WEEKDAYS, weekdayLabel, type Weekday } from "../../../lib/weekdayLabels";
import "./GererDisponibilitesModal.scss";

export interface AvailabilitySlot {
  id: string;
  weekday: Weekday;
  startTime: string;
  endTime: string;
}

interface GererDisponibilitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  slots: AvailabilitySlot[];
  onChange: () => void;
}

export default function GererDisponibilitesModal({
  isOpen,
  onClose,
  slots,
  onChange,
}: GererDisponibilitesModalProps) {
  const [weekday, setWeekday] = useState<Weekday>("MONDAY");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setError(null);
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await api.post("/api/users/me/availabilities", { weekday, startTime, endTime });
      onChange();
    } catch (err) {
      const message =
        isAxiosError<{ message?: string }>(err) && err.response?.data?.message
          ? err.response.data.message
          : "Impossible d'ajouter ce créneau.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    try {
      await api.delete(`/api/users/me/availabilities/${id}`);
      onChange();
    } catch (err) {
      console.error("GererDisponibilitesModal: failed to remove slot", err);
    } finally {
      setRemovingId(null);
    }
  }

  return createPortal(
    <div className="modale-dispo-overlay" onClick={onClose}>
      <div
        className="modale-dispo-content"
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="modale-dispo-content__close"
          onClick={onClose}
          aria-label="Fermer"
        >
          <X size={20} />
        </button>

        <div className="container-gererDispo">
          <h3 className="container-gererDispo__h3">Mes disponibilités</h3>

          {slots.length === 0 ? (
            <p className="container-gererDispo__empty">Aucun créneau pour l'instant.</p>
          ) : (
            <ul className="container-gererDispo__list">
              {slots.map((slot) => (
                <li key={slot.id} className="container-gererDispo__item">
                  <span>
                    <strong>{weekdayLabel(slot.weekday)}</strong> {slot.startTime} – {slot.endTime}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(slot.id)}
                    disabled={removingId === slot.id}
                    aria-label={`Supprimer le créneau du ${weekdayLabel(slot.weekday)}`}
                  >
                    <X size={14} strokeWidth={2.4} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="container-gererDispo__form" onSubmit={handleSubmit}>
            <h4 className="container-gererDispo__formTitle">Ajouter un créneau</h4>

            <div className="container-gererDispo__row">
              <select value={weekday} onChange={(e) => setWeekday(e.target.value as Weekday)}>
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {weekdayLabel(day)}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>

            {error && <p className="container-gererDispo__error">{error}</p>}

            <button type="submit" className="container-gererDispo__submit" disabled={isSubmitting}>
              {isSubmitting ? "Ajout…" : "Ajouter"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
}
