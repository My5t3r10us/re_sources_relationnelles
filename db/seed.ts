import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "./index";
import {
  user,
  account,
  session,
  verification,
  category,
  resource,
  comment,
  favorite,
  completion,
  report,
} from "./schema";
import { auth } from "../lib/auth";
import { randomUUID } from "crypto";

const seedUsers = [
  {
    email: "admin@example.com",
    password: "password123",
    name: "Admin User",
    firstName: "Admin",
    lastName: "User",
  },
  {
    email: "jean.dupont@example.com",
    password: "password123",
    name: "Jean Dupont",
    firstName: "Jean",
    lastName: "Dupont",
  },
  {
    email: "marie.martin@example.com",
    password: "password123",
    name: "Marie Martin",
    firstName: "Marie",
    lastName: "Martin",
  },
];

const seedCategories = [
  {
    id: randomUUID(),
    name: "Anxiété & Stress",
    slug: "anxiete-stress",
    description: "Ressources pour gérer l'anxiété et le stress au quotidien",
    icon: "psychology",
  },
  {
    id: randomUUID(),
    name: "Équilibre vie pro/perso",
    slug: "equilibre-vie",
    description: "Trouver l'équilibre entre vie professionnelle et personnelle",
    icon: "work_history",
  },
  {
    id: randomUUID(),
    name: "Parentalité",
    slug: "parentalite",
    description: "Accompagnement et ressources pour les parents",
    icon: "family_restroom",
  },
  {
    id: randomUUID(),
    name: "Soutien de crise",
    slug: "soutien-crise",
    description: "Aide immédiate et soutien en situation de crise",
    icon: "emergency",
  },
  {
    id: randomUUID(),
    name: "Santé mentale",
    slug: "sante-mentale",
    description: "Bien-être psychologique et santé mentale",
    icon: "self_improvement",
  },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data (order matters for FK constraints)
  await db.delete(report);
  await db.delete(completion);
  await db.delete(favorite);
  await db.delete(comment);
  await db.delete(resource);
  await db.delete(category);
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
  console.log("✓ Cleaned existing data");

  // Create users via Better Auth API
  for (const u of seedUsers) {
    await auth.api.signUpEmail({
      body: {
        email: u.email,
        password: u.password,
        name: u.name,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });
    console.log(`✓ Created user: ${u.email}`);
  }

  // Set admin role
  const allUsers = await db.select().from(user);
  const adminUser = allUsers.find((u) => u.email === "admin@example.com");
  if (adminUser) {
    await db
      .update(user)
      .set({ role: "admin" })
      .where(eq(user.id, adminUser.id));
    console.log("✓ Set admin role for admin@example.com");
  }

  // Create categories
  await db.insert(category).values(seedCategories);
  console.log(`✓ Created ${seedCategories.length} categories`);

  // Create sample resources
  const jeanUser = allUsers.find((u) => u.email === "jean.dupont@example.com");
  const marieUser = allUsers.find(
    (u) => u.email === "marie.martin@example.com"
  );

  if (jeanUser && marieUser) {
    const seedResources = [
      {
        id: randomUUID(),
        title: "Gérer le burnout au travail : un guide pratique",
        content:
          "Le burnout est bien plus que simplement se sentir fatigué après une longue semaine...",
        summary:
          "Stratégies concrètes pour gérer le stress en milieu professionnel.",
        mediaType: "article" as const,
        privacy: "public" as const,
        status: "published" as const,
        categoryId: seedCategories[0].id,
        authorId: jeanUser.id,
        readingTime: 8,
        featured: true,
        viewCount: 1250,
      },
      {
        id: randomUUID(),
        title: "Restructuration cognitive pour le stress quotidien",
        content:
          "Un exercice pratique de 15 minutes conçu pour vous aider à identifier les schémas négatifs...",
        summary:
          "Exercice quotidien pour remettre en question les pensées négatives.",
        mediaType: "exercise" as const,
        privacy: "public" as const,
        status: "published" as const,
        categoryId: seedCategories[0].id,
        authorId: marieUser.id,
        readingTime: 15,
        featured: true,
        viewCount: 890,
      },
      {
        id: randomUUID(),
        title: "Résoudre les conflits au travail",
        content:
          "Apprenez des techniques de médiation et des stratégies de communication...",
        summary:
          "Techniques de médiation pour désamorcer les tensions professionnelles.",
        mediaType: "video" as const,
        privacy: "public" as const,
        status: "published" as const,
        categoryId: seedCategories[1].id,
        authorId: jeanUser.id,
        readingTime: 20,
        viewCount: 456,
      },
      {
        id: randomUUID(),
        title: "Construire des dynamiques familiales résilientes",
        content:
          "Une approche modulaire pour favoriser la communication ouverte...",
        summary:
          "Approche modulaire pour la communication familiale ouverte.",
        mediaType: "article" as const,
        privacy: "public" as const,
        status: "published" as const,
        categoryId: seedCategories[2].id,
        authorId: marieUser.id,
        readingTime: 12,
        viewCount: 678,
      },
      {
        id: randomUUID(),
        title: "Techniques d'ancrage pour les crises d'angoisse",
        content:
          "Exercices de réponse rapide incluant la méthode 5-4-3-2-1...",
        summary:
          "Exercices rapides pour reprendre le contrôle en moment de crise.",
        mediaType: "protocol" as const,
        privacy: "public" as const,
        status: "published" as const,
        categoryId: seedCategories[3].id,
        authorId: jeanUser.id,
        readingTime: 5,
        viewCount: 2100,
      },
    ];

    await db.insert(resource).values(seedResources);
    console.log(`✓ Created ${seedResources.length} resources`);
  }

  console.log(
    `\n✅ Seed complete — ${seedUsers.length} users, ${seedCategories.length} categories created`
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
