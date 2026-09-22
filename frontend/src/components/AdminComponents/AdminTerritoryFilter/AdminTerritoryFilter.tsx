import { useEffect, useState } from "react";
import api from "../../../lib/axios";
import "./AdminTerritoryFilter.scss";

interface AdminTerritory {
  code: string;
  brandName: string;
  isActive: boolean;
}

const STORAGE_KEY = "adminTerritoryFilter";

// "" = Tous. Conservé le temps de la session admin pour rester cohérent
// entre Statistiques, Utilisateurs et Activités. Récupère aussi la liste
// des territoires (tous, actifs ou non) : sert à la fois au sélecteur et à
// résoudre le nom de marque du filtre sélectionné (jamais celui du
// territoire actif du navigateur admin, qui n'a rien à voir avec le filtre).
export function useAdminTerritoryFilter() {
  const [territory, setTerritoryState] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [territories, setTerritories] = useState<AdminTerritory[]>([]);

  useEffect(() => {
    api
      .get<{ territories: AdminTerritory[] }>("/api/territories")
      .then((res) => setTerritories(res.data.territories))
      .catch(() => setTerritories([]));
  }, []);

  function setTerritory(code: string) {
    setTerritoryState(code);
    try {
      sessionStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* stockage indisponible : le filtre reste valable pour la page */
    }
  }

  const brandName = territory ? territories.find((t) => t.code === territory)?.brandName : undefined;

  return { territory: territory || undefined, territoryValue: territory, setTerritory, territories, brandName };
}

interface AdminTerritoryFilterProps {
  value: string;
  onChange: (code: string) => void;
  territories: AdminTerritory[];
}

export default function AdminTerritoryFilter({ value, onChange, territories }: AdminTerritoryFilterProps) {
  if (territories.length === 0) return null;

  const options = [{ code: "", label: "Tous" }].concat(
    territories.map((t) => ({ code: t.code, label: t.isActive ? t.code : `${t.code} (inactif)` })),
  );

  return (
    <div className="admin-territory-filter" role="group" aria-label="Filtrer par territoire">
      {options.map((option) => (
        <button
          key={option.code || "all"}
          type="button"
          className={`admin-territory-filter__btn${
            option.code === value ? " admin-territory-filter__btn--active" : ""
          }`}
          aria-pressed={option.code === value}
          onClick={() => onChange(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
