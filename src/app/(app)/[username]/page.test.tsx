import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}));

import ProfilePage, { generateMetadata } from "./page";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ProfilePage", () => {
  it("renders the username from the route params", async () => {
    const element = await ProfilePage({
      params: Promise.resolve({ username: "ada" }),
    });
    render(element);

    expect(screen.getByText("@ada")).toBeInTheDocument();
  });
});

describe("generateMetadata", () => {
  it("titles the page with the user's display name and username", async () => {
    findUniqueMock.mockResolvedValue({ displayName: "Ada Lovelace" });

    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "ada" }),
    });

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { username: "ada" },
      select: { displayName: true },
    });
    expect(metadata.title).toBe("Ada Lovelace (@ada)");
  });

  it("falls back to the username when no matching user exists", async () => {
    findUniqueMock.mockResolvedValue(null);

    const metadata = await generateMetadata({
      params: Promise.resolve({ username: "ghost" }),
    });

    expect(metadata.title).toBe("ghost (@ghost)");
  });
});
