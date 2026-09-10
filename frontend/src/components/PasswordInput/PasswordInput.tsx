import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import "./PasswordInput.scss";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Classe appliquée au conteneur (positionnement/marges), jamais à l'input lui-même. */
  wrapperClassName?: string;
}

/**
 * Champ mot de passe avec icône œil — état initial masqué, indépendant par
 * instance (deux champs sur une même page, ex. mot de passe + confirmation,
 * se togglent chacun séparément). N'affecte jamais `type`/`value`/validation
 * du champ, uniquement sa visibilité : `className`/`id`/`required`/etc.
 * passent tels quels pour conserver le style de chaque page d'origine.
 */
export default function PasswordInput({
  className,
  wrapperClassName,
  style,
  ...inputProps
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`password-input${wrapperClassName ? ` ${wrapperClassName}` : ""}`}>
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        className={className}
        // Garantit un espace pour l'icône quel que soit le padding défini par
        // la page appelante (priorité de l'inline style, jamais en conflit
        // avec les règles de classe existantes).
        style={{ paddingRight: "2.5rem", ...style }}
      />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setIsVisible((prev) => !prev)}
        aria-label={isVisible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
