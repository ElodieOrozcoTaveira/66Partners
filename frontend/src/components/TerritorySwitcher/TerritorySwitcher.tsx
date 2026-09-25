import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { useTerritory } from "../../contexts/TerritoryContext";
import { useAuth } from "../../contexts/AuthContext";
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
export default function TerritorySwitcher({ prefix, className }: TerritorySwitcherProps) {
  const { publicTerritories, territories, activeTerritory, setActiveTerritory, joinTerritory } =
    useTerritory();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    minWidth: number;
    ready: boolean;
  } | null>(null);
  const controlRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const canSwitch = publicTerritories.length > 1;

  useEffect(() => {
    if (!open) {
      setMenuPosition(null);
      return;
    }

    function resetPosition() {
      const rect = controlRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Premier passage : position de départ (alignée à gauche du badge),
      // `ready: false` le temps de mesurer la largeur réelle du menu (cf.
      // useLayoutEffect ci-dessous) pour le recaler si besoin, sans flash
      // visible grâce au layout effect qui s'exécute avant le paint.
      setMenuPosition({ top: rect.bottom + 6, left: rect.left, minWidth: rect.width, ready: false });
    }

    function closeMenu() {
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
    setMenuPosition({ top: rect.bottom + 6, left, minWidth: rect.width, ready: true });
  }, [open, menuPosition]);

  if (!activeTerritory) return null;

  async function handleSelect(code: string) {
    setOpen(false);
    if (code === activeTerritory!.code) return;
    const alreadyMember = territories.some((territory) => territory.code === code);
    if (token && !alreadyMember) {
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
            className="territory-switcher__control"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label="Changer de territoire actif"
            onClick={() => setOpen((value) => !value)}
          >
            <MapPin size={13} strokeWidth={2.2} className="territory-switcher__pin" aria-hidden="true" />
            <span className="territory-switcher__code" aria-hidden="true">
              {activeTerritory.code}
            </span>
            <ChevronDown
              size={13}
              strokeWidth={2.5}
              className={`territory-switcher__chevron${open ? " territory-switcher__chevron--open" : ""}`}
              aria-hidden="true"
            />
          </button>
          {open &&
            menuPosition &&
            createPortal(
              <div
                ref={menuRef}
                role="listbox"
                aria-label="Territoires disponibles"
                className="territory-switcher__menu"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  minWidth: menuPosition.minWidth,
                  visibility: menuPosition.ready ? "visible" : "hidden",
                }}
              >
                {publicTerritories.map((territory) => {
                  const isActive = territory.code === activeTerritory.code;
                  return (
                    <button
                      key={territory.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      className={`territory-switcher__option${isActive ? " territory-switcher__option--active" : ""}`}
                      onClick={() => handleSelect(territory.code)}
                    >
                      <span>{territory.brandName}</span>
                      {isActive && (
                        <Check size={14} strokeWidth={2.5} className="territory-switcher__check" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>,
              document.body
            )}
        </>
      ) : (
        // Un seul territoire disponible : texte statique, jamais l'apparence
        // d'un choix possible (pas de chevron, pas de contrôle interactif).
        <span className="territory-switcher__control territory-switcher__control--static">
          <MapPin size={13} strokeWidth={2.2} className="territory-switcher__pin" aria-hidden="true" />
          <span className="territory-switcher__code territory-switcher__code--static">
            {activeTerritory.code}
          </span>
        </span>
      )}
    </div>
  );
}
