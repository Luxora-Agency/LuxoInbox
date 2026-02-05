<script setup>
import { useI18n } from 'vue-i18n';
import Hotkey from 'dashboard/components/base/Hotkey.vue';

const { t } = useI18n();

const keyShortcuts = [
  {
    key: 'K',
    description: t('CONVERSATION.EMPTY_STATE.CMD_BAR'),
  },
  {
    key: '/',
    description: t('CONVERSATION.EMPTY_STATE.KEYBOARD_SHORTCUTS'),
  },
];
</script>

<template>
  <div
    class="flex flex-col gap-3 mt-4 pt-4 border-t border-white/20 dark:border-white/5"
  >
    <div
      v-for="keyShortcut in keyShortcuts"
      :key="keyShortcut.key"
      class="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/40 dark:bg-n-solid-2/40 hover:bg-white/60 dark:hover:bg-n-solid-2/60 transition-colors duration-200"
    >
      <div class="flex items-center gap-1.5">
        <Hotkey
          custom-class="w-7 h-6 text-sm font-medium text-n-slate-12
                        bg-white/60 dark:bg-n-solid-3/60
                        border border-white/30 dark:border-white/10
                        rounded-md shadow-sm"
        >
          ⌘
        </Hotkey>
        <Hotkey
          custom-class="w-7 h-6 text-xs font-medium text-n-slate-12
                        bg-white/60 dark:bg-n-solid-3/60
                        border border-white/30 dark:border-white/10
                        rounded-md shadow-sm"
        >
          {{ keyShortcut.key }}
        </Hotkey>
      </div>
      <span class="text-sm text-n-slate-11">
        {{ keyShortcut.description }}
      </span>
    </div>
  </div>
</template>
