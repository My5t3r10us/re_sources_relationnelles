import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const submitReport = vi.fn();

vi.mock("@/app/[locale]/(public)/ressource/[id]/report-actions", () => ({
  submitReport: (args: unknown) => submitReport(args),
}));

import { ReportButton } from "@/components/ui/report-button";

beforeEach(() => {
  submitReport.mockReset();
});

describe("ReportButton", () => {
  it("opens dialog on click", async () => {
    render(<ReportButton resourceId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: /signaler/i }));
    expect(screen.getByText(/Motif/i)).toBeInTheDocument();
  });

  it("submits with chosen reason and optional description", async () => {
    submitReport.mockResolvedValue(undefined);
    render(<ReportButton resourceId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: /signaler/i }));
    await userEvent.selectOptions(screen.getByRole("combobox"), "spam");
    await userEvent.type(screen.getByPlaceholderText(/Décrivez/i), "Pourriel");
    await userEvent.click(screen.getByRole("button", { name: /^Envoyer$/i }));

    expect(submitReport).toHaveBeenCalledWith({
      reason: "spam",
      description: "Pourriel",
      resourceId: "r1",
      commentId: undefined,
    });
  });

  it("shows error message when submit fails", async () => {
    submitReport.mockRejectedValue(new Error("Boom"));
    render(<ReportButton commentId="c1" />);
    await userEvent.click(screen.getByRole("button", { name: /signaler/i }));
    await userEvent.click(screen.getByRole("button", { name: /^Envoyer$/i }));
    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });

  it("closes when 'Fermer' button is clicked", async () => {
    render(<ReportButton resourceId="r1" />);
    await userEvent.click(screen.getByRole("button", { name: /signaler/i }));
    await userEvent.click(screen.getByLabelText("Fermer"));
    expect(screen.queryByText(/Motif/i)).not.toBeInTheDocument();
  });
});
