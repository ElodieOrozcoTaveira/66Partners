import { ArrowUp } from "lucide-react";
import "./Fleche.scss";

export default function Fleche() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      className="btn-scrolltop"
      aria-label="Remonter en haut"
      onClick={scrollToTop}
    >
      <ArrowUp />
    </button>
  );
}
