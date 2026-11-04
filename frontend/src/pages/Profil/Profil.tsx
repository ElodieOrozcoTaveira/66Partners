import AproposProfile from "../../components/ProfilPage/A propos/Apropos";
import CompteDanger from "../../components/ProfilPage/CompteDanger/CompteDanger";
import Dispo from "../../components/ProfilPage/Dispo/Dispo";
import DernieresActivites from "../../components/ProfilPage/DernieresActivites/DernieresActivites";
import HeroProfile from "../../components/ProfilPage/HeroProfil/HeroProfile";
import MembresBloques from "../../components/ProfilPage/MembresBloques/MembresBloques";
import MesSports from "../../components/ProfilPage/MesSports/MesSports";
import StatsProfil from "../../components/ProfilPage/StatsProfil/StatsProfil";
import TopProfile from "../../components/ProfilPage/TopProfil/TopProfil";
import { lazy, Suspense } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { STRAVA_ENABLED } from "../../lib/features";
import "./Profil.scss";

const StravaCard = STRAVA_ENABLED
  ? lazy(() => import("../../components/ProfilPage/StravaCard/StravaCard"))
  : null;

export default function Profil() {
  const { user } = useAuth();

  return (
    <div className="profil-page">
      <HeroProfile user={user} />
      <div className="profil-page__body">
        <TopProfile user={user} />
        <AproposProfile
          headline={user?.headline ?? null}
          createdAt={user?.createdAt ?? null}
        />
        <StatsProfil userId={user?.id ?? null} />
        <MesSports userId={user?.id ?? null} />
        <Dispo userId={user?.id ?? null} />
        <DernieresActivites userId={user?.id ?? null} />
        {StravaCard && (
          <Suspense fallback={null}>
            <StravaCard />
          </Suspense>
        )}
        <MembresBloques />
        <CompteDanger />
      </div>
    </div>
  );
}
