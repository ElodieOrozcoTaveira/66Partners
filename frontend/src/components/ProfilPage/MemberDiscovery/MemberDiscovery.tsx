import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, MapPin, Plus } from "lucide-react";
import ActivityCard, { type ActivityCardData } from "../../ActivityCard/ActivityCard";
import api from "../../../lib/axios";
import { getSportVisual } from "../../../lib/sportVisuals";
import "./MemberDiscovery.scss";

interface MemberSport {
  sportId: string;
  sportName: string;
}

interface MemberDetail {
  member: { pseudo: string; age: number | null; sectorName: string };
  upcomingActivities: ActivityCardData[];
}

const CREATE_ACTIVITY_PATH = "/mesactivités/nouvelle";

/**
 * Bloc du profil d'un autre membre. Le secteur, l'âge et les activités à venir
 * ne s'affichent que si les deux membres sont sur la carte (l'API répond 403
 * ou 404 sinon) ; la création d'activité est proposée dans tous les cas.
 */
export default function MemberDiscovery({ userId }: { userId: string }) {
  const { hash } = useLocation();
  const activitiesRef = useRef<HTMLElement>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [sports, setSports] = useState<MemberSport[]>([]);

  useEffect(() => {
    let cancelled = false;
    setDetail(null);
    setSports([]);
    api
      .get<MemberDetail>(`/api/discovery/members/${userId}`)
      .then((res) => {
        if (!cancelled) setDetail(res.data);
      })
      .catch(() => undefined);
    api
      .get<{ sports: MemberSport[] }>(`/api/users/${userId}/sports`)
      .then((res) => {
        if (!cancelled) setSports(res.data.sports);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Arrivée depuis « Voir ses activités » sur la carte.
  useEffect(() => {
    if (detail && hash === "#activites") {
      activitiesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [detail, hash]);

  return (
    <div className="member-discovery">
      {detail && (
        <>
          <section className="member-discovery__card member-discovery__sector">
            <MapPin size={18} />
            <span>
              À proximité de <strong>{detail.member.sectorName}</strong>
              {detail.member.age !== null ? ` · ${detail.member.age} ans` : ""}
            </span>
          </section>

          <section ref={activitiesRef} id="activites" className="member-discovery__card">
            <h2 className="member-discovery__title">
              <CalendarDays size={18} /> Ses activités à venir
            </h2>
            {detail.upcomingActivities.length > 0 ? (
              <div className="member-discovery__activities">
                {detail.upcomingActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <p className="member-discovery__empty">Aucune activité à venir pour le moment.</p>
            )}
          </section>
        </>
      )}

      <section className="member-discovery__card member-discovery__cta">
        <h2 className="member-discovery__title">Envie de bouger ?</h2>
        <p>
          Propose une sortie : elle sera visible par les sportifs du territoire, qui pourront te
          rejoindre.
        </p>
        {sports.length > 0 ? (
          <div className="member-discovery__sports">
            {sports.map((sport) => {
              const { icon: Icon } = getSportVisual(sport.sportName);
              return (
                <NavLink
                  key={sport.sportId}
                  to={`${CREATE_ACTIVITY_PATH}?sport=${sport.sportId}`}
                  className="btn btn--primary"
                >
                  <Plus size={16} /> <Icon size={15} /> Créer une activité de {sport.sportName}
                </NavLink>
              );
            })}
          </div>
        ) : (
          <NavLink to={CREATE_ACTIVITY_PATH} className="btn btn--primary">
            <Plus size={16} /> Créer une activité
          </NavLink>
        )}
      </section>
    </div>
  );
}
