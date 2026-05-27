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

const shortcutItems = [
  { keys: ['⌘', 'K'], label: 'Abrir menú de comandos' },
  { keys: ['⌘', '/'], label: 'Atajos del teclado' },
];

const liveMetrics = [
  {
    value: '82',
    label: 'En cola',
    meta: '+12 últimas 15m',
    sparkline: 'pink',
  },
  { value: '660', label: 'Mías', sparkline: 'teal' },
  { value: '108', label: 'Sin asignar', sparkline: 'amber' },
  { value: '5', label: 'En espera', sparkline: 'violet' },
];

const liveChannels = [
  { icon: 'i-lucide-message-circle', name: 'WhatsApp', value: '48' },
  { icon: 'i-lucide-instagram', name: 'Instagram', value: '18' },
  { icon: 'i-lucide-send', name: 'Telegram', value: '9' },
  { icon: 'i-lucide-message-square', name: 'Web Chat', value: '7' },
];

const liveRailCopy = {
  title: 'SEÑAL EN VIVO',
  channels: 'CANALES ACTIVOS',
  updated: 'Actualizado ahora',
};
</script>

<template>
  <div
    class="luxo-empty-state items-center justify-center hidden w-full h-full text-center lg:flex bg-gradient-to-br from-n-background via-n-background to-n-slate-3/30"
  >
    <!-- Loading state con glassmorphism -->
    <div
      v-if="uiFlags.isFetching"
      class="luxo-empty-card flex flex-col items-center justify-center gap-4 p-8 rounded-3xl bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5"
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
    <template v-else>
      <div
        class="luxo-empty-card flex flex-col items-center gap-4 p-10 rounded-3xl bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20"
      >
        <div
          class="luxo-empty-icon flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-n-slate-3 to-n-slate-4 dark:from-n-solid-3 dark:to-n-solid-4 shadow-lg"
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
        <div class="luxo-empty-shortcuts">
          <span v-for="item in shortcutItems" :key="item.label">
            <kbd v-for="key in item.keys" :key="key">{{ key }}</kbd>
            {{ item.label }}
          </span>
        </div>
      </div>
      <aside class="luxo-live-rail" aria-hidden="true">
        <div class="luxo-live-title">
          <span>{{ liveRailCopy.title }}</span>
          <i />
        </div>
        <div
          v-for="metric in liveMetrics"
          :key="metric.label"
          class="luxo-live-card"
        >
          <strong>{{ metric.value }}</strong>
          <span>{{ metric.label }}</span>
          <small v-if="metric.meta">{{ metric.meta }}</small>
          <b class="sparkline" :class="metric.sparkline" />
        </div>
        <div class="luxo-channel-list">
          <span>{{ liveRailCopy.channels }}</span>
          <p v-for="channel in liveChannels" :key="channel.name">
            <i :class="channel.icon" />{{ channel.name }}
            <strong>{{ channel.value }}</strong>
          </p>
        </div>
        <div class="luxo-live-updated">
          <span>{{ liveRailCopy.updated }}</span>
          <i />
        </div>
      </aside>
    </template>
  </div>
</template>
