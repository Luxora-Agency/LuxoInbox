<script setup>
import { computed } from 'vue';
import { useKeyboardEvents } from 'dashboard/composables/useKeyboardEvents';
import wootConstants from 'dashboard/constants/globals';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeTab: {
    type: String,
    default: wootConstants.ASSIGNEE_TYPE.ME,
  },
});

const emit = defineEmits(['chatTabChange']);

const activeTabIndex = computed(() => {
  return props.items.findIndex(item => item.key === props.activeTab);
});

const onTabChange = selectedTabIndex => {
  if (selectedTabIndex >= 0 && selectedTabIndex < props.items.length) {
    const selectedItem = props.items[selectedTabIndex];
    if (selectedItem.key !== props.activeTab) {
      emit('chatTabChange', selectedItem.key);
    }
  }
};

const keyboardEvents = {
  'Alt+KeyN': {
    action: () => {
      if (props.activeTab === wootConstants.ASSIGNEE_TYPE.ALL) {
        onTabChange(0);
      } else {
        const nextIndex = (activeTabIndex.value + 1) % props.items.length;
        onTabChange(nextIndex);
      }
    },
  },
};

useKeyboardEvents(keyboardEvents);
</script>

<template>
  <div
    class="flex items-center gap-1 px-3 py-2 border-b border-n-slate-2 dark:border-n-solid-2"
  >
    <button
      v-for="(item, index) in items"
      :key="item.key"
      class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150"
      :class="[
        index === activeTabIndex
          ? 'bg-n-slate-2 dark:bg-n-solid-2 text-n-slate-12'
          : 'text-n-slate-10 hover:text-n-slate-12 hover:bg-n-slate-1 dark:hover:bg-n-solid-3',
      ]"
      @click="onTabChange(index)"
    >
      <span>{{ item.name }}</span>
      <span
        class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-md text-xs font-medium"
        :class="[
          index === activeTabIndex
            ? 'bg-woot-500 text-white'
            : 'bg-n-slate-3 dark:bg-n-solid-1 text-n-slate-10',
        ]"
      >
        {{ item.count }}
      </span>
    </button>
  </div>
</template>
