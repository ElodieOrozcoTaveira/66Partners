import { Calendar, MapPin, Signal, Users } from "lucide-react";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import { LEVEL_LABELS } from "../../../lib/activityLabels";
import { formatDayMonth, formatTime, formatWeekdayLong } from "../../../lib/dateFormat";
import type { CreerActiviteForm } from "../CreerActivite";

interface EtapeApercuProps {
  form: CreerActiviteForm;
  sportName: string;
}

export default function EtapeApercu({ form, sportName }: EtapeApercuProps) {
  const { icon: Icon, color } = getSportVisual(sportName);
  const startDate = form.date && form.time ? new Date(`${form.date}T${form.time}`) : null;

  return (
    <div className="apercu-card">
      <div className="apercu-card__photo-wrap">
        <img
          src={getSportPhoto(sportName)}
          alt={sportName}
          className="apercu-card__photo"
        />
        <span className="apercu-card__badge" style={{ backgroundColor: color }}>
          <Icon size={18} color={getIconColor(color)} />
        </span>
      </div>

      <div className="apercu-card__body">
        <h2 className="apercu-card__title">{form.title || "Titre de l'activité"}</h2>

        <ul className="apercu-card__list">
          <li>
            <Calendar size={15} />
            {startDate
              ? `${formatWeekdayLong(startDate)} ${formatDayMonth(startDate)} à ${formatTime(startDate)}`
              : "Date à définir"}
          </li>
          <li>
            <MapPin size={15} />
            {form.city || "Ville à définir"}
          </li>
          <li>
            <Signal size={15} />
            Niveau {LEVEL_LABELS[form.levelRequired]}
          </li>
          <li>
            <Users size={15} />
            {form.maxParticipants} participants max
          </li>
        </ul>

        {form.description && <p className="apercu-card__description">{form.description}</p>}
      </div>
    </div>
  );
}
