<script setup>
import { useI18n } from 'vue-i18n';
import FeaturePlaceholder from './FeaturePlaceholder.vue';

defineProps({
  message: {
    type: String,
    required: true,
  },
});

const { t } = useI18n();
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-full bg-n-background dark:bg-n-solid-5"
  >
    <div class="flex flex-col items-center gap-6 p-8 max-w-sm">
      <div class="relative flex items-center justify-center">
        <svg
          aria-hidden="true"
          class="absolute pointer-events-none size-28 text-n-slate-6"
          viewBox="0 0 112 112"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse
            cx="56"
            cy="56"
            rx="54"
            ry="24"
            stroke="currentColor"
            stroke-width="1"
            opacity="0.7"
            transform="rotate(-28 56 56)"
          />
          <circle
            cx="93"
            cy="35"
            r="7"
            class="text-orbis-neon"
            fill="currentColor"
            opacity="0.15"
          />
          <circle
            cx="93"
            cy="35"
            r="3"
            class="text-orbis-neon"
            fill="currentColor"
            opacity="0.8"
          />
        </svg>
        <div
          class="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-n-alpha-2 dark:bg-n-solid-3"
        >
          <span class="i-lucide-message-square-text text-n-slate-12 size-8" />
        </div>
      </div>
      <div class="flex flex-col items-center gap-2">
        <span class="text-base font-medium text-n-slate-12 text-center">
          {{ message }}
        </span>
        <span class="text-sm text-n-slate-10 text-center">
          {{ t('CONVERSATION.EMPTY_STATE.CLICK_TO_VIEW') }}
        </span>
      </div>
      <FeaturePlaceholder />
    </div>
  </div>
</template>
