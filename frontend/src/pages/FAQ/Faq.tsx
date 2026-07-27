import Faquestions from "../../components/FaqComponents/Faquestions/Faquestions";
import HeroFaq from "../../components/FaqComponents/HeroFaq/HeroFaq";
import ReponsePasTrouvé from "../../components/FaqComponents/ReponsePastrouvé/ReponsePasTrouvé";

export default function Faq() {
    return(
        <>
           <HeroFaq/> 
           <Faquestions/>
           <ReponsePasTrouvé/>
        </>
    )
}