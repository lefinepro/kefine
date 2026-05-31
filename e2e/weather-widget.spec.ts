import { expect, test, type Page } from '@playwright/test';

import { gotoAndWaitForReady, mockOrderApi } from './helpers/kefine';

const forecastResponse = {
  current: {
    time: '2026-05-31T14:00',
    temperature_2m: 14.4,
    apparent_temperature: 13.1,
    relative_humidity_2m: 60,
    wind_speed_10m: 8.7,
    pressure_msl: 1010.1,
    weather_code: 2
  },
  hourly: {
    time: [
      '2026-05-31T14:00',
      '2026-05-31T15:00',
      '2026-05-31T16:00',
      '2026-05-31T17:00',
      '2026-05-31T18:00',
      '2026-05-31T19:00',
      '2026-05-31T20:00',
      '2026-05-31T21:00'
    ],
    temperature_2m: [14.4, 16.2, 17.1, 17.4, 16.8, 15.3, 13.2, 12],
    precipitation_probability: [5, 6, 8, 10, 12, 8, 4, 2],
    weather_code: [2, 2, 1, 1, 0, 0, 0, 0]
  },
  daily: {
    time: [
      '2026-05-31',
      '2026-06-01',
      '2026-06-02',
      '2026-06-03',
      '2026-06-04',
      '2026-06-05',
      '2026-06-06'
    ],
    weather_code: [2, 3, 61, 1, 0, 80, 45],
    temperature_2m_max: [17.2, 20.1, 21.4, 22.8, 24.1, 19.6, 18.7],
    temperature_2m_min: [7.3, 8.1, 9.5, 11.2, 12.8, 10.4, 9.2],
    precipitation_probability_max: [6, 10, 60, 5, 0, 75, 20]
  }
};

async function mockWeatherApi(page: Page) {
  const geocodeQueries: string[] = [];
  const forecastUrls: string[] = [];

  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('name') ?? '';
    geocodeQueries.push(query);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          {
            name: query || 'Paris',
            latitude: 48.8566,
            longitude: 2.3522,
            country: 'France',
            country_code: 'FR'
          }
        ]
      })
    });
  });

  await page.route('https://api.open-meteo.com/**', async (route) => {
    forecastUrls.push(route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse)
    });
  });

  return { geocodeQueries, forecastUrls };
}

test.describe('Weather widget', () => {
  test('uses Gomel coordinates for the exact named prompt from the issue', async ({ page }) => {
    const weather = await mockWeatherApi(page);
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Weather Gomel,');

    const widget = page.getByTestId('kefine-weather-widget');
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('Gomel');
    await expect(widget).toContainText('Belarus');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('14°');

    expect(weather.geocodeQueries).toEqual([]);
    expect(weather.forecastUrls).toHaveLength(1);
    const forecastUrl = new URL(weather.forecastUrls[0] ?? '');
    expect(forecastUrl.searchParams.get('latitude')).toBe('52.4345');
    expect(forecastUrl.searchParams.get('longitude')).toBe('30.9754');
  });

  test('looks up a named location prompt and switches units', async ({ page }) => {
    const weather = await mockWeatherApi(page);
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Weather Paris');

    const widget = page.getByTestId('kefine-weather-widget');
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('Paris');
    await expect(widget).toContainText('France');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('14°');
    await expect(widget.locator("[data-part='weather-hour']")).toHaveCount(8);
    await expect(widget.locator("[data-part='weather-day']")).toHaveCount(7);
    expect(weather.geocodeQueries).toContain('Paris');

    const fahrenheitButton = widget.getByRole('button', { name: 'Fahrenheit' });
    await expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');
    await fahrenheitButton.click();
    await expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('58°');
  });

  test('uses browser geolocation for a bare weather prompt', async ({ page }) => {
    await page.context().grantPermissions(['geolocation']);
    await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
    const weather = await mockWeatherApi(page);
    await mockOrderApi(page);
    await gotoAndWaitForReady(page);

    await page.getByTestId('kefine-task-input').fill('Weather');

    const widget = page.getByTestId('kefine-weather-widget');
    await expect(widget).toBeVisible();
    await expect(widget).toContainText('Current location');
    await expect(widget.locator("[data-part='weather-current-temp']")).toContainText('14°');

    expect(weather.geocodeQueries).toEqual([]);
    expect(weather.forecastUrls).toHaveLength(1);
    const forecastUrl = new URL(weather.forecastUrls[0] ?? '');
    expect(forecastUrl.searchParams.get('latitude')).toBe('40.7128');
    expect(forecastUrl.searchParams.get('longitude')).toBe('-74.006');
  });
});
