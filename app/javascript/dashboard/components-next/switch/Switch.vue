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
    class="group relative h-5 rounded-full w-9 flex-shrink-0 select-none focus:outline-none focus:ring-2 focus:ring-n-brand/20 focus:ring-offset-n-slate-2 focus:ring-offset-2 transition-all duration-200 ease-out"
    :class="modelValue ? 'bg-n-brand' : 'bg-n-slate-6'"
    role="switch"
    :aria-checked="modelValue"
    @click="updateValue"
  >
    <span class="sr-only">{{ t('SWITCH.TOGGLE') }}</span>
    <span
      class="absolute top-1/2 ltr:left-0.5 rtl:right-0.5 -translate-y-1/2 transition-transform duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]"
      :class="
        modelValue
          ? 'ltr:translate-x-4 rtl:-translate-x-4 group-active:ltr:translate-x-[10px] rtl:group-active:-translate-x-[10px]'
          : 'ltr:translate-x-0 rtl:translate-x-0'
      "
    >
      <span
        class="block h-4 w-4 rounded-full bg-n-background shadow-md transition-[width] duration-[180ms] ease-in-out group-active:w-[22px]"
      />
    </span>
  </button>
</template>
