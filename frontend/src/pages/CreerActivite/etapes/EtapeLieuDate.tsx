import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import {
  preloadVilles66,
  searchVilles66,
  type VilleSuggestion,
} from "../../../lib/villesInsee";
import type { CreerActiviteForm } from "../CreerActivite";

interface EtapeLieuDateProps {
  form: CreerActiviteForm;
  onChange: (patch: Partial<CreerActiviteForm>) => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function EtapeLieuDate({ form, onChange }: EtapeLieuDateProps) {
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // La liste des ~226 communes du 66 est chargée une seule fois en amont,
    // pour que la recherche soit ensuite instantanée (cf. lib/villesInsee.ts).
    preloadVilles66();
  }, []);

  useEffect(() => {
    const query = form.city;
    if (query.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      searchVilles66(query, controller.signal)
        .then((results) => {
          setSuggestions(results);
          setHighlighted(0);
          setIsOpen(true);
        })
        .catch(() => {
          /* recherche annulée ou API indisponible : on garde la saisie libre */
        });
    }, 150);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(suggestion: VilleSuggestion) {
    onChange({ city: suggestion.nom, latitude: suggestion.latitude, longitude: suggestion.longitude });
    setSuggestions([]);
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelect(suggestions[highlighted]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="etape-fields">
      <div className="etape-field">
        <label className="etape-label" htmlFor="ville">
          Ville
        </label>
        <div className="ville-input" ref={wrapperRef}>
          <MapPin size={16} className="ville-input__icon" />
          <input
            id="ville"
            type="text"
            className="etape-input etape-input--with-icon"
            placeholder="Rechercher une ville des Pyrénées-Orientales..."
            value={form.city}
            autoComplete="off"
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            onChange={(event) => onChange({ city: event.target.value, latitude: null, longitude: null })}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            onKeyDown={handleKeyDown}
          />
          {isOpen && suggestions.length > 0 && (
            <ul className="ville-input__suggestions" role="listbox">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.nom}>
                  <button
                    type="button"
                    className={
                      "ville-input__suggestion" +
                      (index === highlighted ? " ville-input__suggestion--active" : "")
                    }
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => handleSelect(suggestion)}
                  >
                    <span>{suggestion.nom}</span>
                    {suggestion.codePostal && (
                      <span className="ville-input__suggestion-cp">{suggestion.codePostal}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {isOpen && suggestions.length === 0 && form.city.trim().length >= 2 && (
            <p className="ville-input__empty">Aucune commune trouvée dans le 66.</p>
          )}
        </div>
        <p className="etape-hint">Recherche des communes du 66 via l'API officielle INSEE.</p>
      </div>

      <div className="etape-field">
        <label className="etape-label" htmlFor="date">
          Date
        </label>
        <input
          id="date"
          type="date"
          className="etape-input"
          min={today}
          value={form.date}
          onChange={(event) => onChange({ date: event.target.value })}
        />
      </div>

      <div className="etape-field">
        <label className="etape-label" htmlFor="heure">
          Heure
        </label>
        <input
          id="heure"
          type="time"
          className="etape-input"
          value={form.time}
          onChange={(event) => onChange({ time: event.target.value })}
        />
      </div>
    </div>
  );
}
