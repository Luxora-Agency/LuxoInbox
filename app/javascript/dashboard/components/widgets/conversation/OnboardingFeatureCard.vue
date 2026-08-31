<script setup>
defineProps({
  icon: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  to: {
    type: String,
    default: '',
  },
  linkText: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div
    class="h-full w-full bg-n-surface-2 border border-n-weak rounded-lg p-4 flex flex-col"
  >
    <div class="flex-1 flex items-center justify-center">
      <div
        class="relative flex items-center justify-center w-full h-36 overflow-hidden border rounded-lg bg-n-solid-2 border-n-weak"
      >
        <svg
          aria-hidden="true"
          class="absolute inset-0 w-full h-full pointer-events-none text-n-slate-7"
          viewBox="0 0 240 144"
          fill="none"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            stroke="currentColor"
            stroke-width="1"
            opacity="0.5"
            transform="rotate(-28 120 72)"
          >
            <ellipse cx="120" cy="72" rx="96" ry="39" />
            <ellipse cx="120" cy="72" rx="66" ry="27" />
          </g>
          <g class="text-orbis-neon" fill="currentColor">
            <circle cx="206" cy="41" r="9" opacity="0.16" />
            <circle cx="206" cy="41" r="3.5" opacity="0.8" />
            <circle cx="70" cy="109" r="2.5" opacity="0.55" />
          </g>
        </svg>
        <span
          class="relative grid rounded-xl size-14 place-content-center bg-orbis-navy ring-1 ring-n-weak"
        >
          <span
            :class="icon"
            aria-hidden="true"
            class="size-7 text-orbis-neon"
          />
        </span>
      </div>
    </div>
    <div class="mt-auto">
      <p
        class="text-base text-n-slate-12 font-interDisplay font-semibold tracking-[0.3px]"
      >
        {{ title }}
      </p>
      <p class="text-n-slate-11 text-sm">
        {{ description }}
      </p>
      <router-link
        v-if="to"
        :to="{ name: to }"
        class="no-underline text-n-blue-11 text-sm font-medium"
      >
        <span>{{ linkText }}</span>
        <span class="ml-2">{{ `→` }}</span>
      </router-link>
    </div>
  </div>
</template>
