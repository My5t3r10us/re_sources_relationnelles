import { test, expect } from "@playwright/test";
import { E2E_CITIZEN, login } from "./helpers/auth";

test.describe("Publish a resource", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, E2E_CITIZEN);
  });

  test("user can reach the publish page when authenticated", async ({ page }) => {
    await page.goto("/fr/publier");
    await expect(page.getByRole("heading", { name: /publier|nouvelle ressource/i })).toBeVisible();
  });

  test("publish form validates required fields", async ({ page }) => {
    await page.goto("/fr/publier");
    const submit = page.getByRole("button", { name: /publier|envoyer|soumettre/i }).first();
    await submit.click();
    await expect(
      page.getByText(/requis|obligatoire|nécessaire|title|content/i).first(),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("user can submit a new resource", async ({ page }) => {
    await page.goto("/fr/publier");
    const title = `Test E2E ${Date.now()}`;
    await page.getByLabel(/titre/i).fill(title);

    const contentField = page.getByLabel(/contenu|description/i).first();
    if (await contentField.isVisible().catch(() => false)) {
      await contentField.fill(
        "Voici un contenu de test pour la publication automatisée d'une ressource",
      );
    }

    const summary = page.getByLabel(/résumé/i).first();
    if (await summary.isVisible().catch(() => false)) {
      await summary.fill("Résumé test E2E");
    }

    await page.getByRole("button", { name: /publier|soumettre/i }).first().click();
    await expect(page).not.toHaveURL(/\/publier$/, { timeout: 15_000 });
  });

  test("can list my own resources in /mes-ressources", async ({ page }) => {
    await page.goto("/fr/mes-ressources");
    await expect(page.getByRole("heading", { name: /mes ressources/i })).toBeVisible();
  });
});
