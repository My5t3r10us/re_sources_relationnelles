import { test, expect } from "@playwright/test";
import { E2E_ADMIN, E2E_CITIZEN, login } from "./helpers/auth";
import { resetRateLimits } from "../setup/db";

test.describe("Admin moderation", () => {
  // Chaque test se connecte : sans remise à zéro, le plafond par IP de
  // better-auth (10 sign-in / 5 min) tombe en cours de suite.
  test.beforeEach(resetRateLimits);

  test("citizen cannot access admin panel", async ({ page }) => {
    await login(page, E2E_CITIZEN);
    await page.goto("/fr/admin/statistiques");
    await expect(page).not.toHaveURL(/\/admin\/statistiques/, { timeout: 5_000 }).catch(async () => {
      await expect(page.getByText(/accès|forbidden|réservé/i)).toBeVisible();
    });
  });

  test("admin can access stats", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/statistiques");
    await expect(page.getByRole("heading", { name: /statistiques/i })).toBeVisible();
  });

  test("admin can browse moderation page", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/moderation");
    await expect(page.getByRole("heading", { name: /modération/i })).toBeVisible();
  });

  test("admin can browse categories management", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/categories");
    await expect(page.getByRole("heading", { name: /catégories/i })).toBeVisible();
  });

  test("admin can browse users management", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/utilisateurs");
    await expect(page.getByRole("heading", { name: /utilisateurs|comptes/i })).toBeVisible();
  });

  test("admin can browse reports/signalements", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/signalements");
    await expect(page.getByRole("heading", { name: /signalements|signalés/i })).toBeVisible();
  });

  test("admin can create a new category", async ({ page }) => {
    await login(page, E2E_ADMIN);
    await page.goto("/fr/admin/categories");
    const newButton = page.getByRole("button", { name: /nouvelle|créer|ajouter/i }).first();
    if (await newButton.isVisible().catch(() => false)) {
      await newButton.click();
      const slug = `e2e-${Date.now()}`;
      const nameField = page.getByLabel(/nom/i).first();
      const slugField = page.getByLabel(/slug/i).first();
      await nameField.fill(`Cat ${slug}`);
      await slugField.fill(slug);
      await page.getByRole("button", { name: /enregistrer|créer|valider/i }).first().click();
      // `exact` : le nom de la catégorie contient lui aussi le slug
      // (« Cat e2e-… »), et une correspondance partielle en viserait deux.
      await expect(page.getByText(slug, { exact: true })).toBeVisible({ timeout: 10_000 });
    }
  });
});
