import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const useSession = vi.fn();
const signOut = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => useSession(),
    signOut: () => signOut(),
  },
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/catalogue",
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/layout/language-switcher", () => ({
  LanguageSwitcher: () => <div data-testid="lang" />,
}));

import { Navbar } from "@/components/layout/navbar";

describe("Navbar", () => {
  it("shows login link when there is no session", () => {
    useSession.mockReturnValue({ data: null });
    render(<Navbar />);
    expect(screen.getByLabelText(/login/i)).toBeInTheDocument();
  });

  it("shows user avatar initial when authenticated", () => {
    useSession.mockReturnValue({ data: { user: { name: "Alice", email: "a@b", role: "citizen" } } });
    render(<Navbar />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens user menu and reveals profile + logout when authenticated", async () => {
    useSession.mockReturnValue({ data: { user: { name: "Bob", email: "b@b", role: "citizen" } } });
    render(<Navbar />);
    await userEvent.click(screen.getByLabelText(/myAccount/i));
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("b@b")).toBeInTheDocument();
  });

  it("shows admin link when role is admin", async () => {
    useSession.mockReturnValue({ data: { user: { name: "X", email: "x@x", role: "admin" } } });
    render(<Navbar />);
    await userEvent.click(screen.getByLabelText(/myAccount/i));
    expect(screen.getByText(/administration/i)).toBeInTheDocument();
  });

  it("does NOT show admin link for citizen", async () => {
    useSession.mockReturnValue({ data: { user: { name: "X", email: "x@x", role: "citizen" } } });
    render(<Navbar />);
    await userEvent.click(screen.getByLabelText(/myAccount/i));
    expect(screen.queryByText(/administration/i)).not.toBeInTheDocument();
  });
});
