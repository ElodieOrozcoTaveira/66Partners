import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { faker } from "@faker-js/faker";
import { sports, users, userSports, activities } from "./schema.js";
import { seedTerritory66 } from "./seed-territories.js";

const db = drizzle(process.env.DATABASE_URL!);

const sportNames = [
  "Football",
  "Basketball",
  "Tennis",
  "Running",
  "Cyclisme",
  "Natation",
  "Musculation",
  "Yoga",
  "Escalade",
  "Badminton",
  "Volleyball",
  "Randonnée",
  "Boxe",
  "Padel",
  "Golf",
  "Pétanque",
  "Gravel",
  "VTT",
  "Squash",
  "Pickleball",
  "Paddle",
  "Marche",
];

// Coordonnées approximatives de villes du 66, pour des données géo réalistes
const villes66 = [
  { city: "Perpignan", latitude: 42.6986, longitude: 2.8956 },
  { city: "Canet-en-Roussillon", latitude: 42.6975, longitude: 3.0303 },
  { city: "Argelès-sur-Mer", latitude: 42.5453, longitude: 3.0244 },
  { city: "Céret", latitude: 42.4892, longitude: 2.7497 },
  { city: "Prades", latitude: 42.6178, longitude: 2.4239 },
  { city: "Saint-Cyprien", latitude: 42.6188, longitude: 3.0289 },
  { city: "Font-Romeu", latitude: 42.5042, longitude: 2.0392 },
  { city: "Thuir", latitude: 42.6308, longitude: 2.7567 },
  { city: "Rivesaltes", latitude: 42.7656, longitude: 2.8689 },
  { city: "Elne", latitude: 42.6017, longitude: 2.9719 },
];

const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"] as const;
const activityStatuses = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
] as const;

type SeedSport = {
  id: string;
  name: string;
};

async function seed() {
  console.log("Seeding sports...");
  await db
    .insert(sports)
    .values(sportNames.map((name) => ({ name })))
    .onConflictDoNothing();
  const allSports: SeedSport[] = await db.select().from(sports);
  console.log(`${allSports.length} sports en base.`);

  console.log("Seeding users...");
  const fakeUsers = Array.from({ length: 30 }, () => {
    const ville = faker.helpers.arrayElement(villes66);
    return {
      email: faker.internet.email().toLowerCase(),
      password: faker.internet.password({ length: 20 }), // à remplacer par un hash Argon2 réel si testé via l'auth
      pseudo: faker.internet.username(),
      city: ville.city,
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
    };
  });

  const insertedUsers = await db.insert(users).values(fakeUsers).returning();
  console.log(`${insertedUsers.length} utilisateurs créés.`);

  console.log("Seeding userSports...");
  const fakeUserSports = insertedUsers.flatMap((user) => {
    // Chaque utilisateur pratique entre 1 et 3 sports différents
    const userSportsList = faker.helpers.arrayElements(
      allSports,
      faker.number.int({ min: 1, max: 3 }),
    );
    return userSportsList.map((sport) => ({
      userId: user.id,
      sportId: sport.id,
      level: faker.helpers.arrayElement(levels),
    }));
  });

  await db.insert(userSports).values(fakeUserSports).onConflictDoNothing();
  console.log(`${fakeUserSports.length} associations user/sport créées.`);

  // Le territoire 66 doit exister avant les activités : territoryId est
  // NOT NULL et cet insert est un bulk-insert direct (il ne passe pas par
  // ActivityService, qui lui résout le territoire par défaut du créateur).
  const territory66 = await seedTerritory66();

  console.log("Seeding activities...");
  const fakeActivities = Array.from({ length: 40 }, () => {
    const creator = faker.helpers.arrayElement(insertedUsers);
    const sport = faker.helpers.arrayElement(allSports);
    const ville = faker.helpers.arrayElement(villes66);

    return {
      title: `${sport.name} - ${faker.helpers.arrayElement(["Sortie découverte", "Session entraînement", "Match amical", "Sortie groupe", "Initiation"])}`,
      description: faker.lorem.paragraph(),
      city: ville.city,
      startDate: faker.date.soon({ days: 60 }), // toujours dans le futur, cf. règle métier
      latitude:
        ville.latitude +
        faker.number.float({ min: -0.01, max: 0.01, fractionDigits: 5 }),
      longitude:
        ville.longitude +
        faker.number.float({ min: -0.01, max: 0.01, fractionDigits: 5 }),
      levelRequired: faker.helpers.arrayElement(levels),
      maxParticipants: faker.number.int({ min: 2, max: 20 }),
      status: faker.helpers.arrayElement(activityStatuses),
      sportId: sport.id,
      creatorId: creator.id,
      territoryId: territory66.id,
    };
  });

  const insertedActivities = await db
    .insert(activities)
    .values(fakeActivities)
    .returning();
  console.log(`${insertedActivities.length} activités créées.`);

  // Les utilisateurs ci-dessus sont insérés en bulk (pas via
  // AuthService.registerUser) : ils n'ont donc pas encore de ligne
  // user_territories. Deuxième appel idempotent pour les rattacher au 66.
  await seedTerritory66();

  console.log("Seed terminé avec succès.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
