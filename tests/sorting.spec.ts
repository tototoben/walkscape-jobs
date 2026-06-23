import { test, expect } from "@playwright/test";

test.describe("DataTable sorting", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("table");
  });

  test("renders all rows", async ({ page }) => {
    const rows = page.locator("tbody tr");
    await expect(rows).not.toHaveCount(0);
  });

  test("sorts by Qty ascending on first click", async ({ page }) => {
    const qtyHeader = page.getByRole("button", { name: "Qty" });
    await qtyHeader.click();
    await page.waitForTimeout(300);

    const cells = page.locator("tbody tr td:nth-child(5)");
    const values = await cells.allTextContents();
    const nums = values.map((v) => Number(v.replace(/[^0-9.-]/g, "")));

    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeGreaterThanOrEqual(nums[i - 1]);
    }
  });

  test("sorts by Qty descending on second click", async ({ page }) => {
    const qtyHeader = page.getByRole("button", { name: "Qty" });
    await qtyHeader.click();
    await qtyHeader.click();
    await page.waitForTimeout(300);

    const cells = page.locator("tbody tr td:nth-child(5)");
    const values = await cells.allTextContents();
    const nums = values.map((v) => Number(v.replace(/[^0-9.-]/g, "")));

    for (let i = 1; i < nums.length; i++) {
      expect(nums[i]).toBeLessThanOrEqual(nums[i - 1]);
    }
  });

  test("sorts by Tier in tier-list order (S > A > B...)", async ({ page }) => {
    const tierHeader = page.getByRole("button", { name: "Tier" });
    await tierHeader.click();
    await page.waitForTimeout(300);

    const cells = page.locator("tbody tr td:nth-child(3)");
    const values = await cells.allTextContents();
    const tierRank: Record<string, number> = { S: 0, A: 1, B: 2, C: 3, D: 4, E: 5, F: 6 };
    const ranks = values.map((v) => tierRank[v.trim()] ?? 99);

    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThanOrEqual(ranks[i - 1]);
    }
  });

  test("sorts by Location alphabetically", async ({ page }) => {
    const locHeader = page.getByRole("button", { name: "Location" });
    await locHeader.click();
    await page.waitForTimeout(300);

    const cells = page.locator("tbody tr td:nth-child(2)");
    const values = await cells.allTextContents();

    for (let i = 1; i < values.length; i++) {
      expect(values[i].localeCompare(values[i - 1])).toBeGreaterThanOrEqual(0);
    }
  });
});
