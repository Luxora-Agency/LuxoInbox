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
    class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-n-slate-1 via-n-background to-woot-50/30 dark:from-n-solid-4 dark:via-n-solid-5 dark:to-woot-950/20"
  >
    <div
      class="flex flex-col items-center gap-5 p-10 rounded-3xl bg-white/70 dark:bg-n-solid-3/70 backdrop-blur-xl border border-white/50 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-black/30 max-w-md"
    >
      <div
        class="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-woot-500 to-woot-600 shadow-lg shadow-woot-500/30"
      >
        <span class="i-lucide-message-square-text text-white size-10" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <span
          class="text-lg font-semibold text-n-slate-12 text-center leading-snug"
        >
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
