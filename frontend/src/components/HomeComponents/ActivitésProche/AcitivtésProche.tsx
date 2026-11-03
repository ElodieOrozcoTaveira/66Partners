import { useEffect, useMemo, useState, lazy, Suspense } from "react";
import { ArrowRight, CalendarPlus } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useBranding, useTerritory } from "../../../contexts/TerritoryContext";
import ActivityCard from "../../ActivityCard/ActivityCard";
import type { ActivityLevel } from "../../../lib/activityLabels";
import type { ActivityAudience } from "../../../lib/audience";
import api from "../../../lib/axios";
import { useAuth } from "../../../contexts/AuthContext";
import "./NearbySection.scss";

// Chargées à la demande : ces modales embarquent react-icons (cf. Home.tsx).
const ModaleContent = lazy(() => import("../../ModaleConnexion/ModaleContent/ModaleContent"));
const ModaleRegisterContent = lazy(
  () => import("../../ModaleRegister/ModaleRegisteContent/ModaleRegisterContent"),
);

const UPCOMING_COUNT = 6;

interface Activity {
  id: string;
  title: string;
  city: string;
  startDate: string;
  maxParticipants: number;
  status: string;
  sportId: string;
  sportName: string;
  participantsCount: number;
  creatorPseudo: string | null;
  creatorAvatar: string | null;
  levelRequired?: ActivityLevel;
  audience?: ActivityAudience;
  latitude?: number | null;
  longitude?: number | null;
}

interface ActivitiesResponse {
  success: boolean;
  activities: Activity[];
}

export default function ActivitésProche() {
  const { territoryOf, territoryIn } = useBranding();
  const { activeTerritory } = useTerritory();
  const territoryCode = activeTerritory?.code;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  // Évite d'afficher l'encart « aucune sortie » avant la fin du chargement.
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeModal, setActiveModal] = useState<"login" | "register" | null>(
    null,
  );

  useEffect(() => {
    // territoryCode se résout de façon asynchrone au premier montage : ne
    // pas appeler avant, désormais refusé sans territoire par le backend
    // (cf. audit P-01).
    if (!territoryCode) return;
    api
      .get<ActivitiesResponse>("/api/activities", {
        params: { territory: territoryCode, from: new Date().toISOString() },
      })
      .then((res) => setActivities(res.data.activities))
      .catch(() => setActivities([]))
      .finally(() => setIsLoaded(true));
  }, [territoryCode]);

  useEffect(() => {
    if (activeModal && user) {
      setActiveModal(null);
      navigate("/explorer");
    }
  }, [activeModal, user, navigate]);

  function handleExplorerClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!user) {
      event.preventDefault();
      setActiveModal("login");
    }
  }

  // `activities` est déjà filtrée à l'à-venir côté backend (`from`), ne
  // reste qu'à exclure les annulées (cf. chantier filtres de date).
  const upcoming = useMemo(() => {
    return activities
      .filter((activity) => activity.status !== "CANCELLED")
      .slice(0, UPCOMING_COUNT);
  }, [activities]);

  // Territoire sans sortie à venir (ex. tout juste ouvert) : encart court
  // plutôt qu'une section vide en haut de page.
  if (isLoaded && upcoming.length === 0) {
    return (
      <section className="nearby page-container" aria-labelledby="nearby-titre">
        <div className="nearby__first">
          <span className="nearby__first-icon">
            <CalendarPlus size={24} />
          </span>
          <div className="nearby__first-text">
            <h2 id="nearby-titre">Lance la première sortie {territoryIn}</h2>
            <p>Propose une activité : les sportifs de ton territoire pourront te rejoindre.</p>
          </div>
          <NavLink to="/mesactivités/nouvelle" className="btn btn--primary" onClick={handleExplorerClick}>
            Créer une activité
          </NavLink>
        </div>

        <Suspense fallback={null}>
          <ModaleContent
            isOpen={activeModal === "login"}
            onClose={() => setActiveModal(null)}
            onSwitchToRegister={() => setActiveModal("register")}
          />
          <ModaleRegisterContent
            isOpen={activeModal === "register"}
            onClose={() => setActiveModal(null)}
            onSwitchToLogin={() => setActiveModal("login")}
          />
        </Suspense>
      </section>
    );
  }

  return (
    <section className="nearby page-container" aria-labelledby="nearby-titre">
      <div className="nearby__head">
        <div>
          <span className="eyebrow">À venir</span>
          <h2 id="nearby-titre" className="nearby__titre">
            Les prochaines sorties {territoryOf}
          </h2>
        </div>
        <NavLink to="/explorer" className="btn btn--ghost" onClick={handleExplorerClick}>
          Voir toutes les activités <ArrowRight size={16} />
        </NavLink>
      </div>

      {!isLoaded ? (
        <div className="nearby__grid" aria-busy="true">
          {[0, 1, 2].map((key) => (
            <span key={key} className="nearby__skeleton" />
          ))}
        </div>
      ) : (
        <div className="nearby__grid">
          {upcoming.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} onClick={handleExplorerClick} />
          ))}
        </div>
      )}

      <Suspense fallback={null}>
        <ModaleContent
          isOpen={activeModal === "login"}
          onClose={() => setActiveModal(null)}
          onSwitchToRegister={() => setActiveModal("register")}
        />
        <ModaleRegisterContent
          isOpen={activeModal === "register"}
          onClose={() => setActiveModal(null)}
          onSwitchToLogin={() => setActiveModal("login")}
        />
      </Suspense>
    </section>
  );
}
