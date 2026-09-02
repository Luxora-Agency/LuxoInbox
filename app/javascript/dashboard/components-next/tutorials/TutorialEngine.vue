<script setup>
import { nextTick, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

import { useAccount } from 'dashboard/composables/useAccount';
import { useStore } from 'dashboard/composables/store';
import { useTutorials } from 'dashboard/composables/useTutorials';
import { requestedSidebarGroup } from 'dashboard/composables/useTutorialsUI';

const ANCHOR_TIMEOUT = 3000;
const POLL_INTERVAL = 100;
// Pages such as the help center redirect themselves once their data lands,
// well after our own `router.push` settled. Without a grace window that
// redirect reads as "the user navigated away" and kills the tour.
const NAVIGATION_GRACE = 2500;
const ORBIS_NAVY = '#010828';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();
const { accountScopedRoute } = useAccount();

const {
  activeTour,
  activeStepIndex,
  stopTour,
  markCompleted,
  resolveSteps,
  resolveTourRoute,
  saveStepIndex,
  finishedTourId,
} = useTutorials();

let driverObj = null;
let steps = [];
// Bumped on every teardown: anything still awaiting from the previous tour
// checks this and bails instead of driving the tour that replaced it.
let runId = 0;
// Bumped on every `goToStep`: a second Next click supersedes the first walk.
let transitionId = 0;
// Distinguishes the engine's own navigation (and the redirects it triggers)
// from the user navigating away.
let navigationGraceUntil = 0;
let isEngineNavigating = false;
// Guards the destroy <-> stopTour cycle from recursing.
let isTearingDown = false;
// A tour that never rendered a step must not be recorded as completed.
let hasShownStep = false;
let cancelAnchorWait = null;
// The step currently on screen, so its `after` action can undo whatever its
// `before` action opened when the user leaves it.
let shownStep = null;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * driver.js highlights `document.querySelector`'s first match, but sidebar
 * leaves stay mounted under `v-show` (display:none) and collapsed groups keep
 * their children focusable behind `visibility:hidden` inside a zero-height
 * grid row. Both still report client rects, so check the box and the computed
 * visibility instead.
 * @param {string} selector
 * @returns {Element|null}
 */
const findVisible = selector => {
  const nodes = Array.from(document.querySelectorAll(selector));
  return (
    nodes.find(node => {
      const { width, height } = node.getBoundingClientRect();
      if (!width || !height) return false;
      return window.getComputedStyle(node).visibility !== 'hidden';
    }) ?? null
  );
};

const waitForAnchor = selector =>
  new Promise(resolve => {
    const deadline = Date.now() + ANCHOR_TIMEOUT;
    let timer = null;

    cancelAnchorWait = () => {
      clearTimeout(timer);
      cancelAnchorWait = null;
      resolve(null);
    };

    const poll = () => {
      const element = findVisible(selector);
      if (element || Date.now() > deadline) {
        cancelAnchorWait = null;
        resolve(element);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL);
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
    navigationGraceUntil = Date.now() + NAVIGATION_GRACE;
  }
};

// What a step's declarative actions get to work with. `expandSidebarGroup`
// reaches the sidebar through the shared ref because `expandedItem` is local
// state provided only to the sidebar's own subtree.
const actionContext = {
  router,
  store,
  expandSidebarGroup: async name => {
    requestedSidebarGroup.value = name;
    await nextTick();
  },
};

/**
 * Opens whatever a step needs on screen before it can be highlighted.
 * `{ click }` waits for the control with the same budget as an anchor and
 * clicks it — driver.js only blocks real pointer events, so a programmatic
 * click reaches the element under the overlay. `{ expandSidebarGroup }` asks
 * the sidebar to open a collapsible group. A function is the escape hatch.
 * Escape is never used to close anything: driver.js listens for it and would
 * kill the tour.
 * @param {Object|Function|undefined} action
 * @param {Object} ctx
 */
const runAction = async (action, ctx) => {
  if (!action) return;

  if (typeof action === 'function') {
    await action(ctx);
    return;
  }

  if (action.expandSidebarGroup) {
    await ctx.expandSidebarGroup(action.expandSidebarGroup);
  }

  if (action.click) {
    const element = await waitForAnchor(action.click);
    element?.click();
  }
};

/**
 * Undoes a step's `before` when the user leaves it. Nothing here waits:
 * whatever the step opened is on screen already, and the teardown path — a
 * close, an abort, the hub swapping tours — has to stay synchronous so it
 * cannot install an anchor poll that outlives the tour it belonged to.
 * @param {Object|Function|undefined} action
 */
const runLeaveAction = action => {
  if (!action) return;

  if (typeof action === 'function') {
    action(actionContext);
    return;
  }

  if (action.expandSidebarGroup) {
    requestedSidebarGroup.value = action.expandSidebarGroup;
  }

  if (action.click) findVisible(action.click)?.click();
};

const teardown = () => {
  runId += 1;
  transitionId += 1;
  const leavingStep = shownStep;
  shownStep = null;
  steps = [];
  hasShownStep = false;
  cancelAnchorWait?.();
  runLeaveAction(leavingStep?.after);
  // Clearing last, so it supersedes any group the leave action just asked for:
  // once the tour is gone nothing may keep steering the sidebar. Only the ref
  // is touched — the user's stored preference is never written from here.
  requestedSidebarGroup.value = null;
  if (!driverObj) return;
  const instance = driverObj;
  driverObj = null;
  instance.destroy();
};

const finish = () => {
  const tour = activeTour.value;
  const completed = hasShownStep;
  isTearingDown = true;
  teardown();
  if (tour && completed) {
    markCompleted(tour.id);
    finishedTourId.value = tour.id;
  }
  stopTour();
  isTearingDown = false;
};

const abort = () => {
  isTearingDown = true;
  teardown();
  stopTour();
  isTearingDown = false;
};

const buildDriverSteps = () =>
  steps.map(step => ({
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

/**
 * Moves to `index`, dropping any step in `direction` whose anchor never shows
 * up, so a missing element never leaves a popover pointing at nothing and the
 * progress counter never claims steps the user will not see.
 * @param {number} index
 * @param {number} direction -1 or 1
 */
const goToStep = async (index, direction) => {
  transitionId += 1;
  const localRun = runId;
  const localTransition = transitionId;
  const isStale = () =>
    localRun !== runId || localTransition !== transitionId || !activeTour.value;

  // The step on screen is being left: close whatever it opened before the next
  // one navigates or opens anything of its own.
  const leavingStep = shownStep;
  shownStep = null;
  runLeaveAction(leavingStep?.after);

  let cursor = index;
  let hasPruned = false;

  while (cursor >= 0 && cursor < steps.length) {
    const step = steps[cursor];
    // eslint-disable-next-line no-await-in-loop
    await navigateTo(step.route);
    if (isStale()) return;

    // eslint-disable-next-line no-await-in-loop
    await runAction(step.before, actionContext);
    if (isStale()) return;

    if (!step.target) break;
    // eslint-disable-next-line no-await-in-loop
    const anchor = await waitForAnchor(step.target);
    if (isStale()) return;
    if (anchor) break;

    // The step is dropped: it will never be shown, so its own leave never runs
    // and whatever its `before` opened has to be closed right here.
    runLeaveAction(step.after);
    steps.splice(cursor, 1);
    hasPruned = true;
    // Splicing already slid the next forward candidate into `cursor`.
    if (direction < 0) cursor -= 1;
  }

  if (isStale()) return;

  if (!steps.length) {
    finish();
    return;
  }

  // driver.js reads the progress counter off the step list it was built with,
  // so a dropped step has to leave the instance too. `setSteps` only resets the
  // state and would re-register every listener on the next `drive`; rebuilding
  // is the path that tears the old instance down cleanly.
  if (hasPruned) {
    isTearingDown = true;
    driverObj?.destroy();
    isTearingDown = false;
    // eslint-disable-next-line no-use-before-define
    driverObj = buildDriver();
  }

  // Walking backwards off the start means every earlier step was dropped, so
  // index 0 is the step the user was already on. Going back never completes.
  if (cursor < 0) cursor = 0;
  else if (cursor >= steps.length) {
    finish();
    return;
  }

  hasShownStep = true;
  shownStep = steps[cursor];
  activeStepIndex.value = cursor;
  saveStepIndex(activeTour.value.id, cursor);
  driverObj?.drive(cursor);
};

const buildDriver = () =>
  driver({
    steps: buildDriverSteps(),
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

watch(activeTour, async tour => {
  // Covers both "tour ended" and "the hub swapped one running tour for another".
  isTearingDown = true;
  teardown();
  isTearingDown = false;

  if (!tour) return;

  const localRun = runId;

  steps = resolveSteps(tour);
  if (!steps.length) {
    stopTour();
    return;
  }

  await navigateTo(resolveTourRoute(tour));
  if (localRun !== runId || activeTour.value !== tour) return;

  driverObj = buildDriver();
  await goToStep(Math.min(activeStepIndex.value, steps.length - 1), 1);
});

// The user leaving on their own invalidates every remaining anchor.
const removeGuard = router.afterEach(() => {
  if (!activeTour.value) return;
  if (isEngineNavigating || Date.now() < navigationGraceUntil) return;
  abort();
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
