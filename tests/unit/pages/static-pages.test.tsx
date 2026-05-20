import { describe, it, expect, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

// ─── Aide page ─────────────────────────────────────────────────────────────
describe("app/[locale]/(public)/aide/page.tsx", () => {
  it("renders without error", async () => {
    const { default: AidePage } = await import("@/app/[locale]/(public)/aide/page");
    const result = AidePage();
    expect(result).toBeTruthy();
  });
});

// ─── Urgence page ──────────────────────────────────────────────────────────
describe("app/[locale]/(public)/urgence/page.tsx", () => {
  it("renders without error", async () => {
    const { default: UrgencePage } = await import("@/app/[locale]/(public)/urgence/page");
    const result = UrgencePage();
    expect(result).toBeTruthy();
  });
});

// ─── Bien-être page ────────────────────────────────────────────────────────
describe("app/[locale]/(public)/bien-etre/page.tsx", () => {
  it("renders without error", async () => {
    const { default: BienEtrePage } = await import("@/app/[locale]/(public)/bien-etre/page");
    const result = BienEtrePage();
    expect(result).toBeTruthy();
  });
});

// ─── Communauté page ───────────────────────────────────────────────────────
describe("app/[locale]/(public)/communaute/page.tsx", () => {
  it("renders without error", async () => {
    const { default: CommunautePage } = await import("@/app/[locale]/(public)/communaute/page");
    const result = CommunautePage();
    expect(result).toBeTruthy();
  });
});
