<script lang="ts">
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { getWeatherTarget, type WeatherTarget } from '$lib/kefine/weather-intent';
  import {
    buildOpenMeteoForecastUrl,
    buildOpenMeteoGeocodeUrl,
    buildWeatherForecastFromOpenMeteo,
    formatTemperature,
    pickOpenMeteoGeocodeResult,
    resolveKnownWeatherLocation,
    type WeatherCondition,
    type WeatherForecast,
    type WeatherResolvedLocation,
    type WeatherUnit
  } from '$lib/kefine/weather-forecast';

  let { active = false, query = '' }: { active?: boolean; query?: string } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.weatherWidget);
  const target = $derived(active ? getWeatherTarget(query) : null);
  const targetKey = $derived(target ? (target.kind === 'named' ? `named:${target.query.toLocaleLowerCase()}` : 'geo') : '');

  type LoadState = 'idle' | 'locating' | 'loading' | 'ready' | 'error';

  let unit = $state<WeatherUnit>('celsius');
  let forecast = $state<WeatherForecast | null>(null);
  let loadState = $state<LoadState>('idle');
  let statusMessage = $state('');
  let activeController: AbortController | null = null;
  let requestSequence = 0;

  onDestroy(() => {
    activeController?.abort();
  });

  function widgetReveal(_node: HTMLElement, { duration = 460 }: { duration?: number } = {}) {
    return {
      duration,
      easing: cubicOut,
      css: (t: number) => {
        const eased = cubicOut(t);
        const y = -18 * (1 - eased);
        const scale = 0.965 + 0.035 * eased;
        return `opacity:${Math.min(1, t * 1.2)}; transform:translateY(${y}px) scale(${scale.toFixed(4)}); transform-origin: top center;`;
      }
    };
  }

  function conditionLabel(condition: WeatherCondition): string {
    if (condition === 'mostly-cloudy') return copy.conditions.mostlyCloudy;
    if (condition === 'partly-cloudy') return copy.conditions.partlyCloudy;
    if (condition === 'clear-night') return copy.conditions.clearNight;
    if (condition === 'rain') return copy.conditions.rain;
    if (condition === 'cloudy') return copy.conditions.cloudy;
    return copy.conditions.sunny;
  }

  function conditionIcon(condition: WeatherCondition): string {
    if (condition === 'mostly-cloudy') return 'mdi:weather-partly-cloudy';
    if (condition === 'partly-cloudy') return 'mdi:weather-partly-cloudy';
    if (condition === 'clear-night') return 'mdi:weather-night';
    if (condition === 'rain') return 'mdi:weather-rainy';
    if (condition === 'cloudy') return 'mdi:weather-cloudy';
    return 'mdi:weather-sunny';
  }

  function selectUnit(selectedUnit: WeatherUnit) {
    unit = selectedUnit;
  }

  function handleUnitPointerDown(event: PointerEvent, selectedUnit: WeatherUnit) {
    if (event.pointerType === 'touch') {
      event.preventDefault();
    }
    selectUnit(selectedUnit);
  }

  function temp(celsius: number, selectedUnit: WeatherUnit): string {
    return formatTemperature(celsius, selectedUnit);
  }

  async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
    const response = await fetch(url, { signal });
    if (!response.ok) {
      throw new Error(`Weather request failed with ${response.status}`);
    }

    return await response.json() as T;
  }

  function getCurrentPosition(signal: AbortSignal): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!browser || !navigator.geolocation) {
        reject(new Error(copy.geolocationUnavailable));
        return;
      }

      // Skip the API call if permission is already denied — Chrome logs a
      // console warning every time getCurrentPosition is called while blocked.
      const check = navigator.permissions?.query?.({ name: 'geolocation' } as PermissionDescriptor);
      if (check) {
        void check.then((status) => {
          if (status.state === 'denied') {
            reject(new DOMException('Geolocation permission denied.', 'NotAllowedError'));
            return;
          }
          requestPosition(signal, resolve, reject);
        });
        return;
      }

      requestPosition(signal, resolve, reject);
    });
  }

  function requestPosition(
    signal: AbortSignal,
    resolve: (position: GeolocationPosition) => void,
    reject: (reason: unknown) => void
  ) {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    signal.addEventListener('abort', abort, { once: true });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        signal.removeEventListener('abort', abort);
        resolve(position);
      },
      (error) => {
        signal.removeEventListener('abort', abort);
        reject(error);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 10 * 60 * 1000,
        timeout: 10_000
      }
    );
  }

  async function resolveNamedLocation(queryText: string, signal: AbortSignal): Promise<WeatherResolvedLocation | null> {
    const known = resolveKnownWeatherLocation(queryText);
    if (known) {
      return known;
    }

    const response = await fetchJson<Parameters<typeof pickOpenMeteoGeocodeResult>[1]>(
      buildOpenMeteoGeocodeUrl(queryText),
      signal
    );
    return pickOpenMeteoGeocodeResult(queryText, response);
  }

  async function resolveLocationByIP(signal: AbortSignal): Promise<WeatherResolvedLocation | null> {
    type IpApiResponse = {
      status: string;
      lat?: number;
      lon?: number;
      city?: string;
      country?: string;
      countryCode?: string;
    };

    try {
      const response = await fetchJson<IpApiResponse>('http://ip-api.com/json/', signal);
      if (response.status !== 'success' || !response.lat || !response.lon || !response.city) {
        return null;
      }
      return {
        name: response.city.trim(),
        country: response.country?.trim() || undefined,
        countryCode: response.countryCode?.trim() || undefined,
        latitude: response.lat,
        longitude: response.lon
      };
    } catch {
      return null;
    }
  }

  async function loadWeather(nextTarget: WeatherTarget, signal: AbortSignal, sequence: number) {
    let location: WeatherResolvedLocation | null = null;

    if (nextTarget.kind === 'named') {
      loadState = 'loading';
      statusMessage = copy.loadingNamed(nextTarget.query);
      location = await resolveNamedLocation(nextTarget.query, signal);
      if (!location) {
        throw new Error(copy.locationNotFound(nextTarget.query));
      }
    } else {
      loadState = 'locating';
      statusMessage = copy.geolocationPrompt;
      try {
        const position = await getCurrentPosition(signal);
        location = {
          name: copy.currentLocation,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      } catch {
        statusMessage = copy.geolocationUnavailable;
        location = await resolveLocationByIP(signal);
      }
      if (!location) {
        throw new Error(copy.geolocationUnavailable);
      }
      loadState = 'loading';
      statusMessage = copy.loadingForecast;
    }

    const response = await fetchJson<Parameters<typeof buildWeatherForecastFromOpenMeteo>[1]>(
      buildOpenMeteoForecastUrl(location),
      signal
    );

    if (sequence !== requestSequence || signal.aborted) {
      return;
    }

    forecast = buildWeatherForecastFromOpenMeteo(location, response);
    loadState = 'ready';
    statusMessage = '';
  }

  function errorMessage(error: unknown): string {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return '';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return copy.forecastUnavailable;
  }

  $effect(() => {
    const nextTarget = target;
    const nextKey = targetKey;

    activeController?.abort();
    activeController = null;
    requestSequence += 1;

    if (!active || !nextTarget || !nextKey || !browser) {
      forecast = null;
      loadState = 'idle';
      statusMessage = '';
      return;
    }

    const sequence = requestSequence;
    const controller = new AbortController();
    activeController = controller;
    forecast = null;

    const delay = nextTarget.kind === 'named' ? 250 : 550;
    loadState = nextTarget.kind === 'geolocation' ? 'locating' : 'loading';
    statusMessage = nextTarget.kind === 'geolocation' ? copy.geolocationPrompt : copy.loadingNamed(nextTarget.query);

    const timer = window.setTimeout(() => {
      void loadWeather(nextTarget, controller.signal, sequence).catch((error) => {
        if (sequence !== requestSequence || controller.signal.aborted) {
          return;
        }

        forecast = null;
        loadState = 'error';
        statusMessage = copy.typeCityHint;
      });
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  });
</script>

{#if active && target}
  <kefine-weather-widget
    transition:widgetReveal
    aria-label={forecast ? `${copy.title} ${forecast.location}` : copy.title}
    data-testid="kefine-weather-widget"
  >
    <kefine-weather-card data-state={loadState}>
      {#if forecast}
        <kefine-weather-head>
          <kefine-weather-title>
            <strong>{conditionLabel(forecast.condition)}</strong>
            <lefine-text>
              {forecast.location}{#if forecast.country}, {forecast.country}{/if}
            </lefine-text>
          </kefine-weather-title>

          <kefine-weather-units role="group" aria-label={copy.unitLabel}>
            <button
              type="button"
              data-active={unit === 'celsius'}
              aria-pressed={unit === 'celsius'}
              aria-label={copy.celsius}
              onpointerdown={(event) => handleUnitPointerDown(event, 'celsius')}
              onclick={() => selectUnit('celsius')}
            >
              °C
            </button>
            <button
              type="button"
              data-active={unit === 'fahrenheit'}
              aria-pressed={unit === 'fahrenheit'}
              aria-label={copy.fahrenheit}
              onpointerdown={(event) => handleUnitPointerDown(event, 'fahrenheit')}
              onclick={() => selectUnit('fahrenheit')}
            >
              °F
            </button>
          </kefine-weather-units>
        </kefine-weather-head>

        <kefine-weather-now>
          <kefine-weather-primary>
            <kefine-weather-main-icon aria-hidden="true">
              <Icon icon={conditionIcon(forecast.condition)} aria-hidden="true" />
            </kefine-weather-main-icon>
            <kefine-weather-current>
              <strong data-part="weather-current-temp">{temp(forecast.currentTempC, unit)}</strong>
              <lefine-text>{copy.feelsLike} {temp(forecast.feelsLikeC, unit)}</lefine-text>
            </kefine-weather-current>
          </kefine-weather-primary>

          <kefine-weather-metrics aria-label={copy.metricsLabel}>
            <kefine-weather-metric>
              <lefine-text>{copy.humidity}</lefine-text>
              <strong>{forecast.humidity}%</strong>
            </kefine-weather-metric>
            <kefine-weather-metric>
              <lefine-text>{copy.wind}</lefine-text>
              <strong>{forecast.windKph} {copy.windUnit}</strong>
            </kefine-weather-metric>
            <kefine-weather-metric>
              <lefine-text>{copy.pressure}</lefine-text>
              <strong>{forecast.pressureHpa} {copy.pressureUnit}</strong>
            </kefine-weather-metric>
          </kefine-weather-metrics>
        </kefine-weather-now>

        <kefine-weather-hourly data-part="weather-hourly" aria-label={copy.hourlyLabel}>
          {#each forecast.hourly as hour (`${hour.time}-${hour.condition}`)}
            <kefine-weather-hour data-part="weather-hour">
              <lefine-text>{hour.time}</lefine-text>
              <kefine-weather-small-icon aria-hidden="true">
                <Icon icon={conditionIcon(hour.condition)} aria-hidden="true" />
              </kefine-weather-small-icon>
              <strong>{temp(hour.temperatureC, unit)}</strong>
            </kefine-weather-hour>
          {/each}
        </kefine-weather-hourly>

        <kefine-weather-daily data-part="weather-daily" aria-label={copy.dailyLabel}>
          {#each forecast.daily as day (`${day.date}-${day.condition}`)}
            <kefine-weather-day data-part="weather-day">
              <lefine-text>{copy.weekdays[day.weekdayIndex] ?? day.label}</lefine-text>
              <kefine-weather-small-icon aria-hidden="true">
                <Icon icon={conditionIcon(day.condition)} aria-hidden="true" />
              </kefine-weather-small-icon>
              {#if day.precipitationChance > 0}
                <kefine-weather-rain>{day.precipitationChance}%</kefine-weather-rain>
              {:else}
                <kefine-weather-rain aria-hidden="true"> </kefine-weather-rain>
              {/if}
              <kefine-weather-temp-range
                aria-label={`${copy.highLabel} ${temp(day.highC, unit)}, ${copy.lowLabel} ${temp(day.lowC, unit)}`}
              >
                <strong>{temp(day.highC, unit)}</strong>
                <lefine-text>{temp(day.lowC, unit)}</lefine-text>
              </kefine-weather-temp-range>
            </kefine-weather-day>
          {/each}
        </kefine-weather-daily>
      {:else}
        <kefine-weather-status>
          <kefine-weather-main-icon aria-hidden="true">
            <Icon icon="mdi:map-marker-radius" aria-hidden="true" />
          </kefine-weather-main-icon>
          <kefine-weather-status-copy>
            <strong>{copy.title}</strong>
            {#if loadState === 'error'}
              <lefine-text>{copy.typeCityHint}</lefine-text>
            {:else}
              <lefine-text>{statusMessage || copy.loadingForecast}</lefine-text>
            {/if}
          </kefine-weather-status-copy>
        </kefine-weather-status>
      {/if}
    </kefine-weather-card>
  </kefine-weather-widget>
{/if}

<style>
  kefine-weather-widget {
    display: flex;
    flex-direction: column;
    width: min(100%, calc(100vw - 7rem));
    max-width: 64rem;
    justify-self: center;
    margin: 0.55rem auto 0.9rem;
  }

  kefine-weather-card {
    display: flex;
    flex-direction: column;
    gap: clamp(0.8rem, 1.7vw, 1rem);
    min-width: 0;
    padding: clamp(0.8rem, 1.7vw, 1.05rem);
    overflow: hidden;
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-sm);
    background:
      radial-gradient(circle at 12% 10%, color-mix(in oklab, #ffd45f 16%, transparent), transparent 28%),
      linear-gradient(135deg, color-mix(in oklab, #62b8ff 10%, transparent), transparent 58%),
      var(--kef-bg-soft);
  }

  kefine-weather-head,
  kefine-weather-now {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.75rem;
    align-items: start;
  }

  kefine-weather-title,
  kefine-weather-current,
  kefine-weather-metric,
  kefine-weather-hour,
  kefine-weather-day,
  kefine-weather-temp-range,
  kefine-weather-status-copy {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  kefine-weather-title,
  kefine-weather-status-copy {
    gap: 0.12rem;
  }

  kefine-weather-title strong,
  kefine-weather-status-copy strong {
    color: var(--lefine-text);
    font-size: clamp(0.95rem, 1.9vw, 1.05rem);
    line-height: 1.15;
  }

  kefine-weather-title lefine-text,
  kefine-weather-current lefine-text,
  kefine-weather-metric lefine-text,
  kefine-weather-hour lefine-text,
  kefine-weather-day lefine-text,
  kefine-weather-status-copy lefine-text {
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
    line-height: 1.2;
  }

  kefine-weather-units {
    display: inline-grid;
    grid-template-columns: repeat(2, 2.05rem);
    align-items: center;
    padding: 0.14rem;
    border: 1px solid var(--kef-line);
    border-radius: 999px;
    background: color-mix(in oklab, var(--kef-bg-card) 88%, transparent);
  }

  kefine-weather-units button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    height: 1.7rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--lefine-text-soft);
    font-size: 0.76rem;
    font-weight: 700;
    cursor: pointer;
    transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
  }

  kefine-weather-units button:hover,
  kefine-weather-units button[data-active='true'] {
    background: var(--kef-primary);
    color: var(--kef-on-primary, #fff);
  }

  kefine-weather-units button:hover {
    transform: translateY(-1px);
  }

  kefine-weather-now {
    grid-template-columns: minmax(8.2rem, 0.55fr) minmax(0, 1fr);
    align-items: center;
  }

  kefine-weather-primary,
  kefine-weather-status {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    min-width: 0;
  }

  kefine-weather-status {
    min-height: 5.1rem;
  }

  kefine-weather-main-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 auto;
    width: clamp(2.75rem, 8vw, 3.4rem);
    height: clamp(2.75rem, 8vw, 3.4rem);
    border-radius: 50%;
    background: color-mix(in oklab, #ffd45f 18%, var(--kef-bg-card));
    color: #ffd45f;
    font-size: clamp(1.45rem, 4.8vw, 1.95rem);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--kef-line) 75%, transparent);
  }

  kefine-weather-card[data-state='error'] kefine-weather-main-icon {
    background: color-mix(in oklab, #ff6b5f 14%, var(--kef-bg-card));
    color: #ff7b6f;
  }

  kefine-weather-main-icon :global(svg) {
    width: 58%;
    height: 58%;
  }

  kefine-weather-current {
    gap: 0.1rem;
  }

  kefine-weather-current strong {
    color: var(--lefine-text);
    font-size: clamp(1.9rem, 6.5vw, 2.65rem);
    line-height: 0.98;
    letter-spacing: 0;
  }

  kefine-weather-metrics {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.46rem;
    min-width: 0;
  }

  kefine-weather-metric {
    justify-content: center;
    gap: 0.12rem;
    min-height: 3rem;
    padding: 0.5rem 0.55rem;
    border: 1px solid color-mix(in oklab, var(--kef-line) 76%, transparent);
    border-radius: var(--kef-radius-xs, 0.35rem);
    background: color-mix(in oklab, var(--kef-bg-card) 74%, transparent);
  }

  kefine-weather-metric strong {
    color: var(--lefine-text);
    font-size: 0.82rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }

  kefine-weather-hourly,
  kefine-weather-daily {
    display: grid;
    min-width: 0;
  }

  kefine-weather-hourly {
    grid-template-columns: repeat(8, minmax(2.35rem, 1fr));
    gap: 0.2rem;
    padding-top: 0.16rem;
  }

  kefine-weather-hour,
  kefine-weather-day {
    align-items: center;
    justify-content: start;
    gap: 0.22rem;
    min-height: 4.35rem;
    padding: 0.32rem 0.26rem;
    border-radius: var(--kef-radius-xs, 0.35rem);
    background: color-mix(in oklab, var(--kef-bg-card) 44%, transparent);
    text-align: center;
  }

  kefine-weather-hour strong,
  kefine-weather-day strong {
    color: var(--lefine-text);
    font-size: 0.75rem;
    line-height: 1.1;
  }

  kefine-weather-small-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 1.25rem;
    color: #ffd45f;
    font-size: 1.05rem;
    line-height: 1;
  }

  kefine-weather-small-icon :global(svg) {
    width: 1.05rem;
    height: 1.05rem;
  }

  kefine-weather-daily {
    grid-template-columns: repeat(7, minmax(2.75rem, 1fr));
    gap: 0.24rem;
  }

  kefine-weather-day {
    min-height: 5.25rem;
  }

  kefine-weather-rain {
    display: block;
    min-height: 0.88rem;
    color: #8f7bff;
    font-size: 0.68rem;
    font-weight: 800;
    line-height: 1;
  }

  kefine-weather-temp-range {
    align-items: center;
    gap: 0.08rem;
  }

  kefine-weather-temp-range lefine-text {
    font-size: 0.68rem;
  }

  @media (max-width: 680px) {
    kefine-weather-widget {
      width: 100%;
      max-width: 100%;
    }

    kefine-weather-head,
    kefine-weather-now {
      grid-template-columns: 1fr;
    }

    kefine-weather-units {
      justify-self: start;
    }

    kefine-weather-metrics {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    kefine-weather-hourly,
    kefine-weather-daily {
      overflow-x: auto;
      padding-bottom: 0.2rem;
      -webkit-overflow-scrolling: touch;
    }

    kefine-weather-hourly {
      grid-template-columns: repeat(8, minmax(2.55rem, 1fr));
    }

    kefine-weather-daily {
      grid-template-columns: repeat(7, minmax(3rem, 1fr));
    }
  }

  @media (max-width: 420px) {
    kefine-weather-card {
      padding: 0.72rem;
    }

    kefine-weather-primary,
    kefine-weather-status {
      gap: 0.58rem;
    }

    kefine-weather-metrics {
      grid-template-columns: 1fr;
    }
  }
</style>
