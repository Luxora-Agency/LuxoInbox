<script setup>
import { useI18n } from 'vue-i18n';
import MenuItem from './MenuItem.vue';

const emit = defineEmits(['optionClick']);
const { t } = useI18n();

const menuItems = [
  {
    key: 'mark_all_read',
    label: t('INBOX.MENU_ITEM.MARK_ALL_READ'),
    icon: 'i-lucide-check-check',
  },
  {
    key: 'delete_all',
    label: t('INBOX.MENU_ITEM.DELETE_ALL'),
    icon: 'i-lucide-trash-2',
  },
  {
    key: 'delete_all_read',
    label: t('INBOX.MENU_ITEM.DELETE_ALL_READ'),
    icon: 'i-lucide-archive',
  },
];

const onClick = key => {
  emit('optionClick', key);
};
</script>

<template>
  <div
    class="flex flex-col max-w-64 min-w-44 gap-0.5 p-2 bg-white dark:bg-n-solid-3 border border-n-weak dark:border-n-strong shadow-xl shadow-black/10 dark:shadow-black/40 rounded-xl"
  >
    <MenuItem
      v-for="item in menuItems"
      :key="item.key"
      :label="item.label"
      :icon="item.icon"
      @click.stop="onClick(item.key)"
    />
  </div>
</template>
