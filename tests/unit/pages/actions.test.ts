import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw Object.assign(new Error(`REDIRECT:${url}`), { digest: "NEXT_REDIRECT" }); }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ─── Auth mocks ────────────────────────────────────────────────────────────
const mockGetServerSession = vi.fn();
vi.mock("@/lib/auth-server", () => ({ getServerSession: mockGetServerSession }));

// ─── DB mock ───────────────────────────────────────────────────────────────
let qIdx = 0;
let qData: any[][] = [];

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(() => makeChain(qData[qIdx++] ?? [])),
    insert: vi.fn(() => makeChain([])),
    update: vi.fn(() => makeChain([])),
    delete: vi.fn(() => makeChain([])),
  },
}));

// ─── S3 mock ───────────────────────────────────────────────────────────────
vi.mock("@/lib/s3", () => ({
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getObjectKeyFromUrl: vi.fn().mockReturnValue("some/key.jpg"),
}));

// ─── Admin-user mock ───────────────────────────────────────────────────────
vi.mock("@/lib/admin-user", () => ({
  createAdminUserCore: vi.fn().mockResolvedValue({ id: "new-admin-id" }),
}));

const mockAdminSession = { user: { id: "admin1", name: "Admin" } };
const mockUserSession = { user: { id: "u1", name: "User" } };

function setupAdminAuth() {
  // requireAdmin calls getServerSession then selects user role
  mockGetServerSession.mockResolvedValue(mockAdminSession);
  qData = [[{ role: "admin" }]];
}

function setupSuperAdminAuth() {
  mockGetServerSession.mockResolvedValue(mockAdminSession);
  qData = [[{ role: "super_admin" }]];
}

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════
// Admin actions
// ═══════════════════════════════════════════════════════════════
describe("admin/actions.ts", () => {
  describe("updateResourceStatus", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { updateResourceStatus } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateResourceStatus("r1", "published")).rejects.toThrow("Non authentifié");
    });

    it("throws when not admin", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ role: "citizen" }]];
      const { updateResourceStatus } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateResourceStatus("r1", "published")).rejects.toThrow("Accès refusé");
    });

    it("updates status for admin", async () => {
      setupAdminAuth();
      const { updateResourceStatus } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateResourceStatus("r1", "published")).resolves.toBeUndefined();
    });
  });

  describe("updateUserRole", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { updateUserRole } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateUserRole("u1", "admin")).rejects.toThrow("Non authentifié");
    });

    it("updates role for admin", async () => {
      setupAdminAuth();
      const { updateUserRole } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateUserRole("u1", "moderator")).resolves.toBeUndefined();
    });
  });

  describe("toggleUserActive", () => {
    it("throws when user not found", async () => {
      setupAdminAuth();
      qData = [[{ role: "admin" }], []]; // requireAdmin uses first, then user lookup returns []
      const { toggleUserActive } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(toggleUserActive("u1")).rejects.toThrow("Utilisateur introuvable");
    });

    it("toggles user active status", async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      qData = [[{ role: "admin" }], [{ active: true }]];
      const { toggleUserActive } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(toggleUserActive("u1")).resolves.toBeUndefined();
    });
  });

  describe("updateCommentStatus", () => {
    it("updates comment status", async () => {
      setupAdminAuth();
      const { updateCommentStatus } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateCommentStatus("c1", "hidden")).resolves.toBeUndefined();
    });
  });

  describe("deleteComment (admin)", () => {
    it("deletes comment", async () => {
      setupAdminAuth();
      const { deleteComment } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(deleteComment("c1")).resolves.toBeUndefined();
    });
  });

  describe("resolveReport", () => {
    it("resolves report", async () => {
      setupAdminAuth();
      const { resolveReport } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(resolveReport("r1")).resolves.toBeUndefined();
    });
  });

  describe("deleteResource", () => {
    it("deletes resource and cleans up S3 files", async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      // requireAdmin: role, then resource imageUrl, then resource files
      qData = [[{ role: "admin" }], [{ imageUrl: "https://cdn.example.com/img.jpg" }], [{ url: "https://cdn.example.com/file.pdf" }]];
      const { deleteResource } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(deleteResource("r1")).resolves.toBeUndefined();
    });

    it("deletes resource without S3 files", async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      qData = [[{ role: "admin" }], [{ imageUrl: null }], []];
      const { deleteResource } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(deleteResource("r1")).resolves.toBeUndefined();
    });
  });

  describe("toggleFeaturedResource", () => {
    it("toggles featured status", async () => {
      setupAdminAuth();
      const { toggleFeaturedResource } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(toggleFeaturedResource("r1", true)).resolves.toBeUndefined();
    });
  });

  describe("createCategory", () => {
    it("creates category", async () => {
      setupAdminAuth();
      const { createCategory } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(createCategory({ name: "Santé", slug: "sante", description: "Desc", icon: "💚" })).resolves.toBeUndefined();
    });

    it("creates category without optional fields", async () => {
      setupAdminAuth();
      const { createCategory } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(createCategory({ name: "Santé", slug: "sante" })).resolves.toBeUndefined();
    });
  });

  describe("updateCategory", () => {
    it("updates category", async () => {
      setupAdminAuth();
      const { updateCategory } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateCategory("c1", { name: "Santé", slug: "sante" })).resolves.toBeUndefined();
    });
  });

  describe("deleteCategory", () => {
    it("deletes category", async () => {
      setupAdminAuth();
      const { deleteCategory } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(deleteCategory("c1")).resolves.toBeUndefined();
    });
  });

  describe("createAdminUser", () => {
    it("throws when not super_admin", async () => {
      mockGetServerSession.mockResolvedValue(mockAdminSession);
      qData = [[{ role: "admin" }]];
      const { createAdminUser } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(createAdminUser({ name: "Alice", email: "alice@test.com", password: "pass", role: "admin" })).rejects.toThrow("super-administrateur");
    });

    it("creates admin user as super_admin", async () => {
      setupSuperAdminAuth();
      const { createAdminUser } = await import("@/app/[locale]/(admin)/admin/actions");
      const result = await createAdminUser({ name: "Alice", email: "alice@test.com", password: "pass", role: "admin" });
      expect(result).toHaveProperty("id");
    });

    it("throws when createAdminUserCore returns error", async () => {
      setupSuperAdminAuth();
      const { createAdminUserCore } = await import("@/lib/admin-user");
      vi.mocked(createAdminUserCore).mockResolvedValueOnce({ error: { message: "Email already taken" } } as any);
      const { createAdminUser } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(createAdminUser({ name: "Alice", email: "alice@test.com", password: "pass", role: "admin" })).rejects.toThrow("Email already taken");
    });
  });

  describe("updateUserRoleAsAdmin", () => {
    it("throws when not super_admin", async () => {
      setupAdminAuth();
      const { updateUserRoleAsAdmin } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateUserRoleAsAdmin("u1", "citizen")).rejects.toThrow();
    });

    it("updates user role as super_admin", async () => {
      setupSuperAdminAuth();
      const { updateUserRoleAsAdmin } = await import("@/app/[locale]/(admin)/admin/actions");
      await expect(updateUserRoleAsAdmin("u1", "admin")).resolves.toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Publish actions
// ═══════════════════════════════════════════════════════════════
describe("publish-actions.ts", () => {
  const validParams = {
    title: "My Resource", content: "Some content here", summary: "Summary",
    mediaType: "article", categoryId: null, privacy: "public" as const,
    isDraft: false, imageUrl: null,
  };

  describe("publishResource", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource(validParams)).rejects.toThrow("Non authentifié");
    });

    it("throws when title or content is empty", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource({ ...validParams, title: "" })).rejects.toThrow("requis");
      await expect(publishResource({ ...validParams, content: "" })).rejects.toThrow("requis");
    });

    it("publishes resource with redirect", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [];
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource(validParams)).rejects.toThrow("REDIRECT");
    });

    it("publishes as draft", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource({ ...validParams, isDraft: true })).rejects.toThrow("REDIRECT");
    });

    it("resolves category by slug when not UUID", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "cat1" }]];
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource({ ...validParams, categoryId: "my-slug" })).rejects.toThrow("REDIRECT");
    });

    it("resolves category directly when UUID format", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource({ ...validParams, categoryId: "550e8400-e29b-41d4-a716-446655440000" })).rejects.toThrow("REDIRECT");
    });

    it("inserts attachments when provided", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { publishResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(publishResource({
        ...validParams,
        attachments: [{ url: "https://cdn.example.com/file.pdf", name: "file.pdf", contentType: "application/pdf" }],
      })).rejects.toThrow("REDIRECT");
    });
  });

  describe("updateResource", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { updateResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(updateResource("r1", validParams)).rejects.toThrow("Non authentifié");
    });

    it("throws when resource not found", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { updateResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(updateResource("r1", validParams)).rejects.toThrow("introuvable");
    });

    it("throws when not author", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u2", status: "draft" }]];
      const { updateResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(updateResource("r1", validParams)).rejects.toThrow("Non autorisé");
    });

    it("updates resource with redirect", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u1", status: "published" }]];
      const { updateResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(updateResource("r1", validParams)).rejects.toThrow("REDIRECT");
    });

    it("updates resource with attachments (cleans old files)", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [
        [{ authorId: "u1", status: "published" }],
        [{ url: "https://cdn.example.com/old.pdf" }],
      ];
      const { updateResource } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(updateResource("r1", {
        ...validParams,
        attachments: [{ url: "https://cdn.example.com/new.pdf", name: "new.pdf", contentType: "application/pdf" }],
      })).rejects.toThrow("REDIRECT");
    });
  });

  describe("submitDraftForReview", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(submitDraftForReview("r1")).rejects.toThrow("Non authentifié");
    });

    it("throws when resource not found", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(submitDraftForReview("r1")).rejects.toThrow("introuvable");
    });

    it("throws when not author", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u2", status: "draft" }]];
      const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(submitDraftForReview("r1")).rejects.toThrow("Non autorisé");
    });

    it("throws when not a draft", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u1", status: "published" }]];
      const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(submitDraftForReview("r1")).rejects.toThrow("brouillons");
    });

    it("submits draft for review", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u1", status: "draft" }]];
      const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
      await expect(submitDraftForReview("r1")).resolves.toBeUndefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Comment actions
// ═══════════════════════════════════════════════════════════════
describe("comment-actions.ts", () => {
  describe("addComment", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(addComment("r1", "content")).rejects.toThrow("Non authentifié");
    });

    it("throws when content is empty", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(addComment("r1", "  ")).rejects.toThrow("vide");
    });

    it("throws when content too long", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(addComment("r1", "x".repeat(2001))).rejects.toThrow("trop long");
    });

    it("adds a comment", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      const result = await addComment("r1", "Great resource!");
      expect(result).toEqual({ success: true });
    });

    it("adds a reply comment with parentId", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      const result = await addComment("r1", "Reply!", "parent1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("deleteComment", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { deleteComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(deleteComment("c1", "r1")).rejects.toThrow("Non authentifié");
    });

    it("throws when comment not found", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { deleteComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(deleteComment("c1", "r1")).rejects.toThrow("introuvable");
    });

    it("throws when not comment author", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u2" }]];
      const { deleteComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(deleteComment("c1", "r1")).rejects.toThrow("Non autorisé");
    });

    it("deletes own comment", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ authorId: "u1" }]];
      const { deleteComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      const result = await deleteComment("c1", "r1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("likeComment", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { likeComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      await expect(likeComment("c1", "r1")).rejects.toThrow("Non authentifié");
    });

    it("likes a comment (not previously liked)", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]]; // no existing like
      const { likeComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      const result = await likeComment("c1", "r1");
      expect(result).toEqual({ success: true, liked: true });
    });

    it("unlikes a comment (previously liked)", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "like1" }]]; // existing like
      const { likeComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
      const result = await likeComment("c1", "r1");
      expect(result).toEqual({ success: true, liked: false });
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Resource actions (favorite, read, save)
// ═══════════════════════════════════════════════════════════════
describe("resource-actions.ts", () => {
  describe("toggleFavorite", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { toggleFavorite } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      await expect(toggleFavorite("r1")).rejects.toThrow("Non authentifié");
    });

    it("adds to favorites when not favorited", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { toggleFavorite } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleFavorite("r1");
      expect(result).toEqual({ success: true, isFavorite: true });
    });

    it("removes from favorites when favorited", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "fav1" }]];
      const { toggleFavorite } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleFavorite("r1");
      expect(result).toEqual({ success: true, isFavorite: false });
    });
  });

  describe("toggleRead", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { toggleRead } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      await expect(toggleRead("r1")).rejects.toThrow("Non authentifié");
    });

    it("marks as read when not read", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { toggleRead } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleRead("r1");
      expect(result).toEqual({ success: true, isRead: true });
    });

    it("unmarks as read when already read", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "read1" }]];
      const { toggleRead } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleRead("r1");
      expect(result).toEqual({ success: true, isRead: false });
    });
  });

  describe("toggleSaved", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { toggleSaved } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      await expect(toggleSaved("r1")).rejects.toThrow("Non authentifié");
    });

    it("saves when not saved", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { toggleSaved } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleSaved("r1");
      expect(result).toEqual({ success: true, isSaved: true });
    });

    it("removes from saved when already saved", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "saved1" }]];
      const { toggleSaved } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
      const result = await toggleSaved("r1");
      expect(result).toEqual({ success: true, isSaved: false });
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// Report actions
// ═══════════════════════════════════════════════════════════════
describe("report-actions.ts", () => {
  describe("submitReport", () => {
    it("throws when unauthenticated", async () => {
      mockGetServerSession.mockResolvedValue(null);
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam", resourceId: "r1" })).rejects.toThrow("Connectez-vous");
    });

    it("throws for invalid reason", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "notvalid" as any, resourceId: "r1" })).rejects.toThrow("Motif invalide");
    });

    it("throws when neither resourceId nor commentId provided", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam" })).rejects.toThrow("Préciser");
    });

    it("throws when both resourceId and commentId provided", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam", resourceId: "r1", commentId: "c1" })).rejects.toThrow("Préciser");
    });

    it("throws when resource not found", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam", resourceId: "r1" })).rejects.toThrow("introuvable");
    });

    it("throws when comment not found", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[]];
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam", commentId: "c1" })).rejects.toThrow("introuvable");
    });

    it("submits report for resource", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "r1" }]];
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "spam", resourceId: "r1", description: "Spam content" })).resolves.toBeUndefined();
    });

    it("submits report for comment", async () => {
      mockGetServerSession.mockResolvedValue(mockUserSession);
      qData = [[{ id: "c1" }]];
      const { submitReport } = await import("@/app/[locale]/(public)/ressource/[id]/report-actions");
      await expect(submitReport({ reason: "harassment", commentId: "c1" })).resolves.toBeUndefined();
    });
  });
});
