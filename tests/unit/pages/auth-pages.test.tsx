import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// ─── Next.js mocks ─────────────────────────────────────────────────────────
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

// ─── Auth client mock ──────────────────────────────────────────────────────
const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockUseSession = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mockSignIn },
    signUp: { email: mockSignUp },
    useSession: mockUseSession,
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  mockUseSession.mockReturnValue({ data: null, isPending: false });
});

// ─── Login page ────────────────────────────────────────────────────────────
describe("app/[locale]/(auth)/login/page.tsx", () => {
  it("renders login form", async () => {
    const { default: LoginPage } = await import("@/app/[locale]/(auth)/login/page");
    render(<LoginPage />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeTruthy();
  });

  it("submits form and calls signIn", async () => {
    const { default: LoginPage } = await import("@/app/[locale]/(auth)/login/page");
    render(<LoginPage />);

    const emailInput = document.querySelector("input[type='email']") as HTMLInputElement;
    const passwordInput = document.querySelector("input[type='password']") as HTMLInputElement;
    const form = document.querySelector("form") as HTMLFormElement;

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.change(passwordInput, { target: { value: "password123" } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        { email: "user@test.com", password: "password123" },
        expect.any(Object)
      );
    });
  });

  it("shows error when signIn returns error", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const { default: LoginPage } = await import("@/app/[locale]/(auth)/login/page");
    render(<LoginPage />);

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it("calls onSuccess callback when login succeeds", async () => {
    mockSignIn.mockImplementation((_creds: any, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({ error: null });
    });
    const { default: LoginPage } = await import("@/app/[locale]/(auth)/login/page");
    render(<LoginPage />);

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockPush).toHaveBeenCalled());
  });

  it("calls onError callback when login fails", async () => {
    mockSignIn.mockImplementation((_creds: any, callbacks: any) => {
      callbacks?.onError?.({ error: { message: "Bad credentials" } });
      return Promise.resolve({ error: null });
    });
    const { default: LoginPage } = await import("@/app/[locale]/(auth)/login/page");
    render(<LoginPage />);

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockSignIn).toHaveBeenCalled());
  });
});

// ─── Register page ─────────────────────────────────────────────────────────
describe("app/[locale]/(auth)/register/page.tsx", () => {
  it("renders register form", async () => {
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);
    expect(document.querySelector("form")).toBeTruthy();
  });

  it("submits form and calls signUp", async () => {
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);

    const inputs = document.querySelectorAll("input");
    // firstName, lastName, email, password, confirmPassword
    fireEvent.change(inputs[0], { target: { value: "Alice" } });
    fireEvent.change(inputs[1], { target: { value: "Doe" } });
    fireEvent.change(inputs[2], { target: { value: "alice@test.com" } });
    fireEvent.change(inputs[3], { target: { value: "Password123!" } });
    fireEvent.change(inputs[4], { target: { value: "Password123!" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({ email: "alice@test.com" }),
        expect.any(Object)
      );
    });
  });

  it("shows error when passwords do not match", async () => {
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[3], { target: { value: "Password123!" } });
    fireEvent.change(inputs[4], { target: { value: "Different456!" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockSignUp).not.toHaveBeenCalled());
  });

  it("shows error when signUp returns error", async () => {
    mockSignUp.mockResolvedValue({ error: { message: "Email taken" } });
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[3], { target: { value: "Password123!" } });
    fireEvent.change(inputs[4], { target: { value: "Password123!" } });

    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
  });

  it("calls onSuccess when register succeeds", async () => {
    mockSignUp.mockImplementation((_creds: any, callbacks: any) => {
      callbacks?.onSuccess?.();
      return Promise.resolve({ error: null });
    });
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[3], { target: { value: "Password123!" } });
    fireEvent.change(inputs[4], { target: { value: "Password123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/tableau-de-bord"));
  });

  it("calls onError when register fails", async () => {
    mockSignUp.mockImplementation((_creds: any, callbacks: any) => {
      callbacks?.onError?.({ error: { message: "Server error" } });
      return Promise.resolve({ error: null });
    });
    const { default: RegisterPage } = await import("@/app/[locale]/(auth)/register/page");
    render(<RegisterPage />);

    const inputs = document.querySelectorAll("input");
    fireEvent.change(inputs[3], { target: { value: "Password123!" } });
    fireEvent.change(inputs[4], { target: { value: "Password123!" } });
    const form = document.querySelector("form") as HTMLFormElement;
    fireEvent.submit(form);

    await waitFor(() => expect(mockSignUp).toHaveBeenCalled());
  });
});
