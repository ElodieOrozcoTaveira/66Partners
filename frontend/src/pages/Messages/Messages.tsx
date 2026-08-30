import { useState } from "react";
import Recherche from "../../components/SportsComponents/Recherche/Recheche";
import ListingMessages from "./ListingMessages/ListingMessages";
import "./Messages.scss";

export default function Messages() {
  const [search, setSearch] = useState("");

  return (
    <div className="messages-page">
      <div className="messages-page__body">
        <h1 className="messages-page__title">Messages</h1>
        <Recherche
          value={search}
          onChange={setSearch}
          placeholder="Rechercher une activité..."
        />
        <ListingMessages search={search} />
      </div>
    </div>
  );
}
