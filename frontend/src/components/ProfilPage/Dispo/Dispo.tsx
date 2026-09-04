import { useCallback, useEffect, useState } from "react";
import { Clock, Plus } from "lucide-react";
import api from "../../../lib/axios";
import { weekdayLabel, type Weekday } from "../../../lib/weekdayLabels";
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

const DISPLAY_COUNT = 3;

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
      console.error("Dispo: failed to fetch availabilities", err);
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

  const visible = slots.slice(0, DISPLAY_COUNT);

  return (
    <div className="container-dispo">
      <div className="container-dispo__header">
        <h2>
          <Clock size={14} strokeWidth={2.4} />
          Disponibilités
        </h2>
        {isOwnProfile && slots.length > 0 && (
          <button
            type="button"
            className="container-dispo__manage"
            onClick={() => setIsModalOpen(true)}
          >
            Voir toutes mes disponibilités
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="container-dispo__empty">Chargement...</p>
      ) : slots.length === 0 && !isOwnProfile ? (
        <p className="container-dispo__empty">Aucune disponibilité renseignée.</p>
      ) : (
        <div className="container-dispo__list">
          {visible.map((slot) => (
            <div key={slot.id} className="dispo-chip">
              <span className="dispo-chip__icon">
                <Clock size={14} strokeWidth={2.2} />
              </span>
              <span className="dispo-chip__day">{weekdayLabel(slot.weekday as Weekday)}</span>
              <span className="dispo-chip__time">
                {slot.startTime} – {slot.endTime}
              </span>
            </div>
          ))}

          {isOwnProfile && (
            <button
              type="button"
              className="dispo-chip dispo-chip--add"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus size={16} strokeWidth={2.4} />
              Ajouter une dispo
            </button>
          )}
        </div>
      )}

      {isOwnProfile && (
        <GererDisponibilitesModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          slots={slots}
          onChange={fetchSlots}
        />
      )}
    </div>
  );
}
