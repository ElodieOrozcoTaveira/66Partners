import { ShieldCheck } from "lucide-react";
import { birthDateError, dateYearsAgo, MINIMUM_AGE } from "../../lib/age";
import "./BirthDateField.scss";

interface BirthDateFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

/** Date de naissance à l'inscription, avec la mention « réservé aux 18 ans et plus ». */
export default function BirthDateField({ id, value, onChange }: BirthDateFieldProps) {
  const error = value ? birthDateError(value) : null;
  return (
    <div className="birthdate-field">
      <label htmlFor={id} className="birthdate-field__label">
        Date de naissance
      </label>
      <input
        id={id}
        type="date"
        required
        value={value}
        min="1900-01-01"
        max={dateYearsAgo(MINIMUM_AGE)}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-hint`}
        aria-invalid={error ? true : undefined}
        className="birthdate-field__input"
      />
      <p id={`${id}-hint`} className={`birthdate-field__hint${error ? " birthdate-field__hint--error" : ""}`}>
        <ShieldCheck size={14} strokeWidth={2.4} aria-hidden="true" />
        {error ?? "Inscription réservée aux personnes majeures (18 ans et plus)."}
      </p>
    </div>
  );
}
