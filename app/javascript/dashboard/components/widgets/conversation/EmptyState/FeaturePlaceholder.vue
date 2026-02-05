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
    class="flex flex-col gap-2 w-full mt-2 pt-3 border-t border-n-slate-2 dark:border-n-solid-2"
  >
    <div
      v-for="keyShortcut in keyShortcuts"
      :key="keyShortcut.key"
      class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-n-slate-1 dark:hover:bg-n-solid-2 transition-colors duration-150"
    >
      <div class="flex items-center gap-0.5">
        <Hotkey
          custom-class="w-6 h-5 text-xs font-medium text-n-slate-11
                        bg-n-slate-2 dark:bg-n-solid-2
                        border border-n-slate-3 dark:border-n-solid-1
                        rounded"
        >
          ⌘
        </Hotkey>
        <Hotkey
          custom-class="w-6 h-5 text-xs font-medium text-n-slate-11
                        bg-n-slate-2 dark:bg-n-solid-2
                        border border-n-slate-3 dark:border-n-solid-1
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
