import { describe, it, expect } from "vitest";
import { canViewResource, resourceViewDenial } from "@/lib/resource-access";
import type { UserRole } from "@/lib/session-user";

const viewer = (id: string, role: UserRole = "citizen") => ({ id, role });

const res = (over: Partial<{ authorId: string; status: string; privacy: string }> = {}) => ({
  authorId: "auteur",
  status: "published",
  privacy: "public",
  ...over,
});

/**
 * Régression E-1 : la page ressource ne vérifiait que `privacy` et ignorait
 * `status`. N'importe qui pouvait donc lire par URL directe une ressource en
 * brouillon, en attente, REJETÉE ou SIGNALÉE — le contenu écarté par la
 * modération restait servi publiquement. Cette logique est désormais partagée
 * entre l'API et la page, et testée ici une seule fois.
 */
describe("resourceViewDenial", () => {
  describe("published + public", () => {
    it("is visible to anonymous visitors", () => {
      expect(resourceViewDenial(res(), null)).toBeNull();
    });

    it("is visible to any authenticated user", () => {
      expect(resourceViewDenial(res(), viewer("autre"))).toBeNull();
    });
  });

  describe("unpublished statuses", () => {
    for (const status of ["draft", "pending", "rejected", "flagged"]) {
      it(`hides a "${status}" resource from a third party`, () => {
        expect(resourceViewDenial(res({ status }), viewer("tiers"))).toBe("not_found");
      });

      it(`hides a "${status}" resource from anonymous visitors`, () => {
        expect(resourceViewDenial(res({ status }), null)).toBe("not_found");
      });

      it(`still shows a "${status}" resource to its author`, () => {
        expect(resourceViewDenial(res({ status }), viewer("auteur"))).toBeNull();
      });

      it(`still shows a "${status}" resource to an admin`, () => {
        expect(resourceViewDenial(res({ status }), viewer("boss", "admin"))).toBeNull();
      });
    }
  });

  describe("private resources", () => {
    it("refuses a third party", () => {
      expect(resourceViewDenial(res({ privacy: "private" }), viewer("tiers"))).toBe("forbidden");
    });

    it("refuses anonymous visitors", () => {
      expect(resourceViewDenial(res({ privacy: "private" }), null)).toBe("forbidden");
    });

    it("allows the author", () => {
      expect(resourceViewDenial(res({ privacy: "private" }), viewer("auteur"))).toBeNull();
    });

    it("allows admins and super-admins", () => {
      expect(resourceViewDenial(res({ privacy: "private" }), viewer("b", "admin"))).toBeNull();
      expect(resourceViewDenial(res({ privacy: "private" }), viewer("b", "super_admin"))).toBeNull();
    });
  });

  it("prefers not_found over forbidden for an unpublished private resource", () => {
    // Ne pas révéler l'existence d'une ressource non publiée.
    expect(resourceViewDenial(res({ status: "draft", privacy: "private" }), viewer("tiers"))).toBe(
      "not_found"
    );
  });

  it("grants a moderator no special visibility", () => {
    // `moderator` n'accorde aucun privilège aujourd'hui (cf. lib/authz.ts).
    expect(resourceViewDenial(res({ status: "draft" }), viewer("m", "moderator"))).toBe("not_found");
  });
});

describe("canViewResource", () => {
  it("mirrors resourceViewDenial", () => {
    expect(canViewResource(res(), null)).toBe(true);
    expect(canViewResource(res({ status: "rejected" }), viewer("tiers"))).toBe(false);
    expect(canViewResource(res({ privacy: "private" }), viewer("tiers"))).toBe(false);
  });
});
