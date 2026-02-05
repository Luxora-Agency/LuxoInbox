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
    class="flex flex-col gap-2 w-full mt-4 pt-4 border-t border-n-slate-2/50 dark:border-white/10"
  >
    <div
      v-for="keyShortcut in keyShortcuts"
      :key="keyShortcut.key"
      class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors duration-200"
    >
      <div class="flex items-center gap-1">
        <Hotkey
          custom-class="w-7 h-6 text-xs font-medium text-n-slate-12
                        bg-white dark:bg-n-solid-3
                        border border-n-slate-2 dark:border-white/10
                        rounded-md shadow-sm"
        >
          ⌘
        </Hotkey>
        <Hotkey
          custom-class="w-7 h-6 text-xs font-medium text-n-slate-12
                        bg-white dark:bg-n-solid-3
                        border border-n-slate-2 dark:border-white/10
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
