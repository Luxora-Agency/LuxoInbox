<script setup>
import { computed } from 'vue';
import { useMapGetter } from 'dashboard/composables/store.js';
import Icon from 'next/icon/Icon.vue';

const props = defineProps({
  name: { type: String, default: '' },
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

// Stable hook for the guided tours: the item `name` is an internal identifier,
// so it survives translation and relabelling the way a class or a label cannot.
const tourAnchor = computed(() =>
  props.name ? `sidebar-${props.name.toLowerCase().replace(/\s+/g, '-')}` : null
);

// Without `to` the header renders as a div[role=button], which browsers do not
// activate from the keyboard, so it needs the key handling a button would give.
const handleKeydown = event => {
  if (props.to) return;

  event.preventDefault();
  emit('toggle');
};
</script>

<template>
  <component
    :is="to ? 'router-link' : 'div'"
    class="flex relative items-center gap-2 px-2 py-1.5 rounded-xl h-10 min-w-0 transition-all duration-150 ease-out group"
    :role="to ? undefined : 'button'"
    :tabindex="to ? undefined : 0"
    draggable="false"
    :data-tour="tourAnchor"
    :to="to"
    :title="label"
    :aria-current="isActive && to ? 'page' : undefined"
    :aria-expanded="expandable ? isExpanded : undefined"
    :class="{
      'text-n-blue-11 bg-n-brand/10 font-medium': isActive && !hasActiveChild,
      'text-n-slate-12 font-medium': hasActiveChild,
      'text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12':
        !isActive && !hasActiveChild,
    }"
    @click.stop="emit('toggle')"
    @keydown.enter="handleKeydown"
    @keydown.space="handleKeydown"
  >
    <span
      v-if="isActive || hasActiveChild"
      aria-hidden="true"
      class="absolute inset-y-1 start-0 w-0.5 rounded-full bg-n-blue-11"
    />
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
      class="grid flex-shrink-0 place-content-center rounded-md size-6 text-n-slate-10"
      @click.stop="emit('toggle')"
    >
      <!-- Mirrored in RTL so it points inward; the expanded rotation flips with
      it so the open state still points down. -->
      <span
        class="i-lucide-chevron-right size-3 transition-transform duration-150 ease-out motion-reduce:transition-none rtl:-scale-x-100"
        :class="{ 'rotate-90 rtl:-rotate-90': isExpanded }"
      />
    </span>
  </component>
</template>
