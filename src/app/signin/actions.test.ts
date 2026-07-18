import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUniqueMock } = vi.hoisted(() => ({ findUniqueMock: vi.fn() }));
const { redirectMock } = vi.hoisted(() => ({ redirectMock: vi.fn() }));
const { syncUserFromAuth0Mock } = vi.hoisted(() => ({
  syncUserFromAuth0Mock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: findUniqueMock } },
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/auth0", () => ({
  syncUserFromAuth0: syncUserFromAuth0Mock,
}));

vi.mock("@/lib/auth0-password", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth0-password")>();
  return {
    ...actual,
    signInWithPassword: vi.fn(),
    signUpWithPassword: vi.fn(),
    establishSessionFromTokens: vi.fn(),
    generateAuth0Username: vi.fn((base: string) => `${base}-mock`),
  };
});

import {
  Auth0PasswordError,
  establishSessionFromTokens,
  generateAuth0Username,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/auth0-password";
import { checkIdentifierAction, signInAction, signUpAction } from "./actions";

const signInWithPasswordMock = vi.mocked(signInWithPassword);
const signUpWithPasswordMock = vi.mocked(signUpWithPassword);
const establishSessionFromTokensMock = vi.mocked(establishSessionFromTokens);
const generateAuth0UsernameMock = vi.mocked(generateAuth0Username);

function formData(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  generateAuth0UsernameMock.mockImplementation(
    (base: string) => `${base}-mock`,
  );
});

describe("checkIdentifierAction", () => {
  it("returns field errors for an empty identifier", async () => {
    const result = await checkIdentifierAction(
      undefined,
      formData({ identifier: "" }),
    );

    expect(result.status).toBe("error");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("tells a non-email identifier with no account to use an email instead", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await checkIdentifierAction(
      undefined,
      formData({ identifier: "unknownuser" }),
    );

    expect(result.status).toBe("error");
    expect(result.error?.identifier?.[0]).toMatch(/Enter an email/);
  });

  it("offers sign-up when an unknown email is submitted", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await checkIdentifierAction(
      undefined,
      formData({ identifier: "new@example.com" }),
    );

    expect(result.mode).toBe("sign-up");
    expect(result.identifier).toBe("new@example.com");
    expect(result.email).toBe("new@example.com");
  });

  it("offers sign-in for a known identifier with a password credential", async () => {
    findUniqueMock.mockResolvedValue({ auth0Id: "auth0|abc123" });

    const result = await checkIdentifierAction(
      undefined,
      formData({ identifier: "existing@example.com" }),
    );

    expect(result.mode).toBe("sign-in");
    expect(result.identifier).toBe("existing@example.com");
  });

  it("rejects a known identifier that only has a Google credential", async () => {
    findUniqueMock.mockResolvedValue({ auth0Id: "google-oauth2|abc123" });

    const result = await checkIdentifierAction(
      undefined,
      formData({ identifier: "existing@example.com" }),
    );

    expect(result.status).toBe("error");
    expect(result.error?.identifier?.[0]).toMatch(/Google/);
  });

  it("looks up by username when the identifier isn't an email", async () => {
    findUniqueMock.mockResolvedValue({ auth0Id: "auth0|abc123" });

    await checkIdentifierAction(
      undefined,
      formData({ identifier: "someusername" }),
    );

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({ where: { username: "someusername" } }),
    );
  });
});

describe("signInAction", () => {
  it("returns validation errors when the password is missing", async () => {
    const result = await signInAction(
      undefined,
      formData({ identifier: "user@example.com", password: "" }),
    );

    expect(result.status).toBe("error");
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("reports no account found when the user doesn't exist", async () => {
    findUniqueMock.mockResolvedValue(null);

    const result = await signInAction(
      undefined,
      formData({ identifier: "user@example.com", password: "hunter2" }),
    );

    expect(result.error?.[""]).toEqual(["No account found."]);
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("reports no account found for a Google-only account", async () => {
    findUniqueMock.mockResolvedValue({
      email: "user@example.com",
      auth0Id: "google-oauth2|abc123",
    });

    const result = await signInAction(
      undefined,
      formData({ identifier: "user@example.com", password: "hunter2" }),
    );

    expect(result.error?.[""]).toEqual(["No account found."]);
  });

  it("reports an incorrect password when Auth0 rejects the credentials", async () => {
    findUniqueMock.mockResolvedValue({
      email: "user@example.com",
      auth0Id: "auth0|abc123",
    });
    signInWithPasswordMock.mockRejectedValue(
      new Auth0PasswordError("invalid_grant", "Wrong credentials"),
    );

    const result = await signInAction(
      undefined,
      formData({ identifier: "user@example.com", password: "wrong" }),
    );

    expect(result.error?.password).toEqual(["Incorrect username or password."]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("rethrows unexpected errors instead of swallowing them", async () => {
    findUniqueMock.mockResolvedValue({
      email: "user@example.com",
      auth0Id: "auth0|abc123",
    });
    signInWithPasswordMock.mockRejectedValue(new Error("network down"));

    await expect(
      signInAction(
        undefined,
        formData({ identifier: "user@example.com", password: "hunter2" }),
      ),
    ).rejects.toThrow("network down");
  });

  it("establishes a session and redirects home on success", async () => {
    findUniqueMock.mockResolvedValue({
      email: "user@example.com",
      auth0Id: "auth0|abc123",
    });
    const tokens = { access_token: "at", token_type: "Bearer" };
    const auth0User = { sub: "auth0|abc123", email: "user@example.com" };
    signInWithPasswordMock.mockResolvedValue(tokens as never);
    establishSessionFromTokensMock.mockResolvedValue(auth0User as never);

    await signInAction(
      undefined,
      formData({ identifier: "user@example.com", password: "hunter2" }),
    );

    expect(signInWithPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      "hunter2",
    );
    expect(establishSessionFromTokensMock).toHaveBeenCalledWith(tokens);
    expect(syncUserFromAuth0Mock).toHaveBeenCalledWith(auth0User);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});

describe("signUpAction", () => {
  it("returns validation errors for a weak password", async () => {
    const result = await signUpAction(
      undefined,
      formData({ email: "user@example.com", password: "weak" }),
    );

    expect(result.status).toBe("error");
    expect(signUpWithPasswordMock).not.toHaveBeenCalled();
  });

  it("tells the user an account already exists", async () => {
    signUpWithPasswordMock.mockRejectedValue(
      new Auth0PasswordError("user_exists", "The user already exists."),
    );

    const result = await signUpAction(
      undefined,
      formData({ email: "user@example.com", password: "Abcd1234" }),
    );

    expect(result.error?.email).toEqual([
      "An account with this email already exists.",
    ]);
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("surfaces other Auth0 errors verbatim", async () => {
    signUpWithPasswordMock.mockRejectedValue(
      new Auth0PasswordError("password_strength_error", "Password too weak."),
    );

    const result = await signUpAction(
      undefined,
      formData({ email: "user@example.com", password: "Abcd1234" }),
    );

    expect(result.error?.email).toEqual(["Password too weak."]);
  });

  it("rethrows unexpected errors instead of swallowing them", async () => {
    signUpWithPasswordMock.mockRejectedValue(new Error("network down"));

    await expect(
      signUpAction(
        undefined,
        formData({ email: "user@example.com", password: "Abcd1234" }),
      ),
    ).rejects.toThrow("network down");
  });

  it("creates the account, signs in, and redirects home on success", async () => {
    const tokens = { access_token: "at", token_type: "Bearer" };
    const auth0User = { sub: "auth0|abc123", email: "user@example.com" };
    signUpWithPasswordMock.mockResolvedValue(undefined);
    signInWithPasswordMock.mockResolvedValue(tokens as never);
    establishSessionFromTokensMock.mockResolvedValue(auth0User as never);

    await signUpAction(
      undefined,
      formData({ email: "user@example.com", password: "Abcd1234" }),
    );

    expect(generateAuth0UsernameMock).toHaveBeenCalledWith("user");
    expect(signUpWithPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      "Abcd1234",
      "user-mock",
    );
    expect(signInWithPasswordMock).toHaveBeenCalledWith(
      "user@example.com",
      "Abcd1234",
    );
    expect(syncUserFromAuth0Mock).toHaveBeenCalledWith(auth0User);
    expect(redirectMock).toHaveBeenCalledWith("/");
  });
});
