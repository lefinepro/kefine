import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page).toHaveTitle(/Kefine/);
  });

  test('should have hero section with slogan', async ({ page }) => {
    const heroSection = page.locator('kf-landing-hero');
    await expect(heroSection).toBeVisible();

    // Check slogan is present
    const slogan = heroSection.getAttribute('slogan');
    expect(slogan).toBeDefined();
  });

  test('should have use-case section', async ({ page }) => {
    const useCaseSection = page.locator('kf-use-case-section');
    await expect(useCaseSection).toBeVisible();
  });

  test('should have combobox with placeholder', async ({ page }) => {
    const heroSection = page.locator('kf-landing-hero');
    const placeholder = await heroSection.getAttribute('placeholder');
    expect(placeholder).toBe('Select a use-case');
  });

  test('should have proper aria labels for accessibility', async ({ page }) => {
    const heroSection = page.locator('kf-landing-hero');
    const ariaLabel = await heroSection.getAttribute('aria-label');
    expect(ariaLabel).toBe('Main hero section');

    const useCaseSection = page.locator('kf-use-case-section');
    const useCaseAriaLabel = await useCaseSection.getAttribute('aria-label');
    expect(useCaseAriaLabel).toBe('Use-case examples section');
  });

  test('should load use-cases data endpoint', async ({ page }) => {
    const response = await page.request.get('/data/use-cases.json');
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data).toHaveProperty('useCases');
    expect(data.useCases).toBeInstanceOf(Array);
    expect(data.useCases.length).toBeGreaterThan(0);
  });

  test('should have correct viewport meta tag', async ({ page }) => {
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });

  test('should have meta description', async ({ page }) => {
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).toContain("Deadline's on fire");
  });
});

test.describe('Landing Page - Responsive Layout', () => {
  test('should render correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const heroSection = page.locator('kf-landing-hero');
    await expect(heroSection).toBeVisible();
  });

  test('should render correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    const heroSection = page.locator('kf-landing-hero');
    await expect(heroSection).toBeVisible();
  });

  test('should render correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    const heroSection = page.locator('kf-landing-hero');
    await expect(heroSection).toBeVisible();

    const useCaseSection = page.locator('kf-use-case-section');
    await expect(useCaseSection).toBeVisible();
  });
});

test.describe('Landing Page - Static Assets', () => {
  test('should load main JavaScript bundle', async ({ page }) => {
    await page.goto('/');

    // Check that the main.js script tag is present
    const mainScript = page.locator('script[src="/dist/assets/main.js"]');
    await expect(mainScript).toHaveCount(1);
  });

  test('should load main stylesheet', async ({ page }) => {
    await page.goto('/');

    // Check that the style.css link is present
    const stylesheet = page.locator('link[href="/dist/assets/style.css"]');
    await expect(stylesheet).toHaveCount(1);
  });
});
