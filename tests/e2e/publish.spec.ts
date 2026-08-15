import { test, expect } from "@playwright/test";
import { E2E_CITIZEN, login } from "./helpers/auth";
import { resetRateLimits } from "../setup/db";

test.describe("Publish a resource", () => {
  test.beforeEach(async ({ page }) => {
    // Le plafond de connexions de better-auth est indexé sur l'IP : sans cette
    // remise à zéro, les `login()` successifs de la suite finissent en 429.
    await resetRateLimits();
    await login(page, E2E_CITIZEN);
  });

  // La page est un « mode rédaction » plein écran : son seul <h1> est un aperçu
  // décoratif du titre saisi, il n'y a donc pas d'en-tête « Publier » à cibler.
  test("user can reach the publish page when authenticated", async ({ page }) => {
    await page.goto("/fr/publier");
    await expect(page.getByLabel(/titre/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /publier sur/i })).toBeVisible();
  });

  test("publish form validates required fields", async ({ page }) => {
    await page.goto("/fr/publier");

    // La validation passe par window.alert, que Playwright referme
    // automatiquement : sans écouteur, le message n'atteint jamais le DOM.
    const dialogMessage = new Promise<string>((resolve) => {
      page.once("dialog", async (dialog) => {
        resolve(dialog.message());
        await dialog.dismiss();
      });
    });

    await page.getByRole("button", { name: /publier sur/i }).click();

    expect(await dialogMessage).toMatch(/requis|obligatoire/i);
    await expect(page).toHaveURL(/\/publier$/);
  });

  test("user can submit a new resource", async ({ page }) => {
    await page.goto("/fr/publier");
    const title = `Test E2E ${Date.now()}`;
    await page.getByLabel(/titre/i).fill(title);

    // L'éditeur est un contenteditable Tiptap : on tape dedans plutôt que de
    // le remplir comme un <input>.
    const content = page.getByLabel(/contenu/i);
    await content.click();
    await content.pressSequentially(
      "Voici un contenu de test pour la publication automatisée d'une ressource",
    );

    await page.getByRole("button", { name: /publier sur/i }).click();

    // L'action serveur redirige vers /ressource/<id> quand la création réussit.
    await page.waitForURL(/\/ressource\//, { timeout: 15_000 });
  });

  test("can list my own resources in /mes-ressources", async ({ page }) => {
    await page.goto("/fr/mes-ressources");
    await expect(page.getByRole("heading", { name: /mes ressources/i })).toBeVisible();
  });
});
