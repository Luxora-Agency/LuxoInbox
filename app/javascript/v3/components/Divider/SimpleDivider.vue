<script>
export default {
  props: {
    label: {
      type: String,
      default: '',
    },
    bg: {
      type: String,
      default: 'bg-white dark:bg-n-solid-2',
    },
  },
};
</script>

<template>
  <div class="relative my-6 section-separator">
    <div class="absolute inset-0 flex items-center" aria-hidden="true">
      <div
        class="w-full h-px bg-gradient-to-r from-transparent via-n-slate-6 to-transparent"
      />
    </div>
    <div v-if="label" class="relative flex justify-center text-sm">
      <span class="px-4 text-n-slate-10 font-medium" :class="bg">
        {{ label }}
      </span>
    </div>
  </div>
</template>
