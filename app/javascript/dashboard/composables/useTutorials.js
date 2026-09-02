import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

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
  CATEGORIES,
  categoryI18nKey,
} from 'dashboard/components-next/tutorials/tours/categories';

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

// `TUTORIALS.TOURS.<UPPER_SNAKE_ID>` — the locale tree keys tours by id.
const tourI18nKey = id =>
  `TUTORIALS.TOURS.${id.toUpperCase().replace(/-/g, '_')}`;

// The search box is typed without accents as often as with them, and Spanish
// copy is full of them: fold both sides before comparing.
const normalize = value =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

export function useTutorials() {
  const { t } = useI18n();
  const route = useRoute();
  const { accountId } = useAccount();
  const { isAdmin } = useAdmin();
  const { shouldShow, shouldShowPaywall } = usePolicy();
  const { uiSettings, updateUISettings } = useUISettings();
  const allConversations = useMapGetter('getAllConversations');
  const allContacts = useMapGetter('contacts/getContacts');
  const allInboxes = useMapGetter('inboxes/getInboxes');
  const userAccounts = useMapGetter('getUserAccounts');

  const settings = computed(() => uiSettings.value?.tutorials ?? {});
  const completedIds = computed(() => settings.value.completed ?? []);
  const dismissedHintIds = computed(() => settings.value.dismissed_hints ?? []);

  // The sidebar decides what it renders with exactly this predicate, so an
  // anchor exists if and only if `shouldShow` agrees: a tour the user could
  // never navigate to is never offered.
  // Tours and steps copy their route's `meta` verbatim, so the third argument
  // is what keeps a cloud-only or enterprise-only page from being taught on an
  // installation that does not have it.
  // `shouldShow` deliberately keeps a premium feature visible when the plan
  // does not include it, so the screen itself can sell the upgrade. A tour of
  // a paywall teaches nothing, so it is dropped here.
  const isVisible = entry => {
    if (entry.audience === 'admin' && !isAdmin.value) return false;
    if (shouldShowPaywall(entry.featureFlag)) return false;
    return shouldShow(
      entry.featureFlag,
      entry.permissions,
      entry.installationTypes
    );
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
    const done = visible
      .filter(tour => isCompleted(tour.id))
      .map(tour => tour.id);
    return {
      completedIds: done,
      completedCount: done.length,
      totalCount: visible.length,
      percent: visible.length
        ? Math.round((done.length / visible.length) * 100)
        : 0,
    };
  });

  /**
   * The library shelves: every category that still has something to offer this
   * user, with its own progress. Categories whose tours are all hidden by a
   * flag, a permission or the installation type are dropped, so the rail never
   * shows a shelf that opens on nothing.
   * @returns {Array} categories decorated with `tours` and progress counters
   */
  const categories = computed(() => {
    const visible = tours.value;

    return CATEGORIES.map(category => {
      const categoryTours = visible.filter(
        tour => tour.category === category.id
      );

      return {
        ...category,
        i18nKey: categoryI18nKey(category.id),
        tours: categoryTours,
        completedCount: categoryTours.filter(tour => isCompleted(tour.id))
          .length,
        totalCount: categoryTours.length,
      };
    }).filter(category => category.totalCount > 0);
  });

  /**
   * Tours that belong to a screen. `pageRoutes` lets one tour be offered on
   * several routes (a list and its detail, a wizard and its steps); a tour that
   * does not declare it is offered on its own start route only.
   * @param {string} routeName
   * @returns {Array} visible tours for that route
   */
  const toursForRoute = routeName => {
    if (!routeName) return [];

    return tours.value.filter(tour =>
      (tour.pageRoutes ?? [tour.route?.name]).includes(routeName)
    );
  };

  // Single source of truth for the contextual chip, the per-screen launcher
  // and the command bar.
  const toursForCurrentRoute = computed(() => toursForRoute(route?.name));

  /**
   * Free-text search over the library: the translated name and description
   * plus the tour's own `keywords`, all accent- and case-insensitive.
   * @param {string} query
   * @returns {Array} matching visible tours
   */
  const searchTours = query => {
    const needle = normalize(query);
    if (!needle) return tours.value;

    return tours.value.filter(tour => {
      const key = tourI18nKey(tour.id);
      const haystack = [
        t(`${key}.NAME`),
        t(`${key}.DESCRIPTION`),
        ...(tour.keywords ?? []),
      ]
        .map(normalize)
        .join(' ');

      return haystack.includes(needle);
    });
  };

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

  // Same idea for the record-scoped tours: the contact detail page and the
  // inbox settings page only exist for a concrete id, so a tour that teaches
  // them runs against the first record the account has.
  const firstContactId = computed(() => allContacts.value?.[0]?.id ?? null);

  const firstInboxId = computed(() => allInboxes.value?.[0]?.id ?? null);

  const hasMultipleAccounts = computed(
    () => (userAccounts.value?.length ?? 0) > 1
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
      if (step.requiresContact && !firstContactId.value) return false;
      if (step.requiresInbox && !firstInboxId.value) return false;
      // The account switcher only opens for a user who belongs to more than
      // one account; on a single-account install its dropdown never renders.
      if (step.requiresMultipleAccounts && !hasMultipleAccounts.value)
        return false;
      return isVisible(step);
    });
  };

  /**
   * A tour whose every step needs a conversation, a contact or an inbox this
   * account does not have yet. Starting it would close the hub and show
   * nothing at all, so the card is disabled and the launcher drops it.
   * @param {Object} tour
   * @returns {boolean}
   */
  const isBlockedByData = tour => Boolean(tour) && !resolveSteps(tour).length;

  /**
   * Where the tour has to start. Record-scoped tours resolve to a real
   * conversation, contact or inbox so their anchors exist; everything else uses
   * the declared route.
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
    if (tour.contactScoped && firstContactId.value) {
      return {
        name: 'contacts_edit',
        params: { contactId: firstContactId.value },
      };
    }
    if (tour.inboxScoped && firstInboxId.value) {
      return {
        name: 'settings_inbox_show',
        params: { inboxId: firstInboxId.value },
      };
    }
    return tour.route;
  };

  const startTour = (tourId, stepIndex = 0) => {
    const tour = getTourById(tourId);
    if (!tour || !canRunOnThisScreen(tour) || isBlockedByData(tour)) return;

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
    categories,
    toursForCurrentRoute,
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
    isBlockedByData,
    searchTours,
    tourI18nKey,
    // engine internals
    resolveSteps,
    resolveTourRoute,
    finishedTourId,
    saveStepIndex: writeStepIndex,
  };
}
