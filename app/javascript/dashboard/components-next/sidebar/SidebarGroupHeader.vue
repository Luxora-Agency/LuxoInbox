<script setup>
import { computed } from 'vue';
import { useMapGetter } from 'dashboard/composables/store.js';
import Icon from 'next/icon/Icon.vue';

const props = defineProps({
  to: { type: [Object, String], default: '' },
  label: { type: String, default: '' },
  icon: { type: [String, Object], default: '' },
  expandable: { type: Boolean, default: false },
  isExpanded: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  hasActiveChild: { type: Boolean, default: false },
  getterKeys: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['toggle']);

const showBadge = useMapGetter(props.getterKeys.badge);
const dynamicCount = useMapGetter(props.getterKeys.count);
const count = computed(() =>
  dynamicCount.value > 99 ? '99+' : dynamicCount.value
);
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    class="flex items-center gap-2 px-2 py-1.5 rounded-xl h-9 min-w-0 transition-all duration-150 ease-out group"
    role="button"
    draggable="false"
    :to="to"
    :title="label"
    :class="{
      'text-n-slate-12 bg-n-brand/10 font-medium shadow-sm':
        isActive && !hasActiveChild,
      'text-n-slate-12 font-medium': hasActiveChild,
      'text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12':
        !isActive && !hasActiveChild,
    }"
    @click.stop="emit('toggle')"
  >
    <div v-if="icon" class="relative flex items-center gap-2">
      <Icon
        v-if="icon"
        :icon="icon"
        class="size-4 transition-colors"
        :class="{
          'text-n-blue-11': isActive && !hasActiveChild,
          'group-hover:text-n-blue-11': !isActive && !hasActiveChild,
        }"
      />
      <span
        v-if="showBadge"
        class="size-2 -top-px ltr:-right-px rtl:-left-px bg-n-brand absolute rounded-full border border-n-solid-2 animate-pulse"
      />
    </div>
    <div
      class="flex items-center gap-1.5 flex-grow justify-between min-w-0 flex-1"
    >
      <span
        class="truncate transition-colors"
        :class="{
          'text-body-main': !isActive,
          'font-medium text-sm': isActive || hasActiveChild,
        }"
      >
        {{ label }}
      </span>
      <span
        v-if="dynamicCount && !expandable"
        class="inline-grid h-5 min-w-5 place-items-center rounded-full px-1 text-xxs font-medium leading-3 flex-shrink-0 transition-colors"
        :class="{
          'text-orbis-navy bg-n-brand': isActive,
          'text-n-slate-11 bg-n-alpha-2': !isActive,
        }"
      >
        {{ count }}
      </span>
    </div>
    <span
      v-if="expandable"
      v-show="isExpanded"
      class="i-lucide-chevron-up size-3 transition-transform"
      @click.stop="emit('toggle')"
    />
  </component>
</template>
