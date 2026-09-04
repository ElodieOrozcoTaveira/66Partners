import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import "./SettingsSection.scss";

export interface SettingsItem {
  key: string;
  icon: LucideIcon;
  label: string;
  description: string;
}

interface SettingsSectionProps {
  title: string;
  items: SettingsItem[];
  onSelect: (item: SettingsItem) => void;
}

export default function SettingsSection({ title, items, onSelect }: SettingsSectionProps) {
  return (
    <section className="admin-settings-section">
      <h2>{title}</h2>
      <div className="admin-settings-section__card">
        {items.map((item, i) => (
          <button
            key={item.key}
            type="button"
            className="admin-settings-section__row"
            style={i === items.length - 1 ? { borderBottom: "none" } : undefined}
            onClick={() => onSelect(item)}
          >
            <span className="admin-settings-section__icon">
              <item.icon size={18} strokeWidth={2.2} />
            </span>
            <span className="admin-settings-section__text">
              <span className="admin-settings-section__label">{item.label}</span>
              <span className="admin-settings-section__description">{item.description}</span>
            </span>
            <ChevronRight size={18} strokeWidth={2.2} className="admin-settings-section__chevron" />
          </button>
        ))}
      </div>
    </section>
  );
}
