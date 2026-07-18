import { z } from "zod";

export const identifierSchema = z.object({
  identifier: z
    .string({ error: "Enter your username or email" })
    .trim()
    .min(1, "Enter your username or email")
    .max(254, "That's too long"),
});

export const signInSchema = z.object({
  identifier: z
    .string({ error: "Enter your username or email" })
    .trim()
    .min(1, "Enter your username or email"),
  password: z
    .string({ error: "Enter your password" })
    .min(1, "Enter your password"),
});

const PASSWORD_CHAR_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];

export const signUpSchema = z.object({
  email: z
    .string({ error: "Enter a valid email" })
    .trim()
    .pipe(z.email({ error: "Enter a valid email" })),
  password: z
    .string({ error: "Enter a password" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "That password is too long")
    .refine(
      (value) =>
        PASSWORD_CHAR_CLASSES.filter((pattern) => pattern.test(value)).length >=
        3,
      "Use at least 3 of: lowercase, uppercase, numbers, symbols",
    ),
});
