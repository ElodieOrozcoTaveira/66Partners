import { SiInstagram } from 'react-icons/si';
import './FollowUs.scss';
import { FaFacebook } from 'react-icons/fa';

export default function FollowUs() {
    return(
        <>
            <div className="container-followUs">
                <section className="container-followUs__titre">Suivez-nous</section>
                <section className="container-followUs__reseaux">
                    <div className="container-followUs__insta">
                        <a
                            href="https://www.instagram.com/66partners/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Suivez-nous sur Instagram"
                        >
                            <SiInstagram size={18} color='#1F2937'/>
                        </a>
                        <a
                            href="https://www.facebook.com/66partners/"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Suivez-nous sur Facebook"
                        >
                            <FaFacebook size={20} color='#1F2937' />
                        </a>
                    </div>
                </section>
            </div>

        </>
    )
}