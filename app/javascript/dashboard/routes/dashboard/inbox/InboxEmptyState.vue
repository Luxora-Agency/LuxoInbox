<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMapGetter } from 'dashboard/composables/store';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const props = defineProps({
  emptyStateMessage: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();
const uiFlags = useMapGetter('notifications/getUIFlags');

const emptyMessage = computed(() => {
  if (props.emptyStateMessage) {
    return props.emptyStateMessage;
  }
  return t('INBOX.LIST.NOTE');
});
</script>

<template>
  <div
    class="items-center justify-center hidden w-full h-full text-center lg:flex bg-gradient-to-br from-n-background via-n-background to-n-slate-3/30"
  >
    <!-- Loading state con glassmorphism -->
    <div
      v-if="uiFlags.isFetching"
      class="flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5"
    >
      <div class="relative">
        <div
          class="absolute inset-0 rounded-full bg-gradient-to-r from-woot-500 to-violet-500 blur-xl opacity-30 animate-pulse"
        />
        <Spinner class="text-n-brand" />
      </div>
      <span class="text-sm text-n-slate-11">
        {{ t('INBOX.LIST.LOADING') }}
      </span>
    </div>

    <!-- Empty state con glassmorphism -->
    <div
      v-else
      class="flex flex-col items-center gap-4 p-10 rounded-3xl bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20"
    >
      <div
        class="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-n-slate-3 to-n-slate-4 dark:from-n-solid-3 dark:to-n-solid-4 shadow-lg"
      >
        <span class="i-lucide-inbox text-n-slate-10 size-10" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <h3 class="text-lg font-semibold text-n-slate-12">
          {{ t('INBOX.LIST.SELECT_CONVERSATION') }}
        </h3>
        <span class="text-sm text-n-slate-11 max-w-xs text-center">
          {{ emptyMessage }}
        </span>
      </div>
    </div>
  </div>
</template>
