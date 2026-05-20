import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "../../setup/db-mock";

// ─── Navigation / next mocks ───────────────────────────────────────────────
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

// ─── Components mocks ──────────────────────────────────────────────────────
vi.mock("@/components/layout/navbar", () => ({ Navbar: () => <nav>Navbar</nav> }));
vi.mock("@/components/layout/footer", () => ({ Footer: () => <footer>Footer</footer> }));
vi.mock("@/components/layout/sidebar-admin", () => ({ SidebarAdmin: () => <aside>Sidebar</aside> }));

beforeEach(() => {
  qIdx = 0;
  qData = [];
  vi.clearAllMocks();
});

// ─── Root layout ───────────────────────────────────────────────────────────
describe("app/layout.tsx", () => {
  it("renders children", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const result = RootLayout({ children: <span>content</span> });
    expect(result).toBeTruthy();
  });
});

// ─── Locale layout ─────────────────────────────────────────────────────────
describe("app/[locale]/layout.tsx", () => {
  it("renders for valid locale", async () => {
    vi.resetModules();
    const { default: LocaleLayout } = await import("@/app/[locale]/layout");
    const result = await LocaleLayout({
      children: <div>children</div>,
      params: Promise.resolve({ locale: "fr" }),
    });
    expect(result).toBeTruthy();
  });

  it("calls notFound for invalid locale", async () => {
    vi.resetModules();
    const { default: LocaleLayout } = await import("@/app/[locale]/layout");
    await expect(
      LocaleLayout({ children: <div />, params: Promise.resolve({ locale: "xx" }) })
    ).rejects.toThrow("NOT_FOUND");
  });
});

// ─── Public layout ─────────────────────────────────────────────────────────
describe("app/[locale]/(public)/layout.tsx", () => {
  it("renders navbar, children, footer", async () => {
    vi.resetModules();
    const { default: PublicLayout } = await import("@/app/[locale]/(public)/layout");
    const result = PublicLayout({ children: <main>content</main> });
    expect(result).toBeTruthy();
  });
});

// ─── Admin layout ──────────────────────────────────────────────────────────
describe("app/[locale]/(admin)/layout.tsx", () => {
  it("redirects unauthenticated user", async () => {
    mockGetServerSession.mockResolvedValue(null);
    vi.resetModules();
    const { default: AdminLayout } = await import("@/app/[locale]/(admin)/layout");
    await expect(AdminLayout({ children: <div /> })).rejects.toThrow("REDIRECT");
  });

  it("redirects non-admin user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", name: "Alice" } });
    qData = [[{ role: "citizen" }]];
    vi.resetModules();
    const { default: AdminLayout } = await import("@/app/[locale]/(admin)/layout");
    await expect(AdminLayout({ children: <div /> })).rejects.toThrow("REDIRECT");
  });

  it("renders for admin user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", name: "Alice" } });
    qData = [[{ role: "admin" }]];
    vi.resetModules();
    const { default: AdminLayout } = await import("@/app/[locale]/(admin)/layout");
    const result = await AdminLayout({ children: <div>admin content</div> });
    expect(result).toBeTruthy();
  });

  it("renders for super_admin user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", name: "Bob" } });
    qData = [[{ role: "super_admin" }]];
    vi.resetModules();
    const { default: AdminLayout } = await import("@/app/[locale]/(admin)/layout");
    const result = await AdminLayout({ children: <div /> });
    expect(result).toBeTruthy();
  });

  it("redirects when db returns no user row", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "u1", name: "Alice" } });
    qData = [[]];
    vi.resetModules();
    const { default: AdminLayout } = await import("@/app/[locale]/(admin)/layout");
    await expect(AdminLayout({ children: <div /> })).rejects.toThrow("REDIRECT");
  });
});
