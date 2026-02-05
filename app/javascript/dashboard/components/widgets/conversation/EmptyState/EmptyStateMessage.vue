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
      <div
        class="flex items-center justify-center w-16 h-16 rounded-2xl bg-woot-100 dark:bg-woot-500/20"
      >
        <span class="i-lucide-message-square-text text-woot-500 size-8" />
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
