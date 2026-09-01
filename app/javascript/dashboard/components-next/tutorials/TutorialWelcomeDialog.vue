<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useWindowSize } from '@vueuse/core';

import wootConstants from 'dashboard/constants/globals';
import { useTutorials } from 'dashboard/composables/useTutorials';

import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const WELCOME_TOUR_ID = 'getting-started';
const WELCOME_DELAY = 1500;

const { t } = useI18n();

const { progress, shouldShowWelcome, dismissWelcome, startTour } =
  useTutorials();

const dialogRef = ref(null);
const isDelayElapsed = ref(false);

let delayTimer = null;

const { width: windowWidth } = useWindowSize();

const isDesktop = computed(
  () => windowWidth.value >= wootConstants.SMALL_SCREEN_BREAKPOINT
);

// Never greet a user who already went through a tour, even if the flag lingers.
const isVisible = computed(
  () =>
    isDelayElapsed.value &&
    isDesktop.value &&
    shouldShowWelcome.value &&
    progress.value.completedCount === 0
);

watch(isVisible, value => {
  if (value) dialogRef.value?.open();
  else dialogRef.value?.close();
});

const onDismiss = () => {
  dismissWelcome();
};

// Dismissing hides the modal <dialog>; starting before it leaves the top layer
// would leave driver.js highlighting an element nobody can click.
const onStart = async () => {
  dismissWelcome();
  await nextTick();
  startTour(WELCOME_TOUR_ID);
};

onMounted(() => {
  delayTimer = setTimeout(() => {
    isDelayElapsed.value = true;
  }, WELCOME_DELAY);
});

onBeforeUnmount(() => {
  clearTimeout(delayTimer);
});
</script>

<template>
  <Dialog
    ref="dialogRef"
    width="md"
    :show-cancel-button="false"
    :show-confirm-button="false"
    @close="onDismiss"
  >
    <div class="relative flex flex-col items-center gap-5 pt-2 text-center">
      <svg
        aria-hidden="true"
        class="absolute pointer-events-none -top-16 h-64 w-64 -translate-x-1/2 left-1/2 text-n-slate-7"
        viewBox="0 0 320 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          stroke="currentColor"
          stroke-width="1"
          opacity="0.5"
          transform="rotate(-28 160 160)"
        >
          <ellipse cx="160" cy="160" rx="160" ry="65" />
          <ellipse cx="160" cy="160" rx="132" ry="54" />
          <ellipse cx="160" cy="160" rx="100" ry="41" />
        </g>
        <g class="text-orbis-neon" fill="currentColor">
          <circle cx="216" cy="70" r="11" opacity="0.14" />
          <circle cx="216" cy="70" r="4" opacity="0.75" />
          <circle cx="87" cy="238" r="8" opacity="0.12" />
          <circle cx="87" cy="238" r="3" opacity="0.6" />
        </g>
      </svg>

      <span
        class="relative grid rounded-2xl size-14 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25"
      >
        <Icon icon="i-lucide-graduation-cap" class="size-7 text-orbis-neon" />
      </span>

      <div class="relative flex flex-col gap-2">
        <h2 class="mb-0 text-xl font-semibold tracking-tight text-n-slate-12">
          {{ t('TUTORIALS.WELCOME.TITLE') }}
        </h2>
        <p class="max-w-sm mb-0 text-sm leading-relaxed text-n-slate-11">
          {{ t('TUTORIALS.WELCOME.BODY') }}
        </p>
      </div>

      <div class="relative flex flex-col w-full gap-2 pt-1">
        <button
          type="button"
          class="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-150 ease-out rounded-lg bg-orbis-neon text-orbis-navy hover:bg-orbis-neon/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbis-neon focus-visible:ring-offset-2 focus-visible:ring-offset-n-background"
          @click="onStart"
        >
          {{ t('TUTORIALS.WELCOME.PRIMARY') }}
          <Icon icon="i-lucide-arrow-right" class="size-4" />
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium transition-colors duration-150 ease-out rounded-lg text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orbis-neon"
          @click="onDismiss"
        >
          {{ t('TUTORIALS.WELCOME.SECONDARY') }}
        </button>
      </div>
    </div>
  </Dialog>
</template>
