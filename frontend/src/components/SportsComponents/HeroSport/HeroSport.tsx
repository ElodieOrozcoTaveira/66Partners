import PageHero from "../../PageHero/PageHero";
import { useBranding } from "../../../contexts/TerritoryContext";

export default function HeroSport() {
  const { brandName, territoryIn } = useBranding();
  return (
    <PageHero
      eyebrow={brandName}
      title="Sports"
      text={`Découvre toutes les activités disponibles ${territoryIn} proposées par ${brandName}, et trouve ton partenaire.`}
    />
  );
}
