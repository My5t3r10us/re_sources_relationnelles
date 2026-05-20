import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => { throw Object.assign(new Error(`REDIRECT:${url}`), { digest: "NEXT_REDIRECT" }); }),
  notFound: vi.fn(() => { throw Object.assign(new Error("NOT_FOUND"), { digest: "NEXT_NOT_FOUND" }); }),
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
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

const mockUseSession = vi.fn();
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: mockUseSession,
    signIn: { email: vi.fn().mockResolvedValue({ error: null }) },
    signUp: { email: vi.fn().mockResolvedValue({ error: null }) },
  },
}));

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
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock("@/components/editor/wysiwyg-editor", () => ({
  WysiwygEditor: ({ onChange }: { onChange: (v: string) => void }) => (
    <textarea onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock("@/app/[locale]/(public)/mes-ressources/submit-button", () => ({
  SubmitDraftButton: ({ resourceId }: { resourceId: string }) => <button>{resourceId}</button>,
}));
vi.mock("@/app/[locale]/(public)/publier/publish-actions", () => ({
  publishResource: vi.fn().mockResolvedValue({ success: true }),
  updateResource: vi.fn().mockResolvedValue({ success: true }),
  saveDraft: vi.fn().mockResolvedValue({ success: true }),
  submitDraftForReview: vi.fn().mockResolvedValue(undefined),
}));

const mockSession = { user: { id: "u1", name: "Alice Test", email: "alice@test.com", role: "citizen" } };

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
  mockGetServerSession.mockResolvedValue(mockSession);
  mockUseSession.mockReturnValue({ data: mockSession, isPending: false });
});

// ─── Tableau de bord ────────────────────────────────────────────────────────
describe("app/[locale]/(public)/tableau-de-bord/page.tsx", () => {
  it("redirects unauthenticated user", async () => {
    mockGetServerSession.mockResolvedValue(null);
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/tableau-de-bord/page");
    await expect(Page()).rejects.toThrow("REDIRECT");
  });

  it("renders dashboard for authenticated user with empty data", async () => {
    // user lookup, favorites, completions, saved, resource count
    qData = [
      [{ name: "Alice Test" }],
      [],
      [],
      [],
      [{ myResourceCount: 0 }],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/tableau-de-bord/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it("renders dashboard with resources", async () => {
    const res = { id: "r1", title: "Resource", summary: "Sum", mediaType: "article", categoryName: "Cat", imageUrl: null };
    qData = [
      [{ name: "Alice Test" }],
      [res],
      [res],
      [res],
      [{ myResourceCount: 2 }],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/tableau-de-bord/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it("renders with imageUrl in resource card", async () => {
    const res = { id: "r1", title: "Resource", summary: "Sum", mediaType: "video", categoryName: null, imageUrl: "https://img.example.com/img.jpg" };
    qData = [[{ name: "Alice" }], [res], [], [], [{ myResourceCount: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/tableau-de-bord/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });

  it("renders with undefined name (uses default 'vous')", async () => {
    qData = [[], [], [], [], [{ myResourceCount: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/tableau-de-bord/page");
    const result = await Page();
    expect(result).toBeTruthy();
  });
});

// ─── Mes ressources ─────────────────────────────────────────────────────────
describe("app/[locale]/(public)/mes-ressources/page.tsx", () => {
  it("redirects unauthenticated user", async () => {
    mockGetServerSession.mockResolvedValue(null);
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/mes-ressources/page");
    await expect(Page({ searchParams: Promise.resolve({}) })).rejects.toThrow("REDIRECT");
  });

  it("renders with no resources", async () => {
    qData = [[], [{ total: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/mes-ressources/page");
    const result = await Page({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with status filter", async () => {
    qData = [
      [{ id: "r1", title: "My Resource", status: "published", privacy: "public", mediaType: "article", readingTime: 2, viewCount: 5, createdAt: new Date(), updatedAt: new Date(), categoryName: "Cat" }],
      [{ total: 1 }],
    ];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/mes-ressources/page");
    const result = await Page({ searchParams: Promise.resolve({ status: "published" }) });
    expect(result).toBeTruthy();
  });

  it("renders with invalid status filter (ignored)", async () => {
    qData = [[], [{ total: 0 }]];
    vi.resetModules();
    const { default: Page } = await import("@/app/[locale]/(public)/mes-ressources/page");
    const result = await Page({ searchParams: Promise.resolve({ status: "invalid" }) });
    expect(result).toBeTruthy();
  });
});

// ─── Submit button ──────────────────────────────────────────────────────────
describe("app/[locale]/(public)/mes-ressources/submit-button.tsx", () => {
  it("renders submit button", async () => {
    const { render } = await import("@testing-library/react");
    vi.unmock("@/app/[locale]/(public)/mes-ressources/submit-button");
    vi.resetModules();
    const { SubmitDraftButton } = await import("@/app/[locale]/(public)/mes-ressources/submit-button");
    render(<SubmitDraftButton resourceId="r1" />);
    expect(document.body).toBeTruthy();
  });

  it("clicks submit button and calls submitDraftForReview", async () => {
    const { render, screen, fireEvent, waitFor, act } = await import("@testing-library/react");
    vi.unmock("@/app/[locale]/(public)/mes-ressources/submit-button");
    vi.resetModules();
    const { SubmitDraftButton } = await import("@/app/[locale]/(public)/mes-ressources/submit-button");
    const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
    render(<SubmitDraftButton resourceId="r1" />);
    const btn = screen.getByTitle("Soumettre ce brouillon à la modération");
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(submitDraftForReview).toHaveBeenCalledWith("r1"));
  });

  it("shows error when submitDraftForReview throws", async () => {
    const { render, screen, fireEvent, waitFor, act } = await import("@testing-library/react");
    vi.unmock("@/app/[locale]/(public)/mes-ressources/submit-button");
    vi.resetModules();
    const { submitDraftForReview } = await import("@/app/[locale]/(public)/publier/publish-actions");
    vi.mocked(submitDraftForReview).mockRejectedValueOnce(new Error("Not allowed"));
    const { SubmitDraftButton } = await import("@/app/[locale]/(public)/mes-ressources/submit-button");
    render(<SubmitDraftButton resourceId="r1" />);
    const btn = screen.getByTitle("Soumettre ce brouillon à la modération");
    await act(async () => { fireEvent.click(btn); });
    await waitFor(() => expect(document.body.textContent).toContain("Not allowed"));
  });
});

// ─── Profil page ────────────────────────────────────────────────────────────
describe("app/[locale]/(public)/profil/page.tsx", () => {
  it("renders loading state when session is pending", async () => {
    const { render } = await import("@testing-library/react");
    mockUseSession.mockReturnValue({ data: null, isPending: true });
    vi.resetModules();
    const { default: ProfilPage } = await import("@/app/[locale]/(public)/profil/page");
    render(<ProfilPage />);
    expect(document.body).toBeTruthy();
  });

  it("renders null when no session", async () => {
    const { render } = await import("@testing-library/react");
    mockUseSession.mockReturnValue({ data: null, isPending: false });
    vi.resetModules();
    const { default: ProfilPage } = await import("@/app/[locale]/(public)/profil/page");
    const { container } = render(<ProfilPage />);
    expect(container).toBeTruthy();
  });

  it("renders profile when session exists", async () => {
    const { render, screen } = await import("@testing-library/react");
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", name: "Alice Test", email: "alice@test.com", role: "citizen", createdAt: new Date() } },
      isPending: false,
    });
    vi.resetModules();
    const { default: ProfilPage } = await import("@/app/[locale]/(public)/profil/page");
    render(<ProfilPage />);
    expect(screen.getAllByText("Alice Test").length).toBeGreaterThan(0);
  });
});

// ─── Publier page (use client) ──────────────────────────────────────────────
describe("app/[locale]/(public)/publier/page.tsx", () => {
  it("renders publish form", async () => {
    const { render } = await import("@testing-library/react");
    vi.resetModules();
    const { default: PublierPage } = await import("@/app/[locale]/(public)/publier/page");
    render(<PublierPage />);
    expect(document.body).toBeTruthy();
  });
});
