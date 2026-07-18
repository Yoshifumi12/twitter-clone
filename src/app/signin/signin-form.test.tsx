import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { identifierSchema } from "@/lib/validations/auth";
import { SignInForm } from "./signin-form";

function identifierErrorResult(identifier: string, message: string) {
  const data = new FormData();
  data.set("identifier", identifier);
  const submission = parseWithZod(data, { schema: identifierSchema });
  if (submission.status !== "success") {
    throw new Error("expected a successful parse for this test fixture");
  }
  return submission.reply({ fieldErrors: { identifier: [message] } });
}

const { checkIdentifierActionMock } = vi.hoisted(() => ({
  checkIdentifierActionMock: vi.fn(),
}));

vi.mock("./actions", () => ({
  checkIdentifierAction: checkIdentifierActionMock,
}));

vi.mock("./password-dialog", () => ({
  PasswordDialog: ({
    open,
    mode,
    identifier,
    email,
  }: {
    open: boolean;
    mode?: string;
    identifier?: string;
    email?: string;
  }) => (
    <div
      data-testid="password-dialog"
      data-open={open}
      data-mode={mode ?? ""}
      data-identifier={identifier ?? ""}
      data-email={email ?? ""}
    />
  ),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function getDialogProbe() {
  return screen.getByTestId("password-dialog");
}

describe("SignInForm", () => {
  it("links the Google button to the Google connection route", () => {
    render(<SignInForm />);

    const googleLink = screen.getByRole("link", {
      name: /continue with google/i,
    });
    expect(googleLink).toHaveAttribute(
      "href",
      "/auth/login?connection=google-oauth2",
    );
  });

  it("disables Continue until an identifier is entered", () => {
    render(<SignInForm />);

    const continueButton = screen.getByRole("button", { name: /continue/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Email or username"), {
      target: { value: "someone@example.com" },
    });

    expect(continueButton).toBeEnabled();
  });

  it("opens the password dialog in sign-in mode when an account exists", async () => {
    checkIdentifierActionMock.mockResolvedValue({
      status: "success",
      mode: "sign-in",
      identifier: "someone@example.com",
    });
    render(<SignInForm />);

    fireEvent.change(screen.getByPlaceholderText("Email or username"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(getDialogProbe()).toHaveAttribute("data-open", "true");
    });
    expect(getDialogProbe()).toHaveAttribute("data-mode", "sign-in");
    expect(getDialogProbe()).toHaveAttribute(
      "data-identifier",
      "someone@example.com",
    );
  });

  it("opens the password dialog in sign-up mode for an unknown email", async () => {
    checkIdentifierActionMock.mockResolvedValue({
      status: "success",
      mode: "sign-up",
      identifier: "new@example.com",
      email: "new@example.com",
    });
    render(<SignInForm />);

    fireEvent.change(screen.getByPlaceholderText("Email or username"), {
      target: { value: "new@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() => {
      expect(getDialogProbe()).toHaveAttribute("data-mode", "sign-up");
    });
    expect(getDialogProbe()).toHaveAttribute("data-email", "new@example.com");
  });

  it("shows a field error and keeps the dialog closed when the account can't sign in with a password", async () => {
    checkIdentifierActionMock.mockResolvedValue(
      identifierErrorResult(
        "someone@example.com",
        "This email address was used to sign up with Google. Continue with Google to sign in.",
      ),
    );
    render(<SignInForm />);

    fireEvent.change(screen.getByPlaceholderText("Email or username"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    expect(
      await screen.findByText(/continue with google to sign in/i),
    ).toBeInTheDocument();
    expect(getDialogProbe()).toHaveAttribute("data-open", "false");
  });
});
