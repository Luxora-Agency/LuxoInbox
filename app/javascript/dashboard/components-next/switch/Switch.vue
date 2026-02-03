<script setup>
import { useI18n } from 'vue-i18n';

const emit = defineEmits(['change']);

const { t } = useI18n();

const modelValue = defineModel({
  type: Boolean,
  default: false,
});

const updateValue = () => {
  modelValue.value = !modelValue.value;
  emit('change', !modelValue.value);
};
</script>

<template>
  <button
    type="button"
    class="relative h-5 transition-all duration-200 ease-out rounded-full w-9 focus:outline-none focus:ring-2 focus:ring-n-brand/20 focus:ring-offset-n-slate-2 focus:ring-offset-2 flex-shrink-0"
    :class="modelValue ? 'bg-n-brand' : 'bg-n-slate-6 disabled:bg-n-slate-6/60'"
    role="switch"
    :aria-checked="modelValue"
    @click="updateValue"
  >
    <span class="sr-only">{{ t('SWITCH.TOGGLE') }}</span>
    <span
      class="absolute top-0.5 left-0.5 h-4 w-4 transform rounded-full shadow-md transition-transform duration-200 ease-out"
      :class="
        modelValue
          ? 'translate-x-4 bg-n-background'
          : 'translate-x-0 bg-n-background'
      "
    />
  </button>
</template>
