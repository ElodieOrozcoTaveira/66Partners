import PageHero from "../../PageHero/PageHero";
import { useBranding } from "../../../contexts/TerritoryContext";

export default function FH() {
  const { brandName } = useBranding();
  return (
    <PageHero
      eyebrow="Comment ça marche"
      title="Bouger ensemble, en quelques étapes"
      text={`Rejoins la communauté ${brandName} et profite d'activités sportives près de chez toi.`}
    />
  );
}
