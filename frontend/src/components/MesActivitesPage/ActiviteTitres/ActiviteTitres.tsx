import "./ActiviteTitres.scss";

export type ActiviteTab = "TOUTES" | "CREEES" | "REJOINTES" | "TERMINEES";

const TABS: { key: ActiviteTab; label: string }[] = [
  { key: "TOUTES", label: "Toutes" },
  { key: "CREEES", label: "Créées" },
  { key: "REJOINTES", label: "Rejointes" },
  { key: "TERMINEES", label: "Terminées" },
];

interface ActiviteTitresProps {
  active: ActiviteTab;
  onChange: (tab: ActiviteTab) => void;
}

export default function ActiviteTitres({ active, onChange }: ActiviteTitresProps) {
  return (
    <div className="activite-titres" role="tablist">
      {TABS.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          className={`activite-titres__tab${active === key ? " activite-titres__tab--active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
