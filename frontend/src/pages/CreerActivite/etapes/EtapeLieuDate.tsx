import { useEffect, useId, useState } from "react";
import { MapPin } from "lucide-react";
import { searchVilles66, type VilleSuggestion } from "../../../lib/villesInsee";
import type { CreerActiviteForm } from "../CreerActivite";

interface EtapeLieuDateProps {
  form: CreerActiviteForm;
  onChange: (patch: Partial<CreerActiviteForm>) => void;
}

const today = new Date().toISOString().slice(0, 10);

export default function EtapeLieuDate({ form, onChange }: EtapeLieuDateProps) {
  const datalistId = useId();
  const [suggestions, setSuggestions] = useState<VilleSuggestion[]>([]);

  useEffect(() => {
    const query = form.city;
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      searchVilles66(query, controller.signal)
        .then(setSuggestions)
        .catch(() => {
          /* recherche annulée ou API indisponible : on garde la saisie libre */
        });
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city]);

  function handleCityChange(value: string) {
    const match = suggestions.find((suggestion) => suggestion.nom === value);
    if (match) {
      onChange({ city: match.nom, latitude: match.latitude, longitude: match.longitude });
    } else {
      onChange({ city: value, latitude: null, longitude: null });
    }
  }

  return (
    <div className="etape-fields">
      <div className="etape-field">
        <label className="etape-label" htmlFor="ville">
          Ville
        </label>
        <div className="ville-input">
          <MapPin size={16} className="ville-input__icon" />
          <input
            id="ville"
            type="text"
            className="etape-input etape-input--with-icon"
            placeholder="Rechercher une ville des Pyrénées-Orientales..."
            list={datalistId}
            value={form.city}
            autoComplete="off"
            onChange={(event) => handleCityChange(event.target.value)}
          />
          <datalist id={datalistId}>
            {suggestions.map((suggestion) => (
              <option key={suggestion.nom} value={suggestion.nom}>
                {suggestion.codePostal}
              </option>
            ))}
          </datalist>
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
