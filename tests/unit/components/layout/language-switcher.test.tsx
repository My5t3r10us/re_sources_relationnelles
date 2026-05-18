import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const replace = vi.fn();

vi.mock("next-intl", () => ({
  useLocale: () => "fr",
  useTranslations: () => (k: string) => k,
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/catalogue",
}));

vi.mock("@/i18n/routing", () => ({
  routing: { locales: ["fr", "en", "de"], defaultLocale: "fr" },
}));

import { LanguageSwitcher } from "@/components/layout/language-switcher";

describe("LanguageSwitcher", () => {
  it("shows current locale", () => {
    render(<LanguageSwitcher />);
    expect(screen.getByText("fr")).toBeInTheDocument();
  });

  it("opens the dropdown and lists supported locales", async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole("button"));
    expect(await screen.findByText("Français")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();
    expect(screen.getByText("Deutsch")).toBeInTheDocument();
  });

  it("calls router.replace with the new locale on selection", async () => {
    render(<LanguageSwitcher />);
    await userEvent.click(screen.getByRole("button"));
    await userEvent.click(await screen.findByText("English"));
    expect(replace).toHaveBeenCalledWith("/catalogue", { locale: "en" });
  });
});
