import { test as setup, expect } from "@playwright/test";
import { resetDb, createTestUser, createTestCategory, createTestResource } from "../setup/db";

setup("seed database for E2E", async () => {
  if (!process.env.DATABASE_URL_TEST && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL_TEST or DATABASE_URL must be set for E2E tests");
  }
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;

  await resetDb();

  const admin = await createTestUser({
    email: "admin-e2e@test.local",
    name: "Admin E2E",
    password: "Password123!",
    role: "super_admin",
  });

  const citizen = await createTestUser({
    email: "citizen-e2e@test.local",
    name: "Citoyen E2E",
    password: "Password123!",
    role: "citizen",
  });

  const category = await createTestCategory({ name: "Bien-être", slug: "bien-etre" });

  await createTestResource({
    authorId: admin.id,
    categoryId: category.id,
    title: "Ressource E2E publiée",
    status: "published",
    privacy: "public",
    featured: true,
  });

  expect(admin.id).toBeTruthy();
  expect(citizen.id).toBeTruthy();
});
