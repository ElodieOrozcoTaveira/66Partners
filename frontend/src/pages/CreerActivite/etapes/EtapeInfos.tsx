import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import type { CreerActiviteForm, Sport } from "../CreerActivite";

interface EtapeInfosProps {
  form: CreerActiviteForm;
  sports: Sport[];
  onChange: (patch: Partial<CreerActiviteForm>) => void;
}

export default function EtapeInfos({ form, sports, onChange }: EtapeInfosProps) {
  const selectedSport = sports.find((sport) => sport.id === form.sportId) ?? null;
  const { icon: Icon, color } = getSportVisual(selectedSport?.name ?? "");

  return (
    <div className="etape-fields">
      <div className="etape-field">
        <label className="etape-label" htmlFor="sport">
          Sport
        </label>
        <div className="sport-select">
          {selectedSport && (
            <span className="sport-select__icon" style={{ backgroundColor: color }}>
              <Icon size={16} color={getIconColor(color)} />
            </span>
          )}
          <select
            id="sport"
            className={`sport-select__control${selectedSport ? " sport-select__control--with-icon" : ""}`}
            value={form.sportId}
            onChange={(event) => onChange({ sportId: event.target.value })}
          >
            <option value="" disabled>
              Choisir un sport
            </option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {sport.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="etape-field">
        <label className="etape-label" htmlFor="titre">
          Titre de l'activité
        </label>
        <input
          id="titre"
          type="text"
          className="etape-input"
          placeholder="Ex. Footing au parc Sant-Vicens"
          value={form.title}
          maxLength={150}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>

      <div className="etape-field">
        <label className="etape-label" htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          className="etape-textarea"
          placeholder="Sortie conviviale, allure, ambiance recherchée..."
          rows={4}
          maxLength={2000}
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>
    </div>
  );
}
