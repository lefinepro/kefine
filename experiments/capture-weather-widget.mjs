import { chromium } from '@playwright/test';

const baseURL = process.env.PW_BASE_URL ?? 'http://127.0.0.1:4173';

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

async function prepare(page) {
  await page.route('**/api/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true}'
    });
  });
  await page.route('https://geocoding-api.open-meteo.com/**', async (route) => {
    const url = new URL(route.request().url());
    const query = url.searchParams.get('name') ?? 'Paris';

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
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(forecastResponse)
    });
  });
}

async function capture({ path, viewport }) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport });
  await page.addInitScript(() => {
    window.localStorage.clear();
    window.localStorage.setItem('kefine-theme', 'light');
  });
  await prepare(page);
  await page.goto(baseURL);
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="kefine-task-input"]');
    return el && Object.getOwnPropertySymbols(el).length > 0;
  });
  await page.getByTestId('kefine-task-input').fill('Weather Paris');
  await page.getByTestId('kefine-weather-widget').waitFor({ state: 'visible' });
  await page.waitForTimeout(700);
  await page.screenshot({ path, fullPage: false });
  await browser.close();
}

await capture({
  path: 'docs/screenshots/issue-108-weather-widget-desktop.png',
  viewport: { width: 1440, height: 1000 }
});
