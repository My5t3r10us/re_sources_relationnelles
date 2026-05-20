import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw Object.assign(new Error(`REDIRECT:${url}`), { digest: "NEXT_REDIRECT" }); }),
  notFound: vi.fn(() => { throw Object.assign(new Error("NOT_FOUND"), { digest: "NEXT_NOT_FOUND" }); }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
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
  uploadObject: vi.fn().mockResolvedValue(undefined),
  deleteObject: vi.fn().mockResolvedValue(undefined),
  getPublicUrl: vi.fn().mockReturnValue("https://cdn.example.com/file.jpg"),
  getObjectKeyFromUrl: vi.fn().mockReturnValue("file.jpg"),
}));

// ─── Component mocks ───────────────────────────────────────────────────────
vi.mock("@/components/markdown/markdown-renderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div>{content}</div>,
}));
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/components/ui/report-button", () => ({
  ReportButton: () => <button>Report</button>,
}));
vi.mock("@/app/[locale]/(public)/ressource/[id]/comment-section", () => ({
  CommentSection: () => <div>Comments</div>,
}));
vi.mock("@/app/[locale]/(public)/ressource/[id]/resource-client", () => ({
  FavoriteButton: () => <button>Fav</button>,
  ReadButton: () => <button>Read</button>,
  SaveButton: () => <button>Save</button>,
  ShareButton: () => <button>Share</button>,
}));
vi.mock("@/app/[locale]/(public)/ressource/[id]/start-session-button", () => ({
  StartSessionButton: () => <button>Session</button>,
}));
vi.mock("@/app/[locale]/(public)/ressource/[id]/modifier/edit-client", () => ({
  EditResourceClient: ({ resource }: any) => <div>Edit {resource.title}</div>,
}));

const mockResource = {
  id: "r1", title: "Test Resource", content: "Content", summary: "Summary",
  mediaType: "article", privacy: "public", status: "published",
  imageUrl: null, readingTime: 3, viewCount: 10,
  createdAt: new Date("2024-01-01"),
  authorName: "Alice", authorImage: null, authorId: "u1",
  categoryName: "Santé", categorySlug: "sante",
};

const mockSession = { user: { id: "u1", name: "Alice" } };

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue(null);
});

// ─── Resource detail page ───────────────────────────────────────────────────
describe("app/[locale]/(public)/ressource/[id]/page.tsx", () => {
  it("calls notFound when resource does not exist", async () => {
    qData = [[]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    await expect(Page({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("renders public resource for anonymous user", async () => {
    // resource, comments
    qData = [[mockResource], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("calls notFound for private resource accessed by non-author", async () => {
    const privateRes = { ...mockResource, privacy: "private", authorId: "u2" };
    mockGetServerSession.mockResolvedValue({ user: { id: "u1" } });
    qData = [[privateRes]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    await expect(Page({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("renders private resource for owner", async () => {
    const privateRes = { ...mockResource, privacy: "private", authorId: "u1" };
    mockGetServerSession.mockResolvedValue(mockSession);
    // resource, comments, liked, fav, saved, read
    qData = [[privateRes], [], [], [], [], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders with logged-in user and user data (fav, saved, read)", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    qData = [
      [mockResource],
      [{ id: "c1", content: "Comment", createdAt: new Date(), authorName: "Bob", authorImage: null, authorId: "u2", parentId: null, likes: 0 }],
      [{ commentId: "c1" }],
      [{ id: "fav1" }],
      [{ id: "saved1" }],
      [{ id: "read1" }],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders collaborative resource (exercise)", async () => {
    const exerciseRes = { ...mockResource, mediaType: "exercise" };
    qData = [[exerciseRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders video resource with URL content", async () => {
    const videoRes = { ...mockResource, mediaType: "video", content: "https://www.youtube.com/watch?v=abc123" };
    qData = [[videoRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders video resource with non-URL content (markdown)", async () => {
    const videoRes = { ...mockResource, mediaType: "video", content: "# Video description" };
    qData = [[videoRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders audio resource with URL content", async () => {
    const audioRes = { ...mockResource, mediaType: "audio", content: "https://example.com/audio.mp3" };
    qData = [[audioRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders pdf resource with URL content", async () => {
    const pdfRes = { ...mockResource, mediaType: "pdf", content: "https://example.com/doc.pdf" };
    qData = [[pdfRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders exercise with logged-in user (collaborative CTA visible)", async () => {
    const exerciseRes = { ...mockResource, mediaType: "exercise", status: "published" };
    mockGetServerSession.mockResolvedValue(mockSession);
    // resource, comments, liked, fav, saved, read
    qData = [[exerciseRes], [], [], [], [], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });

  it("renders video with youtu.be URL", async () => {
    const videoRes = { ...mockResource, mediaType: "video", content: "https://youtu.be/abc123" };
    qData = [[videoRes], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });
});

// ─── Modifier page ──────────────────────────────────────────────────────────
describe("app/[locale]/(public)/ressource/[id]/modifier/page.tsx", () => {
  it("redirects unauthenticated user", async () => {
    mockGetServerSession.mockResolvedValue(null);
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/modifier/page");
    await expect(Page({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("REDIRECT");
  });

  it("calls notFound when resource does not exist", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    qData = [[]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/modifier/page");
    await expect(Page({ params: Promise.resolve({ id: "missing" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("redirects to resource page when user is not author", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    qData = [[{ ...mockResource, authorId: "u2" }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/modifier/page");
    await expect(Page({ params: Promise.resolve({ id: "r1" }) })).rejects.toThrow("REDIRECT");
  });

  it("renders edit form for resource author", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    // resource lookup, categories
    qData = [[{ id: "r1", title: "Resource", content: "Content", mediaType: "article", privacy: "public", categoryId: null, imageUrl: null, authorId: "u1", status: "published" }], []];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/ressource/[id]/modifier/page");
    const result = await Page({ params: Promise.resolve({ id: "r1" }) });
    expect(result).toBeTruthy();
  });
});

// ─── Session page ───────────────────────────────────────────────────────────
describe("app/[locale]/(public)/session/[code]/page.tsx", () => {
  it("redirects unauthenticated user", async () => {
    mockGetServerSession.mockResolvedValue(null);
    vi.resetModules();

    vi.mock("@/app/[locale]/(public)/session/[code]/session-client", () => ({
      SessionClient: () => <div>Session</div>,
    }));

    const { default: Page } = await import("@/app/[locale]/(public)/session/[code]/page");
    await expect(Page({ params: Promise.resolve({ code: "ABCD1234" }) })).rejects.toThrow("REDIRECT");
  });

  it("calls notFound for unknown session code", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    qData = [[]];
    vi.resetModules();

    vi.mock("@/app/[locale]/(public)/session/[code]/session-client", () => ({
      SessionClient: () => <div>Session</div>,
    }));

    const { default: Page } = await import("@/app/[locale]/(public)/session/[code]/page");
    await expect(Page({ params: Promise.resolve({ code: "UNKNOWN1" }) })).rejects.toThrow("NOT_FOUND");
  });

  it("renders session page for participant", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const sess = {
      id: "s1", shareCode: "ABCD1234", status: "active", startedAt: new Date(),
      endedAt: null, hostId: "u1", hostName: "Alice",
      resourceId: "r1", resourceTitle: "Resource", resourceMediaType: "exercise",
    };
    const participant = { id: "p1", userId: "u1", userName: "Alice", joinedAt: new Date() };
    qData = [[sess], [participant]];
    vi.resetModules();

    vi.mock("@/app/[locale]/(public)/session/[code]/session-client", () => ({
      SessionClient: ({ code }: any) => <div>Session {code}</div>,
    }));

    const { default: Page } = await import("@/app/[locale]/(public)/session/[code]/page");
    const result = await Page({ params: Promise.resolve({ code: "ABCD1234" }) });
    expect(result).toBeTruthy();
  });

  it("renders ended session", async () => {
    mockGetServerSession.mockResolvedValue(mockSession);
    const sess = {
      id: "s1", shareCode: "ABCD1234", status: "ended", startedAt: new Date(),
      endedAt: new Date(), hostId: "u2", hostName: "Bob",
      resourceId: "r1", resourceTitle: "Resource", resourceMediaType: "protocol",
    };
    qData = [[sess], []];
    vi.resetModules();

    vi.mock("@/app/[locale]/(public)/session/[code]/session-client", () => ({
      SessionClient: () => <div>Ended</div>,
    }));

    const { default: Page } = await import("@/app/[locale]/(public)/session/[code]/page");
    const result = await Page({ params: Promise.resolve({ code: "ABCD1234" }) });
    expect(result).toBeTruthy();
  });
});
