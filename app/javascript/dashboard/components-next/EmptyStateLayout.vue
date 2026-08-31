<script setup>
import Policy from 'dashboard/components/policy.vue';

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  actionPerms: {
    type: Array,
    default: () => [],
  },
  showBackdrop: {
    type: Boolean,
    default: true,
  },
});
</script>

<template>
  <section
    class="relative flex flex-col items-center justify-center w-full h-full overflow-hidden"
  >
    <div
      class="relative w-full max-w-5xl mx-auto overflow-hidden h-full max-h-[28rem]"
    >
      <div
        v-if="showBackdrop"
        class="w-full h-full space-y-4 overflow-y-hidden opacity-50 pointer-events-none"
      >
        <slot name="empty-state-item" />
      </div>
      <div
        class="flex flex-col items-center justify-end w-full h-full pb-20"
        :class="{
          'absolute inset-x-0 bottom-0 bg-gradient-to-t from-n-surface-1 from-25% to-transparent':
            showBackdrop,
        }"
      >
        <div
          class="relative flex flex-col items-center justify-center gap-6"
          :class="{
            'mt-48': !showBackdrop,
          }"
        >
          <svg
            aria-hidden="true"
            class="absolute w-[34rem] max-w-[150%] h-auto pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 text-n-slate-6"
            viewBox="0 0 320 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              stroke="currentColor"
              stroke-width="1"
              opacity="0.35"
              transform="rotate(-28 160 160)"
            >
              <ellipse cx="160" cy="160" rx="160" ry="65" />
              <ellipse cx="160" cy="160" rx="132" ry="54" />
              <ellipse cx="160" cy="160" rx="100" ry="41" />
            </g>
            <g class="text-orbis-neon" fill="currentColor">
              <circle cx="216" cy="70" r="11" opacity="0.14" />
              <circle cx="216" cy="70" r="4" opacity="0.75" />
              <circle cx="87" cy="238" r="8" opacity="0.12" />
              <circle cx="87" cy="238" r="3" opacity="0.6" />
            </g>
          </svg>
          <div class="relative flex flex-col items-center justify-center gap-3">
            <h2
              class="text-3xl font-semibold tracking-tight text-center text-n-slate-12"
            >
              {{ title }}
            </h2>
            <p
              v-if="subtitle"
              class="max-w-xl text-base text-center text-n-slate-11 tracking-[0.3px]"
            >
              {{ subtitle }}
            </p>
          </div>
          <Policy class="relative" :permissions="actionPerms">
            <slot name="actions" />
          </Policy>
        </div>
      </div>
    </div>
  </section>
</template>
