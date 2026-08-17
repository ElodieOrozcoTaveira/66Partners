import { Bell } from "lucide-react";
import "./Hello.scss";

interface HelloProps {
  pseudo: string;
}

export default function Hello({ pseudo }: HelloProps) {
  return (
    <div className="container-hello">
      <div className="container-hello__text">
        <h1 className="container-hello__h1">Bonjour {pseudo} !</h1>
        <p className="container-hello__p">Prêt pour de nouvelles aventures ?</p>
      </div>
      <button
        type="button"
        className="container-hello__bell"
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={2} />
      </button>
    </div>
  );
}
