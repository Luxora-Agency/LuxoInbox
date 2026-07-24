<script setup>
import { computed } from 'vue';
import { useToggle } from '@vueuse/core';

import Button from 'dashboard/components-next/button/Button.vue';
import WithLabel from './WithLabel.vue';

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  icon: {
    type: String,
    default: '',
  },
  name: {
    type: String,
    required: true,
  },
  hasError: Boolean,
  errorMessage: {
    type: String,
    default: '',
  },
  spacing: {
    type: String,
    default: 'base',
    validator: value => ['base', 'compact'].includes(value),
  },
});

const FIELDS = {
  TEXT: 'text',
  PASSWORD: 'password',
};

defineOptions({
  inheritAttrs: false,
});

const model = defineModel({
  type: [String, Number],
  required: true,
});

const [isPasswordVisible, togglePasswordVisibility] = useToggle();

const isPasswordField = computed(() => props.type === FIELDS.PASSWORD);

const currentInputType = computed(() => {
  if (isPasswordField.value) {
    return isPasswordVisible.value ? FIELDS.TEXT : FIELDS.PASSWORD;
  }
  return props.type;
});
</script>

<template>
  <WithLabel
    :label="label"
    :icon="icon"
    :name="name"
    :has-error="hasError"
    :error-message="errorMessage"
  >
    <template #rightOfLabel>
      <slot />
    </template>
    <input
      v-bind="$attrs"
      v-model="model"
      :name="name"
      :type="currentInputType"
      class="block w-full border-none rounded-xl bg-n-alpha-black2 appearance-none outline outline-1 text-n-slate-12 placeholder:text-n-slate-11 sm:text-sm sm:leading-6 transition-all duration-200"
      :class="{
        'error outline-n-ruby-8 dark:outline-n-ruby-8 hover:outline-n-ruby-9 dark:hover:outline-n-ruby-9 focus:outline-n-ruby-9 focus:ring-4 focus:ring-n-ruby-4 disabled:outline-n-ruby-8 dark:disabled:outline-n-ruby-8':
          hasError,
        'outline-n-weak dark:outline-n-weak hover:outline-n-slate-7 dark:hover:outline-n-slate-7 focus:outline-n-brand dark:focus:outline-n-brand focus:ring-4 focus:ring-n-brand/10':
          !hasError,
        'px-4 py-3.5': spacing === 'base',
        'px-4 py-2.5 mb-0': spacing === 'compact',
        'pl-10': icon,
        'pr-11': isPasswordField,
      }"
    />
    <Button
      v-if="isPasswordField"
      type="button"
      slate
      sm
      link
      :icon="isPasswordVisible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
      class="absolute inset-y-0 right-0 pr-3.5"
      :aria-label="isPasswordVisible ? 'Hide password' : 'Show password'"
      :aria-pressed="isPasswordVisible"
      @click="togglePasswordVisibility()"
    />
  </WithLabel>
</template>
