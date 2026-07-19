import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSessionMock } = vi.hoisted(() => ({ getSessionMock: vi.fn() }));
const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));

vi.mock("@/lib/auth0", () => ({
  auth0: { getSession: getSessionMock },
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("./logout-card", () => ({
  LogoutCard: () => <div data-testid="logout-card" />,
}));

import LogoutPage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  redirectMock.mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  });
});

describe("LogoutPage", () => {
  it("redirects to /signin when there is no session", async () => {
    getSessionMock.mockResolvedValue(null);

    await expect(LogoutPage()).rejects.toThrow("NEXT_REDIRECT");

    expect(redirectMock).toHaveBeenCalledWith("/signin");
  });

  it("renders the logout card when there is a session", async () => {
    getSessionMock.mockResolvedValue({ user: { sub: "auth0|abc123" } });

    const element = await LogoutPage();
    render(element);

    expect(screen.getByTestId("logout-card")).toBeInTheDocument();
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
