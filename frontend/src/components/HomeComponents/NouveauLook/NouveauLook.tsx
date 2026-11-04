import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  Bell,
  CheckCircle2,
  Compass,
  Download,
  EllipsisVertical,
  Home,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Plus,
  Share,
  Smartphone,
  Sparkles,
  SquarePlus,
  User,
  Users,
} from "lucide-react";
import { useBranding, useTerritory } from "../../../contexts/TerritoryContext";
import { getSportPhoto } from "../../../lib/sportPhotos";
import { resolveTerritoryAsset } from "../../../lib/territoryAssets";
import { useTerritoryThemes } from "../../TerritoryBadge/TerritoryBadge";
import {
  PWA_INSTALL_AVAILABLE,
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  type BeforeInstallPromptEvent,
} from "../../../lib/pwaInstall";
import "./NouveauLook.scss";

export const NOUVEAU_LOOK_ID = "nouveau-look";

interface PhoneTerritory {
  id: string;
  code: string;
  name: string;
  assetsPath: string | null;
}

interface PhoneMockupProps {
  territory: PhoneTerritory;
  firstName: string;
  sport: string;
  outing: string;
  position: "left" | "center" | "right";
  colors: Record<string, string> | undefined;
}

/** Téléphone affichant l'accueil de l'app, aux couleurs d'un territoire. */
function PhoneMockup({ territory, firstName, sport, outing, position, colors }: PhoneMockupProps) {
  const style = {
    ...(colors?.primary && { "--brand-primary": colors.primary }),
    ...(colors?.primaryDark && { "--brand-primary-dark": colors.primaryDark }),
    ...(colors?.accent && { "--brand-accent": colors.accent }),
    ...(colors?.accentDark && { "--brand-accent-dark": colors.accentDark }),
  } as CSSProperties;
  return (
    <div className={`phone phone--${position}`} style={style} aria-hidden="true">
      <div className="phone__notch" />
      <div className="phone__screen">
        <div
          className="phone__header"
          style={{ backgroundImage: `url(${resolveTerritoryAsset(territory.assetsPath, "emblem")})` }}
        >
          <div className="phone__tint" />
          <div className="phone__row">
            <span className="phone__avatar" />
            <div className="phone__hello">
              <strong>Bonjour {firstName}</strong>
              <span>Envie d'une nouvelle aventure ?</span>
            </div>
            <span className="phone__bell">
              <Bell size={13} />
            </span>
          </div>
          <div className="phone__chips">
            <span>
              <MapPin size={10} /> {territory.name}
            </span>
            <span>
              <Users size={10} /> Sportifs autour de toi
            </span>
          </div>
        </div>

        <div className="phone__hero" style={{ backgroundImage: `url(${getSportPhoto(sport)})` }}>
          <span className="phone__countdown">Demain</span>
          <div className="phone__hero-text">
            <small>TA PROCHAINE SORTIE</small>
            <strong>{outing}</strong>
          </div>
        </div>

        <p className="phone__section">À venir autour de toi</p>
        <div className="phone__tiles">
          {["Randonnée", "Cyclisme"].map((tile) => (
            <div key={tile} className="phone__tile">
              <span style={{ backgroundImage: `url(${getSportPhoto(tile)})` }} />
              <strong>{tile}</strong>
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

// Territoires des téléphones de côté : couleurs bien différentes et visuels légers.
const SIDE_PREFERENCE = ["65", "09", "82", "32", "12", "66"];

const PHONE_CONTENT = [
  { firstName: "Tom", sport: "Randonnée", outing: "Rando au lever du soleil" },
  { firstName: "Léa", sport: "Running", outing: "Footing au bord de l'eau" },
  { firstName: "Inès", sport: "Cyclisme", outing: "Sortie vélo du dimanche" },
];

/** Trois téléphones en éventail : le territoire affiché au centre, deux autres de côté. */
function PhoneFan() {
  const { activeTerritory, publicTerritories } = useTerritory();
  const others = SIDE_PREFERENCE.map((code) => publicTerritories.find((territory) => territory.code === code))
    .filter((territory): territory is NonNullable<typeof territory> => Boolean(territory))
    .filter((territory) => territory.code !== activeTerritory?.code);
  const center = activeTerritory ?? publicTerritories[0];
  const trio = center ? [others[0] ?? center, center, others[1] ?? center] : [];
  const themes = useTerritoryThemes(trio);
  if (trio.length === 0) return null;

  const positions = ["left", "center", "right"] as const;
  return (
    <div className="phone-fan">
      {trio.map((territory, index) => (
        <PhoneMockup
          key={`${positions[index]}-${territory.code}`}
          territory={territory}
          position={positions[index]!}
          colors={themes[territory.code]}
          {...PHONE_CONTENT[index]!}
        />
      ))}
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

type Platform = "ios" | "android";

const INSTALL_STEPS: Record<Platform, { icon: typeof Share; text: ReactNode }[]> = {
  ios: [
    { icon: Compass, text: <>Ouvre le site dans <strong>Safari</strong>.</> },
    { icon: Share, text: <>Touche le bouton <strong>Partager</strong>, en bas de l'écran.</> },
    { icon: SquarePlus, text: <>Choisis <strong>« Sur l'écran d'accueil »</strong>.</> },
    { icon: CheckCircle2, text: <>Touche <strong>« Ajouter »</strong> : l'app apparaît avec son logo.</> },
  ],
  android: [
    { icon: Compass, text: <>Ouvre le site dans <strong>Chrome</strong>.</> },
    { icon: EllipsisVertical, text: <>Touche le menu <strong>⋮</strong>, en haut à droite.</> },
    {
      icon: SquarePlus,
      text: <>Choisis <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong>.</>,
    },
    { icon: CheckCircle2, text: <>Confirme : l'app apparaît avec son logo.</> },
  ],
};

/** Installer l'app web : bouton natif si possible, et le pas-à-pas iPhone / Android. */
function InstallCta() {
  const { brandName } = useBranding();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(getDeferredInstallPrompt);
  const [installed, setInstalled] = useState(isStandalone);
  const [platform, setPlatform] = useState<Platform>(() => (isIos() ? "ios" : "android"));

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

  return (
    <>
      {prompt && (
        <button type="button" className="btn btn--primary nouveau-look__install" onClick={() => void install()}>
          <Download size={18} /> Installer l'application
        </button>
      )}

      <div className="install-guide">
        <div className="install-guide__head">
          <span className="install-guide__title">Ajouter {brandName} à ton écran d'accueil</span>
          <div className="install-guide__tabs" role="tablist" aria-label="Type de téléphone">
            {(["ios", "android"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={platform === value}
                className={`install-guide__tab${platform === value ? " install-guide__tab--active" : ""}`}
                onClick={() => setPlatform(value)}
              >
                {value === "ios" ? "iPhone" : "Android"}
              </button>
            ))}
          </div>
        </div>
        <ol className="install-guide__steps">
          {INSTALL_STEPS[platform].map(({ icon: Icon, text }, index) => (
            <li key={index}>
              <span className="install-guide__number">{index + 1}</span>
              <span className="install-guide__icon">
                <Icon size={16} strokeWidth={2.4} />
              </span>
              <span className="install-guide__text">{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
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
          <PhoneFan />
        </div>
      </div>
    </section>
  );
}
