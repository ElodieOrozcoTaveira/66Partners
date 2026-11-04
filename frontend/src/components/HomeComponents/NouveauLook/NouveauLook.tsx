import { useEffect, useState } from "react";
import {
  Bell,
  CheckCircle2,
  Compass,
  Download,
  Home,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Plus,
  Share,
  Smartphone,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { useBranding, useTerritory } from "../../../contexts/TerritoryContext";
import { getSportPhoto } from "../../../lib/sportPhotos";
import {
  PWA_INSTALL_AVAILABLE,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "../../../lib/pwaInstall";
import "./NouveauLook.scss";

export const NOUVEAU_LOOK_ID = "nouveau-look";

/** Téléphone affichant l'accueil de l'app, aux couleurs du territoire. */
function PhoneMockup() {
  const { asset, territoryName } = useBranding();
  return (
    <div className="phone" aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div className="phone__header" style={{ backgroundImage: `url(${asset("emblem")})` }}>
          <div className="phone__tint" />
          <div className="phone__row">
            <span className="phone__avatar" />
            <div className="phone__hello">
              <strong>Bonjour Léa</strong>
              <span>Envie d'une nouvelle aventure ?</span>
            </div>
            <span className="phone__bell">
              <Bell size={13} />
            </span>
          </div>
          <div className="phone__chips">
            <span>
              <MapPin size={10} /> {territoryName || "Mon territoire"}
            </span>
            <span>
              <Users size={10} /> Sportifs autour de toi
            </span>
          </div>
        </div>

        <div className="phone__hero" style={{ backgroundImage: `url(${getSportPhoto("Running")})` }}>
          <span className="phone__countdown">Demain</span>
          <div className="phone__hero-text">
            <small>TA PROCHAINE SORTIE</small>
            <strong>Footing au bord de l'eau</strong>
          </div>
        </div>

        <p className="phone__section">À venir autour de toi</p>
        <div className="phone__tiles">
          {["Randonnée", "Cyclisme"].map((sport) => (
            <div key={sport} className="phone__tile">
              <span style={{ backgroundImage: `url(${getSportPhoto(sport)})` }} />
              <strong>{sport}</strong>
              <em>2 places</em>
            </div>
          ))}
        </div>

        <div className="phone__tabs">
          <Home size={15} />
          <Compass size={15} />
          <span className="phone__plus">
            <Plus size={15} />
          </span>
          <MessageCircle size={15} />
          <User size={15} />
        </div>
      </div>
    </div>
  );
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/** Installer l'app web : bouton natif si possible, sinon la marche à suivre. */
function InstallCta() {
  const { brandName } = useBranding();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(getDeferredInstallPrompt);
  const [installed, setInstalled] = useState(isStandalone);

  useEffect(() => {
    const handleAvailable = () => setPrompt(getDeferredInstallPrompt());
    const handleInstalled = () => setInstalled(true);
    window.addEventListener(PWA_INSTALL_AVAILABLE, handleAvailable);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener(PWA_INSTALL_AVAILABLE, handleAvailable);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function install() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearDeferredInstallPrompt();
    setPrompt(null);
    if (outcome === "accepted") setInstalled(true);
  }

  if (installed) {
    return (
      <p className="nouveau-look__installed">
        <CheckCircle2 size={18} strokeWidth={2.6} /> {brandName} est installé sur cet appareil
      </p>
    );
  }

  if (prompt) {
    return (
      <button type="button" className="btn btn--primary nouveau-look__install" onClick={() => void install()}>
        <Download size={18} /> Installer l'application
      </button>
    );
  }

  return (
    <p className="nouveau-look__how">
      {isIos() ? (
        <>
          <Share size={16} /> Sur iPhone : touche <strong>Partager</strong>, puis{" "}
          <strong>« Sur l'écran d'accueil »</strong>.
        </>
      ) : (
        <>
          <Smartphone size={16} /> Depuis le menu de ton navigateur, choisis{" "}
          <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.
        </>
      )}
    </p>
  );
}

/** « {brandName} s'est refait une beauté » : nouveautés et installation de l'app web. */
export default function NouveauLook() {
  const { brandName } = useBranding();
  const { publicTerritories } = useTerritory();
  const count = publicTerritories.length;

  const features = [
    {
      icon: Sparkles,
      title: "Un tout nouveau design",
      text: "Plus clair, plus rapide, pensé d'abord pour ton téléphone.",
    },
    {
      icon: MapIcon,
      title: "La carte des sorties",
      text: "Repère d'un coup d'œil les activités autour de toi.",
    },
    {
      icon: MapPin,
      title: count > 1 ? `${count} territoires en Occitanie` : "Ton territoire",
      text: "Change de territoire en un geste et découvre les sorties ailleurs.",
    },
    {
      icon: Bell,
      title: "Rappels et notifications",
      text: "Sois prévenu avant chaque sortie et à chaque nouveau message.",
    },
  ];

  return (
    <section id={NOUVEAU_LOOK_ID} className="nouveau-look page-container" aria-labelledby="nouveau-look-titre">
      <div className="nouveau-look__card">
        <div className="nouveau-look__text">
          <span className="nouveau-look__pill">
            <Sparkles size={14} strokeWidth={2.6} /> Nouveau
          </span>
          <h2 id="nouveau-look-titre" className="nouveau-look__titre">
            {brandName} s'est refait une beauté.
          </h2>
          <p>
            Nouveau look, nouvelles fonctionnalités : trouver un partenaire de sport n'a jamais été aussi
            simple, sur ordinateur comme sur téléphone.
          </p>

          <ul className="nouveau-look__features">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="nouveau-look__feature-icon">
                  <Icon size={18} strokeWidth={2.4} />
                </span>
                <span>
                  <strong>{title}</strong>
                  {text}
                </span>
              </li>
            ))}
          </ul>

          <div className="nouveau-look__app">
            <p className="nouveau-look__app-title">
              <Smartphone size={18} strokeWidth={2.4} /> Une vraie app, sans passer par un store
            </p>
            <InstallCta />
          </div>
        </div>
        <div className="nouveau-look__visual">
          <span className="nouveau-look__sticker" aria-hidden="true">
            <Sparkles size={16} /> Nouveau look
          </span>
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
