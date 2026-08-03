import Etapes from "../../components/FonctionnementComp/Etapes/Etapes";
import Experience from "../../components/FonctionnementComp/Experience/Experience";
import FH from "../../components/FonctionnementComp/FonctionnementHero/FH";
import Prêt from "../../components/FonctionnementComp/Prêt/Prêt";

export default function Fonctionnement() {
  return (
    <>
      <FH />
      <Etapes />
      <Experience/>
      <Prêt/>
    </>
  );
}
