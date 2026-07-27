import { Search } from 'lucide-react';
import './Recherche.scss';

interface RechercheProps {
  value: string;
  onChange: (value: string) => void;
}

export default function Recherche({ value, onChange }: RechercheProps) {
  return (
    <div className="container-search">
      <Search className="container-search__icon" size={18} />
      <input
        type="search"
        className="container-search__input"
        placeholder="Rechercher un sport..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
