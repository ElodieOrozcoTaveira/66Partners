const DEFAULT_PHOTO = "/montagne.png";

// Clés alignées sur `sports.name` en base (voir backend/src/db/seed.ts)

const sportPhotos: Record<string, string> = {
  Football: "/sports/football.png",
  Basketball: "/sports/basket.png",
  Tennis: "/sports/tennis.png",
  Running: "/sports/running.png",
  Cyclisme: "/sports/cyclisme.png",
  Natation: "/sports/natation.png",
  Musculation: "/sports/musculation.png",
  Yoga: "/sports/yoga.png",
  Escalade: "/sports/escalade.png",
  Badminton: "/sports/badminton.png",
  Volleyball: "/sports/volleyball.png",
  Randonnée: "/sports/randonnee.png",
  Boxe: "/sports/boxe.png",
  Padel: "/sports/padel.png",
  Golf: "/sports/golf.png",
  Pétanque: "/sports/petanque.png",
  Gravel: "/sports/gravel.png",
  VTT: "/sports/vtt.png",
  Squash: "/sports/squash.png",
  Pickleball: "/sports/pickleball.png",
  Paddle: "/sports/paddle.png",
  Marche: "/sports/randonnee.png",
};

export function getSportPhoto(sportName: string): string {
  return sportPhotos[sportName] ?? DEFAULT_PHOTO;
}
