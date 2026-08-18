import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackButton } from "@/components/ui/feedback-button";

// `vitest.setup.ts` mocke `next-intl` : `t("clé")` renvoie la clé elle-même,
// ce qui rend les assertions indépendantes des traductions.

const BOARD_URL = "https://feedback.example";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FeedbackButton", () => {
  it("renders nothing when the board URL is not configured", () => {
    const { container } = render(<FeedbackButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens the dialog and shows the privacy notice", async () => {
    render(<FeedbackButton boardUrl={BOARD_URL} />);
    await userEvent.click(screen.getByRole("button", { name: /trigger/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("privacyNotice")).toBeInTheDocument();
  });

  it("submits the selected type, title and description", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { number: 4, slug: "s", url: `${BOARD_URL}/posts/4/s` }, error: null }),
        { status: 201 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<FeedbackButton boardUrl={BOARD_URL} />);
    await userEvent.click(screen.getByRole("button", { name: /trigger/i }));
    await userEvent.click(screen.getByRole("radio", { name: /typeBug/i }));
    await userEvent.type(screen.getByLabelText("title"), "Le filtre plante");
    await userEvent.type(screen.getByLabelText("description"), "Étapes de reproduction");
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      type: "bug",
      title: "Le filtre plante",
      description: "Étapes de reproduction",
    });

    // État de confirmation, avec le lien vers la publication créée.
    expect(await screen.findByText("success")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "viewPost" })).toHaveAttribute(
      "href",
      `${BOARD_URL}/posts/4/s`,
    );
  });

  it("surfaces the server error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ data: null, error: { code: "RATE_LIMITED", message: "Trop de requêtes." } }),
          { status: 429 },
        ),
      ),
    );

    render(<FeedbackButton boardUrl={BOARD_URL} />);
    await userEvent.click(screen.getByRole("button", { name: /trigger/i }));
    await userEvent.type(screen.getByLabelText("title"), "Titre valide");
    await userEvent.click(screen.getByRole("button", { name: /^submit$/i }));

    expect(await screen.findByText("Trop de requêtes.")).toBeInTheDocument();
  });

  it("closes the dialog", async () => {
    render(<FeedbackButton boardUrl={BOARD_URL} />);
    await userEvent.click(screen.getByRole("button", { name: /trigger/i }));
    await userEvent.click(screen.getByLabelText("closeLabel"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
