import './Apropos.scss';

interface AproposProfileProps {
    bio: string | null;
    isOwnProfile?: boolean;
}

export default function AproposProfile({ bio, isOwnProfile = true }: AproposProfileProps) {
    if (!bio) {
        if (!isOwnProfile) return null;
        return (
            <p className="container-aproposProfile__empty">
                Ajoute une présentation depuis « Modifier le profil ».
            </p>
        );
    }

    return <p className="container-aproposProfile__quote">« {bio} »</p>;
}