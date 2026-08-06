import { CalendarDays, House, MessageSquareMore, User } from "lucide-react";
import "./BottomNavBar.scss";
import { NavLink } from "react-router-dom";

export default function BottomNavBar() {
  return (
    <div className="container-bottomNavbar">
      <nav className="container-bottomNavbar__nav">
        <NavLink to="/dashboard" className="container-bottomNavbar__link">
          <House size={22} strokeWidth={1.9} />
        </NavLink>
        <NavLink to="/homeActivities" className="container-bottomNavbar__link">
          <CalendarDays size={22} strokeWidth={1.9} />
        </NavLink>
        <NavLink to="/homeMessages" className="container-bottomNavbar__link">
          <MessageSquareMore
           size={22} strokeWidth={1.9} />
        </NavLink>
        <NavLink to="/profile" className="container-bottomNavbar__link">
          <User size={22} strokeWidth={1.9} />
        </NavLink>
      </nav>
    </div>
  );
}
