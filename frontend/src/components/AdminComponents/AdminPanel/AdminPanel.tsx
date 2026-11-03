import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { numberFormatter } from "../../../lib/adminLabels";
import "./AdminPanel.scss";

/** Carte blanche avec titre, utilisée par les sections des pages admin. */
export function Panel({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-panel">
      <header className="admin-panel__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Petit chiffre clé : valeur en gras, libellé dessous. */
export function MiniStat({
  icon: Icon,
  label,
  value,
  suffix,
  hint,
}: {
  icon?: LucideIcon;
  label: string;
  value: number | string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="admin-mini-stat">
      {Icon ? (
        <span className="admin-mini-stat__icon">
          <Icon size={16} strokeWidth={2.2} />
        </span>
      ) : null}
      <strong>
        {typeof value === "number" ? numberFormatter.format(value) : value}
        {suffix ? <small>{suffix}</small> : null}
      </strong>
      <span>{label}</span>
      {hint ? <em>{hint}</em> : null}
    </div>
  );
}

/** Pastille colorée de statut (activité ou participation). */
export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <span className="admin-status-badge" style={{ color, backgroundColor: `${color}1a` }}>
      {label}
    </span>
  );
}

/** Barre empilée (répartition d'un total en segments colorés) + légende. */
export function StackedBar({
  segments,
}: {
  segments: { key: string; label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((acc, segment) => acc + segment.value, 0);
  return (
    <div className="admin-stacked">
      <div className="admin-stacked__bar" role="img" aria-label={segments.map((s) => `${s.label} : ${s.value}`).join(", ")}>
        {total === 0 ? (
          <span className="admin-stacked__empty" />
        ) : (
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => (
              <span
                key={segment.key}
                style={{ flexGrow: segment.value, backgroundColor: segment.color }}
                title={`${segment.label} : ${segment.value}`}
              />
            ))
        )}
      </div>
      <ul className="admin-stacked__legend">
        {segments.map((segment) => (
          <li key={segment.key}>
            <span className="admin-stacked__dot" style={{ backgroundColor: segment.color }} />
            {segment.label}
            <strong>{numberFormatter.format(segment.value)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
