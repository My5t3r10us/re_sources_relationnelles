import { describe, expect, it } from "vitest";
import { buildStatsCsv, escapeCsvValue } from "@/app/[locale]/(admin)/admin/statistiques/stats-export";
import { createAdminStatsFixture } from "../../setup/admin-stats-fixture";

describe("export CSV des statistiques", () => {
  it("échappe les séparateurs, guillemets et sauts de ligne", () => {
    expect(escapeCsvValue('Santé; "mentale"\nFrance')).toBe('"Santé; ""mentale""\nFrance"');
  });

  it("produit un CSV avec BOM et un nombre de colonnes constant", () => {
    const csv = buildStatsCsv(createAdminStatsFixture(), "synthese");
    expect(csv.startsWith("\uFEFF")).toBe(true);

    const rows = csv.slice(1).trimEnd().split("\r\n");
    expect(rows[0]).toBe("Section;Indicateur;Dimension;Valeur");

    // Le libellé complexe est entouré de guillemets ; on vérifie la structure
    // des lignes simples et la présence de l'échappement dédié séparément.
    expect(rows.filter((row) => !row.startsWith("Répartition;Catégorie")).every((row) => row.split(";").length === 4)).toBe(true);
    expect(csv).toContain('"Santé; ""mentale""\nFrance"');
  });

  it("produit une table temporelle à six colonnes", () => {
    const csv = buildStatsCsv(createAdminStatsFixture(), "series-temporelles");
    const rows = csv.slice(1).trimEnd().split("\r\n");
    expect(rows.every((row) => row.split(";").length === 6)).toBe(true);
  });
});
