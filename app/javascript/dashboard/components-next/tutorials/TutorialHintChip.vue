<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWindowSize } from '@vueuse/core';

import wootConstants from 'dashboard/constants/globals';
import { useTutorials } from 'dashboard/composables/useTutorials';
import { useCallsStore } from 'dashboard/stores/calls';

import Icon from 'dashboard/components-next/icon/Icon.vue';

const HINT_DELAY = 2500;

const { t } = useI18n();
const callsStore = useCallsStore();

const {
  toursForCurrentRoute,
  isRunning,
  isHubOpen,
  isWelcomeOpen,
  finishedTour,
  startTour,
  isCompleted,
  isHintDismissed,
  dismissHint,
  canRunOnThisScreen,
  isBlockedByData,
} = useTutorials();

const { width: windowWidth } = useWindowSize();

const armedTourId = ref(null);

let armTimer = null;

const isDesktop = computed(
  () => windowWidth.value >= wootConstants.SMALL_SCREEN_BREAKPOINT
);

const candidateTour = computed(() => {
  if (!isDesktop.value || isRunning.value || isHubOpen.value) return null;
  // The welcome dialog owns the top layer; a chip underneath its backdrop is
  // a second nudge the user cannot even read. The completion dialog is the
  // same case, and it already offers the next tour itself.
  if (isWelcomeOpen.value || finishedTour.value) return null;
  // A live call parks its own widget in this corner and its controls win.
  if (callsStore.hasActiveCall || callsStore.hasIncomingCall) return null;

  // `toursForCurrentRoute` honours `pageRoutes`, so a tour that covers a list
  // and its detail is nudged on both.
  return (
    toursForCurrentRoute.value.find(
      tour =>
        canRunOnThisScreen(tour) &&
        !isBlockedByData(tour) &&
        !isCompleted(tour.id) &&
        !isHintDismissed(tour.id)
    ) ?? null
  );
});

const visibleTour = computed(() =>
  candidateTour.value?.id === armedTourId.value ? candidateTour.value : null
);

const hintLabel = computed(() => {
  const tour = visibleTour.value;
  if (!tour) return '';

  const key = `TUTORIALS.TOURS.${tour.id.toUpperCase().replace(/-/g, '_')}.NAME`;
  return t('TUTORIALS.HINT.TITLE', { section: t(key) });
});

watch(
  candidateTour,
  tour => {
    clearTimeout(armTimer);

    if (!tour) {
      armedTourId.value = null;
      return;
    }

    if (armedTourId.value === tour.id) return;

    armedTourId.value = null;
    armTimer = setTimeout(() => {
      armedTourId.value = tour.id;
    }, HINT_DELAY);
  },
  { immediate: true }
);

// Dismissals go to ui_settings: the nudge is spent for good, on every device.
const onDismiss = () => {
  const tour = visibleTour.value;
  if (!tour) return;

  dismissHint(tour.id);
  armedTourId.value = null;
};

const onStart = () => {
  const tour = visibleTour.value;
  if (!tour) return;

  armedTourId.value = null;
  startTour(tour.id);
};

onBeforeUnmount(() => {
  clearTimeout(armTimer);
});
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="opacity-0 translate-y-3 motion-reduce:translate-y-0"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-2 motion-reduce:translate-y-0"
  >
    <!-- Sits above the Copilot launcher (bottom-4, z-50) instead of under it. -->
    <div
      v-if="visibleTour"
      role="status"
      class="fixed bottom-24 z-50 flex max-w-sm items-center gap-3 rounded-2xl bg-n-solid-2/95 py-2.5 pl-4 pr-2.5 shadow-xl shadow-n-slate-12/10 ring-1 ring-n-weak backdrop-blur-md ltr:right-6 rtl:left-6"
    >
      <span
        class="grid flex-shrink-0 rounded-lg size-8 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
      >
        <Icon :icon="visibleTour.icon" class="size-4 text-orbis-neon" />
      </span>

      <p class="mb-0 text-sm leading-snug text-n-slate-12">
        {{ hintLabel }}
      </p>

      <button
        type="button"
        class="flex-shrink-0 rounded-lg bg-orbis-neon px-2.5 py-1.5 text-xs font-semibold text-orbis-navy transition-colors duration-150 motion-reduce:transition-none hover:bg-orbis-neon/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon focus-visible:ring-offset-2 focus-visible:ring-offset-n-background"
        @click="onStart"
      >
        {{ t('TUTORIALS.HINT.VIEW') }}
      </button>

      <button
        type="button"
        class="grid flex-shrink-0 transition-colors duration-150 motion-reduce:transition-none rounded-lg size-7 place-items-center text-n-slate-11 hover:bg-n-alpha-2 hover:text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
        :aria-label="t('TUTORIALS.HINT.DISMISS')"
        @click="onDismiss"
      >
        <Icon icon="i-lucide-x" class="size-4" />
      </button>
    </div>
  </Transition>
</template>
