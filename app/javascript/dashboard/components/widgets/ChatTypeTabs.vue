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
  <div class="mx-3 mt-2 mb-1">
    <div
      class="flex items-center gap-1 p-1 rounded-xl bg-white/40 dark:bg-n-solid-3/40 backdrop-blur-md border border-white/20 dark:border-white/5"
    >
      <button
        v-for="(item, index) in items"
        :key="item.key"
        class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
        :class="[
          index === activeTabIndex
            ? 'bg-white dark:bg-n-solid-3 text-n-slate-12 shadow-sm'
            : 'text-n-slate-11 hover:text-n-slate-12 hover:bg-white/50 dark:hover:bg-n-solid-3/50',
        ]"
        @click="onTabChange(index)"
      >
        <span>{{ item.name }}</span>
        <span
          class="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium"
          :class="[
            index === activeTabIndex
              ? 'bg-woot-500/10 text-woot-500'
              : 'bg-n-alpha-1 text-n-slate-10',
          ]"
        >
          {{ item.count }}
        </span>
      </button>
    </div>
  </div>
</template>
