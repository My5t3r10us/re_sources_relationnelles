import { test, expect } from "@playwright/test";
import { E2E_CITIZEN, login } from "./helpers/auth";

test.describe("Auth flow", () => {
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
    await expect(page.getByRole("button", { name: /inscription|register|créer/i })).toBeVisible();
  });

  test("registers a new user", async ({ page }) => {
    const stamp = Date.now();
    await page.goto("/fr/register");

    await page.getByLabel(/nom complet|nom/i).fill(`User${stamp}`);
    await page.getByLabel(/email/i).fill(`u${stamp}@test.local`);
    await page.getByLabel(/^mot de passe$/i).fill("Password123!");
    const confirmField = page.getByLabel(/confirmer|confirmation/i);
    if (await confirmField.isVisible().catch(() => false)) {
      await confirmField.fill("Password123!");
    }

    await page.getByRole("button", { name: /inscription|register|créer/i }).click();
    await expect(page).not.toHaveURL(/\/register$/, { timeout: 15_000 });
  });
});
