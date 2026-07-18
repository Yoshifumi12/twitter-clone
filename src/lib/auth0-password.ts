import { cookies } from "next/headers";
import type { User as Auth0User } from "@auth0/nextjs-auth0/types";
import type { AbstractSessionStore } from "@auth0/nextjs-auth0/server";
import { auth0 } from "@/lib/auth0";

/**
 * `Auth0Client#updateSession` refuses to run unless a session already exists, so it
 * can't establish a brand-new session for a password-grant login. The store it
 * delegates to (`AbstractSessionStore`, exported for exactly this kind of case) has
 * no such restriction, so we reach past the private field to use it directly.
 */
function getSessionStore(): AbstractSessionStore {
  return (auth0 as unknown as { sessionStore: AbstractSessionStore })
    .sessionStore;
}

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN!;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID!;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET!;
const AUTH0_DB_CONNECTION =
  process.env.AUTH0_DB_CONNECTION ?? "Username-Password-Authentication";

const issuer = `https://${AUTH0_DOMAIN}`;

export class Auth0PasswordError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

interface Auth0TokenResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<Auth0TokenResponse> {
  const res = await fetch(`${issuer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "http://auth0.com/oauth/grant-type/password-realm",
      username: email,
      password,
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      realm: AUTH0_DB_CONNECTION,
      scope: "openid profile email offline_access",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Auth0PasswordError(
      data.error ?? "sign_in_failed",
      data.error_description ?? "Incorrect username or password.",
    );
  }
  return data as Auth0TokenResponse;
}

/**
 * The `Username-Password-Authentication` connection requires a username between 1
 * and 15 characters. This is unrelated to our own Prisma `username` field, so it
 * doesn't need to be human-friendly or checked for uniqueness against Prisma —
 * Auth0 enforces uniqueness within the connection itself.
 */
export function generateAuth0Username(base: string): string {
  const normalized = base.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
  const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 6);
  return `${normalized.slice(0, 15 - suffix.length)}${suffix}`;
}

export async function signUpWithPassword(
  email: string,
  password: string,
  username: string,
): Promise<void> {
  const res = await fetch(`${issuer}/dbconnections/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      email,
      password,
      username,
      connection: AUTH0_DB_CONNECTION,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      data.name === "PasswordStrengthError"
        ? (data.policy ?? "Password does not meet the strength requirements.")
        : (data.description ??
          data.error_description ??
          data.error ??
          "Unable to create your account.");
    throw new Auth0PasswordError(data.code ?? "sign_up_failed", message);
  }
}

export async function fetchAuth0UserInfo(
  accessToken: string,
): Promise<Auth0User> {
  const res = await fetch(`${issuer}/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Auth0PasswordError(
      "userinfo_failed",
      "Unable to load your profile.",
    );
  }
  return (await res.json()) as Auth0User;
}

export async function establishSessionFromTokens(
  tokenResponse: Auth0TokenResponse,
) {
  const user = await fetchAuth0UserInfo(tokenResponse.access_token);
  const nowSeconds = Math.floor(Date.now() / 1000);

  await getSessionStore().set(
    await cookies(),
    await cookies(),
    {
      user,
      tokenSet: {
        accessToken: tokenResponse.access_token,
        idToken: tokenResponse.id_token,
        refreshToken: tokenResponse.refresh_token,
        scope: tokenResponse.scope,
        expiresAt: nowSeconds + tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
      },
      internal: {
        sid: crypto.randomUUID(),
        createdAt: nowSeconds,
      },
    },
    true,
  );

  return user;
}
