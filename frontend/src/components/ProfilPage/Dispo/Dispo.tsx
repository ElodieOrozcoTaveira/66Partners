import { useCallback, useEffect, useState } from "react";
import { CalendarClock, Moon, Pencil, Plus, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import api from "../../../lib/axios";
import { WEEKDAYS, weekdayLabel, type Weekday } from "../../../lib/weekdayLabels";
import GererDisponibilitesModal, {
  type AvailabilitySlot,
} from "../GererDisponibilitesModal/GererDisponibilitesModal";
import "./Dispo.scss";

interface DispoProps {
  userId: string | null;
  isOwnProfile?: boolean;
}

interface AvailabilitiesResponse {
  success: boolean;
  availabilities: AvailabilitySlot[];
}

interface Period {
  key: "morning" | "noon" | "afternoon" | "evening";
  label: string;
  icon: LucideIcon;
}

/** Moment de la journée d'après l'heure de début du créneau. */
function periodOf(startTime: string): Period {
  const hour = Number(startTime.split(":")[0]);
  if (hour < 12) return { key: "morning", label: "Matin", icon: Sunrise };
  if (hour < 14) return { key: "noon", label: "Midi", icon: Sun };
  if (hour < 18) return { key: "afternoon", label: "Après-midi", icon: Sunset };
  return { key: "evening", label: "Soir", icon: Moon };
}

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  return minutes === "00" ? `${Number(hours)}h` : `${Number(hours)}h${minutes}`;
}

export default function Dispo({ userId, isOwnProfile = true }: DispoProps) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSlots = useCallback(async () => {
    if (!userId) return;
    try {
      const url = isOwnProfile
        ? "/api/users/me/availabilities"
        : `/api/users/${userId}/availabilities`;
      const res = await api.get<AvailabilitiesResponse>(url);
      setSlots(res.data.availabilities);
    } catch (err) {
      console.error(
        "Dispo: failed to fetch availabilities",
        err instanceof Error ? err.message : "Erreur inconnue",
      );
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId, isOwnProfile]);

  useEffect(() => {
    setIsLoading(true);
    fetchSlots();
  }, [fetchSlots]);

  if (!userId) return null;

  const byDay = WEEKDAYS.map((weekday) => ({
    weekday,
    slots: slots
      .filter((slot) => slot.weekday === weekday)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));
  const activeDays = byDay.filter((day) => day.slots.length > 0);

  return (
    <section className="container-dispo" aria-labelledby="dispo-titre">
      <div className="container-dispo__header">
        <div className="container-dispo__heading">
          <span className="container-dispo__icon" aria-hidden="true">
            <CalendarClock size={19} strokeWidth={2.2} />
          </span>
          <div>
            <h2 id="dispo-titre" className="container-dispo__h2">
              Disponibilités
            </h2>
            {!isLoading && slots.length > 0 && (
              <p className="container-dispo__count">
                {slots.length} créneau{slots.length > 1 ? "x" : ""} · {activeDays.length} jour
                {activeDays.length > 1 ? "s" : ""} par semaine
              </p>
            )}
          </div>
        </div>
        {isOwnProfile && slots.length > 0 && (
          <button type="button" className="container-dispo__manage" onClick={() => setIsModalOpen(true)}>
            <Pencil size={14} strokeWidth={2.4} />
            Gérer
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="container-dispo__empty">Chargement...</p>
      ) : slots.length === 0 ? (
        <div className="container-dispo__empty">
          <p>
            {isOwnProfile
              ? "Indique quand tu es disponible : les autres sportifs sauront quand te proposer une sortie."
              : "Aucune disponibilité renseignée pour l'instant."}
          </p>
          {isOwnProfile && (
            <button type="button" className="container-dispo__add" onClick={() => setIsModalOpen(true)}>
              <Plus size={16} strokeWidth={2.6} />
              Ajouter mes disponibilités
            </button>
          )}
        </div>
      ) : (
        <>
          <ol className="container-dispo__week" aria-label="Jours disponibles">
            {byDay.map(({ weekday, slots: daySlots }) => (
              <li
                key={weekday}
                className={daySlots.length > 0 ? "is-active" : undefined}
                aria-label={`${weekdayLabel(weekday)} : ${daySlots.length > 0 ? "disponible" : "pas de créneau"}`}
              >
                <span className="container-dispo__letter">{weekdayLabel(weekday).charAt(0)}</span>
                <span className="container-dispo__short">{weekdayLabel(weekday).slice(0, 3)}</span>
                {daySlots.length > 1 && <em>{daySlots.length}</em>}
              </li>
            ))}
          </ol>

          <ul className="container-dispo__days">
            {activeDays.map(({ weekday, slots: daySlots }) => (
              <li key={weekday} className="dispo-day">
                <span className="dispo-day__name">{weekdayLabel(weekday as Weekday)}</span>
                <span className="dispo-day__slots">
                  {daySlots.map((slot) => {
                    const period = periodOf(slot.startTime);
                    const Icon = period.icon;
                    return (
                      <span
                        key={slot.id}
                        className={`dispo-slot dispo-slot--${period.key}`}
                        title={period.label}
                      >
                        <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
                        <span className="dispo-slot__time">
                          {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                        </span>
                        <span className="dispo-slot__period">{period.label}</span>
                      </span>
                    );
                  })}
                </span>
              </li>
            ))}
          </ul>

          {isOwnProfile && (
            <button
              type="button"
              className="container-dispo__add container-dispo__add--ghost"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} strokeWidth={2.6} />
              Ajouter un créneau
            </button>
          )}
        </>
      )}

      {isOwnProfile && (
        <GererDisponibilitesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slots={slots}
          onChange={fetchSlots}
        />
      )}
    </section>
  );
}
