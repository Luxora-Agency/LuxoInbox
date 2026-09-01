<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useWindowSize } from '@vueuse/core';

import wootConstants from 'dashboard/constants/globals';
import { useTutorials } from 'dashboard/composables/useTutorials';

import Dialog from 'dashboard/components-next/dialog/Dialog.vue';
import Icon from 'dashboard/components-next/icon/Icon.vue';

const RESET_CONFIRM_TIMEOUT = 4000;

const { t } = useI18n();

const {
  tours,
  progress,
  isHubOpen,
  startTour,
  resumeTour,
  resetTour,
  resetAll,
  closeHub,
  isCompleted,
} = useTutorials();

const dialogRef = ref(null);
const isResetConfirming = ref(false);

let resetTimer = null;

const { width: windowWidth } = useWindowSize();

const isSmallScreen = computed(
  () => windowWidth.value < wootConstants.SMALL_SCREEN_BREAKPOINT
);

// Anchored tours need the desktop layout: on a phone the sidebar is a closed
// drawer, so the card offers nothing to start.
const isBlockedOnThisScreen = tour => isSmallScreen.value && !tour.mobileSafe;

watch(isHubOpen, value => {
  if (value) dialogRef.value?.open();
  else dialogRef.value?.close();

  clearTimeout(resetTimer);
  isResetConfirming.value = false;
});

// `TUTORIALS.TOURS.<UPPER_SNAKE_ID>` — matches the locale tree in the contract.
const tourI18nKey = id =>
  `TUTORIALS.TOURS.${id.toUpperCase().replace(/-/g, '_')}`;

const tourName = tour => t(`${tourI18nKey(tour.id)}.NAME`);

const tourDescription = tour => t(`${tourI18nKey(tour.id)}.DESCRIPTION`);

// The composable decorates every visible tour with the step the user stopped at.
const isResumable = tour =>
  !isCompleted(tour.id) && Number(tour.resumeStepIndex) > 0;

const actionLabel = tour => {
  if (isCompleted(tour.id)) return t('TUTORIALS.HUB.REPLAY');
  if (isResumable(tour)) return t('TUTORIALS.HUB.RESUME');
  return t('TUTORIALS.HUB.START');
};

const actionIcon = tour => {
  if (isCompleted(tour.id)) return 'i-lucide-rotate-ccw';
  if (isResumable(tour)) return 'i-lucide-play';
  return 'i-lucide-arrow-right';
};

const RING_RADIUS = 26;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const ringOffset = computed(() => {
  const percent = Math.min(Math.max(progress.value.percent ?? 0, 0), 100);
  return RING_CIRCUMFERENCE * (1 - percent / 100);
});

const progressLabel = computed(() =>
  t('TUTORIALS.HUB.PROGRESS', {
    completed: progress.value.completedCount,
    total: progress.value.totalCount,
  })
);

// The hub is a modal <dialog>: it owns the top layer and would swallow every
// pointer event aimed at the highlighted element. Close it, let the watcher
// flush, and only then hand control over to the engine.
const runTour = async tour => {
  if (isBlockedOnThisScreen(tour)) return;

  const shouldReplay = isCompleted(tour.id);
  const shouldResume = !shouldReplay && isResumable(tour);

  closeHub();
  await nextTick();

  if (shouldReplay) {
    resetTour(tour.id);
    startTour(tour.id);
    return;
  }

  if (shouldResume) {
    resumeTour(tour.id);
    return;
  }

  startTour(tour.id);
};

// Wiping every tour's progress is written straight to the server for all of
// the user's devices, so the first click only arms the button.
const onResetAll = () => {
  clearTimeout(resetTimer);

  if (!isResetConfirming.value) {
    isResetConfirming.value = true;
    resetTimer = setTimeout(() => {
      isResetConfirming.value = false;
    }, RESET_CONFIRM_TIMEOUT);
    return;
  }

  isResetConfirming.value = false;
  resetAll();
};

onBeforeUnmount(() => {
  clearTimeout(resetTimer);
});
</script>

<template>
  <Dialog
    ref="dialogRef"
    width="3xl"
    position="top"
    overflow-y-auto
    :aria-label="t('TUTORIALS.HUB.TITLE')"
    :show-cancel-button="false"
    :show-confirm-button="false"
    @close="closeHub"
  >
    <div class="relative flex flex-col gap-6">
      <svg
        aria-hidden="true"
        class="absolute -top-24 pointer-events-none h-72 w-72 opacity-70 ltr:-right-24 rtl:-left-24 text-n-slate-7"
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

      <header
        class="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between"
      >
        <div class="flex flex-col gap-1.5 min-w-0">
          <h2
            class="text-2xl font-semibold tracking-tight text-n-slate-12 mb-0"
          >
            {{ t('TUTORIALS.HUB.TITLE') }}
          </h2>
          <p class="max-w-lg mb-0 text-sm leading-relaxed text-n-slate-11">
            {{ t('TUTORIALS.HUB.SUBTITLE') }}
          </p>
        </div>

        <div class="flex items-center flex-shrink-0 gap-3">
          <div class="relative grid size-16 place-items-center">
            <svg
              aria-hidden="true"
              class="size-16 -rotate-90"
              viewBox="0 0 64 64"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="32"
                cy="32"
                :r="RING_RADIUS"
                stroke="currentColor"
                stroke-width="5"
                class="text-n-slate-4"
              />
              <!-- Lime reads as ~1:1 against the light track, so the arc
                   carries navy on light and lime on dark. -->
              <circle
                cx="32"
                cy="32"
                :r="RING_RADIUS"
                stroke="currentColor"
                stroke-width="5"
                stroke-linecap="round"
                class="transition-all duration-500 ease-out motion-reduce:transition-none text-orbis-navy dark:text-orbis-neon"
                :stroke-dasharray="RING_CIRCUMFERENCE"
                :stroke-dashoffset="ringOffset"
              />
            </svg>
            <span
              class="absolute text-base font-semibold tabular-nums text-n-slate-12"
            >
              {{ progress.completedCount }}
            </span>
          </div>
          <span class="text-sm font-medium text-n-slate-11">
            {{ progressLabel }}
          </span>
        </div>
      </header>

      <div
        v-if="isSmallScreen"
        class="relative flex items-start gap-3 p-4 rounded-xl bg-n-alpha-2 ring-1 ring-n-weak"
      >
        <Icon
          icon="i-lucide-monitor"
          class="mt-0.5 flex-shrink-0 size-4 text-n-slate-12 dark:text-orbis-neon"
        />
        <p class="mb-0 text-sm leading-relaxed text-n-slate-11">
          {{ t('TUTORIALS.HUB.MOBILE_NOTICE') }}
        </p>
      </div>

      <p
        v-if="!tours.length"
        class="relative py-10 mb-0 text-sm text-center text-n-slate-11"
      >
        {{ t('TUTORIALS.HUB.EMPTY') }}
      </p>

      <ul
        v-else
        class="relative grid grid-cols-1 gap-4 pr-1 -mr-1 list-none md:grid-cols-2 max-h-[min(58vh,32rem)] overflow-y-auto"
      >
        <li
          v-for="tour in tours"
          :key="tour.id"
          class="flex flex-col gap-4 p-5 transition-all duration-200 ease-out motion-reduce:transition-none rounded-2xl bg-n-solid-2 ring-1 ring-n-weak hover:ring-n-slate-6 hover:shadow-lg hover:shadow-n-slate-12/5"
        >
          <div class="flex items-start gap-4">
            <span
              class="grid flex-shrink-0 rounded-xl size-11 place-items-center bg-orbis-navy ring-1 ring-orbis-neon/25 dark:ring-orbis-neon/40"
            >
              <Icon :icon="tour.icon" class="size-5 text-orbis-neon" />
            </span>
            <div class="flex flex-col gap-1 min-w-0">
              <h3 class="mb-0 text-sm font-semibold text-n-slate-12">
                {{ tourName(tour) }}
              </h3>
              <p class="mb-0 text-sm leading-relaxed text-n-slate-11">
                {{ tourDescription(tour) }}
              </p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 mt-auto">
            <span
              class="inline-flex items-center gap-1.5 text-xs font-medium text-n-slate-11"
            >
              <Icon icon="i-lucide-clock" class="size-3.5" />
              {{
                t('TUTORIALS.HUB.MINUTES', { minutes: tour.estimatedMinutes })
              }}
            </span>
            <span
              v-if="isCompleted(tour.id)"
              class="inline-flex items-center gap-1 rounded-full bg-orbis-neon/10 px-2.5 py-1 text-xs font-medium text-n-slate-12 ring-1 ring-orbis-neon/30"
            >
              <Icon
                icon="i-lucide-check"
                class="size-3.5 text-n-slate-12 dark:text-orbis-neon"
              />
              {{ t('TUTORIALS.HUB.COMPLETED') }}
            </span>
            <button
              type="button"
              :disabled="isBlockedOnThisScreen(tour)"
              class="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon focus-visible:ring-offset-2 focus-visible:ring-offset-n-background disabled:cursor-not-allowed disabled:opacity-45 ltr:ml-auto rtl:mr-auto"
              :class="
                isCompleted(tour.id)
                  ? 'bg-n-alpha-2 text-n-slate-12 ring-1 ring-n-weak hover:enabled:bg-n-alpha-3'
                  : 'bg-orbis-neon text-orbis-navy hover:enabled:bg-orbis-neon/85'
              "
              @click="runTour(tour)"
            >
              {{ actionLabel(tour) }}
              <Icon :icon="actionIcon(tour)" class="size-3.5" />
            </button>
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full gap-3">
        <button
          type="button"
          class="text-sm font-medium underline transition-colors duration-150 motion-reduce:transition-none rounded text-n-slate-11 underline-offset-4 decoration-n-slate-6 hover:text-n-slate-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
          @click="onResetAll"
        >
          {{
            isResetConfirming
              ? t('TUTORIALS.HUB.RESET_ALL_CONFIRM')
              : t('TUTORIALS.HUB.RESET_ALL')
          }}
        </button>
        <button
          type="button"
          class="inline-flex items-center rounded-lg bg-n-alpha-2 px-3.5 py-2 text-sm font-medium text-n-slate-12 ring-1 ring-n-weak transition-colors duration-150 motion-reduce:transition-none hover:bg-n-alpha-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-n-slate-12 dark:focus-visible:ring-orbis-neon"
          @click="closeHub"
        >
          {{ t('TUTORIALS.HUB.CLOSE') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
