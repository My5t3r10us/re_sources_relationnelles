import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(""),
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

// ─── Component mocks ───────────────────────────────────────────────────────
vi.mock("@/components/layout/sidebar-catalog", () => ({
  SidebarCatalog: ({ categories }: any) => <aside data-testid="sidebar">{categories.length} cats</aside>,
}));
vi.mock("@/app/[locale]/(public)/catalogue/catalogue-client", () => ({
  CatalogueClient: ({ resources, total }: any) => <div data-testid="catalogue">{total} total, {resources.length} shown</div>,
}));

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
});

describe("app/[locale]/(public)/catalogue/page.tsx", () => {
  it("renders with no filters (default state)", async () => {
    // 1: count query, 2: resources query, 3: categories for sidebar
    qData = [[{ total: 0 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({}) });
    expect(result).toBeTruthy();
  });

  it("renders with categorie filter (found category)", async () => {
    // 1: category lookup, 2: count, 3: resources, 4: sidebar categories
    qData = [[{ id: "cat1" }], [{ total: 2 }], [
      { id: "r1", title: "Resource 1", summary: null, mediaType: "article", readingTime: 3, featured: false, viewCount: 0, createdAt: new Date(), imageUrl: null, categoryName: "Santé", categorySlug: "sante" },
    ], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ categorie: "sante" }) });
    expect(result).toBeTruthy();
  });

  it("renders with categorie filter (not found category)", async () => {
    // 1: category lookup returns empty, 2: count, 3: resources, 4: sidebar categories
    qData = [[], [{ total: 0 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ categorie: "unknown" }) });
    expect(result).toBeTruthy();
  });

  it("renders with media filter", async () => {
    qData = [[{ total: 1 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ media: "video" }) });
    expect(result).toBeTruthy();
  });

  it("renders with search query", async () => {
    qData = [[{ total: 0 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ q: "anxiété" }) });
    expect(result).toBeTruthy();
  });

  it("renders with tri=populaire", async () => {
    qData = [[{ total: 0 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ tri: "populaire" }) });
    expect(result).toBeTruthy();
  });

  it("renders with tri=ancien", async () => {
    qData = [[{ total: 0 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ tri: "ancien" }) });
    expect(result).toBeTruthy();
  });

  it("renders with page=2", async () => {
    qData = [[{ total: 20 }], [], []];
    vi.resetModules();
    const { default: CataloguePage } = await import("@/app/[locale]/(public)/catalogue/page");
    const result = await CataloguePage({ searchParams: Promise.resolve({ page: "2" }) });
    expect(result).toBeTruthy();
  });
});

// ─── CatalogueClient ───────────────────────────────────────────────────────
describe("app/[locale]/(public)/catalogue/catalogue-client.tsx", () => {
  it("renders with resources", async () => {
    const { render, screen } = await import("@testing-library/react");
    vi.resetModules();

    // Un-mock the catalogue client for this test
    vi.unmock("@/app/[locale]/(public)/catalogue/catalogue-client");
    const { CatalogueClient } = await import("@/app/[locale]/(public)/catalogue/catalogue-client");

    const resources = [
      {
        id: "r1", title: "Resource 1", summary: "Summary", mediaType: "article" as const,
        readingTime: 3, featured: false, viewCount: 10, createdAt: new Date(),
        imageUrl: null, categoryName: "Santé", categorySlug: "sante",
      },
    ];

    render(
      <CatalogueClient
        resources={resources}
        total={1}
        currentPage={1}
        totalPages={1}
        activeMedia=""
        activeSort="recent"
        search=""
      />
    );
    expect(screen.getByText("Resource 1")).toBeTruthy();
  });

  it("renders empty state with no resources", async () => {
    const { render } = await import("@testing-library/react");
    vi.resetModules();
    vi.unmock("@/app/[locale]/(public)/catalogue/catalogue-client");
    const { CatalogueClient } = await import("@/app/[locale]/(public)/catalogue/catalogue-client");

    render(
      <CatalogueClient
        resources={[]}
        total={0}
        currentPage={1}
        totalPages={1}
        activeMedia=""
        activeSort="recent"
        search=""
      />
    );
    expect(document.body).toBeTruthy();
  });

  it("renders featured resource without imageUrl and without readingTime", async () => {
    const { render } = await import("@testing-library/react");
    vi.resetModules();
    vi.unmock("@/app/[locale]/(public)/catalogue/catalogue-client");
    const { CatalogueClient } = await import("@/app/[locale]/(public)/catalogue/catalogue-client");

    const resources = [
      { id: "f1", title: "Featured No Image", summary: "Sum", mediaType: "exercise" as const, readingTime: null, featured: true, viewCount: 10, createdAt: new Date(), imageUrl: null, categoryName: null, categorySlug: null },
    ];

    render(
      <CatalogueClient
        resources={resources}
        total={1}
        currentPage={1}
        totalPages={1}
        activeMedia=""
        activeSort="recent"
        search=""
      />
    );
    expect(document.body).toBeTruthy();
  });

  it("renders with featured resource and various media types", async () => {
    const { render } = await import("@testing-library/react");
    vi.resetModules();
    vi.unmock("@/app/[locale]/(public)/catalogue/catalogue-client");
    const { CatalogueClient } = await import("@/app/[locale]/(public)/catalogue/catalogue-client");

    const resources = [
      { id: "f1", title: "Featured", summary: "Sum", mediaType: "article" as const, readingTime: 3, featured: true, viewCount: 100, createdAt: new Date(), imageUrl: "https://img.example.com/img.jpg", categoryName: "Santé", categorySlug: "sante" },
      { id: "r1", title: "PDF Resource", summary: "Sum", mediaType: "pdf" as const, readingTime: null, featured: false, viewCount: 5, createdAt: new Date(), imageUrl: null, categoryName: null, categorySlug: null },
      { id: "r2", title: "Audio Resource", summary: "Sum", mediaType: "audio" as const, readingTime: null, featured: false, viewCount: 2, createdAt: new Date(), imageUrl: "https://img.example.com/a.jpg", categoryName: null, categorySlug: null },
    ];

    render(
      <CatalogueClient
        resources={resources}
        total={3}
        currentPage={1}
        totalPages={3}
        activeMedia="article"
        activeSort="populaire"
        search="test"
      />
    );
    expect(document.body).toBeTruthy();
  });
});
