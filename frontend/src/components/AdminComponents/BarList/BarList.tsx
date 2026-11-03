import { numberFormatter } from "../../../lib/adminLabels";
import "./BarList.scss";

export interface BarListItem {
  key: string;
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
}

interface BarListProps {
  items: BarListItem[];
  emptyLabel?: string;
  /** Valeur de référence des barres (par défaut : la plus grande valeur). */
  total?: number;
  showPercent?: boolean;
}

/** Classement horizontal simple : libellé, barre proportionnelle, valeur. */
export default function BarList({ items, emptyLabel = "Aucune donnée pour l'instant.", total, showPercent = false }: BarListProps) {
  if (items.length === 0) return <p className="admin-bar-list__empty">{emptyLabel}</p>;

  const reference = total ?? Math.max(...items.map((item) => item.value), 1);
  const sum = items.reduce((acc, item) => acc + item.value, 0);

  return (
    <ul className="admin-bar-list">
      {items.map((item) => {
        const width = reference === 0 ? 0 : Math.max(2, Math.round((item.value / reference) * 100));
        const content = (
          <>
            <span className="admin-bar-list__top">
              <span className="admin-bar-list__label">{item.label}</span>
              <span className="admin-bar-list__value">
                {numberFormatter.format(item.value)}
                {showPercent && sum > 0 ? <small> · {Math.round((item.value / sum) * 100)} %</small> : null}
              </span>
            </span>
            <span className="admin-bar-list__track">
              <span
                className="admin-bar-list__fill"
                style={{ width: `${width}%`, ...(item.color ? { background: item.color } : {}) }}
              />
            </span>
          </>
        );
        return (
          <li key={item.key}>
            {item.onClick ? (
              <button type="button" className="admin-bar-list__row admin-bar-list__row--link" onClick={item.onClick}>
                {content}
              </button>
            ) : (
              <div className="admin-bar-list__row">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
