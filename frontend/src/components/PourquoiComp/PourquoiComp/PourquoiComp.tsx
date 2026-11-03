import PageHero from "../../PageHero/PageHero";
import { useBranding } from "../../../contexts/TerritoryContext";

export default function PourquoiComp() {
  const { brandName } = useBranding();
  return (
    <PageHero
      eyebrow={`Pourquoi ${brandName}`}
      title="Une communauté sportive, locale et bienveillante"
      text={`Une plateforme pensée pour les passionnés de sport, en extérieur comme en salle. Rejoindre ${brandName}, c'est faire partie d'une communauté engagée et active.`}
    />
  );
}
