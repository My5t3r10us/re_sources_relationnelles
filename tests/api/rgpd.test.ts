import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { authLog, comment, favorite, resource, user } from "@/db/schema";
import {
  DELETED_USER_ID,
  DELETED_USER_NAME,
  deleteUserAccount,
  ensureDeletedUserPlaceholder,
  exportUserData,
  purgeAuthLog,
  secretMatches,
} from "@/lib/rgpd";
import {
  resetDb,
  createTestUser,
  createTestCategory,
  createTestResource,
  createTestComment,
} from "../setup/db";

// Le bucket n'est pas joignable en test : seule compte la façon dont
// `deleteUserAccount` choisit les clés à supprimer.
// `vi.hoisted` est nécessaire — la fabrique de `vi.mock` est remontée au-dessus
// des déclarations du module et ne peut pas capturer un `const` ordinaire.
const { deleteObject } = vi.hoisted(() => ({
  deleteObject: vi.fn(async (_key: string) => {}),
}));
vi.mock("@/lib/s3", async () => {
  const actual = await vi.importActual<typeof import("@/lib/s3")>("@/lib/s3");
  return { ...actual, deleteObject };
});

// Base publique réellement configurée pour les tests (`tests/setup/vitest.setup.ts`
// pose AWS_PUBLIC_URL). Une URL d'un autre hôte n'est pas reconnue comme un
// objet du bucket, et c'est le comportement attendu.
const BUCKET_URL = process.env.AWS_PUBLIC_URL ?? "https://test.example.com";

beforeEach(async () => {
  await resetDb();
  deleteObject.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("compte réceptacle", () => {
  it("crée un compte inactif, sans identifiants, donc non connectable", async () => {
    await ensureDeletedUserPlaceholder();

    const [fantome] = await db
      .select()
      .from(user)
      .where(eq(user.id, DELETED_USER_ID));

    expect(fantome.name).toBe(DELETED_USER_NAME);
    // `loadVerifiedUser` renvoie null pour tout compte inactif : c'est ce qui
    // rend le réceptacle inutilisable comme porte d'entrée.
    expect(fantome.active).toBe(false);
    expect(fantome.role).toBe("citizen");
  });

  it("est idempotent", async () => {
    await ensureDeletedUserPlaceholder();
    await ensureDeletedUserPlaceholder();

    const rows = await db
      .select()
      .from(user)
      .where(eq(user.id, DELETED_USER_ID));
    expect(rows).toHaveLength(1);
  });

  it("refuse de se supprimer lui-même", async () => {
    await ensureDeletedUserPlaceholder();
    await expect(deleteUserAccount(DELETED_USER_ID)).rejects.toThrow(
      /réceptacle/,
    );
  });
});

describe("effacement du compte (art. 17)", () => {
  it("anonymise le contenu public et détruit le reste", async () => {
    const citoyen = await createTestUser({ email: "partant@test.local" });
    const autre = await createTestUser({ email: "reste@test.local" });
    const categorie = await createTestCategory();

    const publiee = await createTestResource({
      authorId: citoyen.id,
      categoryId: categorie.id,
      status: "published",
    });
    const brouillon = await createTestResource({
      authorId: citoyen.id,
      categoryId: categorie.id,
      status: "draft",
    });
    const ressourceAutrui = await createTestResource({
      authorId: autre.id,
      categoryId: categorie.id,
      status: "published",
    });
    const commentaire = await createTestComment({
      resourceId: ressourceAutrui.id,
      authorId: citoyen.id,
    });
    await db.insert(favorite).values({
      id: crypto.randomUUID(),
      userId: citoyen.id,
      resourceId: ressourceAutrui.id,
    });

    const rapport = await deleteUserAccount(citoyen.id);

    expect(rapport.ressourcesAnonymisees).toBe(1);
    expect(rapport.commentairesAnonymises).toBe(1);

    // La ligne `user` disparaît : plus aucune donnée d'identité.
    const restant = await db.select().from(user).where(eq(user.id, citoyen.id));
    expect(restant).toHaveLength(0);

    // La ressource publiée survit, réattribuée au compte réceptacle.
    const [survivante] = await db
      .select()
      .from(resource)
      .where(eq(resource.id, publiee.id));
    expect(survivante.authorId).toBe(DELETED_USER_ID);

    // Le brouillon part avec son auteur (cascade).
    const brouillons = await db
      .select()
      .from(resource)
      .where(eq(resource.id, brouillon.id));
    expect(brouillons).toHaveLength(0);

    // Le commentaire reste dans le fil, détaché de son auteur.
    const [commentaireSurvivant] = await db
      .select()
      .from(comment)
      .where(eq(comment.id, commentaire.id));
    expect(commentaireSurvivant.authorId).toBe(DELETED_USER_ID);

    // Les favoris sont des données personnelles : ils partent.
    const favoris = await db
      .select()
      .from(favorite)
      .where(eq(favorite.userId, citoyen.id));
    expect(favoris).toHaveLength(0);
  });

  it("détache l'identifiant du journal sans effacer le journal", async () => {
    const citoyen = await createTestUser();
    await db.insert(authLog).values({
      id: crypto.randomUUID(),
      userId: citoyen.id,
      event: "login",
      ipAddress: "203.0.113.10",
    });

    await deleteUserAccount(citoyen.id);

    // `auth_log` n'a pas de FK vers `user` : sans mise à NULL explicite,
    // l'identifiant resterait, recoupable, donc encore personnel.
    const restants = await db
      .select()
      .from(authLog)
      .where(eq(authLog.userId, citoyen.id));
    expect(restants).toHaveLength(0);

    const journal = await db.select().from(authLog);
    expect(journal.length).toBeGreaterThan(0);
    expect(journal.every((l) => l.userId === null)).toBe(true);
  });

  it("ne supprime du bucket que les fichiers des ressources non conservées", async () => {
    const citoyen = await createTestUser();
    const publiee = await createTestResource({
      authorId: citoyen.id,
      status: "published",
    });
    const brouillon = await createTestResource({
      authorId: citoyen.id,
      status: "draft",
    });

    const urlConservee = `${BUCKET_URL}/${citoyen.id}/garde.png`;
    const urlSupprimee = `${BUCKET_URL}/${citoyen.id}/jette.png`;
    await db
      .update(resource)
      .set({ imageUrl: urlConservee })
      .where(eq(resource.id, publiee.id));
    await db
      .update(resource)
      .set({ imageUrl: urlSupprimee })
      .where(eq(resource.id, brouillon.id));

    await deleteUserAccount(citoyen.id);

    const clesSupprimees = deleteObject.mock.calls.map((c) => c[0]);
    expect(clesSupprimees).toContain(`${citoyen.id}/jette.png`);
    // L'image de la ressource conservée doit rester : la ressource vit encore.
    expect(clesSupprimees).not.toContain(`${citoyen.id}/garde.png`);
  });

  it("ne touche pas aux contenus des autres citoyens", async () => {
    const citoyen = await createTestUser();
    const autre = await createTestUser();
    const ressourceAutrui = await createTestResource({
      authorId: autre.id,
      status: "published",
    });

    await deleteUserAccount(citoyen.id);

    const [intacte] = await db
      .select()
      .from(resource)
      .where(eq(resource.id, ressourceAutrui.id));
    expect(intacte.authorId).toBe(autre.id);
    expect(
      await db.select().from(user).where(eq(user.id, autre.id)),
    ).toHaveLength(1);
  });
});

describe("portabilité (art. 20)", () => {
  it("exporte les données du citoyen et rien d'autre", async () => {
    const citoyen = await createTestUser({
      email: "export@test.local",
      name: "Alice",
    });
    const autre = await createTestUser({ email: "autrui@test.local" });
    const sienne = await createTestResource({
      authorId: citoyen.id,
      title: "Ma ressource",
    });
    const autrui = await createTestResource({
      authorId: autre.id,
      title: "Ressource d'autrui",
    });
    await createTestComment({ resourceId: autrui.id, authorId: citoyen.id });

    const donnees = await exportUserData(citoyen.id);

    expect(donnees.compte).toMatchObject({
      id: citoyen.id,
      email: "export@test.local",
      nom: "Alice",
    });
    expect(donnees.ressources).toHaveLength(1);
    expect((donnees.ressources[0] as { id: string }).id).toBe(sienne.id);
    expect(donnees.commentaires).toHaveLength(1);

    // Aucune donnée d'un autre compte ne doit fuir dans l'export.
    expect(JSON.stringify(donnees)).not.toContain(autre.id);
  });

  it("est sérialisable en JSON", async () => {
    const citoyen = await createTestUser();
    await createTestResource({ authorId: citoyen.id });

    const json = JSON.stringify(await exportUserData(citoyen.id));
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("échoue explicitement sur un compte inexistant", async () => {
    await expect(exportUserData("inconnu")).rejects.toThrow(/introuvable/);
  });
});

describe("purge de rétention du journal (F-5)", () => {
  it("supprime les entrées expirées et conserve les récentes", async () => {
    const vieille = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const recente = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);

    await db.insert(authLog).values([
      {
        id: "vieille",
        event: "login",
        ipAddress: "203.0.113.1",
        createdAt: vieille,
      },
      {
        id: "recente",
        event: "login",
        ipAddress: "203.0.113.2",
        createdAt: recente,
      },
    ]);

    const supprimees = await purgeAuthLog(180);

    expect(supprimees).toBe(1);
    const restantes = await db.select().from(authLog);
    expect(restantes.map((l) => l.id)).toEqual(["recente"]);
  });

  it("refuse une durée de conservation absurde", async () => {
    await expect(purgeAuthLog(0)).rejects.toThrow(/au moins 1 jour/);
    await expect(purgeAuthLog(Number.NaN)).rejects.toThrow(/au moins 1 jour/);
  });
});

describe("secret d'ordonnancement", () => {
  it("accepte le secret exact et rejette tout le reste", () => {
    expect(secretMatches("s3cret-de-cron", "s3cret-de-cron")).toBe(true);
    expect(secretMatches("s3cret-de-cronn", "s3cret-de-cron")).toBe(false);
    expect(secretMatches("", "s3cret-de-cron")).toBe(false);
    expect(secretMatches("autre", "s3cret-de-cron")).toBe(false);
  });
});
