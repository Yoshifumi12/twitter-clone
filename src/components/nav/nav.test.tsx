import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Nav } from "./nav";

const { usePathnameMock } = vi.hoisted(() => ({ usePathnameMock: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
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

  it("renders a Post button", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByRole("button", { name: /post/i })).toBeInTheDocument();
  });

  it("shows the current user's display name and @username", () => {
    render(<Nav displayName="Ada Lovelace" username="ada" />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("@ada")).toBeInTheDocument();
  });
});
