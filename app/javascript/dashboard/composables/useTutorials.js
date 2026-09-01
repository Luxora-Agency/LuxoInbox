import { computed, ref } from 'vue';

import { useAccount } from 'dashboard/composables/useAccount';
import { useAdmin } from 'dashboard/composables/useAdmin';
import { useMapGetter } from 'dashboard/composables/store';
import { useUISettings } from 'dashboard/composables/useUISettings';

import { LocalStorage } from 'shared/helpers/localStorage';
import { LOCAL_STORAGE_KEYS } from 'dashboard/constants/localStorage';

import { TOURS, getTourById } from 'dashboard/components-next/tutorials/tours';

// Singleton state: every consumer (hub, welcome, chip, engine, sidebar) shares
// one running tour, so the state lives at module scope like the repo's other
// cross-component composables.
const activeTour = ref(null);
const activeStepIndex = ref(0);
const isHubOpen = ref(false);

// localStorage is not reactive; this mirror keeps the hub's "Resume" label and
// the engine's start index in sync with what we last wrote. Seeded eagerly:
// filling it lazily would write to the ref from inside the `tours` computed,
// which self-invalidates the getter. LocalStorage.get swallows its own errors.
const stepProgress = ref(
  LocalStorage.get(LOCAL_STORAGE_KEYS.TUTORIAL_PROGRESS) || {}
);

const readStepProgress = () => stepProgress.value;

export function useTutorials() {
  const { accountId } = useAccount();
  const { isAdmin } = useAdmin();
  const { uiSettings, updateUISettings } = useUISettings();
  const isFeatureEnabledonAccount = useMapGetter(
    'accounts/isFeatureEnabledonAccount'
  );

  const settings = computed(() => uiSettings.value?.tutorials ?? {});
  const completedIds = computed(() => settings.value.completed ?? []);

  const isFlagOn = flag =>
    !flag || isFeatureEnabledonAccount.value(accountId.value, flag);

  const isVisible = entry => {
    if (entry.audience === 'admin' && !isAdmin.value) return false;
    return isFlagOn(entry.featureFlag);
  };

  const stepIndexFor = tourId =>
    readStepProgress()[accountId.value]?.[tourId] ?? 0;

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

  /**
   * Steps the current user is allowed to see. Filtering here — not while the
   * tour runs — keeps the progress counter honest.
   * @param {Object} tour
   * @returns {Array} visible steps
   */
  const resolveSteps = tour => (tour ? tour.steps.filter(isVisible) : []);

  const openHub = () => {
    isHubOpen.value = true;
  };

  const closeHub = () => {
    isHubOpen.value = false;
  };

  const startTour = (tourId, stepIndex = 0) => {
    const tour = getTourById(tourId);
    if (!tour) return;

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

  const dismissWelcome = () => patchSettings({ welcome_dismissed: true });

  return {
    // state
    tours,
    activeTour,
    activeStepIndex,
    isRunning: computed(() => Boolean(activeTour.value)),
    progress,
    isHubOpen,
    shouldShowWelcome,
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
    // engine internals
    resolveSteps,
    saveStepIndex: writeStepIndex,
  };
}
