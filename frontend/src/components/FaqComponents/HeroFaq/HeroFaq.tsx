import PageHero from "../../PageHero/PageHero";
import { useBranding } from "../../../contexts/TerritoryContext";

export default function HeroFaq() {
  const { brandName } = useBranding();
  return (
    <PageHero
      eyebrow="Aide"
      title="Questions fréquentes"
      text={`Retrouve ici les réponses aux questions les plus fréquentes sur ${brandName}.`}
    />
  );
}
