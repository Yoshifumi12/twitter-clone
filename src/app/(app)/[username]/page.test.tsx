import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfilePage from "./page";

describe("ProfilePage", () => {
  it("renders the username from the route params", async () => {
    const element = await ProfilePage({
      params: Promise.resolve({ username: "ada" }),
    });
    render(element);

    expect(screen.getByText("@ada")).toBeInTheDocument();
  });
});
