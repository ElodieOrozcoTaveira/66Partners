import { Minus, Plus } from "lucide-react";
import { LEVEL_LABELS, LEVEL_OPTIONS } from "../../../lib/activityLabels";
import type { CreerActiviteForm } from "../CreerActivite";

interface EtapeDetailsProps {
  form: CreerActiviteForm;
  onChange: (patch: Partial<CreerActiviteForm>) => void;
}

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 100;

export default function EtapeDetails({ form, onChange }: EtapeDetailsProps) {
  function adjustParticipants(delta: number) {
    const next = Math.min(
      MAX_PARTICIPANTS,
      Math.max(MIN_PARTICIPANTS, form.maxParticipants + delta),
    );
    onChange({ maxParticipants: next });
  }

  return (
    <div className="etape-fields">
      <div className="etape-field">
        <span className="etape-label">Niveau</span>
        <div className="niveau-select">
          {LEVEL_OPTIONS.map((level) => (
            <button
              key={level}
              type="button"
              className={`niveau-select__option${form.levelRequired === level ? " niveau-select__option--active" : ""}`}
              onClick={() => onChange({ levelRequired: level })}
            >
              {LEVEL_LABELS[level]}
            </button>
          ))}
        </div>
      </div>

      <div className="etape-field">
        <span className="etape-label">Nombre de participants (max)</span>
        <div className="participants-stepper">
          <button
            type="button"
            className="participants-stepper__btn"
            onClick={() => adjustParticipants(-1)}
            disabled={form.maxParticipants <= MIN_PARTICIPANTS}
            aria-label="Diminuer le nombre de participants"
          >
            <Minus size={16} />
          </button>
          <span className="participants-stepper__value">{form.maxParticipants}</span>
          <button
            type="button"
            className="participants-stepper__btn"
            onClick={() => adjustParticipants(1)}
            disabled={form.maxParticipants >= MAX_PARTICIPANTS}
            aria-label="Augmenter le nombre de participants"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
