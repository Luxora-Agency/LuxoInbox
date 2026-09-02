<script setup>
import { computed } from 'vue';
import { toTourSlug } from './tourAnchor';

const props = defineProps({
  label: { type: String, required: true },
});

// The heading only receives its rendered label, so the tutorial anchor is
// derived from it. See the note in the tutorials contract: passing the menu
// item's English `name` down would make this locale-independent.
const tourAnchor = computed(() => {
  const slug = toTourSlug(props.label);
  return slug ? `sidebar-section-${slug}` : null;
});
</script>

<template>
  <li
    :data-tour="tourAnchor"
    aria-hidden="true"
    class="px-2 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-n-slate-11 select-none pointer-events-none list-none min-w-0"
  >
    <span class="truncate block">{{ label }}</span>
  </li>
</template>
