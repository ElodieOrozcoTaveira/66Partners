import { CalendarDays, House, MessageSquareMore, Plus, User } from "lucide-react";
import { createPortal } from "react-dom";
import { NavLink } from "react-router-dom";
import { useNotifications } from "../../contexts/NotificationsContext";
import "./BottomNavBar.scss";

const NAV_ITEMS_LEFT = [
  { to: "/dashboard", icon: House, label: "Accueil" },
  { to: "/mesactivités", icon: CalendarDays, label: "Activités" },
];

const NAV_ITEMS_RIGHT = [
  { to: "/messages", icon: MessageSquareMore, label: "Messages" },
  { to: "/profile", icon: User, label: "Profil" },
];

export default function BottomNavBar() {
  const { unreadMessagesCount, unreadActivitiesCount } = useNotifications();

  const badgeCountByPath: Record<string, number> = {
    "/messages": unreadMessagesCount,
    "/mesactivités": unreadActivitiesCount,
  };

  function renderItem({
    to,
    icon: Icon,
    label,
  }: (typeof NAV_ITEMS_LEFT)[number]) {
    const badgeCount = badgeCountByPath[to] ?? 0;
    return (
      <NavLink key={to} to={to} className="container-bottomNavbar__link">
        <span className="container-bottomNavbar__icon-wrap">
          <Icon size={20} strokeWidth={2} />
          {badgeCount > 0 && (
            <span className="container-bottomNavbar__badge">
              {badgeCount > 9 ? "9+" : badgeCount}
            </span>
          )}
        </span>
        <span className="container-bottomNavbar__label">{label}</span>
      </NavLink>
    );
  }

  return createPortal(
    <div className="container-bottomNavbar">
      <nav className="container-bottomNavbar__nav">
        {NAV_ITEMS_LEFT.map(renderItem)}
        <NavLink
          to="/mesactivités/nouvelle"
          className="container-bottomNavbar__create"
          aria-label="Créer une activité"
        >
          <Plus size={22} strokeWidth={2.4} />
        </NavLink>
        {NAV_ITEMS_RIGHT.map(renderItem)}
      </nav>
    </div>,
    document.body,
  );
}
