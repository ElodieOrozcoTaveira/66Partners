import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import AproposProfile from "../../components/ProfilPage/A propos/Apropos";
import Dispo from "../../components/ProfilPage/Dispo/Dispo";
import HeroProfile from "../../components/ProfilPage/HeroProfil/HeroProfile";
import MesSports from "../../components/ProfilPage/MesSports/MesSports";
import StatsProfil from "../../components/ProfilPage/StatsProfil/StatsProfil";
import TopProfile from "../../components/ProfilPage/TopProfil/TopProfil";
import { useAuth, type User } from "../../contexts/AuthContext";
import api from "../../lib/axios";
import "../Profil/Profil.scss";

interface UserResponse {
  success: boolean;
  user: User;
}

export default function UserProfil() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let mounted = true;
    setIsLoading(true);
    setError(null);

    api
      .get<UserResponse>(`/api/users/${userId}`)
      .then((res) => {
        if (!mounted) return;
        setProfileUser(res.data.user);
      })
      .catch(() => {
        if (!mounted) return;
        setError("Ce profil est introuvable.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId]);

  if (currentUser && userId === currentUser.id) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return <p className="profil-page__state">Chargement...</p>;
  }

  if (error || !profileUser) {
    return (
      <p className="profil-page__state">
        {error ?? "Ce profil est introuvable."}
      </p>
    );
  }

  return (
    <div className="profil-page">
      <HeroProfile user={profileUser} isOwnProfile={false} />
      <div className="profil-page__body">
        <TopProfile user={profileUser} isOwnProfile={false} />
        <StatsProfil userId={profileUser.id} />
        <AproposProfile bio={profileUser.bio} isOwnProfile={false} />
        <Dispo dispo={profileUser.dispo} isOwnProfile={false} />
        <MesSports userId={profileUser.id} isOwnProfile={false} />
      </div>
    </div>
  );
}
