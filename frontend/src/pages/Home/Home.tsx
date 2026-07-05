import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Hamburger from "../../components/Hamburger/Hamburger";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
    </div>
  );
}
