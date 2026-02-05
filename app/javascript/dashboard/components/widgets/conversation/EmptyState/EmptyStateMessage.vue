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
  <div class="flex flex-col items-center justify-center h-full bg-n-background">
    <div
      class="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white dark:bg-n-solid-3 border border-n-slate-2 dark:border-n-solid-2 shadow-sm max-w-sm"
    >
      <div
        class="flex items-center justify-center w-16 h-16 rounded-xl bg-woot-50 dark:bg-woot-500/10"
      >
        <span class="i-lucide-message-square-text text-woot-500 size-8" />
      </div>
      <div class="flex flex-col items-center gap-1">
        <span class="text-base font-semibold text-n-slate-12 text-center">
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
