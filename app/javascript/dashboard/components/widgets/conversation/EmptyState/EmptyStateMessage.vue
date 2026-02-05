<script setup>
import FeaturePlaceholder from './FeaturePlaceholder.vue';

defineProps({
  message: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-full bg-gradient-to-br from-n-background via-n-background to-n-slate-3/30"
  >
    <div
      class="flex flex-col items-center gap-6 p-10 rounded-3xl bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-black/20"
    >
      <div
        class="flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-n-slate-3 to-n-slate-4 dark:from-n-solid-3 dark:to-n-solid-4 shadow-lg"
      >
        <span class="i-lucide-message-square-text text-n-slate-10 size-12" />
      </div>
      <div class="flex flex-col items-center gap-2">
        <span class="text-base font-semibold text-n-slate-12 text-center">
          {{ message }}
        </span>
      </div>
      <FeaturePlaceholder />
    </div>
  </div>
</template>
