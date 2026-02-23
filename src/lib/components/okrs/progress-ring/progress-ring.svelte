<script lang="ts">
  import { getProgressColor } from '$lib/utils/colors';

  interface Props {
    progress: number;
    size?: 'sm' | 'md' | 'lg';
    color?: string;
  }

  let { progress, size = 'md', color }: Props = $props();

  const sizeMap = { sm: 32, md: 48, lg: 64 };
  const fontSizeMap = { sm: 10, md: 14, lg: 18 };

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  const px = $derived(sizeMap[size]);
  const fontSize = $derived(fontSizeMap[size]);
  const clamped = $derived(Math.max(0, Math.min(100, progress)));
  const strokeDashoffset = $derived(circumference - (clamped / 100) * circumference);
  const strokeColor = $derived(color ?? getProgressColor(clamped));
  const roundedProgress = $derived(Math.round(clamped));
</script>

<svg
  width={px}
  height={px}
  viewBox="0 0 100 100"
  aria-label="Progress: {roundedProgress}%"
  role="img"
>
  <!-- Background track -->
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke="#e5e7eb"
    stroke-width="10"
  />
  <!-- Progress arc -->
  <circle
    cx="50"
    cy="50"
    r={radius}
    fill="none"
    stroke={strokeColor}
    stroke-width="10"
    stroke-linecap="round"
    stroke-dasharray={circumference}
    stroke-dashoffset={strokeDashoffset}
    transform="rotate(-90 50 50)"
    class="progress-arc"
  />
  <!-- Percentage text -->
  <text
    x="50"
    y="50"
    text-anchor="middle"
    dominant-baseline="central"
    font-size={fontSize}
    font-weight="700"
    fill="#111827"
  >{roundedProgress}%</text>
</svg>

<style>
  @import './progress-ring.css';
</style>
