import type { Page } from "@playwright/test";

export interface E2ECredentials {
  email: string;
  password: string;
}

export const E2E_ADMIN: E2ECredentials = {
  email: "admin-e2e@test.local",
  password: "Password123!",
};

export const E2E_CITIZEN: E2ECredentials = {
  email: "citizen-e2e@test.local",
  password: "Password123!",
};

export async function login(page: Page, creds: E2ECredentials) {
  await page.goto("/fr/login");
  await page.getByLabel(/email/i).fill(creds.email);
  await page.getByLabel(/mot de passe|password/i).fill(creds.password);
  await page.getByRole("button", { name: /se connecter|login/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/login"));
}

export async function logout(page: Page) {
  await page.goto("/fr");
  const logoutBtn = page.getByRole("button", { name: /déconnexion|logout/i });
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
  }
}
