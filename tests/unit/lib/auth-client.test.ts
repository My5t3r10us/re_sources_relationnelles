import { describe, it, expect, vi } from "vitest";

vi.mock("better-auth/react", () => ({
  createAuthClient: vi.fn((opts: { baseURL: string }) => ({ __opts: opts, signIn: vi.fn() })),
}));

describe("authClient", () => {
  it("is created with the env base URL when set", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";
    vi.resetModules();
    const { authClient } = await import("@/lib/auth-client");
    expect((authClient as unknown as { __opts: { baseURL: string } }).__opts.baseURL).toBe(
      "https://app.example.com",
    );
  });

  it("falls back to localhost:3000 when env is not set", async () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    vi.resetModules();
    const { authClient } = await import("@/lib/auth-client");
    expect((authClient as unknown as { __opts: { baseURL: string } }).__opts.baseURL).toBe(
      "http://localhost:3000",
    );
  });
});
