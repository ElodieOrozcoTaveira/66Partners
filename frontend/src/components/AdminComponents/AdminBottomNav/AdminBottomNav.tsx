import { ChartNoAxesColumn, Settings } from "lucide-react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import "./AdminBottomNav.scss";

const NAV_ITEMS = [
  { to: "/admin/stats", icon: ChartNoAxesColumn, label: "Statistiques" },
  { to: "/admin/settings", icon: Settings, label: "Paramètres" },
];

export default function AdminBottomNav() {
  return createPortal(
    <div className="admin-bottom-nav">
      <nav className="admin-bottom-nav__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="admin-bottom-nav__link">
            <Icon size={20} strokeWidth={2} />
            <span className="admin-bottom-nav__label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>,
    document.body,
  );
}
