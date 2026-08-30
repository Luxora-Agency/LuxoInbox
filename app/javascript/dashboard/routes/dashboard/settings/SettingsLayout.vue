<script setup>
import Icon from 'dashboard/components-next/icon/Icon.vue';

defineProps({
  isLoading: {
    type: Boolean,
    default: false,
  },
  noRecordsFound: {
    type: Boolean,
    default: false,
  },
  loadingMessage: {
    type: String,
    default: '',
  },
  noRecordsMessage: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div class="flex flex-col w-full h-full gap-4 font-inter">
    <slot name="header" />
    <!-- Added to render any templates that should be rendered before body -->
    <main>
      <slot name="preBody" />
      <slot v-if="isLoading" name="loading">
        <woot-loading-state :message="loadingMessage" />
      </slot>
      <div
        v-else-if="noRecordsFound"
        class="flex flex-col items-center justify-center flex-1 gap-3 py-20 text-center"
      >
        <span
          class="flex items-center justify-center rounded-full size-10 bg-n-alpha-1"
        >
          <Icon icon="i-lucide-inbox" class="size-5 text-n-slate-10" />
        </span>
        <p class="mb-0 max-w-prose text-body-main text-n-slate-11">
          {{ noRecordsMessage }}
        </p>
      </div>
      <slot v-else name="body" />
      <!-- Do not delete the slot below. It is required to render anything that is not defined in the above slots. -->
      <slot />
    </main>
  </div>
</template>
