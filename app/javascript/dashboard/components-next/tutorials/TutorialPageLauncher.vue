<script setup>
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { onKeyStroke, useWindowSize } from '@vueuse/core';
import { OnClickOutside } from '@vueuse/components';

import wootConstants from 'dashboard/constants/globals';
import { useTutorials } from 'dashboard/composables/useTutorials';

import Icon from 'dashboard/components-next/icon/Icon.vue';

const PANEL_TITLE_ID = 'tutorial-page-launcher-title';

const { t } = useI18n();

const {
  toursForCurrentRoute,
  isRunning,
  isHubOpen,
  isWelcomeOpen,
  startTour,
  resumeTour,
  resetTour,
  openHub,
  isCompleted,
  canRunOnThisScreen,
  tourI18nKey,
} = useTutorials();

const { width: windowWidth } = useWindowSize();

const isOpen = ref(false);

const isDesktop = computed(
  () => windowWidth.value >= wootConstants.SMALL_SCREEN_BREAKPOINT
);

// Everything this screen can teach right now. `toursForCurrentRoute` already
// filters by feature flag, permission and installation type.
const screenTours = computed(() =>
  isDesktop.value ? toursForCurrentRoute.value.filter(canRunOnThisScreen) : []
);

// The launcher stacks over the contextual chip (bottom-24) and the Copilot
// launcher (bottom-4); while a tour runs, the hub or the welcome dialog owns
// the screen, so it steps aside.
const isVisible = computed(
  () =>
    screenTours.value.length > 0 &&
    !isRunning.value &&
    !isHubOpen.value &&
    !isWelcomeOpen.value
);

const close = () => {
  isOpen.value = false;
};

const toggle = () => {
  isOpen.value = !isOpen.value;
};

watch(isVisible, visible => {
  if (!visible) close();
});

onKeyStroke('Escape', () => {
  if (isOpen.value) close();
});

const tourName = tour => t(`${tourI18nKey(tour.id)}.NAME`);

// The composable decorates every visible tour with the step the user stopped at.
const isResumable = tour =>
  !isCompleted(tour.id) && Number(tour.resumeStepIndex) > 0;

const actionLabel = tour => {
  if (isCompleted(tour.id)) return t('TUTORIALS.HUB.REPLAY');
  if (isResumable(tour)) return t('TUTORIALS.HUB.RESUME');
  return t('TUTORIALS.HUB.START');
};

const minutesLabel = tour =>
  t('TUTORIALS.HUB.MINUTES', { minutes: tour.estimatedMinutes });

const runTour = tour => {
  close();

  if (isCompleted(tour.id)) {
    resetTour(tour.id);
    startTour(tour.id);
    return;
  }

  if (isResumable(tour)) {
    resumeTour(tour.id);
    return;
  }

  startTour(tour.id);
};

const onViewLibrary = () => {
  close();
  openHub();
};
</script>

<template>
  <!-- Kept mounted and hidden instead of `v-if`: the launcher is the component's
       single root, and its own visibility rules already gate what renders. -->
  <OnClickOutside v-show="isVisible" @trigger="close">
    <div class="fixed bottom-40 z-50 ltr:right-4 rtl:left-4">
      <Transition
        enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0 translate-y-2 motion-reduce:translate-y-0"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1 motion-reduce:translate-y-0"
      >
        <div
          v-if="isOpen"
          role="dialog"
          :aria-labelledby="PANEL_TITLE_ID"
          class="absolute bottom-full mb-3 w-72 overflow-hidden rounded-2xl bg-n-solid-2/95 shadow-xl shadow-n-slate-12/10 ring-1 ring-n-weak backdrop-blur-md ltr:right-0 rtl:left-0"
        >
          <p
            :id="PANEL_TITLE_ID"
            class="mb-0 px-4 pt-3.5 pb-2 text-xs font-semibold uppercase tracking-wide text-n-slate-11"
          >
            {{ t('TUTORIALS.LAUNCHER.TITLE') }}
          </p>

          <ul class="flex flex-col gap-1 px-2 pb-2 mb-0 list-none">
            <li v-for="tour in screenTours" :key="tour.id">
              <button
                type="button"
                class="flex w-full items-start gap-3 rounded-xl px-2 py-2 text-start transition-colors duration-150 motion-reduce:transition-none hover:bg-n-alpha-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
                @click="runTour(tour)"
              >
                <span
                  class="grid flex-shrink-0 mt-0.5 rounded-lg size-8 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
                >
                  <Icon :icon="tour.icon" class="size-4 text-orbis-neon" />
                </span>

                <span class="flex flex-col flex-grow min-w-0 gap-0.5">
                  <span
                    class="text-sm font-medium leading-snug text-n-slate-12 line-clamp-2"
                  >
                    {{ tourName(tour) }}
                  </span>
                  <span class="text-xs text-n-slate-11">
                    {{ minutesLabel(tour) }}
                  </span>
                </span>

                <span
                  class="flex flex-shrink-0 items-center gap-1 mt-1 text-xs font-semibold text-n-slate-12"
                >
                  <Icon
                    v-if="isCompleted(tour.id)"
                    icon="i-lucide-check"
                    class="size-3.5 text-orbis-neon"
                  />
                  {{ actionLabel(tour) }}
                </span>
              </button>
            </li>
          </ul>

          <div class="px-2 pb-2 border-t border-n-weak">
            <button
              type="button"
              class="flex w-full items-center gap-2 mt-2 rounded-xl px-2 py-2 text-xs font-medium text-n-slate-11 transition-colors duration-150 motion-reduce:transition-none hover:bg-n-alpha-2 hover:text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
              @click="onViewLibrary"
            >
              <Icon icon="i-lucide-library" class="size-4" />
              {{ t('TUTORIALS.LAUNCHER.VIEW_LIBRARY') }}
            </button>
          </div>
        </div>
      </Transition>

      <button
        type="button"
        :aria-label="t('TUTORIALS.LAUNCHER.ARIA_LABEL')"
        :aria-expanded="isOpen"
        class="relative grid rounded-2xl size-11 place-items-center bg-n-solid-2/95 shadow-lg shadow-n-slate-12/10 ring-1 ring-n-weak backdrop-blur-md transition-colors duration-150 motion-reduce:transition-none hover:bg-n-alpha-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
        @click="toggle"
      >
        <span
          class="grid rounded-xl size-8 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
        >
          <Icon icon="i-lucide-graduation-cap" class="size-4 text-orbis-neon" />
        </span>

        <span
          class="absolute -top-1 grid min-w-5 h-5 px-1 place-items-center rounded-full bg-orbis-neon text-[0.625rem] font-bold leading-none text-orbis-navy ltr:-right-1 rtl:-left-1"
          aria-hidden="true"
        >
          {{ screenTours.length }}
        </span>
      </button>
    </div>
  </OnClickOutside>
</template>
