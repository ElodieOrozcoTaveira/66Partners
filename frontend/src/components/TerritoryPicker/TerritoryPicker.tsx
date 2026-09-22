import { useState } from "react";
import { useTerritory } from "../../contexts/TerritoryContext";
import "./TerritoryPicker.scss";

/**
 * Territoire principal choisi à l'inscription (classique ou via Google /
 * Facebook). Par défaut : le territoire actuellement affiché à l'écran.
 * Le composant ne s'affiche que si plusieurs territoires actifs existent ;
 * sinon le seul territoire actif est utilisé sans rien demander.
 */
export function useSignupTerritory() {
  const { activeTerritory } = useTerritory();
  const [chosen, setChosen] = useState<string | null>(null);
  const territoryCode = chosen ?? activeTerritory?.code;
  return { territoryCode, setTerritoryCode: setChosen };
}

interface TerritoryPickerProps {
  value: string | undefined;
  onChange: (code: string) => void;
  id: string;
}

export default function TerritoryPicker({ value, onChange, id }: TerritoryPickerProps) {
  const { publicTerritories } = useTerritory();

  if (publicTerritories.length < 2) return null;

  return (
    <div className="territory-picker">
      <label htmlFor={id} className="territory-picker__label">
        Ton territoire principal
      </label>
      <select
        id={id}
        className="territory-picker__select"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        {publicTerritories.map((territory) => (
          <option key={territory.id} value={territory.code}>
            {territory.brandName} — {territory.name}
          </option>
        ))}
      </select>
    </div>
  );
}
