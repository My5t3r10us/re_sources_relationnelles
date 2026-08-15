import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

// Les quatre pages du pied de page renvoyaient un 404 : elles n'existaient pas.
// Imports statiques plutôt qu'un `import()` construit — Vite ne sait pas
// analyser un chemin dynamique et émet un avertissement à chaque exécution.
const legalPages = [
  [
    "mentions-legales",
    "Mentions légales",
    () => import("@/app/[locale]/(public)/mentions-legales/page"),
  ],
  [
    "confidentialite",
    "Politique de confidentialité",
    () => import("@/app/[locale]/(public)/confidentialite/page"),
  ],
  [
    "accessibilite",
    "Déclaration d'accessibilité",
    () => import("@/app/[locale]/(public)/accessibilite/page"),
  ],
  ["contact", "Contact", () => import("@/app/[locale]/(public)/contact/page")],
] as const;

describe.each(legalPages)(
  "app/[locale]/(public)/%s/page.tsx",
  (_slug, titre, load) => {
    it("s'affiche sans erreur", async () => {
      const { default: Page } = await load();
      expect(Page()).toBeTruthy();
    });

    it("porte un titre de niveau 1 explicite", async () => {
      const { default: Page } = await load();
      render(Page());
      expect(
        screen.getByRole("heading", { level: 1, name: titre }),
      ).toBeInTheDocument();
    });

    it("signale qu'il s'agit d'une simulation et non d'un service ministériel", async () => {
      const { default: Page } = await load();
      render(Page());
      expect(screen.getByText(/Projet de simulation/)).toBeInTheDocument();
    });
  },
);

describe("politique de confidentialité", () => {
  it("annonce la durée de conservation réellement appliquée au journal", async () => {
    // Le code purge à 180 jours (DEFAULT_AUTH_LOG_RETENTION_DAYS) : une
    // politique annonçant autre chose serait un manquement en soi.
    const { DEFAULT_AUTH_LOG_RETENTION_DAYS } = await import("@/lib/rgpd");
    const { default: Page } = await import(
      "@/app/[locale]/(public)/confidentialite/page"
    );
    render(Page());

    expect(
      screen.getByText(`${DEFAULT_AUTH_LOG_RETENTION_DAYS} jours`),
    ).toBeInTheDocument();
  });

  it("décrit l'anonymisation des contenus publics après effacement", async () => {
    const { default: Page } = await import(
      "@/app/[locale]/(public)/confidentialite/page"
    );
    render(Page());
    expect(screen.getByText(/« Utilisateur supprimé »/)).toBeInTheDocument();
  });
});

describe("déclaration d'accessibilité", () => {
  it("déclare un état de conformité RGAA explicite", async () => {
    // Le RGAA impose d'annoncer l'état réellement vérifié. Aucun audit n'ayant
    // été mené, « non conforme » est la seule déclaration exacte.
    const { default: Page } = await import(
      "@/app/[locale]/(public)/accessibilite/page"
    );
    render(Page());
    expect(screen.getByText("non conforme")).toBeInTheDocument();
  });

  it("indique les voies de recours auprès du Défenseur des droits", async () => {
    const { default: Page } = await import(
      "@/app/[locale]/(public)/accessibilite/page"
    );
    render(Page());
    expect(screen.getByText(/Défenseur des droits/)).toBeInTheDocument();
  });
});
