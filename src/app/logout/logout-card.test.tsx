import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LogoutCard } from "./logout-card";

const { backMock } = vi.hoisted(() => ({ backMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: backMock }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LogoutCard", () => {
  it("shows the confirmation heading and copy", () => {
    render(<LogoutCard />);

    expect(
      screen.getByRole("heading", { name: "Log out of Yapper?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You can always log back in at any time."),
    ).toBeInTheDocument();
  });

  it("links the log out action straight to the Auth0 logout route", () => {
    render(<LogoutCard />);

    expect(screen.getByRole("link", { name: "Log out" })).toHaveAttribute(
      "href",
      "/auth/logout",
    );
  });

  it("navigates back when Cancel is clicked", () => {
    render(<LogoutCard />);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(backMock).toHaveBeenCalledTimes(1);
  });
});
