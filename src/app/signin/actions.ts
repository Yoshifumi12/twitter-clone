"use server";

import { redirect } from "next/navigation";
import { parseWithZod } from "@conform-to/zod/v4";
import type { SubmissionResult } from "@conform-to/dom";
import { prisma } from "@/lib/prisma";
import { syncUserFromAuth0 } from "@/lib/auth0";
import {
  Auth0PasswordError,
  establishSessionFromTokens,
  generateAuth0Username,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/auth0-password";
import {
  identifierSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validations/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Auth0's `sub` claim is prefixed by connection: `auth0|...` for the password
 * database connection, `google-oauth2|...` for Google. Only the former has a
 * password to sign in with. */
function hasPasswordCredential(auth0Id: string): boolean {
  return auth0Id.startsWith("auth0|");
}

export type CheckIdentifierResult = SubmissionResult<string[]> & {
  mode?: "sign-in" | "sign-up";
  identifier?: string;
  email?: string;
};

export async function checkIdentifierAction(
  _prevState: CheckIdentifierResult | undefined,
  formData: FormData,
): Promise<CheckIdentifierResult> {
  const submission = parseWithZod(formData, { schema: identifierSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const identifier = submission.value.identifier;
  const isEmail = EMAIL_PATTERN.test(identifier);

  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { username: identifier },
    select: { auth0Id: true },
  });

  if (!user) {
    if (!isEmail) {
      return submission.reply({
        fieldErrors: {
          identifier: ["No account found. Enter an email to create one."],
        },
      });
    }

    return {
      ...submission.reply({ resetForm: false }),
      mode: "sign-up",
      identifier,
      email: identifier,
    };
  }

  if (!hasPasswordCredential(user.auth0Id)) {
    return submission.reply({
      fieldErrors: {
        identifier: [
          "This email address was used to sign up with Google. Continue with Google to sign in.",
        ],
      },
    });
  }

  return {
    ...submission.reply({ resetForm: false }),
    mode: "sign-in",
    identifier,
  };
}

export type PasswordResult = SubmissionResult<string[]>;

export async function signInAction(
  _prevState: PasswordResult | undefined,
  formData: FormData,
): Promise<PasswordResult> {
  const submission = parseWithZod(formData, { schema: signInSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const { identifier, password } = submission.value;
  const isEmail = EMAIL_PATTERN.test(identifier);

  const user = await prisma.user.findUnique({
    where: isEmail ? { email: identifier } : { username: identifier },
    select: { email: true, auth0Id: true },
  });

  if (!user || !hasPasswordCredential(user.auth0Id)) {
    return submission.reply({ formErrors: ["No account found."] });
  }

  try {
    const tokens = await signInWithPassword(user.email, password);
    const auth0User = await establishSessionFromTokens(tokens);
    await syncUserFromAuth0(auth0User);
  } catch (error) {
    if (error instanceof Auth0PasswordError) {
      return submission.reply({
        fieldErrors: { password: ["Incorrect username or password."] },
      });
    }
    throw error;
  }

  redirect("/");
}

export async function signUpAction(
  _prevState: PasswordResult | undefined,
  formData: FormData,
): Promise<PasswordResult> {
  const submission = parseWithZod(formData, { schema: signUpSchema });
  if (submission.status !== "success") {
    return submission.reply();
  }

  const { email, password } = submission.value;

  try {
    const username = generateAuth0Username(email.split("@")[0]);
    await signUpWithPassword(email, password, username);
    const tokens = await signInWithPassword(email, password);
    const auth0User = await establishSessionFromTokens(tokens);
    await syncUserFromAuth0(auth0User);
  } catch (error) {
    if (error instanceof Auth0PasswordError) {
      const message =
        error.code === "user_exists"
          ? "An account with this email already exists."
          : error.message;
      return submission.reply({ fieldErrors: { email: [message] } });
    }
    throw error;
  }

  redirect("/");
}
