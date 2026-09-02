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
// A step that neither navigates nor clicks anything is pointing at the screen
// already on display, so its anchor either exists or is one render away. The
// full budget there is three seconds of a frozen popover for every leaf a new
// account has not created yet.
const SETTLED_ANCHOR_TIMEOUT = 400;
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
// How much of the tour the account's data actually allows. A run that survived
// as a handful of narrative bubbles is not the tour the card promised, so it
// must not be stamped as completed.
let plannedStepCount = 0;
let declaredStepCount = 0;
// Every in-flight anchor poll. A second Next click starts its own walk, and the
// first walk's cancel must not be overwritten or its timer outlives the tour.
const anchorWaits = new Set();
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

const waitForAnchor = (selector, timeout = ANCHOR_TIMEOUT) =>
  new Promise(resolve => {
    const deadline = Date.now() + timeout;
    let timer = null;
    let cancel = null;

    const settle = element => {
      anchorWaits.delete(cancel);
      resolve(element);
    };

    cancel = () => {
      clearTimeout(timer);
      settle(null);
    };
    anchorWaits.add(cancel);

    const poll = () => {
      const element = findVisible(selector);
      if (element || Date.now() > deadline) {
        settle(element);
        return;
      }
      timer = setTimeout(poll, POLL_INTERVAL);
    };

    poll();
  });

/**
 * How long a step's own anchor is worth waiting for. A navigation — the step's
 * own or the one that opened the tour — and a click both change the screen
 * asynchronously; expanding a sidebar group or synthesising a hover do not.
 * @param {Object} step
 * @returns {number} milliseconds
 */
const anchorBudget = step => {
  if (step.route || Date.now() < navigationGraceUntil) return ANCHOR_TIMEOUT;
  if (typeof step.before === 'function' || step.before?.click) {
    return ANCHOR_TIMEOUT;
  }
  return SETTLED_ANCHOR_TIMEOUT;
};

const cancelAnchorWaits = () => {
  Array.from(anchorWaits).forEach(cancel => cancel());
  anchorWaits.clear();
};

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
// A fresh object every time, so a step re-requesting the group the previous one
// already asked for still fires the sidebar's watcher.
const requestSidebarGroup = name => {
  requestedSidebarGroup.value = name ? { name } : null;
};

const actionContext = {
  router,
  store,
  expandSidebarGroup: async name => {
    requestSidebarGroup(name);
    await nextTick();
  },
};

/**
 * Reveals a control that only renders while the pointer is over its row. The
 * pointer sits on the driver popover during a tour, so the hover state has to
 * be synthesised. Best effort by design: layouts that render the control
 * unconditionally have nothing to hover and must not pay the anchor budget.
 * @param {string} selector
 */
const hoverAnchor = selector => {
  const element = findVisible(selector);
  if (!element) return;
  ['pointerenter', 'mouseenter', 'mouseover'].forEach(type => {
    element.dispatchEvent(
      new MouseEvent(type, { bubbles: type === 'mouseover' })
    );
  });
};

/**
 * Opens whatever a step needs on screen before it can be highlighted.
 * `{ click }` waits for the control with the same budget as an anchor and
 * clicks it — driver.js only blocks real pointer events, so a programmatic
 * click reaches the element under the overlay. `{ probe }` makes that click
 * idempotent: the surface the click is meant to open is looked up first and the
 * click is skipped when it is already there, so a toggle is never flipped shut.
 * `{ hover }` synthesises a hover for controls that only render on one, and
 * `{ expandSidebarGroup }` asks the sidebar to open a collapsible group. A
 * function is the escape hatch. Escape is never used to close anything:
 * driver.js listens for it and would kill the tour.
 * @param {Object|Function|undefined} action
 * @param {Object} ctx
 * @returns {Promise<boolean>} false when a declared control never showed up
 */
const runAction = async (action, ctx) => {
  if (!action) return true;

  if (typeof action === 'function') {
    await action(ctx);
    return true;
  }

  if (action.expandSidebarGroup) {
    await ctx.expandSidebarGroup(action.expandSidebarGroup);
  }

  if (action.hover) hoverAnchor(action.hover);

  if (!action.click) return true;

  if (action.probe) {
    await nextTick();
    if (findVisible(action.probe)) return true;
  }

  const element = await waitForAnchor(action.click);
  element?.click();
  return Boolean(element);
};

/**
 * Undoes a step's `before` when the user leaves it. The click that triggered the
 * leave may already have closed the surface: overlays listen for outside clicks
 * on `window` in the capture phase, which runs before driver.js can stop the
 * event at `document`. Vue has not patched the DOM at that instant, so a step
 * declaring `probe` is settled after the pending render and its click is skipped
 * when the surface is gone — otherwise the "close" would re-open it and leave
 * the dropdown or dialog orphaned on screen.
 *
 * Nothing here polls: the teardown path — a close, an abort, the hub swapping
 * tours — must not install an anchor wait that outlives the tour it belonged to.
 * @param {Object|Function|undefined} action
 * @returns {Promise<void>}
 */
const runLeaveAction = async action => {
  if (!action) return;

  if (typeof action === 'function') {
    action(actionContext);
    return;
  }

  if (action.expandSidebarGroup) {
    requestSidebarGroup(action.expandSidebarGroup);
  }

  if (!action.click) return;

  if (action.probe) {
    await nextTick();
    if (!findVisible(action.probe)) return;
  }

  findVisible(action.click)?.click();
};

const teardown = () => {
  runId += 1;
  transitionId += 1;
  const leavingStep = shownStep;
  shownStep = null;
  steps = [];
  hasShownStep = false;
  plannedStepCount = 0;
  declaredStepCount = 0;
  cancelAnchorWaits();
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
  // A run the account's data cut down to a couple of narrative bubbles is not
  // the tour the card promised, so it must not be stamped as done.
  const completed = hasShownStep && plannedStepCount * 2 >= declaredStepCount;
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
    const opened = await runAction(step.before, actionContext);
    if (isStale()) return;

    if (!step.target) break;

    // Skipped when the control the step had to open never appeared — a tab
    // this channel does not offer, a button this plan hides. The anchor behind
    // it cannot exist either, so the step is dropped at once instead of paying
    // the budget a second time.
    let anchor = null;
    if (opened) {
      // eslint-disable-next-line no-await-in-loop
      anchor = await waitForAnchor(step.target, anchorBudget(step));
    }
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
  declaredStepCount = tour.steps.length;
  plannedStepCount = steps.length;
  // The hub and the launcher refuse to start a tour whose data left it empty,
  // so reaching this is a catalog bug rather than an account state.
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
