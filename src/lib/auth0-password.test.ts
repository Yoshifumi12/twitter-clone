import { beforeEach, describe, expect, it, vi } from "vitest";

const { sessionStoreSet } = vi.hoisted(() => ({ sessionStoreSet: vi.fn() }));

vi.mock("@/lib/auth0", () => ({
  auth0: { sessionStore: { set: sessionStoreSet } },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ mock: "cookie-store" })),
}));

import {
  Auth0PasswordError,
  establishSessionFromTokens,
  fetchAuth0UserInfo,
  generateAuth0Username,
  signInWithPassword,
  signUpWithPassword,
} from "./auth0-password";

function jsonResponse(body: unknown, ok: boolean, status = ok ? 200 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("signInWithPassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts a password-realm grant request and returns the tokens", async () => {
    const tokens = {
      access_token: "at",
      token_type: "Bearer",
      expires_in: 86400,
    };
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(jsonResponse(tokens, true));

    const result = await signInWithPassword("user@example.com", "hunter2");

    expect(result).toEqual(tokens);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.auth0.local/oauth/token",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      username: "user@example.com",
      password: "hunter2",
      client_id: "test-client-id",
      client_secret: "test-client-secret",
      realm: "Username-Password-Authentication",
    });
  });

  it("throws Auth0PasswordError with Auth0's error details on failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(
        { error: "invalid_grant", error_description: "Wrong credentials" },
        false,
      ),
    );

    await expect(
      signInWithPassword("user@example.com", "wrong"),
    ).rejects.toMatchObject({
      code: "invalid_grant",
      message: "Wrong credentials",
    });
  });

  it("falls back to a generic message when Auth0 omits error details", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({}, false));

    await expect(
      signInWithPassword("user@example.com", "wrong"),
    ).rejects.toMatchObject({
      code: "sign_in_failed",
      message: "Incorrect username or password.",
    });
  });
});

describe("generateAuth0Username", () => {
  it("strips non-alphanumeric characters and lowercases the base", () => {
    const username = generateAuth0Username("Some.User+Name");
    expect(username).toMatch(/^[a-z0-9]+$/);
    expect(username.startsWith("someuser")).toBe(true);
  });

  it("never exceeds Auth0's 15 character username limit", () => {
    const username = generateAuth0Username(
      "a-very-long-local-part-that-exceeds-the-limit",
    );
    expect(username.length).toBeLessThanOrEqual(15);
  });

  it("produces a different username on each call", () => {
    const first = generateAuth0Username("someone");
    const second = generateAuth0Username("someone");
    expect(first).not.toBe(second);
  });

  it("falls back to 'user' when the base has no alphanumeric characters", () => {
    const username = generateAuth0Username("!!!");
    expect(username.startsWith("user")).toBe(true);
  });
});

describe("signUpWithPassword", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to the dbconnections/signup endpoint", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(jsonResponse({}, true));

    await signUpWithPassword("user@example.com", "Abcd1234", "user123");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://test.auth0.local/dbconnections/signup",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(body).toMatchObject({
      client_id: "test-client-id",
      email: "user@example.com",
      password: "Abcd1234",
      username: "user123",
      connection: "Username-Password-Authentication",
    });
  });

  it("uses the password policy message for PasswordStrengthError", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(
        { name: "PasswordStrengthError", policy: "Too weak." },
        false,
      ),
    );

    await expect(
      signUpWithPassword("user@example.com", "weak", "user123"),
    ).rejects.toMatchObject({ message: "Too weak." });
  });

  it("surfaces user_exists so the caller can show a friendly message", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      jsonResponse(
        { code: "user_exists", description: "The user already exists." },
        false,
      ),
    );

    await expect(
      signUpWithPassword("user@example.com", "Abcd1234", "user123"),
    ).rejects.toMatchObject({
      code: "user_exists",
      message: "The user already exists.",
    });
  });

  it("falls back to a generic message when the error body isn't JSON", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error("not json");
      },
    } as unknown as Response);

    await expect(
      signUpWithPassword("user@example.com", "Abcd1234", "user123"),
    ).rejects.toMatchObject({
      code: "sign_up_failed",
      message: "Unable to create your account.",
    });
  });
});

describe("fetchAuth0UserInfo", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the user profile on success", async () => {
    const profile = { sub: "auth0|123", email: "user@example.com" };
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse(profile, true));

    const result = await fetchAuth0UserInfo("access-token");

    expect(result).toEqual(profile);
  });

  it("throws Auth0PasswordError when the userinfo call fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse({}, false));

    await expect(fetchAuth0UserInfo("access-token")).rejects.toBeInstanceOf(
      Auth0PasswordError,
    );
  });
});

describe("establishSessionFromTokens", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStoreSet.mockClear();
  });

  it("fetches the user profile and persists a session from the token response", async () => {
    const profile = { sub: "auth0|123", email: "user@example.com" };
    vi.spyOn(global, "fetch").mockResolvedValue(jsonResponse(profile, true));
    const nowSeconds = Math.floor(Date.now() / 1000);

    const result = await establishSessionFromTokens({
      access_token: "at",
      id_token: "it",
      refresh_token: "rt",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "openid profile email",
    });

    expect(result).toEqual(profile);
    expect(sessionStoreSet).toHaveBeenCalledTimes(1);
    const [, , session, isNew] = sessionStoreSet.mock.calls[0];
    expect(isNew).toBe(true);
    expect(session.user).toEqual(profile);
    expect(session.tokenSet).toMatchObject({
      accessToken: "at",
      idToken: "it",
      refreshToken: "rt",
      scope: "openid profile email",
      token_type: "Bearer",
    });
    expect(session.tokenSet.expiresAt).toBeGreaterThanOrEqual(
      nowSeconds + 3600,
    );
    expect(session.internal.sid).toMatch(/^[0-9a-f-]{36}$/);
  });
});
