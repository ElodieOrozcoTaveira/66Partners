import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Download,
  Layers,
  LogOut,
  Mail,
  Map,
  ShieldCheck,
  Info,
  Send,
  User,
  UserCog,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { revokeAdminAccess } from "../../lib/adminAccess";
import AdminBottomNav from "../../components/AdminComponents/AdminBottomNav/AdminBottomNav";
import SettingsSection, {
  type SettingsItem,
} from "../../components/AdminComponents/SettingsSection/SettingsSection";
import "./AdminSettings.scss";

const SECTIONS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Gestion des accès & équipe",
    items: [
      {
        key: "admins-roles",
        icon: UserCog,
        label: "Administrateurs & rôles",
        description: "Ajouter ou modifier les accès admin",
      },
      {
        key: "security-logs",
        icon: ClipboardList,
        label: "Journal de sécurité",
        description: "Historique d'activité et connexions",
      },
    ],
  },
  {
    title: "Territoires & contenus",
    items: [
      {
        key: "territories",
        icon: Map,
        label: "Configuration des territoires",
        description: "Départements actifs sur la plateforme",
      },
      {
        key: "categories",
        icon: Layers,
        label: "Catégories d'activités",
        description: "Gérer les sports et catégories",
      },
    ],
  },
  {
    title: "Notifications & communication",
    items: [
      {
        key: "push",
        icon: Send,
        label: "Notifications push globales",
        description: "Envoyer un message à tous les utilisateurs",
      },
      {
        key: "email-templates",
        icon: Mail,
        label: "Modèles d'emails automatiques",
        description: "Personnaliser les emails transactionnels",
      },
    ],
  },
  {
    title: "Données & export",
    items: [
      {
        key: "export",
        icon: Download,
        label: "Export des données",
        description: "Format CSV / Excel",
      },
    ],
  },
  {
    title: "Préférences générales",
    items: [
      {
        key: "platform-info",
        icon: Info,
        label: "Informations de la plateforme",
        description: "Nom, contact, mentions légales",
      },
      {
        key: "2fa",
        icon: ShieldCheck,
        label: "Authentification à deux facteurs",
        description: "Renforcer la sécurité du compte admin",
      },
    ],
  },
];

export default function AdminSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);

  function handleSelect(item: SettingsItem) {
    setToast(`${item.label} — bientôt disponible`);
  }

  function handleExitAdmin() {
    revokeAdminAccess();
    navigate("/");
  }

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-page__body">
        <header className="admin-settings-page__header">
          <h1>Paramètres Admin</h1>
        </header>

        <div className="admin-settings-page__profile">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.pseudo} className="admin-settings-page__avatar" />
          ) : (
            <span className="admin-settings-page__avatar admin-settings-page__avatar--fallback">
              <User size={18} strokeWidth={2.2} />
            </span>
          )}
          <div className="admin-settings-page__profile-text">
            <strong>{user?.pseudo ?? "Accès administrateur"}</strong>
            <span>Administrateur</span>
          </div>
          <button type="button" className="admin-settings-page__logout" onClick={handleExitAdmin}>
            <LogOut size={16} strokeWidth={2.2} />
            Quitter
          </button>
        </div>

        {SECTIONS.map((section) => (
          <SettingsSection
            key={section.title}
            title={section.title}
            items={section.items}
            onSelect={handleSelect}
          />
        ))}
      </div>

      {toast && <div className="admin-settings-page__toast">{toast}</div>}

      <AdminBottomNav />
    </div>
  );
}
