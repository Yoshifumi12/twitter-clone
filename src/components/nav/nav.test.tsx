import type { ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "./nav";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/components/yap/compose-dialog", () => ({
  ComposeDialog: ({ trigger }: { trigger: ReactNode }) => trigger,
}));

beforeEach(() => {
  usePathnameMock.mockReturnValue("/");
});

describe("Nav", () => {
  it("links every item to its route, with Profile pointing at the current user", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    const expectedLinks: Record<string, string> = {
      Home: "/",
      Explore: "/explore",
      Notifications: "/notifications",
      Connect: "/connect",
      Chat: "/chat",
      Bookmarks: "/bookmarks",
      Profile: "/ada",
    };

    for (const [label, href] of Object.entries(expectedLinks)) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("bolds only the link matching the current route", () => {
    usePathnameMock.mockReturnValue("/explore");
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByRole("link", { name: "Explore" })).toHaveClass(
      "font-bold",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveClass(
      "font-bold",
    );
  });

  it("links the logo to the home route", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByRole("link", { name: "Yapper" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("fills only the icon matching the current route", () => {
    usePathnameMock.mockReturnValue("/explore");
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    const activeIcon = screen
      .getByRole("link", { name: "Explore" })
      .querySelector("svg");
    const inactiveIcon = screen
      .getByRole("link", { name: "Home" })
      .querySelector("svg");

    expect(activeIcon).toHaveAttribute("fill", "currentColor");
    expect(inactiveIcon).toHaveAttribute("fill", "none");
  });

  it("renders a Yap button", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByRole("button", { name: /yap/i })).toBeInTheDocument();
  });

  it("shows the current user's display name and @username", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
  });

  it("does not show the account menu until it is opened", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(
      screen.queryByRole("link", { name: "Log out @ada" }),
    ).not.toBeInTheDocument();
  });

  it("opens an account menu with a log out option when the account block is clicked", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    fireEvent.click(
      screen.getByRole("button", { name: /ada lovelace.*@ada/i }),
    );

    const logOutLink = screen.getByRole("link", { name: "Log out @ada" });
    expect(logOutLink).toBeInTheDocument();
    expect(logOutLink).toHaveAttribute("href", "/logout");
  });

  it("scopes the log out option to the current user", () => {
    render(<Nav displayName="Grace Hopper" username="grace" />);

    fireEvent.click(
      screen.getByRole("button", { name: /grace hopper.*@grace/i }),
    );

    expect(
      screen.getByRole("link", { name: "Log out @grace" }),
    ).toBeInTheDocument();
  });
});
