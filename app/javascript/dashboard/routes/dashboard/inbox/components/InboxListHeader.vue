<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'dashboard/composables/store';
import { useAlert, useTrack } from 'dashboard/composables';
import { INBOX_EVENTS } from 'dashboard/helper/AnalyticsHelper/events';

import NextButton from 'dashboard/components-next/button/Button.vue';
import InboxOptionMenu from './InboxOptionMenu.vue';
import InboxDisplayMenu from './InboxDisplayMenu.vue';

const props = defineProps({
  isContextMenuOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['redirect', 'filter']);

const { t } = useI18n();
const store = useStore();

const showInboxDisplayMenu = ref(false);
const showInboxOptionMenu = ref(false);

watch(
  () => props.isContextMenuOpen,
  val => {
    if (val) {
      showInboxDisplayMenu.value = false;
      showInboxOptionMenu.value = false;
    }
  },
  { immediate: true }
);

const markAllRead = () => {
  useTrack(INBOX_EVENTS.MARK_ALL_NOTIFICATIONS_AS_READ);
  store.dispatch('notifications/readAll').then(() => {
    useAlert(t('INBOX.ALERTS.MARK_ALL_READ'));
  });
};

const deleteAll = () => {
  store.dispatch('notifications/deleteAll').then(() => {
    useAlert(t('INBOX.ALERTS.DELETE_ALL'));
  });
};

const deleteAllRead = () => {
  store.dispatch('notifications/deleteAllRead').then(() => {
    useAlert(t('INBOX.ALERTS.DELETE_ALL_READ'));
  });
};

const openInboxDisplayMenu = () => {
  showInboxDisplayMenu.value = !showInboxDisplayMenu.value;
};

const openInboxOptionsMenu = () => {
  showInboxOptionMenu.value = !showInboxOptionMenu.value;
};

const onInboxOptionMenuClick = key => {
  const actions = {
    mark_all_read: () => markAllRead(),
    delete_all: () => deleteAll(),
    delete_all_read: () => deleteAllRead(),
  };
  const action = actions[key];
  if (action) action();
  emit('redirect');
};

const onFilterChange = option => {
  emit('filter', option);
  showInboxDisplayMenu.value = false;
  emit('redirect');
};
</script>

<template>
  <div
    class="luxo-inbox-list-header relative z-20 flex items-center justify-between w-full gap-2 h-[72px] px-4 bg-white/50 dark:bg-n-solid-3/50 backdrop-blur-xl border-b border-white/20 dark:border-white/5"
  >
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <!-- Icono con gradiente -->
      <div
        class="luxo-header-mark flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-woot-500 to-violet-500 shadow-lg shadow-woot-500/25"
      >
        <span class="i-lucide-inbox text-white size-5" />
      </div>
      <div class="flex flex-col min-w-0">
        <h1 class="text-base font-semibold text-n-slate-12 truncate">
          {{ t('INBOX.LIST.TITLE') }}
        </h1>
        <p class="text-xs text-n-slate-10">
          {{ t('INBOX.LIST.SUBTITLE') }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <!-- Filtro dropdown -->
      <div class="relative">
        <NextButton
          :label="t('INBOX.LIST.DISPLAY_DROPDOWN')"
          icon="i-lucide-filter"
          trailing-icon
          slate
          xs
          faded
          class="bg-white/60 dark:bg-n-solid-2/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-n-solid-2/80"
          @click="openInboxDisplayMenu"
        />
        <InboxDisplayMenu
          v-if="showInboxDisplayMenu"
          v-on-clickaway="openInboxDisplayMenu"
          class="absolute mt-1 top-full ltr:left-0 rtl:right-0 z-[100]"
          @filter="onFilterChange"
        />
      </div>

      <!-- Opciones -->
      <div class="relative">
        <NextButton
          icon="i-lucide-more-vertical"
          slate
          xs
          faded
          class="bg-white/60 dark:bg-n-solid-2/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-n-solid-2/80"
          @click="openInboxOptionsMenu"
        />
        <InboxOptionMenu
          v-if="showInboxOptionMenu"
          v-on-clickaway="openInboxOptionsMenu"
          class="absolute top-full mt-1 ltr:right-0 ltr:lg:right-[unset] rtl:left-0 rtl:lg:left-[unset] z-[100]"
          @option-click="onInboxOptionMenuClick"
        />
      </div>
    </div>
  </div>
</template>
