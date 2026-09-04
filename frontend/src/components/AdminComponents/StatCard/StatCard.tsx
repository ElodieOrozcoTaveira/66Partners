import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { getIconColor } from "../../../lib/sportVisuals";
import Skeleton from "../Skeleton/Skeleton";
import "./StatCard.scss";

interface StatCardProps {
  icon: LucideIcon;
  color: string;
  label: string;
  value: number | null;
  deltaPct?: number;
  loading?: boolean;
  suffix?: string;
}

const numberFormatter = new Intl.NumberFormat("fr-FR");

export default function StatCard({
  icon: Icon,
  color,
  label,
  value,
  deltaPct,
  loading = false,
  suffix,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="admin-stat-card">
        <Skeleton width={36} height={36} radius="50%" />
        <Skeleton width="70%" height="1.4rem" className="admin-stat-card__gap-top" />
        <Skeleton width="50%" height="0.75rem" />
        <Skeleton width="65%" height="0.7rem" />
      </div>
    );
  }

  const isPositive = (deltaPct ?? 0) >= 0;

  return (
    <div className="admin-stat-card">
      <span
        className="admin-stat-card__icon"
        style={{ backgroundColor: color, color: getIconColor(color) }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      <p className="admin-stat-card__value">
        {value === null ? "—" : numberFormatter.format(value)}
        {suffix}
      </p>
      <h4>{label}</h4>
      {deltaPct !== undefined && (
        <span
          className={`admin-stat-card__delta ${
            isPositive ? "admin-stat-card__delta--up" : "admin-stat-card__delta--down"
          }`}
        >
          {isPositive ? (
            <TrendingUp size={12} strokeWidth={2.4} />
          ) : (
            <TrendingDown size={12} strokeWidth={2.4} />
          )}
          {isPositive ? "+" : ""}
          {deltaPct}%
          <span className="admin-stat-card__delta-label">vs période précédente</span>
        </span>
      )}
    </div>
  );
}
