import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { TerritoryBreakdownItem } from "../../../api/adminStats";
import Skeleton from "../Skeleton/Skeleton";
import ErrorBlock from "../ErrorBlock/ErrorBlock";
import "./TerritoryDonutChart.scss";

interface TerritoryDonutChartProps {
  items: TerritoryBreakdownItem[];
  totalUsers: number;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  onSeeAll?: () => void;
}

// Palette catégorielle validée (CVD deutan/protan/tritan >= 8, lecture normale
// >= 15, cf. skill dataviz) : le rouge de marque domine, les teintes suivantes
// s'écartent volontairement du rouge/orange pour rester distinguables. "Autres"
// reste un gris neutre, hors palette d'identité par construction.
const SLICE_COLORS = ["#C62828", "#EDA100", "#1BAF7A", "#9CA3AF"];

const SIZE = 160;
const STROKE = 26;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const numberFormatter = new Intl.NumberFormat("fr-FR");

export default function TerritoryDonutChart({
  items,
  totalUsers,
  loading = false,
  error = false,
  onRetry,
  onSeeAll,
}: TerritoryDonutChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const segments = useMemo(() => {
    let cursor = 0;
    return items.map((item, i) => {
      const length = (item.percent / 100) * CIRCUMFERENCE;
      const segment = {
        ...item,
        color: SLICE_COLORS[i % SLICE_COLORS.length],
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        dashoffset: -cursor,
      };
      cursor += length;
      return segment;
    });
  }, [items]);

  if (error) {
    return (
      <section className="admin-donut-chart admin-donut-chart--empty">
        <ErrorBlock message="Impossible de charger la répartition par territoire." onRetry={onRetry ?? (() => {})} />
      </section>
    );
  }

  if (loading || items.length === 0) {
    return (
      <section className="admin-donut-chart">
        <Skeleton width="55%" height="1rem" />
        <div className="admin-donut-chart__body">
          <Skeleton width={SIZE} height={SIZE} radius="50%" />
          <div className="admin-donut-chart__legend">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} width="100%" height="0.9rem" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-donut-chart">
      <h3>Répartition par territoire</h3>
      <div className="admin-donut-chart__body">
        <div className="admin-donut-chart__ring-wrap">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label={`Répartition des ${numberFormatter.format(totalUsers)} utilisateurs par territoire`}
          >
            <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
              {segments.map((segment, i) => (
                <circle
                  key={segment.code}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={activeIndex === i ? STROKE + 4 : STROKE}
                  strokeDasharray={segment.dasharray}
                  strokeDashoffset={segment.dashoffset}
                  className="admin-donut-chart__segment"
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              ))}
            </g>
          </svg>
          <div className="admin-donut-chart__center">
            <strong>{numberFormatter.format(totalUsers)}</strong>
            <span>utilisateurs</span>
          </div>
        </div>

        <ul className="admin-donut-chart__legend">
          {segments.map((segment, i) => (
            <li
              key={segment.code}
              className={activeIndex === i ? "is-active" : ""}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span className="admin-donut-chart__swatch" style={{ backgroundColor: segment.color }} />
              <span className="admin-donut-chart__legend-name">{segment.name}</span>
              <span className="admin-donut-chart__legend-value">
                {numberFormatter.format(segment.count)} ({segment.percent}%)
              </span>
            </li>
          ))}
        </ul>
      </div>

      {onSeeAll && (
        <button type="button" className="admin-donut-chart__see-all" onClick={onSeeAll}>
          Voir tous les territoires
          <ChevronRight size={16} strokeWidth={2.4} />
        </button>
      )}
    </section>
  );
}
