import { useMemo } from "react";
import { NavLink } from "react-router-dom";
import { Check } from "lucide-react";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import {
  formatDayMonth,
  formatRelativeDay,
  formatTime,
  formatWeekdayLong,
  formatWeekdayShort,
} from "../../../lib/dateFormat";
import "./ActiviteListing.scss";

export interface ActiviteListItem {
  id: string;
  title: string;
  city: string;
  startDate: string;
  status: string;
  sportName: string;
  participantsCount: number;
}

interface ActiviteListingProps {
  activities: ActiviteListItem[];
  isLoading: boolean;
  emptyMessage: string;
  /** true : sépare "À venir" / "Passées". false : liste plate (onglet Terminées). */
  splitByDate?: boolean;
}

function participantsLabel(count: number): string {
  return `${count} participant${count > 1 ? "s" : ""}`;
}

function ActiviteCard({
  activity,
  isPast,
}: {
  activity: ActiviteListItem;
  isPast: boolean;
}) {
  const { icon: Icon, color } = getSportVisual(activity.sportName);
  const startDate = new Date(activity.startDate);

  return (
    <NavLink to={`/activities/${activity.id}`} className="activite-card">
      <span className="activite-card__badge" style={{ backgroundColor: color }}>
        <Icon color={getIconColor(color)} size={20} />
      </span>

      <div className="activite-card__body">
        <h3 className="activite-card__title">{activity.title}</h3>
        <p className="activite-card__meta">
          {isPast
            ? `${formatWeekdayShort(startDate)} ${formatDayMonth(startDate)}`
            : `${formatWeekdayLong(startDate)} ${formatTime(startDate)}`}
          {" · "}
          {participantsLabel(activity.participantsCount)}
        </p>
        {!isPast && (
          <span className="activite-card__pill">{formatRelativeDay(startDate)}</span>
        )}
      </div>

      {isPast && (
        <span className="activite-card__done" aria-label="Activité passée">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
    </NavLink>
  );
}

export default function ActiviteListing({
  activities,
  isLoading,
  emptyMessage,
  splitByDate = true,
}: ActiviteListingProps) {
  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const sorted = [...activities];

    if (!splitByDate) {
      return {
        upcoming: [] as ActiviteListItem[],
        past: sorted.sort(
          (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
        ),
      };
    }

    return {
      upcoming: sorted
        .filter((activity) => new Date(activity.startDate).getTime() > now)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
      past: sorted
        .filter((activity) => new Date(activity.startDate).getTime() <= now)
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
    };
  }, [activities, splitByDate]);

  if (isLoading) {
    return <p className="activite-listing__empty">Chargement...</p>;
  }

  if (activities.length === 0) {
    return <p className="activite-listing__empty">{emptyMessage}</p>;
  }

  return (
    <div className="activite-listing">
      {upcoming.length > 0 && (
        <section className="activite-listing__section">
          <h2 className="activite-listing__section-title">À venir</h2>
          <div className="activite-listing__list">
            {upcoming.map((activity) => (
              <ActiviteCard key={activity.id} activity={activity} isPast={false} />
            ))}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="activite-listing__section">
          {splitByDate && <h2 className="activite-listing__section-title">Passées</h2>}
          <div className="activite-listing__list">
            {past.map((activity) => (
              <ActiviteCard key={activity.id} activity={activity} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
