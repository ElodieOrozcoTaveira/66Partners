import { useEffect, useRef, useState, type SyntheticEvent } from "react";
import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "../../../lib/axios";
import { getSportVisual } from "../../../lib/sportVisuals";
import { getSportPhoto } from "../../../lib/sportPhotos";
import "./SportsPop.scss";

const DEFAULT_PHOTO = "/montagne.webp";
const RANDOM_COUNT = 10;

function handlePhotoError(event: SyntheticEvent<HTMLImageElement>) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = DEFAULT_PHOTO;
}

function pickRandom<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

interface Sport {
  id: string;
  name: string;
  favoritesCount: number;
}

interface SportsResponse {
  success: boolean;
  sports: Sport[];
}

export default function SportsPop() {
  const [sports, setSports] = useState<Sport[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .get<SportsResponse>("/api/sports")
      .then((res) => setSports(pickRandom(res.data.sports, RANDOM_COUNT)))
      .catch(() => setSports([]));
  }, []);

  function scrollByCards(direction: 1 | -1) {
    const list = listRef.current;
    if (!list) return;
    const card = list.querySelector<HTMLElement>(".sportpop-item");
    const step = card ? card.offsetWidth + 28 : list.clientWidth * 0.8;
    list.scrollBy({ left: direction * step, behavior: "smooth" });
  }

  return (
    <div className="container-sportpop">
      <div className="container-sportpop__header">
        <h2 className="container-sportpop__h2">Sports populaires</h2>
        <NavLink to="/sports" className="container-sportpop__btn">
          Voir tout
        </NavLink>
      </div>

      <div className="container-sportpop__carousel">
        <button
          type="button"
          className="container-sportpop__arrow container-sportpop__arrow--left"
          onClick={() => scrollByCards(-1)}
          aria-label="Sports précédents"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="container-sportpop__list" ref={listRef}>
          {sports.map((sport) => {
            const { icon: Icon } = getSportVisual(sport.name);

            return (
              <NavLink key={sport.id} to="/sports" className="sportpop-item">
                <div className="sportpop-item__thumb">
                  <img
                    src={getSportPhoto(sport.name)}
                    alt={sport.name}
                    className="sportpop-item__photo"
                    onError={handlePhotoError}
                  />
                  <span className="sportpop-item__badge">
                    <Icon size={14} />
                  </span>
                </div>
                <span className="sportpop-item__name">{sport.name}</span>
                <span className="sportpop-item__membres">
                  {sport.favoritesCount} membre
                  {sport.favoritesCount === 1 ? "" : "s"}
                </span>
              </NavLink>
            );
          })}
        </div>

        <button
          type="button"
          className="container-sportpop__arrow container-sportpop__arrow--right"
          onClick={() => scrollByCards(1)}
          aria-label="Sports suivants"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
