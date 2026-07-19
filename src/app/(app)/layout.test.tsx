import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));
const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: getSessionMock },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/components/nav/nav", () => ({
  Nav: ({
    displayName,
    username,
  }: {
    displayName: string;
    username: string;
  }) => (
    <div
      data-testid="nav"
      data-display-name={displayName}
      data-username={username}
    />
  ),
}));

import AppLayout from "./layout";

beforeEach(() => {
  vi.clearAllMocks();
  redirectMock.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("AppLayout", () => {
  it("redirects to /signin when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(AppLayout({ children: <div>child</div> })).rejects.toThrow(
      "NEXT_REDIRECT",
    );

    expect(redirectMock).toHaveBeenCalledWith("/signin");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("renders the nav with the synced user's profile and the page children", async () => {
    getSessionMock.mockResolvedValue({
      user: { sub: "auth0|abc123", name: "Fallback Name" },
    });
    findUniqueMock.mockResolvedValue({
      displayName: "Ada Lovelace",
      username: "ada",
    });

    const element = await AppLayout({ children: <p>Page content</p> });
    render(element);

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { auth0Id: "auth0|abc123" },
      select: { displayName: true, username: true },
    });
    expect(screen.getByTestId("nav")).toHaveAttribute(
      "data-display-name",
      "Ada Lovelace",
    );
    expect(screen.getByTestId("nav")).toHaveAttribute("data-username", "ada");
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("falls back to the Auth0 session name and an empty username when there's no synced user yet", async () => {
    getSessionMock.mockResolvedValue({
      user: { sub: "auth0|abc123", name: "Fallback Name" },
    });
    findUniqueMock.mockResolvedValue(null);

    const element = await AppLayout({ children: <p>Page content</p> });
    render(element);

    expect(screen.getByTestId("nav")).toHaveAttribute(
      "data-display-name",
      "Fallback Name",
    );
    expect(screen.getByTestId("nav")).toHaveAttribute("data-username", "");
  });
});
