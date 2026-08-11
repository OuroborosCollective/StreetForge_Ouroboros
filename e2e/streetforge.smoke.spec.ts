import { expect, test } from "@playwright/test";

test.describe("StreetForge browser smoke", () => {
  test("renders the start screen and routes unauthenticated entry into character login", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("DER BLOCK").first()).toBeVisible();
    await page.getByRole("button", { name: /DEN BLOCK BETRETEN/i }).click();
    await expect(page.getByRole("dialog", { name: /character selection/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /MIT MANUS ANMELDEN/i })).toBeVisible();
  });

  test("exposes a healthy, gated canvas without synthetic game state", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".streetforge-shell")).toHaveAttribute("data-runtime", "ready");
    const hasWebGl = await page.locator("canvas.streetforge-canvas").evaluate((canvas) => {
      const surface = canvas as HTMLCanvasElement;
      return surface.width > 0 && surface.height > 0 && Boolean(surface.getContext("webgl2") || surface.getContext("webgl"));
    });
    expect(hasWebGl).toBeTruthy();
    await expect(page.getByText("DER BLOCK").first()).toBeVisible();
    await expect(page.getByText(/CANVAS LINK UNAVAILABLE/i)).not.toBeVisible();
  });

  test("loads the itch.io wrapper with an explicit HTTPS game origin", async ({ page }) => {
    await page.goto("/itchio.html?gameUrl=https://example.com/streetforge/");
    await expect(page.locator("#streetforge-client")).toHaveAttribute("src", "https://example.com/streetforge/");
  });
});
