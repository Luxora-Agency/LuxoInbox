<script setup>
import { useToggle } from '@vueuse/core';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  defaultOpen: {
    type: Boolean,
    default: true,
  },
});

const [isOpen, toggle] = useToggle(props.defaultOpen);
</script>

<template>
  <button
    v-bind="$attrs"
    type="button"
    :aria-expanded="isOpen"
    class="group flex items-center justify-between gap-3 w-full cursor-pointer px-0 pb-2 pt-4 text-start border-t border-solid border-n-weak"
    @click="toggle()"
  >
    <span class="text-heading-2 text-n-slate-12 min-w-0">
      {{ title }}
    </span>
    <Icon
      icon="i-lucide-chevron-down"
      class="shrink-0 size-4 text-n-slate-10 transition-transform duration-150 ease-out motion-reduce:transition-none group-hover:text-n-slate-11"
      :class="{ '-rotate-90 rtl:rotate-90': !isOpen }"
    />
  </button>
  <div v-if="isOpen" class="w-full space-y-4 pt-4 mb-4">
    <slot />
  </div>
</template>
