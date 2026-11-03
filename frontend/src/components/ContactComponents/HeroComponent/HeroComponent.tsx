import PageHero from "../../PageHero/PageHero";

export default function HeroComponent() {
  return (
    <PageHero
      as="h2"
      eyebrow="Contact"
      title="Une question ? Écris-nous."
      text="Une suggestion ou besoin d'aide ? Notre équipe est là pour t'accompagner et te répond dans les plus brefs délais."
    />
  );
}
