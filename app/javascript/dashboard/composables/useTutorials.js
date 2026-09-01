import { computed } from 'vue';

import { useAccount } from 'dashboard/composables/useAccount';
import { useAdmin } from 'dashboard/composables/useAdmin';
import { useMapGetter } from 'dashboard/composables/store';
import { usePolicy } from 'dashboard/composables/usePolicy';
import { useUISettings } from 'dashboard/composables/useUISettings';

import { LocalStorage } from 'shared/helpers/localStorage';
import { LOCAL_STORAGE_KEYS } from 'dashboard/constants/localStorage';
import wootConstants from 'dashboard/constants/globals';

import { TOURS, getTourById } from 'dashboard/components-next/tutorials/tours';

import {
  activeTour,
  activeStepIndex,
  finishedTourId,
  isHubOpen,
  isRunning,
  isWelcomeOpen,
  openHub,
  closeHub,
  stepProgress,
} from 'dashboard/composables/useTutorialsUI';

const readStepProgress = () => stepProgress.value;

// Tours anchor on the desktop layout: on a phone the sidebar is a closed
// drawer and the conversation panes are mutually exclusive, so every anchored
// step would resolve to nothing.
const isSmallScreen = () =>
  window.innerWidth < wootConstants.SMALL_SCREEN_BREAKPOINT;

export function useTutorials() {
  const { accountId } = useAccount();
  const { isAdmin } = useAdmin();
  const { shouldShow } = usePolicy();
  const { uiSettings, updateUISettings } = useUISettings();
  const allConversations = useMapGetter('getAllConversations');

  const settings = computed(() => uiSettings.value?.tutorials ?? {});
  const completedIds = computed(() => settings.value.completed ?? []);
  const dismissedHintIds = computed(() => settings.value.dismissed_hints ?? []);

  // The sidebar decides what it renders with exactly this predicate, so an
  // anchor exists if and only if `shouldShow` agrees: a tour the user could
  // never navigate to is never offered.
  const isVisible = entry => {
    if (entry.audience === 'admin' && !isAdmin.value) return false;
    return shouldShow(entry.featureFlag, entry.permissions);
  };

  const stepIndexFor = tourId =>
    readStepProgress()[accountId.value]?.[tourId] ?? 0;

  const canRunOnThisScreen = tour =>
    Boolean(tour) && (tour.mobileSafe || !isSmallScreen());

  const tours = computed(() =>
    TOURS.filter(isVisible).map(tour => ({
      ...tour,
      resumeStepIndex: stepIndexFor(tour.id),
    }))
  );

  const isCompleted = tourId => completedIds.value.includes(tourId);

  const progress = computed(() => {
    const visible = tours.value;
    const done = visible.filter(tour => isCompleted(tour.id)).map(t => t.id);
    return {
      completedIds: done,
      completedCount: done.length,
      totalCount: visible.length,
      percent: visible.length
        ? Math.round((done.length / visible.length) * 100)
        : 0,
    };
  });

  // `updateUISettings` merges only the first level, so the whole `tutorials`
  // object has to be read, merged and written back as one value.
  const patchSettings = patch =>
    updateUISettings({ tutorials: { ...settings.value, ...patch } });

  const writeStepIndex = (tourId, index) => {
    const store = readStepProgress();
    const forAccount = { ...(store[accountId.value] ?? {}), [tourId]: index };
    stepProgress.value = { ...store, [accountId.value]: forAccount };
    LocalStorage.updateJsonStore(
      LOCAL_STORAGE_KEYS.TUTORIAL_PROGRESS,
      accountId.value,
      forAccount
    );
  };

  const clearStepIndex = tourId => {
    const store = readStepProgress();
    const forAccount = { ...(store[accountId.value] ?? {}) };
    delete forAccount[tourId];
    stepProgress.value = { ...store, [accountId.value]: forAccount };
    LocalStorage.updateJsonStore(
      LOCAL_STORAGE_KEYS.TUTORIAL_PROGRESS,
      accountId.value,
      forAccount
    );
  };

  // Tours that teach the reply flow only make sense with a chat open; the
  // engine uses this to pick the start route and to drop the steps that would
  // otherwise wait three seconds for an element that cannot exist.
  const firstConversationId = computed(
    () => allConversations.value?.[0]?.id ?? null
  );

  /**
   * Steps the current user is allowed to see. Filtering here — not while the
   * tour runs — keeps the progress counter honest.
   * @param {Object} tour
   * @returns {Array} visible steps
   */
  const resolveSteps = tour => {
    if (!tour) return [];

    return tour.steps.filter(step => {
      if (step.requiresConversation && !firstConversationId.value) return false;
      return isVisible(step);
    });
  };

  /**
   * Where the tour has to start. Conversation tours resolve to a real chat so
   * their anchors exist; everything else uses the declared route.
   * @param {Object} tour
   * @returns {Object|null}
   */
  const resolveTourRoute = tour => {
    if (!tour) return null;
    if (tour.conversationScoped && firstConversationId.value) {
      return {
        name: 'inbox_conversation',
        params: { conversation_id: firstConversationId.value },
      };
    }
    return tour.route;
  };

  const startTour = (tourId, stepIndex = 0) => {
    const tour = getTourById(tourId);
    if (!tour || !canRunOnThisScreen(tour)) return;

    finishedTourId.value = null;
    activeStepIndex.value = stepIndex;
    activeTour.value = tour;
  };

  const resumeTour = tourId => startTour(tourId, stepIndexFor(tourId));

  const stopTour = () => {
    activeTour.value = null;
    activeStepIndex.value = 0;
  };

  const markCompleted = tourId => {
    if (!isCompleted(tourId)) {
      patchSettings({ completed: [...completedIds.value, tourId] });
    }
    clearStepIndex(tourId);
  };

  const resetTour = tourId => {
    patchSettings({
      completed: completedIds.value.filter(id => id !== tourId),
    });
    clearStepIndex(tourId);
  };

  const resetAll = () => {
    patchSettings({ completed: [] });
    stepProgress.value = { ...readStepProgress(), [accountId.value]: {} };
    LocalStorage.updateJsonStore(
      LOCAL_STORAGE_KEYS.TUTORIAL_PROGRESS,
      accountId.value,
      {}
    );
  };

  const shouldShowWelcome = computed(() => !settings.value.welcome_dismissed);

  const dismissWelcome = () => {
    if (!shouldShowWelcome.value) return;
    patchSettings({ welcome_dismissed: true });
  };

  const isHintDismissed = tourId => dismissedHintIds.value.includes(tourId);

  const dismissHint = tourId => {
    if (isHintDismissed(tourId)) return;
    patchSettings({ dismissed_hints: [...dismissedHintIds.value, tourId] });
  };

  // The tour that just ended, so the completion dialog can offer the next one.
  const finishedTour = computed(() =>
    finishedTourId.value ? getTourById(finishedTourId.value) : null
  );

  const nextTour = computed(() => {
    if (!finishedTourId.value) return null;
    const runnable = tours.value.filter(
      tour =>
        tour.id !== finishedTourId.value &&
        !isCompleted(tour.id) &&
        canRunOnThisScreen(tour)
    );
    return (
      runnable.find(
        tour => tour.order > (getTourById(finishedTourId.value)?.order ?? 0)
      ) ??
      runnable[0] ??
      null
    );
  });

  const clearFinishedTour = () => {
    finishedTourId.value = null;
  };

  return {
    // state
    tours,
    activeTour,
    activeStepIndex,
    isRunning,
    progress,
    isHubOpen,
    isWelcomeOpen,
    shouldShowWelcome,
    finishedTour,
    nextTour,
    // actions
    startTour,
    stopTour,
    resumeTour,
    markCompleted,
    resetTour,
    resetAll,
    openHub,
    closeHub,
    isCompleted,
    dismissWelcome,
    isHintDismissed,
    dismissHint,
    clearFinishedTour,
    canRunOnThisScreen,
    // engine internals
    resolveSteps,
    resolveTourRoute,
    finishedTourId,
    saveStepIndex: writeStepIndex,
  };
}
