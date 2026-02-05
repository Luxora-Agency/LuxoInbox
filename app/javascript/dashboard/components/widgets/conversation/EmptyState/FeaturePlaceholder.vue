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
    class="flex flex-col gap-3 w-full mt-4 pt-4 border-t border-n-slate-2 dark:border-n-solid-3"
  >
    <div
      v-for="keyShortcut in keyShortcuts"
      :key="keyShortcut.key"
      class="flex items-center justify-center gap-2"
    >
      <div class="flex items-center gap-1">
        <Hotkey
          custom-class="w-6 h-5 text-xs font-medium text-n-slate-11
                        bg-n-slate-2 dark:bg-n-solid-3
                        border border-n-slate-3 dark:border-n-solid-2
                        rounded"
        >
          ⌘
        </Hotkey>
        <Hotkey
          custom-class="w-6 h-5 text-xs font-medium text-n-slate-11
                        bg-n-slate-2 dark:bg-n-solid-3
                        border border-n-slate-3 dark:border-n-solid-2
                        rounded"
        >
          {{ keyShortcut.key }}
        </Hotkey>
      </div>
      <span class="text-xs text-n-slate-10">
        {{ keyShortcut.description }}
      </span>
    </div>
  </div>
</template>
