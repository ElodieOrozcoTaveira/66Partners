import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../../../lib/axios";
import { getIconColor, getSportVisual } from "../../../lib/sportVisuals";
import "./SportsMarquee.scss";

interface Sport {
  id: string;
  name: string;
}

/** Bandeau de sports qui défile en continu, avec les pastilles de l'app. */
export default function SportsMarquee() {
  const [sports, setSports] = useState<Sport[]>([]);

  useEffect(() => {
    api
      .get<{ sports: Sport[] }>("/api/sports")
      .then((res) => setSports(res.data.sports))
      .catch(() => setSports([]));
  }, []);

  if (sports.length === 0) return null;

  // Liste doublée : l'animation boucle sans à-coup (translateX -50 %).
  const loop = [...sports, ...sports];

  return (
    <section className="sports-marquee" aria-label="Sports pratiqués">
      <div className="sports-marquee__track">
        {loop.map((sport, index) => {
          const { icon: Icon, color } = getSportVisual(sport.name);
          const duplicate = index >= sports.length;
          return (
            <NavLink
              key={`${sport.id}-${index}`}
              to="/sports"
              className="sports-marquee__chip"
              aria-hidden={duplicate || undefined}
              tabIndex={duplicate ? -1 : undefined}
            >
              <span className="sports-marquee__icon" style={{ backgroundColor: color }}>
                <Icon size={14} color={getIconColor(color)} />
              </span>
              {sport.name}
            </NavLink>
          );
        })}
      </div>
    </section>
  );
}
