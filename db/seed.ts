import "dotenv/config";
import { db } from "./index";
import { user, account, session, verification } from "./schema";
import { auth } from "../lib/auth";

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

async function seed() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await db.delete(verification);
  await db.delete(session);
  await db.delete(account);
  await db.delete(user);
  console.log("✓ Cleaned existing data");

  // Create users via Better Auth API (handles password hashing)
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

  console.log(`\n✅ Seed complete — ${seedUsers.length} users created`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
