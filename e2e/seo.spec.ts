import { expect, test } from "@playwright/test";

/**
 * SEO contract — metadata, Open Graph / Twitter cards, and the AutoWash
 * JSON-LD block emitted from src/app/layout.tsx.
 */
test.describe("seo", () => {
  test("title and meta description", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(
      "Auto Detailing & Ceramic Coating | Framingham MA — We Care Car Care",
    );
    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveAttribute(
      "content",
      /Top-rated auto detailing, ceramic coating & paint protection in Framingham/,
    );
  });

  test("Open Graph and Twitter card tags", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      "Auto Detailing & Ceramic Coating | Framingham MA",
    );
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute("content", "website");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/images\/hero-car\.webp$/,
    );
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });

  test("html lang attribute set", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("AutoWash JSON-LD carries business facts", async ({ page }) => {
    await page.goto("/");
    const raw = await page
      .locator('script[type="application/ld+json"]')
      .first()
      .textContent();
    expect(raw).toBeTruthy();
    const json = JSON.parse(raw as string) as Record<string, unknown>;
    expect(json["@type"]).toBe("AutoWash");
    expect(json["telephone"]).toBe("+1-508-290-7476");
    const address = json["address"] as Record<string, string>;
    expect(address.addressLocality).toBe("Framingham");
    expect(address.addressRegion).toBe("MA");
    const rating = json["aggregateRating"] as Record<string, string>;
    expect(rating.ratingValue).toBe("5.0");
    // areaServed enumerates the service-area cities
    const areas = json["areaServed"] as Array<Record<string, string>>;
    expect(areas.length).toBeGreaterThan(3);
  });
});
