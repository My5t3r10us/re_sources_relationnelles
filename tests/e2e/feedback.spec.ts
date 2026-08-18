import { test, expect } from "@playwright/test";
import { login, E2E_CITIZEN } from "./helpers/auth";

/**
 * Le portail Fider n'est pas déployé pour les tests : `POST /api/v1/feedback`
 * est donc intercepté. Ce qui est vérifié ici est le parcours dans
 * l'application — ouverture, saisie, confirmation — pas l'API de Fider.
 *
 * Ces tests ne s'exécutent que si `NEXT_PUBLIC_FIDER_URL` est renseigné au
 * démarrage du serveur : sans elle le bouton n'est pas rendu, ce qui est le
 * comportement attendu et couvert par le dernier cas.
 */
const boardConfigured = Boolean(process.env.NEXT_PUBLIC_FIDER_URL);

test.describe("Feedback Fider", () => {
  test.skip(!boardConfigured, "NEXT_PUBLIC_FIDER_URL non configurée");

  test("un citoyen connecté publie une idée depuis le pied de page", async ({ page }) => {
    await page.route("**/api/v1/feedback", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            number: 7,
            slug: "mode-sombre",
            url: `${process.env.NEXT_PUBLIC_FIDER_URL}/posts/7/mode-sombre`,
          },
          error: null,
        }),
      });
    });

    await login(page, E2E_CITIZEN);
    await page.goto("/fr");

    await page.getByRole("button", { name: /proposer une amélioration/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    await dialog.getByRole("radio", { name: /idée/i }).click();
    await dialog.getByLabel(/titre/i).fill("Ajouter un mode sombre");
    await dialog.getByLabel(/description/i).fill("Confort de lecture le soir.");
    await dialog.getByRole("button", { name: /^envoyer$/i }).click();

    await expect(dialog.getByText(/votre retour a bien été publié/i)).toBeVisible();
    await expect(dialog.getByRole("link", { name: /voir la publication/i })).toHaveAttribute(
      "href",
      /\/posts\/7\/mode-sombre$/,
    );
  });

  test("l'erreur du serveur est affichée sans détail technique", async ({ page }) => {
    await page.route("**/api/v1/feedback", async (route) => {
      await route.fulfill({
        status: 502,
        contentType: "application/json",
        body: JSON.stringify({
          data: null,
          error: { code: "FEEDBACK_UNAVAILABLE", message: "Portail de retours indisponible" },
        }),
      });
    });

    await login(page, E2E_CITIZEN);
    await page.goto("/fr");

    await page.getByRole("button", { name: /proposer une amélioration/i }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel(/titre/i).fill("Un titre suffisamment long");
    await dialog.getByRole("button", { name: /^envoyer$/i }).click();

    await expect(dialog.getByText(/portail de retours indisponible/i)).toBeVisible();
  });
});

test.describe("Feedback Fider désactivé", () => {
  test.skip(boardConfigured, "NEXT_PUBLIC_FIDER_URL est configurée");

  test("le bouton est absent quand le portail n'est pas configuré", async ({ page }) => {
    await page.goto("/fr");
    await expect(
      page.getByRole("button", { name: /proposer une amélioration/i }),
    ).toHaveCount(0);
  });
});
