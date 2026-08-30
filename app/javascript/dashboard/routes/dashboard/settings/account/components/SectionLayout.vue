<script setup>
import { useI18n } from 'vue-i18n';

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  hideContent: { type: Boolean, default: false },
  beta: { type: Boolean, default: false },
});
const { t } = useI18n();
</script>

<template>
  <section
    class="grid grid-cols-1 gap-5 p-5 sm:p-6 rounded-2xl border border-n-weak bg-n-solid-1 [interpolate-size:allow-keywords]"
  >
    <header class="grid grid-cols-1 gap-3 sm:grid-cols-4">
      <div
        v-if="
          title || beta || $slots.title || description || $slots.description
        "
        class="min-w-0 sm:col-span-3"
      >
        <h4
          v-if="title || beta || $slots.title"
          class="text-heading-2 text-n-slate-12 flex items-center gap-2"
        >
          <slot name="title">{{ title }}</slot>
          <div
            v-if="beta"
            v-tooltip.top="t('GENERAL.BETA_DESCRIPTION')"
            class="text-xs uppercase text-n-iris-11 border border-1 border-n-iris-10 leading-none rounded-lg px-1 py-0.5"
          >
            {{ t('GENERAL.BETA') }}
          </div>
        </h4>
        <p
          v-if="description || $slots.description"
          class="mt-2 max-w-prose text-sm leading-relaxed text-n-slate-11"
        >
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div class="sm:col-span-1">
        <slot name="headerActions" />
      </div>
    </header>
    <div
      class="transition-[height] duration-300 ease-in-out motion-reduce:transition-none text-n-slate-12"
      :class="{ 'overflow-hidden h-0': hideContent, 'h-auto': !hideContent }"
    >
      <slot />
    </div>
  </section>
</template>
