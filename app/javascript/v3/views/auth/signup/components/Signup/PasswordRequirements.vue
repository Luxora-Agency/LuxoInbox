<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const props = defineProps({
  password: { type: String, default: '' },
});
const MIN_PASSWORD_LENGTH = 6;
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|'"/\\.,`<>:;?~]/;

const { t } = useI18n();

const requirements = computed(() => {
  const password = props.password || '';
  return [
    {
      id: 'length',
      met: password.length >= MIN_PASSWORD_LENGTH,
      label: t('REGISTER.PASSWORD.REQUIREMENTS_LENGTH', {
        min: MIN_PASSWORD_LENGTH,
      }),
    },
    {
      id: 'uppercase',
      met: /[A-Z]/.test(password),
      label: t('REGISTER.PASSWORD.REQUIREMENTS_UPPERCASE'),
    },
    {
      id: 'lowercase',
      met: /[a-z]/.test(password),
      label: t('REGISTER.PASSWORD.REQUIREMENTS_LOWERCASE'),
    },
    {
      id: 'number',
      met: /[0-9]/.test(password),
      label: t('REGISTER.PASSWORD.REQUIREMENTS_NUMBER'),
    },
    {
      id: 'special',
      met: SPECIAL_CHAR_REGEX.test(password),
      label: t('REGISTER.PASSWORD.REQUIREMENTS_SPECIAL'),
    },
  ];
});
</script>

<template>
  <div
    class="absolute top-0 z-50 w-64 rounded-xl border border-white/10 bg-orbis-navy/95 px-4 py-4 font-mono text-xs shadow-2xl backdrop-blur-md start-full ms-4"
  >
    <ul role="list" class="space-y-2">
      <li
        v-for="item in requirements"
        :key="item.id"
        class="inline-flex gap-2 items-start transition-colors duration-200"
      >
        <Icon
          class="flex-none flex-shrink-0 size-3.5 mt-0.5 transition-colors duration-200"
          :icon="item.met ? 'i-lucide-circle-check-big' : 'i-lucide-circle'"
          :class="item.met ? 'text-orbis-neon' : 'text-orbis-cream/30'"
        />
        <span
          :class="
            item.met
              ? 'text-orbis-cream font-medium'
              : 'text-orbis-cream/40 font-normal'
          "
          class="transition-all duration-200"
        >
          {{ item.label }}
        </span>
      </li>
    </ul>
  </div>
</template>
