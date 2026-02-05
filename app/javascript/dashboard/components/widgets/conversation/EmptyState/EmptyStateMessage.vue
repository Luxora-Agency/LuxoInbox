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
    class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-n-background via-n-background to-n-slate-3/20"
  >
    <div
      class="flex flex-col items-center gap-5 p-8 rounded-2xl bg-white/50 dark:bg-n-solid-3/50 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 max-w-sm"
    >
      <div
        class="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-woot-500/10 to-violet-500/10 dark:from-woot-500/20 dark:to-violet-500/20 border border-woot-500/20"
      >
        <span class="i-lucide-message-square-text text-woot-500 size-10" />
      </div>
      <div class="flex flex-col items-center gap-1.5">
        <span
          class="text-base font-semibold text-n-slate-12 text-center leading-snug"
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
