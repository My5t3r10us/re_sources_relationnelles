import { test, expect } from "@playwright/test";
import { E2E_CITIZEN, login } from "./helpers/auth";
import { resetRateLimits } from "../setup/db";

test.describe("Auth flow", () => {
  // better-auth plafonne /sign-in/email (10 / 5 min) et /sign-up/email
  // (5 / heure) par adresse IP : la suite entière partage un seul budget.
  test.beforeEach(resetRateLimits);

  test("login page is reachable", async ({ page }) => {
    await page.goto("/fr/login");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test("wrong credentials show an error", async ({ page }) => {
    await page.goto("/fr/login");
    await page.getByLabel(/email/i).fill("nobody@nope.test");
    await page.getByLabel(/mot de passe/i).fill("wrong-password");
    await page.getByRole("button", { name: /se connecter|login/i }).click();
    await expect(page.getByText(/identifiants|invalid|incorrect/i)).toBeVisible({ timeout: 10_000 });
  });

  test("happy path: existing user logs in and reaches home", async ({ page }) => {
    await login(page, E2E_CITIZEN);
    await expect(page).not.toHaveURL(/\/login$/);
  });

  test("registration page is reachable", async ({ page }) => {
    await page.goto("/fr/register");
    await expect(page.getByRole("button", { name: /s'inscrire|inscription/i })).toBeVisible();
  });

  test("registers a new user", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/fr/register");

    // Le formulaire sépare prénom et nom. `/nom/i` seul matcherait aussi
    // « Prénom » et déclencherait une violation du mode strict.
    await page.getByLabel(/prénom/i).fill(`User${stamp}`);
    await page.getByLabel(/^nom$/i).fill("Test");
    await page.getByLabel(/email/i).fill(`u${stamp}@test.local`);
    // Ancré pour ne pas capturer « Confirmer le mot de passe ».
    await page.getByLabel(/^mot de passe$/i).fill("Password123!");
    await page.getByLabel(/confirmer/i).fill("Password123!");

    await page.getByRole("button", { name: /s'inscrire|inscription/i }).click();
    await expect(page).not.toHaveURL(/\/register$/, { timeout: 15_000 });
  });
});
