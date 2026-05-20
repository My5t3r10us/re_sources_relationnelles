import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw Object.assign(new Error(`REDIRECT:${url}`), { digest: "NEXT_REDIRECT" }); }),
  notFound: vi.fn(() => { throw Object.assign(new Error("NOT_FOUND"), { digest: "NEXT_NOT_FOUND" }); }),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
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
    selectDistinct: vi.fn(() => makeChain(qData[qIdx++] ?? [])),
    insert: vi.fn(() => makeChain([])),
    update: vi.fn(() => makeChain([])),
    delete: vi.fn(() => makeChain([])),
  },
}));

// ─── S3 mock ───────────────────────────────────────────────────────────────
vi.mock("@/lib/s3", () => ({
  uploadObject: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getPublicUrl: vi.fn().mockReturnValue("https://cdn.example.com/file.jpg"),
  getObjectKeyFromUrl: vi.fn().mockReturnValue("file.jpg"),
}));

// ─── UI component mocks ────────────────────────────────────────────────────
vi.mock("@/components/ui/badge", () => ({ Badge: ({ children }: any) => <span>{children}</span> }));
vi.mock("@/components/ui/button", () => ({ Button: ({ children }: any) => <button>{children}</button> }));
vi.mock("@/components/ui/card", () => ({ Card: ({ children }: any) => <div>{children}</div> }));

// ─── Admin action component mocks ──────────────────────────────────────────
vi.mock("@/app/[locale]/(admin)/admin/categories/category-actions", () => ({
  CategoryForm: () => <form>Category form</form>,
  CategoryRow: ({ category }: any) => <div>{category.name}</div>,
}));
vi.mock("@/app/[locale]/(admin)/admin/moderation/moderation-actions", () => ({
  ApproveResourceButton: () => <button>Approve</button>,
  RejectResourceButton: () => <button>Reject</button>,
  UnpublishResourceButton: () => <button>Unpublish</button>,
  DeleteCommentButton: () => <button>Delete</button>,
  HideCommentButton: () => <button>Hide</button>,
  ResolveReportButton: () => <button>Resolve</button>,
}));
vi.mock("@/app/[locale]/(admin)/admin/ressources/resource-admin-actions", () => ({
  AdminResourceActions: () => <div>Actions</div>,
}));
vi.mock("@/app/[locale]/(admin)/admin/ressources/category-select", () => ({
  CategorySelect: () => <select />,
}));
vi.mock("@/app/[locale]/(admin)/admin/utilisateurs/user-actions", () => ({
  UserActions: () => <div>User actions</div>,
}));
vi.mock("@/app/[locale]/(admin)/admin/utilisateurs/create-user-modal", () => ({
  CreateUserModal: () => <div>Create modal</div>,
}));
vi.mock("@/app/[locale]/(admin)/admin/statistiques/stats-export", () => ({
  StatsExportButton: () => <button>Export</button>,
}));

const mockAdminSession = { user: { id: "admin1", name: "Admin User" } };

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue(mockAdminSession);
});

// ─── Categories admin page ──────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/categories/page.tsx", () => {
  it("renders with empty categories", async () => {
    qData = [[]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/categories/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it("renders with categories", async () => {
    qData = [[{ id: "c1", name: "Santé", slug: "sante", description: "Desc", icon: "💚", createdAt: new Date(), resourceCount: 5 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/categories/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });
});

// ─── Moderation admin page ──────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/moderation/page.tsx", () => {
  it("renders with empty pending resources", async () => {
    // pendingResources, flaggedResources, flaggedComments, [{pendingCount}], [{flaggedCount}]
    qData = [[], [], [], [{ pendingCount: 0 }], [{ flaggedCount: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/moderation/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it("renders with pending resources and comments", async () => {
    const res = {
      id: "r1", title: "Resource", summary: null, createdAt: new Date(),
      authorName: "Alice", authorId: "u1", categoryName: "Santé", mediaType: "article",
    };
    const com = {
      id: "c1", content: "Comment", createdAt: new Date(), authorName: "Bob",
      resourceTitle: "Resource", resourceId: "r1",
    };
    // pendingResources, flaggedResources, flaggedComments, [{pendingCount}], [{flaggedCount}]
    qData = [[res], [], [com], [{ pendingCount: 1 }], [{ flaggedCount: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/moderation/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });
});

// ─── Resources admin page ───────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/ressources/page.tsx", () => {
  it("renders with empty resources", async () => {
    qData = [[], [{ total: 0 }], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/ressources/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with status filter", async () => {
    qData = [
      [{ id: "r1", title: "Resource", status: "published", mediaType: "article", createdAt: new Date(), authorName: "Alice", categoryName: null, featured: false }],
      [{ total: 1 }],
      [{ id: "c1", name: "Cat", slug: "cat" }],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/ressources/page");
    const result = await Page({ searchParams: Promise.resolve({ status: "published" }) });
    expect(result).toBeTruthy();
  });
});

// ─── Signalements admin page ────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/signalements/page.tsx", () => {
  it("renders with empty reports", async () => {
    // rows, [{total}], [{unresolvedTotal}], [{resolvedTotal}], [{globalTotal}]
    qData = [[], [{ total: 0 }], [{ unresolvedTotal: 0 }], [{ resolvedTotal: 0 }], [{ globalTotal: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/signalements/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with reports", async () => {
    const rep = {
      id: "r1", reason: "spam", description: null, resolved: false, createdAt: new Date(),
      reporterName: "Alice", reporterEmail: "alice@test.com",
      resourceId: "res1", resourceTitle: "Resource",
      commentId: null, commentContent: null,
    };
    // rows, [{total}], [{unresolvedTotal}], [{resolvedTotal}], [{globalTotal}]
    qData = [[rep], [{ total: 1 }], [{ unresolvedTotal: 1 }], [{ resolvedTotal: 0 }], [{ globalTotal: 1 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/signalements/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });
});

// ─── Statistiques admin page ────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/statistiques/page.tsx", () => {
  it("renders with default period (all time)", async () => {
    // 8 scalar queries + categoryStats, roleStats, mediaTypeStats, allCategories, allRegions (selectDistinct)
    qData = [
      [{ totalUsers: 10 }],
      [{ totalResources: 8 }],
      [{ totalViews: 100 }],
      [{ pendingResources: 2 }],
      [{ publishedResources: 6 }],
      [{ totalReports: 3 }],
      [{ unresolvedReports: 1 }],
      [{ totalComments: 20 }],
      [], // categoryStats
      [], // roleStats
      [], // mediaTypeStats
      [], // allCategories
      [], // allRegions (selectDistinct)
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/statistiques/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with period=7d filter", async () => {
    qData = [
      [{ totalUsers: 5 }],
      [{ totalResources: 3 }],
      [{ totalViews: 50 }],
      [{ pendingResources: 1 }],
      [{ publishedResources: 2 }],
      [{ totalReports: 1 }],
      [{ unresolvedReports: 0 }],
      [{ totalComments: 10 }],
      [], [], [], [], [],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/statistiques/page");
    const result = await Page({ searchParams: Promise.resolve({ period: "7d" }) });
    expect(result).toBeTruthy();
  });
});

// ─── Utilisateurs admin page ────────────────────────────────────────────────
describe("app/[locale]/(admin)/admin/utilisateurs/page.tsx", () => {
  it("renders with empty users list", async () => {
    mockGetServerSession.mockResolvedValue(mockAdminSession);
    // viewer role lookup, users list, total count
    qData = [[{ role: "admin" }], [], [{ total: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/utilisateurs/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with users", async () => {
    mockGetServerSession.mockResolvedValue(mockAdminSession);
    const u = { id: "u1", name: "Alice", email: "alice@test.com", role: "citizen", active: true, createdAt: new Date() };
    // viewer role lookup, users list, total count
    qData = [[{ role: "admin" }], [u], [{ total: 1 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/utilisateurs/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with role and search filter", async () => {
    mockGetServerSession.mockResolvedValue(mockAdminSession);
    qData = [[{ role: "admin" }], [], [{ total: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(admin)/admin/utilisateurs/page");
    const result = await Page({ searchParams: Promise.resolve({ role: "admin", q: "alice" }) });
    expect(result).toBeTruthy();
  });
});
