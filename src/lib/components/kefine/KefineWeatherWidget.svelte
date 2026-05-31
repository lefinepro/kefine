<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import Icon from '@iconify/svelte';
  import { kefineLocaleText } from '$lib/constants/kefine-locale';
  import { extractWeatherLocation } from '$lib/kefine/weather-intent';
  import {
    buildWeatherForecast,
    formatTemperature,
    type WeatherCondition,
    type WeatherUnit
  } from '$lib/kefine/weather-forecast';

  let { active = false, query = '' }: { active?: boolean; query?: string } = $props();

  const localeText = $derived($kefineLocaleText);
  const copy = $derived(localeText.weatherWidget);

  let unit = $state<WeatherUnit>('celsius');
  const location = $derived(extractWeatherLocation(query, copy.defaultLocation));
  const forecast = $derived(buildWeatherForecast(location));

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
</script>

{#if active}
  <kefine-weather-widget
    transition:widgetReveal
    aria-label={`${copy.title} ${forecast.location}`}
    data-testid="kefine-weather-widget"
  >
    <kefine-weather-card>
      <kefine-weather-head>
        <kefine-weather-title>
          <strong>{conditionLabel(forecast.condition)}</strong>
          <lefine-text>
            {forecast.location}{#if forecast.countryCode === 'belarus'}, {copy.belarus}{/if}
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
        {#each forecast.daily as day (`${day.dayIndex}-${day.condition}`)}
          <kefine-weather-day data-part="weather-day">
            <lefine-text>{copy.days[day.dayIndex] ?? copy.days[0]}</lefine-text>
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
    </kefine-weather-card>
  </kefine-weather-widget>
{/if}

<style>
  kefine-weather-widget {
    display: flex;
    flex-direction: column;
    margin: 0.55rem 0 0.9rem;
  }

  kefine-weather-card {
    display: flex;
    flex-direction: column;
    gap: clamp(0.8rem, 1.7vw, 1rem);
    padding: clamp(0.8rem, 1.7vw, 1.05rem);
    border: 1px solid var(--kef-line);
    border-radius: var(--kef-radius-sm);
    background:
      radial-gradient(circle at 12% 10%, color-mix(in oklab, #ffd45f 16%, transparent), transparent 28%),
      linear-gradient(135deg, color-mix(in oklab, #62b8ff 10%, transparent), transparent 58%),
      var(--kef-bg-soft);
    min-width: 0;
    overflow: hidden;
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
  kefine-weather-temp-range {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  kefine-weather-title {
    gap: 0.12rem;
  }

  kefine-weather-title strong {
    color: var(--lefine-text);
    font-size: clamp(0.95rem, 1.9vw, 1.05rem);
    line-height: 1.15;
  }

  kefine-weather-title lefine-text,
  kefine-weather-current lefine-text,
  kefine-weather-metric lefine-text,
  kefine-weather-hour lefine-text,
  kefine-weather-day lefine-text {
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

  kefine-weather-primary {
    display: flex;
    align-items: center;
    gap: 0.72rem;
    min-width: 0;
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

    kefine-weather-primary {
      gap: 0.58rem;
    }

    kefine-weather-metrics {
      grid-template-columns: 1fr;
    }
  }
</style>
