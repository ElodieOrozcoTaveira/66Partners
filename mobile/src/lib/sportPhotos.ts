/** Ressource locale (numéro renvoyé par `require`). */
type LocalImage = number;

/**
 * Photo d'illustration par sport, même correspondance que le web
 * (frontend/src/lib/sportPhotos.ts). Les fichiers sont des copies allégées
 * (720 px, JPEG) des images de frontend/public/sports.
 * Clés alignées sur `sports.name` en base.
 */
const DEFAULT_PHOTO = require("../../assets/images/sports/canigou.jpg");

const SPORT_PHOTOS: Record<string, LocalImage> = {
  Football: require("../../assets/images/sports/football.jpg"),
  Basketball: require("../../assets/images/sports/basket.jpg"),
  Tennis: require("../../assets/images/sports/tennis.jpg"),
  Running: require("../../assets/images/sports/running.jpg"),
  Cyclisme: require("../../assets/images/sports/cyclisme.jpg"),
  Natation: require("../../assets/images/sports/natation.jpg"),
  Musculation: require("../../assets/images/sports/musculation.jpg"),
  Yoga: require("../../assets/images/sports/yoga.jpg"),
  Escalade: require("../../assets/images/sports/escalade.jpg"),
  Badminton: require("../../assets/images/sports/badminton.jpg"),
  Volleyball: require("../../assets/images/sports/volleyball.jpg"),
  Randonnée: require("../../assets/images/sports/randonnee.jpg"),
  Boxe: require("../../assets/images/sports/boxe.jpg"),
  Padel: require("../../assets/images/sports/padel.jpg"),
  Golf: require("../../assets/images/sports/golf.jpg"),
  Pétanque: require("../../assets/images/sports/petanque.jpg"),
  Gravel: require("../../assets/images/sports/gravel.jpg"),
  VTT: require("../../assets/images/sports/vtt.jpg"),
  Squash: require("../../assets/images/sports/squash.jpg"),
  Pickleball: require("../../assets/images/sports/pickleball.jpg"),
  Paddle: require("../../assets/images/sports/paddle.jpg"),
  Marche: require("../../assets/images/sports/randonnee.jpg"),
  Roller: require("../../assets/images/sports/roller.jpg"),
  Trail: require("../../assets/images/sports/trail.jpg"),
};

export function getSportPhoto(sportName: string): LocalImage {
  return SPORT_PHOTOS[sportName] ?? DEFAULT_PHOTO;
}

export const LANDSCAPE_PHOTO: LocalImage = DEFAULT_PHOTO;
