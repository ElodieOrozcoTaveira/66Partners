const DEFAULT_PHOTO = "/montagne.webp";

// Clés alignées sur `sports.name` en base (voir backend/src/db/seed.ts)

const sportPhotos: Record<string, string> = {
  Football: "/sports/football.webp",
  Basketball: "/sports/basket.webp",
  Tennis: "/sports/tennis.webp",
  Running: "/sports/running.webp",
  Cyclisme: "/sports/cyclisme.webp",
  Natation: "/sports/natation.webp",
  Musculation: "/sports/musculation.webp",
  Yoga: "/sports/yoga.webp",
  Escalade: "/sports/escalade.webp",
  Badminton: "/sports/badminton.webp",
  Volleyball: "/sports/volleyball.webp",
  Randonnée: "/sports/randonnee.webp",
  Boxe: "/sports/boxe.webp",
  Padel: "/sports/padel.webp",
  Golf: "/sports/golf.webp",
  Pétanque: "/sports/petanque.webp",
  Gravel: "/sports/gravel.webp",
  VTT: "/sports/vtt.webp",
  Squash: "/sports/squash.webp",
  Pickleball: "/sports/pickleball.webp",
  Paddle: "/sports/paddle.webp",
  Marche: "/sports/randonnee.webp",
};

export function getSportPhoto(sportName: string): string {
  return sportPhotos[sportName] ?? DEFAULT_PHOTO;
}
