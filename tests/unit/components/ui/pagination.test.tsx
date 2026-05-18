import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Pagination } from "@/components/ui/pagination";

describe("Pagination", () => {
  it("renders all pages when total <= 7", () => {
    render(<Pagination currentPage={1} totalPages={5} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole("button", { name: String(i) })).toBeInTheDocument();
    }
  });

  it("renders ellipsis when total > 7 and currentPage in middle", () => {
    render(<Pagination currentPage={5} totalPages={10} />);
    expect(screen.getAllByText("…").length).toBeGreaterThan(0);
  });

  it("disables 'previous' on first page", () => {
    render(<Pagination currentPage={1} totalPages={5} />);
    expect(screen.getByLabelText("Page précédente")).toBeDisabled();
  });

  it("disables 'next' on last page", () => {
    render(<Pagination currentPage={5} totalPages={5} />);
    expect(screen.getByLabelText("Page suivante")).toBeDisabled();
  });

  it("fires onPageChange with clicked page", async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("marks current page with aria-current", () => {
    render(<Pagination currentPage={2} totalPages={5} />);
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
  });
});
