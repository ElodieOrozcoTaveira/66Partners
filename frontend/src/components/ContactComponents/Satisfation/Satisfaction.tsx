import { ShieldCheck } from 'lucide-react';
import './Satisfaction.scss';

export default function Satisfaction() {
    return(
        <>
            <div className="container-satisfaction">
                <h2 className="container-satisfaction__icon"><ShieldCheck color='#E6392E' size={30}/></h2>
                <h3 className="container-satisfaction__h3">Votre satisfaction est notre priorité.</h3>
                <p className="container-satisfaction__p">Nous mettons tout en oeuvre pour vous apporter une réponse claire et rapide</p>
                
                <div className="container-satisfaction__underline"></div>
            </div>
        </>
    )
}