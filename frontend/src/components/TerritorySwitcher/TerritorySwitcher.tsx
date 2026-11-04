import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTerritory } from "../../contexts/TerritoryContext";
import { useAuth } from "../../contexts/AuthContext";
import TerritoryBadge, { territoryStyle, useTerritoryThemes } from "../TerritoryBadge/TerritoryBadge";
import TerritoryWheel, { byDepartment } from "../TerritoryWheel/TerritoryWheel";
import { PHONE_QUERY, useMediaQuery } from "../../hooks/useMediaQuery";
import "./TerritorySwitcher.scss";

interface TerritorySwitcherProps {
  /** Texte affiché avant le territoire (ex. pseudo), optionnel. */
  prefix?: string;
  /** Classe posée sur le conteneur racine (ex. pastille déjà stylée à l'appelant). */
  className?: string;
}

/**
 * Source et mécanique UNIQUES du changement de territoire (Header, menu
 * burger) : mêmes `publicTerritories`/`territories`/`activeTerritory`/
 * `setActiveTerritory`/`joinTerritory` (TerritoryContext), jamais une
 * seconde implémentation. Générique — ne connaît aucun code de territoire
 * particulier.
 *
 * Tous les territoires actifs sont proposés ici, pas seulement ceux déjà
 * rejoints : sélectionner un territoire dont le compte n'est pas encore
 * membre déclenche le join existant (même API que "Rejoindre" côté Profil)
 * avant de basculer le contexte actif — jamais une seconde règle
 * d'appartenance, jamais un accès sans rejoindre réellement le territoire.
 *
 * Menu déroulant "maison" (pas un <select> natif) rendu via portail sur
 * <body> et repositionné depuis le rect du badge : un <select> natif est
 * positionné/stylé par le navigateur/l'OS (menu plein écran sur mobile,
 * position parfois incohérente entre Chrome/Firefox/Safari sur desktop), et
 * aurait été clippé par le panneau du burger (overflow-y: auto) s'il avait
 * été positionné en absolute dans le DOM plutôt qu'en portail. Le portail
 * garantit que le menu reste toujours visuellement ancré sous le même badge,
 * quel que soit le navigateur ou l'endroit où le composant est monté.
 */
/** Hauteur disponible sous le badge, pour que le menu ne sorte jamais de l'écran. */
function menuMaxHeight(top: number): number {
  return Math.max(220, Math.min(460, window.innerHeight - top - 12));
}

export default function TerritorySwitcher({ prefix, className }: TerritorySwitcherProps) {
  const { publicTerritories, territories, testTerritories, activeTerritory, setActiveTerritory, joinTerritory } =
    useTerritory();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    maxHeight: number;
    ready: boolean;
  } | null>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Un membre voit toujours ses propres territoires, même inactifs
  // publiquement (ex. 34 pas encore ouvert mais déjà rejoint) : `territories`
  // (GET /api/territories/mine) n'est jamais filtré par isActive côté
  // backend. On y ajoute les territoires publics actifs non encore rejoints
  // (dédupliqués) pour ne jamais perdre le join direct déjà en place — sans
  // ça, un membre du seul 66 ne verrait plus un futur territoire tout juste
  // activé tant qu'il ne l'a pas rejoint. Un visiteur non connecté reste
  // strictement limité aux territoires publics actifs.
  const memberCodes = new Set(territories.map((territory) => territory.code));
  const publicCodes = new Set(publicTerritories.map((territory) => territory.code));
  // Territoires de test staging (cf. TerritoryContext) : ajoutés en dernier,
  // seulement s'ils ne sont déjà couverts ni par l'appartenance réelle ni
  // par la liste publique — jamais dupliqués, jamais prioritaires.
  const extraTestTerritories = testTerritories.filter(
    (territory) => !memberCodes.has(territory.code) && !publicCodes.has(territory.code),
  );
  const visibleTerritories = (
    token
      ? [
          ...territories,
          ...publicTerritories.filter((territory) => !memberCodes.has(territory.code)),
          ...extraTestTerritories,
        ]
      : [...publicTerritories, ...extraTestTerritories]
  ).sort(byDepartment);
  const canSwitch = visibleTerritories.length > 1;
  const visibleThemes = useTerritoryThemes(
    activeTerritory && !visibleTerritories.some((territory) => territory.code === activeTerritory.code)
      ? [activeTerritory, ...visibleTerritories]
      : visibleTerritories,
  );

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      setPendingCode(null);
      return;
    }

    function resetPosition() {
      const rect = controlRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Premier passage : position de départ (alignée à gauche du badge),
      // `ready: false` le temps de mesurer la largeur réelle du menu (cf.
      // useLayoutEffect ci-dessous) pour le recaler si besoin, sans flash
      // visible grâce au layout effect qui s'exécute avant le paint.
      setMenuPosition({ top: rect.bottom + 8, left: rect.left, maxHeight: menuMaxHeight(rect.bottom + 8), ready: false });
    }

    function closeMenu(event: Event) {
      // Défiler dans la liste elle-même ne ferme pas le menu.
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (controlRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    resetPosition();
    window.addEventListener("resize", resetPosition);
    // capture: true pour intercepter le scroll de n'importe quel ancêtre
    // (ex. panneau burger), pas seulement celui de window.
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", resetPosition);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // Deuxième passage : une fois le menu monté (hors écran/invisible) à sa
  // largeur réelle, on le recale pour qu'il reste toujours dans le
  // viewport — le badge (ex. Header) peut être tout près du bord droit.
  useLayoutEffect(() => {
    if (!open || !menuPosition || menuPosition.ready) return;
    const rect = controlRef.current?.getBoundingClientRect();
    const menuEl = menuRef.current;
    if (!rect || !menuEl) return;
    const menuWidth = menuEl.getBoundingClientRect().width;
    const margin = 8;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - margin) {
      left = rect.right - menuWidth;
    }
    left = Math.max(margin, left);
    setMenuPosition({ top: rect.bottom + 8, left, maxHeight: menuMaxHeight(rect.bottom + 8), ready: true });
  }, [open, menuPosition]);

  if (!activeTerritory) return null;

  async function handleSelect(code: string) {
    setOpen(false);
    if (code === activeTerritory!.code) return;
    const alreadyMember = territories.some((territory) => territory.code === code);
    // Territoire de test staging (cf. TerritoryContext) : jamais réellement
    // actif publiquement, donc jamais rejoignable via l'API (le backend
    // refuse à raison tout join vers un territoire isActive=false). Basculer
    // directement le contexte local sans passer par joinTerritory — ce n'est
    // pas une vraie appartenance, seulement un aperçu de test.
    const isTestTerritory = testTerritories.some((territory) => territory.code === code);
    if (token && !alreadyMember && !isTestTerritory) {
      try {
        await joinTerritory(code);
      } catch {
        // Join impossible (réseau, territoire désactivé entre-temps...) : on
        // ne bascule jamais le contexte sur un territoire non rejoint.
        return;
      }
    }
    setActiveTerritory(code);
  }

  const themes = visibleThemes;

  return (
    <div className={`territory-switcher${className ? ` ${className}` : ""}`}>
      {prefix && (
        <>
          <span className="territory-switcher__prefix">{prefix}</span>
          <span className="territory-switcher__sep">·</span>
        </>
      )}
      {canSwitch ? (
        <>
          <button
            type="button"
            ref={controlRef}
            className={`territory-switcher__control${open ? " territory-switcher__control--open" : ""}`}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Territoire actif : ${activeTerritory.brandName}. Changer de territoire`}
            style={territoryStyle(themes[activeTerritory.code])}
            onClick={() => setOpen((value) => !value)}
          >
            <TerritoryBadge code={activeTerritory.code} theme={themes[activeTerritory.code]} size="sm" />
            <span className="territory-switcher__brand">{activeTerritory.brandName}</span>
            <ChevronDown size={14} strokeWidth={2.6} className="territory-switcher__chevron" aria-hidden="true" />
          </button>
          {open &&
            menuPosition &&
            createPortal(
              <div
                ref={menuRef}
                className="territory-switcher__menu"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  maxHeight: menuPosition.maxHeight,
                  visibility: menuPosition.ready ? "visible" : "hidden",
                }}
              >
                <p className="territory-switcher__menuTitle">Changer de territoire</p>
                {isPhone ? (
                  (() => {
                    const pending =
                      visibleTerritories.find((territory) => territory.code === (pendingCode ?? activeTerritory.code)) ??
                      activeTerritory;
                    const isCurrent = pending.code === activeTerritory.code;
                    const needsJoin = Boolean(token) && !memberCodes.has(pending.code);
                    return (
                      <div className="territory-switcher__wheel">
                        <TerritoryWheel
                          territories={visibleTerritories}
                          themes={themes}
                          value={pending.code}
                          onChange={setPendingCode}
                          label="Territoires disponibles"
                        />
                        <button
                          type="button"
                          className="territory-switcher__confirm"
                          style={territoryStyle(themes[pending.code])}
                          onClick={() => (isCurrent ? setOpen(false) : void handleSelect(pending.code))}
                        >
                          {isCurrent
                            ? `Rester sur ${pending.brandName}`
                            : needsJoin
                              ? `Rejoindre ${pending.brandName}`
                              : `Passer sur ${pending.brandName}`}
                        </button>
                      </div>
                    );
                  })()
                ) : (
                <div className="territory-switcher__list" role="listbox" aria-label="Territoires disponibles">
                  {visibleTerritories.map((territory) => {
                    const isActive = territory.code === activeTerritory.code;
                    const isMember = !token || memberCodes.has(territory.code);
                    return (
                      <button
                        key={territory.id}
                        type="button"
                        role="option"
                        aria-selected={isActive}
                        className={`territory-switcher__option${isActive ? " territory-switcher__option--active" : ""}`}
                        style={territoryStyle(themes[territory.code])}
                        onClick={() => handleSelect(territory.code)}
                      >
                        <TerritoryBadge code={territory.code} theme={themes[territory.code]} />
                        <span className="territory-switcher__texts">
                          <span className="territory-switcher__optionBrand">{territory.brandName}</span>
                          <span className="territory-switcher__optionName">{territory.name}</span>
                        </span>
                        {isActive ? (
                          <span className="territory-switcher__check" aria-hidden="true">
                            <Check size={13} strokeWidth={3} />
                          </span>
                        ) : !isMember ? (
                          <span className="territory-switcher__join">
                            <Plus size={12} strokeWidth={2.8} aria-hidden="true" />
                            Rejoindre
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                )}
              </div>,
              document.body
            )}
        </>
      ) : (
        // Un seul territoire disponible : texte statique, jamais l'apparence
        // d'un choix possible (pas de chevron, pas de contrôle interactif).
        <span className="territory-switcher__control territory-switcher__control--static">
          <TerritoryBadge code={activeTerritory.code} theme={themes[activeTerritory.code]} size="sm" />
          <span className="territory-switcher__brand">{activeTerritory.brandName}</span>
        </span>
      )}
    </div>
  );
}
