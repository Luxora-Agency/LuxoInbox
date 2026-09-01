<script setup>
import { onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useAccount } from 'dashboard/composables/useAccount';
import { useTutorials } from 'dashboard/composables/useTutorials';

const ANCHOR_TIMEOUT = 3000;
const POLL_INTERVAL = 100;
const ORBIS_NAVY = '#010828';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const { accountScopedRoute } = useAccount();

const {
  activeTour,
  activeStepIndex,
  stopTour,
  markCompleted,
  resolveSteps,
  saveStepIndex,
} = useTutorials();

let driverObj = null;
let steps = [];
// Distinguishes the engine's own `router.push` from the user navigating away.
let isEngineNavigating = false;
// Guards the destroy <-> stopTour cycle from recursing.
let isTearingDown = false;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * driver.js highlights `document.querySelector`'s first match, but sidebar
 * leaves stay mounted under `v-show` (display:none). Pick the rendered one.
 * @param {string} selector
 * @returns {Element|null}
 */
const findVisible = selector => {
  const nodes = document.querySelectorAll(selector);
  return (
    Array.from(nodes).find(node => node.getClientRects().length > 0) ?? null
  );
};

const waitForAnchor = selector =>
  new Promise(resolve => {
    const deadline = Date.now() + ANCHOR_TIMEOUT;
    const poll = () => {
      const element = findVisible(selector);
      if (element || Date.now() > deadline) {
        resolve(element);
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    };
    poll();
  });

const navigateTo = async routeDef => {
  if (!routeDef) return;

  const target = router.resolve(
    accountScopedRoute(routeDef.name, routeDef.params)
  );
  if (target.fullPath === route.fullPath) return;

  isEngineNavigating = true;
  try {
    await router.push(target.fullPath);
  } catch {
    // A redirect or a duplicated navigation is not a tour failure; the anchor
    // poll below decides whether the step is usable.
  } finally {
    isEngineNavigating = false;
  }
};

const teardown = () => {
  steps = [];
  if (!driverObj) return;
  const instance = driverObj;
  driverObj = null;
  instance.destroy();
};

const finish = () => {
  const tour = activeTour.value;
  isTearingDown = true;
  teardown();
  if (tour) markCompleted(tour.id);
  stopTour();
  isTearingDown = false;
};

const abort = () => {
  isTearingDown = true;
  teardown();
  stopTour();
  isTearingDown = false;
};

/**
 * Moves to `index`, skipping in `direction` over any step whose anchor never
 * shows up, so a missing element never leaves a popover pointing at nothing.
 * @param {number} index
 * @param {number} direction -1 or 1
 */
const goToStep = async (index, direction) => {
  let cursor = index;

  while (cursor >= 0 && cursor < steps.length) {
    const step = steps[cursor];
    // eslint-disable-next-line no-await-in-loop
    await navigateTo(step.route);
    if (!activeTour.value) return;
    // eslint-disable-next-line no-await-in-loop
    if (!step.target || (await waitForAnchor(step.target))) break;
    cursor += direction;
  }

  if (!activeTour.value) return;

  if (cursor < 0 || cursor >= steps.length) {
    finish();
    return;
  }

  activeStepIndex.value = cursor;
  saveStepIndex(activeTour.value.id, cursor);
  driverObj?.drive(cursor);
};

const buildDriver = () => {
  const driverSteps = steps.map(step => ({
    element: step.target ? () => findVisible(step.target) : undefined,
    popover: {
      title: t(`TUTORIALS.TOURS.${step.i18nKey.replace('.', '.STEPS.')}.TITLE`),
      description: t(
        `TUTORIALS.TOURS.${step.i18nKey.replace('.', '.STEPS.')}.BODY`
      ),
      side: step.side ?? 'bottom',
      align: step.align ?? 'center',
    },
  }));

  return driver({
    steps: driverSteps,
    popoverClass: 'orbis-tour',
    overlayColor: ORBIS_NAVY,
    overlayOpacity: 0.65,
    stageRadius: 12,
    stagePadding: 8,
    animate: !prefersReducedMotion(),
    allowClose: true,
    showProgress: true,
    progressText: t('TUTORIALS.CONTROLS.PROGRESS'),
    nextBtnText: t('TUTORIALS.CONTROLS.NEXT'),
    prevBtnText: t('TUTORIALS.CONTROLS.PREV'),
    doneBtnText: t('TUTORIALS.CONTROLS.DONE'),
    onNextClick: () => goToStep((driverObj?.getActiveIndex() ?? 0) + 1, 1),
    onPrevClick: () => goToStep((driverObj?.getActiveIndex() ?? 0) - 1, -1),
    onDoneClick: () => finish(),
    onCloseClick: () => abort(),
    onDestroyed: () => {
      if (!isTearingDown) abort();
    },
  });
};

watch(activeTour, async tour => {
  // Covers both "tour ended" and "the hub swapped one running tour for another".
  isTearingDown = true;
  teardown();
  isTearingDown = false;

  if (!tour) return;

  steps = resolveSteps(tour);
  if (!steps.length) {
    stopTour();
    return;
  }

  await navigateTo(tour.route);
  if (activeTour.value !== tour) return;

  driverObj = buildDriver();
  await goToStep(Math.min(activeStepIndex.value, steps.length - 1), 1);
});

// The user leaving on their own invalidates every remaining anchor.
const removeGuard = router.afterEach(() => {
  if (activeTour.value && !isEngineNavigating) abort();
});

onBeforeUnmount(() => {
  removeGuard();
  abort();
});
</script>

<template>
  <!-- driver.js renders its overlay and popover into document.body. -->
  <div class="hidden" aria-hidden="true" />
</template>
