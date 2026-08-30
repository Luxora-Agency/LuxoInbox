<script setup>
defineProps({
  label: { type: String, required: true },
});
</script>

<template>
  <li
    aria-hidden="true"
    class="px-2 pt-3 pb-1 font-mono text-[10px] uppercase tracking-[0.08em] text-n-slate-11 select-none pointer-events-none list-none min-w-0"
  >
    <span class="truncate block">{{ label }}</span>
  </li>
</template>
