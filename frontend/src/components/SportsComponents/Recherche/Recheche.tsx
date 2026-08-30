import { Search } from 'lucide-react';
import './Recherche.scss';

interface RechercheProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function Recherche({
  value,
  onChange,
  placeholder = "Rechercher un sport...",
}: RechercheProps) {
  return (
    <div className="container-search">
      <Search className="container-search__icon" size={18} />
      <input
        type="search"
        className="container-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
