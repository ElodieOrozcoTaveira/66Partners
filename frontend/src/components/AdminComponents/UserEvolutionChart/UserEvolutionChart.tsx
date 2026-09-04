import { useMemo, useRef, useState } from "react";
import type { UserEvolutionPoint } from "../../../api/adminStats";
import Skeleton from "../Skeleton/Skeleton";
import ErrorBlock from "../ErrorBlock/ErrorBlock";
import "./UserEvolutionChart.scss";

interface UserEvolutionChartProps {
  points: UserEvolutionPoint[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

const WIDTH = 320;
const HEIGHT = 160;
const PADDING_X = 8;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 26;

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
});
const numberFormatter = new Intl.NumberFormat("fr-FR");

export default function UserEvolutionChart({
  points,
  loading = false,
  error = false,
  onRetry,
}: UserEvolutionChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const { linePath, areaPath, coords, minValue, maxValue } = useMemo(() => {
    if (points.length === 0) {
      return { linePath: "", areaPath: "", coords: [] as { x: number; y: number }[], minValue: 0, maxValue: 0 };
    }

    const values = points.map((p) => p.count);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const innerWidth = WIDTH - PADDING_X * 2;
    const innerHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const pts = points.map((p, i) => {
      const x = PADDING_X + (i / (points.length - 1 || 1)) * innerWidth;
      const y = PADDING_TOP + innerHeight - ((p.count - min) / range) * innerHeight;
      return { x, y };
    });

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const baseline = PADDING_TOP + innerHeight;
    const area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${baseline} L${pts[0].x.toFixed(1)},${baseline} Z`;

    return { linePath: line, areaPath: area, coords: pts, minValue: min, maxValue: max };
  }, [points]);

  function handlePointerMove(clientX: number) {
    const svg = svgRef.current;
    if (!svg || coords.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relativeX = ((clientX - rect.left) / rect.width) * WIDTH;
    let closest = 0;
    let closestDist = Infinity;
    coords.forEach((c, i) => {
      const dist = Math.abs(c.x - relativeX);
      if (dist < closestDist) {
        closestDist = dist;
        closest = i;
      }
    });
    setHoverIndex(closest);
  }

  if (error) {
    return (
      <section className="admin-evolution-chart admin-evolution-chart--empty">
        <ErrorBlock message="Impossible de charger l'évolution des utilisateurs." onRetry={onRetry ?? (() => {})} />
      </section>
    );
  }

  if (loading || points.length === 0) {
    return (
      <section className="admin-evolution-chart">
        <div className="admin-evolution-chart__header">
          <Skeleton width="55%" height="1rem" />
        </div>
        <Skeleton width="100%" height={HEIGHT} radius="12px" />
      </section>
    );
  }

  const first = points[0].count;
  const last = points[points.length - 1].count;
  const changePct = first === 0 ? 0 : Math.round(((last - first) / first) * 100);
  const active = hoverIndex !== null ? points[hoverIndex] : null;
  const activeCoord = hoverIndex !== null ? coords[hoverIndex] : null;

  return (
    <section className="admin-evolution-chart">
      <div className="admin-evolution-chart__header">
        <h3>Évolution des utilisateurs</h3>
        <span className={`admin-evolution-chart__change ${changePct >= 0 ? "is-up" : "is-down"}`}>
          {changePct >= 0 ? "↗" : "↘"} {changePct >= 0 ? "+" : ""}
          {changePct}%
        </span>
      </div>
      <p className="admin-evolution-chart__subtitle">vs période précédente</p>

      <div className="admin-evolution-chart__plot">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Évolution des utilisateurs, de ${numberFormatter.format(minValue)} à ${numberFormatter.format(maxValue)}`}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="admin-evolution-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c62828" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#c62828" stopOpacity="0" />
            </linearGradient>
          </defs>

          <line
            x1={PADDING_X}
            x2={WIDTH - PADDING_X}
            y1={HEIGHT - PADDING_BOTTOM}
            y2={HEIGHT - PADDING_BOTTOM}
            className="admin-evolution-chart__baseline"
          />

          <path d={areaPath} fill="url(#admin-evolution-fill)" />
          <path d={linePath} fill="none" className="admin-evolution-chart__line" />

          {activeCoord && (
            <line
              x1={activeCoord.x}
              x2={activeCoord.x}
              y1={PADDING_TOP}
              y2={HEIGHT - PADDING_BOTTOM}
              className="admin-evolution-chart__crosshair"
            />
          )}

          {coords.map((c, i) =>
            i === coords.length - 1 || i === hoverIndex ? (
              <circle
                key={i}
                cx={c.x}
                cy={c.y}
                r={4}
                className="admin-evolution-chart__dot"
              />
            ) : null,
          )}
        </svg>

        {active && activeCoord && (
          <div
            className="admin-evolution-chart__tooltip"
            style={{
              left: `${(activeCoord.x / WIDTH) * 100}%`,
              top: `${(activeCoord.y / HEIGHT) * 100}%`,
            }}
          >
            <strong>{numberFormatter.format(active.count)}</strong>
            <span>{dateFormatter.format(new Date(active.date))}</span>
          </div>
        )}
      </div>

      <div className="admin-evolution-chart__axis">
        <span>{dateFormatter.format(new Date(points[0].date))}</span>
        <span>{dateFormatter.format(new Date(points[points.length - 1].date))}</span>
      </div>
    </section>
  );
}
