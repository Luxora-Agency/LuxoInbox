<script setup>
import { useAttrs } from 'vue';
import { useMapGetter } from 'dashboard/composables/store';

const attrs = useAttrs();
const globalConfig = useMapGetter('globalConfig/get');
</script>

<template>
  <img
    v-if="globalConfig.logoThumbnail"
    v-bind="attrs"
    :src="globalConfig.logoThumbnail"
  />
  <svg
    v-else
    v-once
    v-bind="attrs"
    class="text-orbis-cream"
    width="16"
    height="16"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="32" height="32" rx="7" fill="#010828" />
    <g transform="translate(1.6 1.6) scale(0.9)">
      <circle cx="16" cy="16" r="6.2" fill="currentColor" />
      <ellipse
        cx="16"
        cy="16"
        rx="13.2"
        ry="5.4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        opacity="0.85"
        transform="rotate(-28 16 16)"
      />
      <circle cx="26.2" cy="9.4" r="2.7" fill="#6FFF00" />
    </g>
  </svg>
</template>
