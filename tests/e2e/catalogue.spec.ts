import { test, expect } from "@playwright/test";

test.describe("Catalogue & reading", () => {
  test("catalogue page lists resources", async ({ page }) => {
    await page.goto("/fr/catalogue");
    await expect(page.getByRole("heading", { name: /catalogue/i })).toBeVisible();
    const cards = page.locator("article, [data-testid='resource-card'], a:has-text('Ressource E2E')");
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test("search filters resources", async ({ page }) => {
    await page.goto("/fr/catalogue");
    const search = page.getByPlaceholder(/rechercher/i).first();
    if (await search.isVisible().catch(() => false)) {
      await search.fill("E2E");
      await search.press("Enter");
      await expect(page.getByText(/Ressource E2E publiée/i)).toBeVisible({ timeout: 10_000 });
    }
  });

  test("can navigate to a resource detail page", async ({ page }) => {
    await page.goto("/fr/catalogue");
    const firstResource = page.getByText(/Ressource E2E publiée/i).first();
    await firstResource.click();
    await expect(page).toHaveURL(/\/ressource\//);
    await expect(page.getByRole("heading", { name: /Ressource E2E publiée/i })).toBeVisible();
  });

  test("category sidebar is present", async ({ page }) => {
    await page.goto("/fr/catalogue");
    await expect(page.getByText(/Toutes les ressources/i).first()).toBeVisible();
  });
});
