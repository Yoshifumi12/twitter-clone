import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { parseWithZod } from "@conform-to/zod/v4";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { signInSchema } from "@/lib/validations/auth";
import { PasswordDialog } from "./password-dialog";

function signInErrorResult(
  identifier: string,
  password: string,
  message: string,
) {
  const data = new FormData();
  data.set("identifier", identifier);
  data.set("password", password);
  const submission = parseWithZod(data, { schema: signInSchema });
  if (submission.status !== "success") {
    throw new Error("expected a successful parse for this test fixture");
  }
  return submission.reply({ fieldErrors: { password: [message] } });
}

const { signInActionMock, signUpActionMock } = vi.hoisted(() => ({
  signInActionMock: vi.fn(),
  signUpActionMock: vi.fn(),
}));

vi.mock("./actions", () => ({
  signInAction: signInActionMock,
  signUpAction: signUpActionMock,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("PasswordDialog in sign-in mode", () => {
  it("shows who is signing in and submits the password to signInAction", async () => {
    signInActionMock.mockResolvedValue(undefined);
    const onOpenChange = vi.fn();
    render(
      <PasswordDialog
        open
        onOpenChange={onOpenChange}
        mode="sign-in"
        identifier="someone@example.com"
      />,
    );

    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    expect(
      screen.getByText("Signing in as someone@example.com"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "hunter2" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(signInActionMock).toHaveBeenCalledTimes(1));
    const submittedData = signInActionMock.mock.calls[0][1] as FormData;
    expect(submittedData.get("identifier")).toBe("someone@example.com");
    expect(submittedData.get("password")).toBe("hunter2");
  });

  it("displays the error returned by signInAction", async () => {
    signInActionMock.mockResolvedValue(
      signInErrorResult(
        "someone@example.com",
        "wrong",
        "Incorrect username or password.",
      ),
    );
    render(
      <PasswordDialog
        open
        onOpenChange={vi.fn()}
        mode="sign-in"
        identifier="someone@example.com"
      />,
    );

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Incorrect username or password."),
    ).toBeInTheDocument();
  });
});

describe("PasswordDialog in sign-up mode", () => {
  it("shows who is creating an account and submits the password to signUpAction", async () => {
    signUpActionMock.mockResolvedValue(undefined);
    render(
      <PasswordDialog
        open
        onOpenChange={vi.fn()}
        mode="sign-up"
        email="new@example.com"
      />,
    );

    expect(screen.getByText("Create your password")).toBeInTheDocument();
    expect(
      screen.getByText("Creating an account for new@example.com"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "Abcd1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(signUpActionMock).toHaveBeenCalledTimes(1));
    const submittedData = signUpActionMock.mock.calls[0][1] as FormData;
    expect(submittedData.get("email")).toBe("new@example.com");
    expect(submittedData.get("password")).toBe("Abcd1234");
  });
});
