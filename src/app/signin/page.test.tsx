import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./signin-form", () => ({
  SignInForm: () => <div data-testid="signin-form" />,
}));

import SignInPage from "./page";

describe("SignInPage", () => {
  it("renders the heading and the sign-in form", () => {
    render(<SignInPage />);

    expect(
      screen.getByRole("heading", { name: "Talk About It." }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("signin-form")).toBeInTheDocument();
  });

  it("renders the logo images as decorative and non-interactive", () => {
    render(<SignInPage />);

    const images = screen.getAllByRole("presentation");
    expect(images).toHaveLength(2);

    for (const image of images) {
      expect(image).toHaveAttribute("alt", "");
      expect(image).toHaveAttribute("draggable", "false");
      expect(image.className).toContain("pointer-events-none");
      expect(image.className).toContain("select-none");
    }

    const srcs = images.map((image) => image.getAttribute("src") ?? "");
    expect(srcs.some((src) => src.includes("y_logo_light.png"))).toBe(true);
    expect(srcs.some((src) => src.includes("y_logo_dark.png"))).toBe(true);
  });
});
