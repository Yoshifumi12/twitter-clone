import { describe, expect, it } from "vitest";
import { identifierSchema, signInSchema, signUpSchema } from "./auth";

describe("identifierSchema", () => {
  it("accepts a trimmed non-empty identifier", () => {
    const result = identifierSchema.safeParse({ identifier: "  someone  " });
    expect(result.success).toBe(true);
    expect(result.success && result.data.identifier).toBe("someone");
  });

  it("rejects an empty identifier", () => {
    const result = identifierSchema.safeParse({ identifier: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an identifier made only of whitespace", () => {
    const result = identifierSchema.safeParse({ identifier: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects an identifier longer than 254 characters", () => {
    const result = identifierSchema.safeParse({
      identifier: "a".repeat(255),
    });
    expect(result.success).toBe(false);
  });

  it("accepts an identifier at the 254 character boundary", () => {
    const result = identifierSchema.safeParse({
      identifier: "a".repeat(254),
    });
    expect(result.success).toBe(true);
  });
});

describe("signInSchema", () => {
  it("accepts a valid identifier and password", () => {
    const result = signInSchema.safeParse({
      identifier: "someone@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing password", () => {
    const result = signInSchema.safeParse({
      identifier: "someone@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a missing identifier", () => {
    const result = signInSchema.safeParse({
      identifier: "",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("does not enforce password strength (sign-in only checks presence)", () => {
    const result = signInSchema.safeParse({
      identifier: "someone@example.com",
      password: "a",
    });
    expect(result.success).toBe(true);
  });
});

describe("signUpSchema", () => {
  it("accepts a valid email and strong password", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: "Abcd1234",
    });
    expect(result.success).toBe(true);
  });

  it("trims and validates the email", () => {
    const result = signUpSchema.safeParse({
      email: "  someone@example.com  ",
      password: "Abcd1234",
    });
    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe("someone@example.com");
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({
      email: "not-an-email",
      password: "Abcd1234",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password longer than 128 characters", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: `Ab1${"a".repeat(126)}`,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password using fewer than 3 character classes", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: "alllowercase",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a password with exactly 3 of the 4 character classes", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: "Abcdefg1",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a password using all 4 character classes", () => {
    const result = signUpSchema.safeParse({
      email: "someone@example.com",
      password: "Abcd123!",
    });
    expect(result.success).toBe(true);
  });
});
