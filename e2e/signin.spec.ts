import { expect, test } from "@playwright/test";

/**
 * These specs deliberately stop short of submitting the identifier or
 * password forms: doing so would hit real Auth0 endpoints (and, for
 * sign-up, permanently create an account in whatever tenant AUTH0_DOMAIN
 * points at) with no way for an automated run to clean up afterwards.
 */
test.describe("sign-in page", () => {
  test("links the Google button to the Google connection route", async ({
    page,
  }) => {
    await page.goto("/signin");

    const googleLink = page.getByRole("link", {
      name: /continue with google/i,
    });
    await expect(googleLink).toBeVisible();
    await expect(googleLink).toHaveAttribute(
      "href",
      "/auth/login?connection=google-oauth2",
    );
  });

  test("disables Continue until an identifier is entered", async ({ page }) => {
    await page.goto("/signin");

    const continueButton = page.getByRole("button", { name: /continue/i });
    const identifierInput = page.getByPlaceholder("Email or username");

    await expect(continueButton).toBeDisabled();

    await identifierInput.fill("someone@example.com");
    await expect(continueButton).toBeEnabled();

    await identifierInput.fill("");
    await expect(continueButton).toBeDisabled();

    await identifierInput.fill("   ");
    await expect(continueButton).toBeDisabled();
  });

  test("does not render the password dialog until an identifier is submitted", async ({
    page,
  }) => {
    await page.goto("/signin");

    await expect(page.getByRole("dialog", { name: /password/i })).toHaveCount(
      0,
    );
  });
});
