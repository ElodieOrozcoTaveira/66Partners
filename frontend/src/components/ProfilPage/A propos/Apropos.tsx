import { UserRound } from 'lucide-react';
import './Apropos.scss';

interface AproposProfileProps {
    bio: string | null;
    isOwnProfile?: boolean;
}

export default function AproposProfile({ bio, isOwnProfile = true }: AproposProfileProps) {
    return(
        <div className="container-aproposProfile">
            <h2 className="container-aproposProfile__h2">
                <UserRound size={13} strokeWidth={2.4} />
                A propos de moi
            </h2>
            {bio ? (
                <p className="container-aproposProfile__text">{bio}</p>
            ) : (
                <p className="container-aproposProfile__empty">
                    {isOwnProfile
                        ? "Tu n'as pas encore ajouté de présentation."
                        : "Aucune présentation ajoutée."}
                </p>
            )}
        </div>
    )
}