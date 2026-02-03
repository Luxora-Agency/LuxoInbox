<script setup>
import Icon from 'dashboard/components-next/icon/Icon.vue';

defineProps({
  label: { type: String, default: '' },
  name: { type: String, required: true },
  icon: { type: String, default: '' },
  hasError: { type: Boolean, default: false },
  helpMessage: { type: String, default: '' },
  errorMessage: { type: String, default: '' },
});

const iconMap = {
  mail: 'i-lucide-mail',
  'lock-closed': 'i-lucide-lock',
  user: 'i-lucide-user',
  phone: 'i-lucide-phone',
  search: 'i-lucide-search',
  building: 'i-lucide-building-2',
  globe: 'i-lucide-globe',
};

const getIconClass = icon => iconMap[icon] || icon;
</script>

<template>
  <div class="space-y-2">
    <label
      v-if="label"
      :for="name"
      class="flex justify-between text-sm font-medium leading-6 text-n-slate-12 tracking-tight"
      :class="{ 'text-n-ruby-11': hasError }"
    >
      <slot name="label">
        {{ label }}
      </slot>
      <slot name="rightOfLabel" />
    </label>
    <div class="w-full">
      <div class="flex items-center relative w-full">
        <Icon
          v-if="icon"
          :icon="getIconClass(icon)"
          class="absolute left-3.5 size-[18px] text-n-slate-10 pointer-events-none"
        />
        <slot />
      </div>
      <div
        v-if="errorMessage && hasError"
        class="text-sm mt-2 ml-0.5 text-n-ruby-10 leading-tight"
      >
        {{ errorMessage }}
      </div>
      <div
        v-else-if="helpMessage || $slots.help"
        class="text-sm mt-2 ml-0.5 text-n-slate-10 leading-tight"
      >
        <slot name="help">
          {{ helpMessage }}
        </slot>
      </div>
    </div>
  </div>
</template>
