<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  title: { type: String, required: true },
  isOpen: { type: Boolean, default: false },
});

const isExpanded = ref(props.isOpen);

const toggleAccordion = () => {
  isExpanded.value = !isExpanded.value;
};

watch(
  () => props.isOpen,
  newValue => {
    isExpanded.value = newValue;
  }
);
</script>

<template>
  <div
    class="ring-1 ring-n-weak/50 rounded-xl bg-n-solid-2 transition-all duration-200 hover:ring-n-weak"
  >
    <button
      class="flex items-center justify-between w-full p-4 text-left rounded-xl transition-colors duration-150 hover:bg-n-alpha-1"
      @click="toggleAccordion"
    >
      <span class="text-sm font-medium text-n-slate-12">{{ title }}</span>
      <span
        class="w-5 h-5 transition-transform duration-200 ease-out i-lucide-chevron-down text-n-slate-11"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>
    <div v-if="isExpanded" class="p-4 pt-0">
      <slot />
    </div>
  </div>
</template>
