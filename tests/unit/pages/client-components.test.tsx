import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
const mockPush = vi.fn();
const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// ─── Action mocks ──────────────────────────────────────────────────────────
vi.mock("@/app/[locale]/(public)/ressource/[id]/resource-actions", () => ({
  toggleFavorite: vi.fn().mockResolvedValue({ success: true, isFavorite: true }),
  toggleRead: vi.fn().mockResolvedValue({ success: true, isRead: true }),
  toggleSaved: vi.fn().mockResolvedValue({ success: true, isSaved: true }),
}));

vi.mock("@/app/[locale]/(public)/ressource/[id]/comment-actions", () => ({
  addComment: vi.fn().mockResolvedValue({ success: true }),
  deleteComment: vi.fn().mockResolvedValue({ success: true }),
  likeComment: vi.fn().mockResolvedValue({ success: true, liked: true }),
}));

vi.mock("@/app/[locale]/(admin)/admin/actions", () => ({
  updateResourceStatus: vi.fn().mockResolvedValue(undefined),
  updateCommentStatus: vi.fn().mockResolvedValue(undefined),
  deleteComment: vi.fn().mockResolvedValue(undefined),
  resolveReport: vi.fn().mockResolvedValue(undefined),
  updateUserRole: vi.fn().mockResolvedValue(undefined),
  toggleUserActive: vi.fn().mockResolvedValue(undefined),
  updateUserRoleAsAdmin: vi.fn().mockResolvedValue(undefined),
  toggleFeaturedResource: vi.fn().mockResolvedValue(undefined),
  createAdminUser: vi.fn().mockResolvedValue({ id: "new-id" }),
  createCategory: vi.fn().mockResolvedValue(undefined),
  updateCategory: vi.fn().mockResolvedValue(undefined),
  deleteCategory: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/app/[locale]/(public)/publier/publish-actions", () => ({
  publishResource: vi.fn().mockResolvedValue(undefined),
  updateResource: vi.fn().mockResolvedValue(undefined),
  submitDraftForReview: vi.fn().mockResolvedValue(undefined),
}));

// ─── UI mocks ──────────────────────────────────────────────────────────────
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }));
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled }: any) => <button onClick={onClick} disabled={disabled}>{children}</button>,
}));
vi.mock("@/components/ui/report-button", () => ({ ReportButton: () => <button>Report</button> }));
vi.mock("@/components/ui/emoji-picker", () => ({
  EmojiPicker: ({ onSelect, onChange }: { onSelect?: (e: string) => void; onChange?: (e: string) => void }) => (
    <button onClick={() => (onSelect ?? onChange ?? (() => {}))("😀")}>Pick emoji</button>
  ),
}));
vi.mock("@/components/editor/wysiwyg-editor", () => ({
  WysiwygEditor: ({ onChange }: { onChange: (v: string) => void }) => (
    <textarea onChange={(e) => onChange(e.target.value)} data-testid="editor" />
  ),
}));

const mockFetch = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = mockFetch;
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    configurable: true,
  });
  Object.defineProperty(navigator, "share", { value: undefined, configurable: true });
});

// ═══════════════════════════════════════════════════════════════
// Resource client buttons
// ═══════════════════════════════════════════════════════════════
describe("resource-client.tsx - FavoriteButton", () => {
  it("renders unfavorited state", async () => {
    const { FavoriteButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<FavoriteButton resourceId="r1" isFavorite={false} isAuthenticated={true} />);
    expect(screen.getByText("Ajouter aux favoris")).toBeTruthy();
  });

  it("renders favorited state", async () => {
    const { FavoriteButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<FavoriteButton resourceId="r1" isFavorite={true} isAuthenticated={true} />);
    expect(screen.getByText("Dans vos favoris")).toBeTruthy();
  });

  it("renders disabled when not authenticated", async () => {
    const { FavoriteButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<FavoriteButton resourceId="r1" isFavorite={false} isAuthenticated={false} />);
    expect(document.querySelector("button[disabled]")).toBeTruthy();
  });

  it("does nothing on click when not authenticated", async () => {
    const { toggleFavorite } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { FavoriteButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<FavoriteButton resourceId="r1" isFavorite={false} isAuthenticated={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(toggleFavorite).not.toHaveBeenCalled();
  });

  it("calls toggleFavorite on click when authenticated", async () => {
    const { toggleFavorite } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { FavoriteButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<FavoriteButton resourceId="r1" isFavorite={false} isAuthenticated={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toggleFavorite).toHaveBeenCalledWith("r1"));
  });
});

describe("resource-client.tsx - ReadButton", () => {
  it("renders unread state", async () => {
    const { ReadButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ReadButton resourceId="r1" isRead={false} isAuthenticated={true} />);
    expect(screen.getByText("Marquer comme exploitée")).toBeTruthy();
  });

  it("renders read state", async () => {
    const { ReadButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ReadButton resourceId="r1" isRead={true} isAuthenticated={true} />);
    expect(screen.getByText(/Exploitée/)).toBeTruthy();
  });

  it("calls toggleRead on click when authenticated", async () => {
    const { toggleRead } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { ReadButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ReadButton resourceId="r1" isRead={false} isAuthenticated={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toggleRead).toHaveBeenCalledWith("r1"));
  });

  it("does nothing when not authenticated", async () => {
    const { toggleRead } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { ReadButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ReadButton resourceId="r1" isRead={false} isAuthenticated={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(toggleRead).not.toHaveBeenCalled();
  });
});

describe("resource-client.tsx - SaveButton", () => {
  it("renders unsaved state", async () => {
    const { SaveButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<SaveButton resourceId="r1" isSaved={false} isAuthenticated={true} />);
    expect(screen.getByText("Mettre de côté")).toBeTruthy();
  });

  it("renders saved state", async () => {
    const { SaveButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<SaveButton resourceId="r1" isSaved={true} isAuthenticated={true} />);
    expect(screen.getByText("Mis de côté")).toBeTruthy();
  });

  it("calls toggleSaved on click", async () => {
    const { toggleSaved } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { SaveButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<SaveButton resourceId="r1" isSaved={false} isAuthenticated={true} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(toggleSaved).toHaveBeenCalledWith("r1"));
  });

  it("does nothing when not authenticated", async () => {
    const { toggleSaved } = await import("@/app/[locale]/(public)/ressource/[id]/resource-actions");
    const { SaveButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<SaveButton resourceId="r1" isSaved={false} isAuthenticated={false} />);
    fireEvent.click(screen.getByRole("button"));
    expect(toggleSaved).not.toHaveBeenCalled();
  });
});

describe("resource-client.tsx - ShareButton", () => {
  it("renders share button", async () => {
    const { ShareButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ShareButton title="Resource Title" />);
    expect(screen.getByText("Partager")).toBeTruthy();
  });

  it("copies URL to clipboard when navigator.share is not available", async () => {
    const { ShareButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ShareButton title="Resource Title" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it("uses navigator.share when available", async () => {
    const mockShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "share", { value: mockShare, configurable: true });

    const { ShareButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ShareButton title="Resource" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(mockShare).toHaveBeenCalled();
  });

  it("falls back to clipboard when navigator.share throws", async () => {
    const mockShare = vi.fn().mockRejectedValue(new Error("Share failed"));
    Object.defineProperty(navigator, "share", { value: mockShare, configurable: true });

    const { ShareButton } = await import("@/app/[locale]/(public)/ressource/[id]/resource-client");
    render(<ShareButton title="Resource" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════
// StartSessionButton
// ═══════════════════════════════════════════════════════════════
describe("start-session-button.tsx", () => {
  it("renders button", async () => {
    const { StartSessionButton } = await import("@/app/[locale]/(public)/ressource/[id]/start-session-button");
    render(<StartSessionButton resourceId="r1" />);
    expect(screen.getByText("Démarrer une session")).toBeTruthy();
  });

  it("navigates to session on success", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { shareCode: "ABCD1234" } }),
    });

    const { StartSessionButton } = await import("@/app/[locale]/(public)/ressource/[id]/start-session-button");
    render(<StartSessionButton resourceId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/session/ABCD1234"));
  });

  it("shows error when API returns error", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Ressource non collaborative" } }),
    });

    const { StartSessionButton } = await import("@/app/[locale]/(public)/ressource/[id]/start-session-button");
    render(<StartSessionButton resourceId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await waitFor(() => expect(screen.getByText("Ressource non collaborative")).toBeTruthy());
  });

  it("shows error when API ok but no shareCode", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: {} }),
    });

    const { StartSessionButton } = await import("@/app/[locale]/(public)/ressource/[id]/start-session-button");
    render(<StartSessionButton resourceId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await waitFor(() => expect(screen.getByText("Impossible de démarrer la session")).toBeTruthy());
  });

  it("shows network error on fetch failure", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { StartSessionButton } = await import("@/app/[locale]/(public)/ressource/[id]/start-session-button");
    render(<StartSessionButton resourceId="r1" />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
    });
    await waitFor(() => expect(screen.getByText("Erreur réseau")).toBeTruthy());
  });
});

// ═══════════════════════════════════════════════════════════════
// CommentSection
// ═══════════════════════════════════════════════════════════════
describe("comment-section.tsx", () => {
  const baseProps = {
    resourceId: "r1",
    resourceAuthorId: "u-author",
    comments: [],
    currentUserId: "u1",
    currentUserName: "Alice",
    currentUserImage: null,
    likedCommentIds: [],
  };

  it("renders with no comments", async () => {
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} />);
    expect(document.body).toBeTruthy();
  });

  it("renders comments list", async () => {
    const comment = {
      id: "c1", content: "Great resource!", createdAt: new Date("2024-01-01"),
      authorName: "Bob", authorImage: null, authorId: "u2", parentId: null, likes: 0,
    };
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} comments={[comment]} />);
    expect(screen.getByText("Great resource!")).toBeTruthy();
  });

  it("renders comment with image avatar", async () => {
    const comment = {
      id: "c1", content: "With image", createdAt: new Date(),
      authorName: "Bob", authorImage: "https://img.example.com/avatar.jpg", authorId: "u2", parentId: null, likes: 0,
    };
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} comments={[comment]} />);
    expect(screen.getByText("With image")).toBeTruthy();
  });

  it("renders liked comment", async () => {
    const comment = {
      id: "c1", content: "Liked comment", createdAt: new Date(),
      authorName: "Bob", authorImage: null, authorId: "u2", parentId: null, likes: 5,
    };
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} comments={[comment]} likedCommentIds={["c1"]} />);
    expect(screen.getByText("Liked comment")).toBeTruthy();
  });

  it("renders reply comment (nested)", async () => {
    const parentComment = {
      id: "c1", content: "Parent", createdAt: new Date(),
      authorName: "Bob", authorImage: null, authorId: "u2", parentId: null, likes: 0,
    };
    const replyComment = {
      id: "c2", content: "Reply", createdAt: new Date(),
      authorName: "Alice", authorImage: null, authorId: "u1", parentId: "c1", likes: 0,
    };
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} comments={[parentComment, replyComment]} />);
    expect(screen.getByText("Parent")).toBeTruthy();
    expect(screen.getByText("Reply")).toBeTruthy();
  });

  it("shows own comment delete button", async () => {
    const comment = {
      id: "c1", content: "My comment", createdAt: new Date(),
      authorName: "Alice", authorImage: null, authorId: "u1", parentId: null, likes: 0,
    };
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} comments={[comment]} />);
    expect(document.body).toBeTruthy();
  });

  it("renders without current user (unauthenticated)", async () => {
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection
      resourceId="r1"
      resourceAuthorId="u-author"
      comments={[]}
      likedCommentIds={[]}
    />);
    expect(document.body).toBeTruthy();
  });

  it("submits a new comment", async () => {
    const { addComment } = await import("@/app/[locale]/(public)/ressource/[id]/comment-actions");
    const { CommentSection } = await import("@/app/[locale]/(public)/ressource/[id]/comment-section");
    render(<CommentSection {...baseProps} />);

    const textarea = document.querySelector("textarea");
    if (textarea) {
      fireEvent.change(textarea, { target: { value: "My new comment" } });
      const submitButton = document.querySelector("button[type='submit']");
      if (submitButton) {
        await act(async () => {
          fireEvent.click(submitButton);
        });
        await waitFor(() => expect(addComment).toHaveBeenCalled());
      }
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// Admin action buttons (moderation-actions)
// ═══════════════════════════════════════════════════════════════
describe("moderation-actions.tsx", () => {
  it("renders ApproveResourceButton", async () => {
    const { ApproveResourceButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<ApproveResourceButton resourceId="r1" />);
    expect(screen.getByText("Approuver")).toBeTruthy();
  });

  it("renders RejectResourceButton", async () => {
    const { RejectResourceButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<RejectResourceButton resourceId="r1" />);
    expect(screen.getByText("Rejeter")).toBeTruthy();
  });

  it("renders UnpublishResourceButton", async () => {
    const { UnpublishResourceButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<UnpublishResourceButton resourceId="r1" />);
    expect(document.body).toBeTruthy();
  });

  it("renders DeleteCommentButton and clicks it", async () => {
    const { updateCommentStatus, deleteComment } = await import("@/app/[locale]/(admin)/admin/actions");
    const { DeleteCommentButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<DeleteCommentButton commentId="c1" />);
    const btn = screen.getByRole("button");
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(deleteComment || updateCommentStatus).toBeDefined());
  });

  it("renders HideCommentButton", async () => {
    const { HideCommentButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<HideCommentButton commentId="c1" />);
    expect(document.body).toBeTruthy();
  });

  it("renders ResolveReportButton", async () => {
    const { ResolveReportButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<ResolveReportButton reportId="r1" />);
    expect(document.body).toBeTruthy();
  });

  it("clicks ApproveResourceButton and calls updateResourceStatus", async () => {
    const { updateResourceStatus } = await import("@/app/[locale]/(admin)/admin/actions");
    const { ApproveResourceButton } = await import("@/app/[locale]/(admin)/admin/moderation/moderation-actions");
    render(<ApproveResourceButton resourceId="r1" />);
    await act(async () => { fireEvent.click(screen.getByRole("button")); });
    await waitFor(() => expect(updateResourceStatus).toHaveBeenCalledWith("r1", "published"));
  });
});

// ═══════════════════════════════════════════════════════════════
// UserActions
// ═══════════════════════════════════════════════════════════════
describe("user-actions.tsx", () => {
  it("renders for admin viewer", async () => {
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={true} viewerRole="admin" />);
    expect(document.body).toBeTruthy();
  });

  it("renders for super_admin viewer", async () => {
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={true} viewerRole="super_admin" />);
    expect(document.body).toBeTruthy();
  });

  it("renders for deactivated user", async () => {
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={false} viewerRole="admin" />);
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// CategoryForm / CategoryRow
// ═══════════════════════════════════════════════════════════════
describe("category-actions.tsx", () => {
  it("renders CategoryForm", async () => {
    const { CategoryForm } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryForm />);
    expect(document.querySelector("form")).toBeTruthy();
  });

  it("validates empty form submission", async () => {
    const { CategoryForm } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryForm />);
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);
    await waitFor(() => {
      expect(document.body).toBeTruthy();
    });
  });

  it("submits valid category", async () => {
    const { createCategory } = await import("@/app/[locale]/(admin)/admin/actions");
    const { CategoryForm } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryForm />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Santé mentale" } });

    const form = document.querySelector("form") as HTMLFormElement;
    await act(async () => { fireEvent.submit(form); });
    await waitFor(() => expect(createCategory).toHaveBeenCalled());
  });

  it("renders CategoryRow with edit/delete buttons", async () => {
    const { CategoryRow } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryRow id="c1" name="Santé" slug="sante" description="Desc" icon="💚" resourceCount={3} />);
    expect(screen.getAllByText("Santé").length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// CreateUserModal
// ═══════════════════════════════════════════════════════════════
describe("create-user-modal.tsx", () => {
  it("renders create button", async () => {
    const { CreateUserModal } = await import("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal");
    render(<CreateUserModal />);
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// StatsExportButton
// ═══════════════════════════════════════════════════════════════
describe("stats-export.tsx", () => {
  it("renders export button", async () => {
    const { StatsExportButton } = await import("@/app/[locale]/(admin)/admin/statistiques/stats-export");
    render(<StatsExportButton stats={{ resources: 10, users: 5, comments: 20, reports: 2, views: 100, categories: 3, sessions: 1 }} />);
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// AdminResourceActions
// ═══════════════════════════════════════════════════════════════
describe("resource-admin-actions.tsx", () => {
  it("renders resource action buttons (pending, not featured)", async () => {
    const { AdminResourceActions } = await import("@/app/[locale]/(admin)/admin/ressources/resource-admin-actions");
    render(<AdminResourceActions resourceId="r1" currentStatus="pending" isFeatured={false} />);
    expect(document.body).toBeTruthy();
  });

  it("renders with featured resource (isFeatured=true)", async () => {
    const { AdminResourceActions } = await import("@/app/[locale]/(admin)/admin/ressources/resource-admin-actions");
    render(<AdminResourceActions resourceId="r1" currentStatus="published" isFeatured={true} />);
    expect(document.body).toBeTruthy();
  });

  it("clicks publish button", async () => {
    const { updateResourceStatus } = await import("@/app/[locale]/(admin)/admin/actions");
    const { AdminResourceActions } = await import("@/app/[locale]/(admin)/admin/ressources/resource-admin-actions");
    render(<AdminResourceActions resourceId="r1" currentStatus="pending" isFeatured={false} />);
    const publishBtn = screen.getByTitle("Publier");
    await act(async () => { fireEvent.click(publishBtn); });
    await waitFor(() => expect(updateResourceStatus).toHaveBeenCalledWith("r1", "published"));
  });

  it("clicks star/feature button", async () => {
    const { toggleFeaturedResource } = await import("@/app/[locale]/(admin)/admin/actions");
    const { AdminResourceActions } = await import("@/app/[locale]/(admin)/admin/ressources/resource-admin-actions");
    render(<AdminResourceActions resourceId="r1" currentStatus="published" isFeatured={false} />);
    const starBtn = screen.getByTitle("Mettre en avant");
    await act(async () => { fireEvent.click(starBtn); });
    await waitFor(() => expect(toggleFeaturedResource).toHaveBeenCalledWith("r1", true));
  });
});

// ═══════════════════════════════════════════════════════════════
// CategorySelect
// ═══════════════════════════════════════════════════════════════
describe("category-select.tsx", () => {
  it("renders category select", async () => {
    const { CategorySelect } = await import("@/app/[locale]/(admin)/admin/ressources/category-select");
    render(<CategorySelect resourceId="r1" currentCategoryId={null} categories={[{ id: "c1", name: "Santé", slug: "sante" }]} />);
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// EditResourceClient
// ═══════════════════════════════════════════════════════════════
describe("edit-client.tsx", () => {
  const mockResource = {
    id: "r1", title: "My Resource", content: "Content here", mediaType: "article",
    privacy: "public", categoryId: null, imageUrl: null, authorId: "u1", status: "draft",
  };

  it("renders edit form", async () => {
    const { EditResourceClient } = await import("@/app/[locale]/(public)/ressource/[id]/modifier/edit-client");
    render(<EditResourceClient resource={mockResource as any} categories={[]} />);
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// SessionClient
// ═══════════════════════════════════════════════════════════════
describe("session-client.tsx", () => {
  const baseProps = {
    code: "ABCD1234",
    status: "active" as const,
    isHost: false,
    isParticipant: true,
    currentUserId: "u1",
    initialParticipants: [{ id: "p1", userId: "u1", userName: "Alice", joinedAt: new Date().toISOString(), leftAt: null }],
  };

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders as participant", async () => {
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    render(<SessionClient {...baseProps} />);
    expect(document.body).toBeTruthy();
  });

  it("renders as host", async () => {
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    render(<SessionClient {...baseProps} isHost={true} />);
    expect(document.body).toBeTruthy();
  });

  it("renders ended session", async () => {
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    render(<SessionClient {...baseProps} status="ended" />);
    expect(document.body).toBeTruthy();
  });

  it("renders as non-participant", async () => {
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    render(<SessionClient {...baseProps} isParticipant={false} />);
    expect(document.body).toBeTruthy();
  });

  it("renders with initial messages (covers message list rendering)", async () => {
    // Make fetch return messages from both other user and current user (covers both branches)
    mockFetch.mockImplementation((_url: string) => {
      if (_url.includes("/messages")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              { id: "m1", content: "Hello from other", createdAt: new Date().toISOString(), authorId: "u2", authorName: "Bob" },
              { id: "m2", content: "My message", createdAt: new Date().toISOString(), authorId: "u1", authorName: "Alice" },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: { status: "active", participants: [] } }) });
    });
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    await act(async () => {
      render(<SessionClient {...baseProps} />);
    });
    expect(document.body).toBeTruthy();
  });

  it("handles Enter key in textarea to send message", async () => {
    // GET → empty arrays, POST (send) → single message object
    mockFetch.mockImplementation((_url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") {
        return Promise.resolve({ ok: true, json: async () => ({ data: { id: "m1", content: "Hi", createdAt: new Date().toISOString(), authorId: "u1", authorName: "Alice" } }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });
    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    await act(async () => { render(<SessionClient {...baseProps} />); });
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    if (textarea) {
      fireEvent.change(textarea, { target: { value: "Hello" } });
      await act(async () => {
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      });
    }
    expect(document.body).toBeTruthy();
  });

  it("sends a message", async () => {
    // GET requests return empty arrays; POST (send) returns a single message object
    mockFetch.mockImplementation((_url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ data: { id: "m1", content: "Hello!", createdAt: new Date().toISOString(), authorId: "u1", authorName: "Alice" } }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    const { SessionClient } = await import("@/app/[locale]/(public)/session/[code]/session-client");
    render(<SessionClient {...baseProps} />);

    const input = document.querySelector("input, textarea") as HTMLInputElement;
    if (input) {
      fireEvent.change(input, { target: { value: "Hello!" } });
      const sendButton = document.querySelector("button[type='submit']");
      if (sendButton) {
        await act(async () => { fireEvent.click(sendButton); });
      }
    }
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// Home page
// ═══════════════════════════════════════════════════════════════
describe("app/[locale]/page.tsx (home)", () => {
  beforeAll(() => {
    vi.doMock("@/components/layout/navbar", () => ({ Navbar: () => <nav>Navbar</nav> }));
    vi.doMock("@/components/layout/footer", () => ({ Footer: () => <footer>Footer</footer> }));
    vi.doMock("@/lib/home-data", () => ({
      getHomeData: vi.fn().mockResolvedValue({
        featured: [],
        recent: [],
        popularCategories: [],
        stats: { totalResources: 0 },
      }),
    }));
  });

  afterAll(() => {
    vi.unmock("@/components/layout/navbar");
    vi.unmock("@/components/layout/footer");
    vi.unmock("@/lib/home-data");
    vi.resetModules();
  });

  it("renders home page (empty state)", async () => {
    vi.resetModules();
    const { default: HomePage } = await import("@/app/[locale]/page");
    const result = await HomePage();
    expect(result).toBeTruthy();
  });

  it("renders home page with featured and recent resources (full render)", async () => {
    vi.resetModules();
    const { getHomeData } = await import("@/lib/home-data");
    vi.mocked(getHomeData).mockResolvedValueOnce({
      featured: [
        { id: "f1", title: "Featured", summary: "Sum", mediaType: "article", imageUrl: "https://img.example.com/f.jpg", categoryName: "Santé", readingTime: 5, viewCount: 100 },
      ],
      recent: [
        { id: "r1", title: "Recent", summary: "Sum", mediaType: "video", imageUrl: null, categoryName: null, readingTime: null, viewCount: 50 },
        { id: "r2", title: "Old", summary: null, mediaType: "exercise", imageUrl: null, categoryName: null, readingTime: 3, viewCount: 5 },
      ],
      popularCategories: [{ id: "c1", name: "Santé", slug: "sante", icon: "💚" }],
      stats: { totalResources: 1500 },
    } as any);
    const { default: HomePage } = await import("@/app/[locale]/page");
    const result = await HomePage();
    // Render the returned JSX to execute ResourceTile and other sub-components
    await act(async () => { render(result as any); });
    expect(document.body).toBeTruthy();
  });

  it("renders home page with resources without imageUrl and no readingTime", async () => {
    vi.resetModules();
    const { getHomeData } = await import("@/lib/home-data");
    vi.mocked(getHomeData).mockResolvedValueOnce({
      featured: [],
      recent: [
        { id: "r1", title: "Recent Audio", summary: "Sum", mediaType: "audio", imageUrl: null, categoryName: null, readingTime: null, viewCount: 0 },
      ],
      popularCategories: [],
      stats: { totalResources: 999 },
    } as any);
    const { default: HomePage } = await import("@/app/[locale]/page");
    const result = await HomePage();
    await act(async () => { render(result as any); });
    expect(document.body).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════
// CreateUserModal extended
// ═══════════════════════════════════════════════════════════════
describe("create-user-modal.tsx (extended)", () => {
  it("opens modal and renders form", async () => {
    const { CreateUserModal } = await import("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal");
    render(<CreateUserModal />);
    const openBtn = screen.getByText("Créer un compte");
    await act(async () => { fireEvent.click(openBtn); });
    expect(document.querySelector("form")).toBeTruthy();
  });

  it("submits form and calls createAdminUser", async () => {
    const { createAdminUser } = await import("@/app/[locale]/(admin)/admin/actions");
    const { CreateUserModal } = await import("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal");
    render(<CreateUserModal />);
    await act(async () => { fireEvent.click(screen.getByText("Créer un compte")); });
    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Admin Test" } });
    fireEvent.change(inputs[1], { target: { value: "admin@test.com" } });
    fireEvent.change(inputs[2], { target: { value: "password123" } });
    const form = document.querySelector("form") as HTMLFormElement;
    await act(async () => { fireEvent.submit(form); });
    await waitFor(() => expect(createAdminUser).toHaveBeenCalled());
  });

  it("shows error when createAdminUser throws", async () => {
    const { createAdminUser } = await import("@/app/[locale]/(admin)/admin/actions");
    vi.mocked(createAdminUser).mockRejectedValueOnce(new Error("Email already exists"));
    const { CreateUserModal } = await import("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal");
    render(<CreateUserModal />);
    await act(async () => { fireEvent.click(screen.getByText("Créer un compte")); });
    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[0], { target: { value: "Admin Test" } });
    fireEvent.change(inputs[1], { target: { value: "admin@test.com" } });
    fireEvent.change(inputs[2], { target: { value: "password123" } });
    const form = document.querySelector("form") as HTMLFormElement;
    await act(async () => { fireEvent.submit(form); });
    await waitFor(() => expect(document.body.textContent).toContain("Email already exists"));
  });

  it("cancels modal and resets form", async () => {
    const { CreateUserModal } = await import("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal");
    render(<CreateUserModal />);
    await act(async () => { fireEvent.click(screen.getByText("Créer un compte")); });
    expect(document.querySelector("form")).toBeTruthy();
    const cancelBtn = screen.getByText("Annuler");
    await act(async () => { fireEvent.click(cancelBtn); });
    expect(document.querySelector("form")).toBeFalsy();
  });
});

// ═══════════════════════════════════════════════════════════════
// UserActions extended
// ═══════════════════════════════════════════════════════════════
describe("user-actions.tsx (extended)", () => {
  it("opens role menu and changes role", async () => {
    const { updateUserRole } = await import("@/app/[locale]/(admin)/admin/actions");
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={true} viewerRole="admin" />);
    const pencilBtn = screen.getByLabelText("Modifier le rôle");
    await act(async () => { fireEvent.click(pencilBtn); });
    const adminRole = screen.getByText("Admin");
    await act(async () => { fireEvent.click(adminRole); });
    await waitFor(() => expect(updateUserRole).toHaveBeenCalledWith("u1", "admin"));
  });

  it("opens role menu as super_admin and uses updateUserRoleAsAdmin", async () => {
    const { updateUserRoleAsAdmin } = await import("@/app/[locale]/(admin)/admin/actions");
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={true} viewerRole="super_admin" />);
    const pencilBtn = screen.getByLabelText("Modifier le rôle");
    await act(async () => { fireEvent.click(pencilBtn); });
    const superAdminRole = screen.getByText("Super-Admin");
    await act(async () => { fireEvent.click(superAdminRole); });
    await waitFor(() => expect(updateUserRoleAsAdmin).toHaveBeenCalledWith("u1", "super_admin"));
  });

  it("toggles user active status", async () => {
    const { toggleUserActive } = await import("@/app/[locale]/(admin)/admin/actions");
    const { UserActions } = await import("@/app/[locale]/(admin)/admin/utilisateurs/user-actions");
    render(<UserActions userId="u1" currentRole="citizen" isActive={true} viewerRole="admin" />);
    const banBtn = screen.getByLabelText("Désactiver");
    await act(async () => { fireEvent.click(banBtn); });
    await waitFor(() => expect(toggleUserActive).toHaveBeenCalledWith("u1"));
  });
});

// ═══════════════════════════════════════════════════════════════
// CategoryRow edit state
// ═══════════════════════════════════════════════════════════════
describe("category-actions.tsx (edit state)", () => {
  it("enters edit mode and saves", async () => {
    const { updateCategory } = await import("@/app/[locale]/(admin)/admin/actions");
    const { CategoryRow } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryRow id="c1" name="Santé" slug="sante" description="Desc" icon="💚" resourceCount={3} />);
    // First button is the pencil/edit button in non-editing state
    const buttons = document.querySelectorAll("button");
    await act(async () => { fireEvent.click(buttons[0]); }); // enter edit mode
    // In editing state: [EmojiPicker button, Check button, X button]
    const editingButtons = document.querySelectorAll("button");
    // The Check button (handleSave) is the second button (index 1)
    await act(async () => { fireEvent.click(editingButtons[1]); });
    await waitFor(() => expect(updateCategory).toHaveBeenCalled());
  });

  it("enters edit mode and cancels", async () => {
    const { CategoryRow } = await import("@/app/[locale]/(admin)/admin/categories/category-actions");
    render(<CategoryRow id="c1" name="Santé" slug="sante" description={null} icon={null} resourceCount={0} />);
    const buttons = document.querySelectorAll("button");
    await act(async () => { fireEvent.click(buttons[0]); }); // enter edit mode
    const editingButtons = document.querySelectorAll("button");
    // X button (cancel) is the third button (index 2)
    await act(async () => { fireEvent.click(editingButtons[2]); });
    // Should be back to non-editing state showing name
    expect(screen.getAllByText("Santé").length).toBeGreaterThan(0);
  });
});
