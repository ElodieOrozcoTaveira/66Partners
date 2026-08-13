import { CalendarDays, House, MessageSquareMore, User } from "lucide-react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import "./BottomNavBar.scss";

const NAV_ITEMS = [
  { to: "/dashboard", icon: House, label: "Accueil" },
  { to: "/homeActivities", icon: CalendarDays, label: "Activités" },
  { to: "/homeMessages", icon: MessageSquareMore, label: "Messages" },
  { to: "/profile", icon: User, label: "Profil" },
];

export default function BottomNavBar() {
  return createPortal(
    <div className="container-bottomNavbar">
      <nav className="container-bottomNavbar__nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="container-bottomNavbar__link">
            <Icon size={20} strokeWidth={2} />
            <span className="container-bottomNavbar__label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>,
    document.body,
  );
}
