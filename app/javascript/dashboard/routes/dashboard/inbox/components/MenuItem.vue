<script setup>
defineProps({
  label: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div
    role="button"
    class="flex items-center gap-2.5 w-full h-9 px-3 py-2 rounded-lg cursor-pointer text-n-slate-12 hover:bg-n-slate-3 dark:hover:bg-n-solid-2 hover:text-woot-500 transition-colors duration-200 min-w-0"
  >
    <span
      v-if="icon"
      :class="icon"
      class="size-4 flex-shrink-0 text-n-slate-11"
    />
    <span class="text-sm font-medium truncate">
      {{ label }}
    </span>
  </div>
</template>
