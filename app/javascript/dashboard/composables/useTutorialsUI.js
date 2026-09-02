import { computed, ref } from 'vue';

import { LocalStorage } from 'shared/helpers/localStorage';
import { LOCAL_STORAGE_KEYS } from 'dashboard/constants/localStorage';

// Singleton state for the tutorials module. It lives here — apart from
// `useTutorials` — so that the always-mounted consumers (the sidebar and the
// profile menu) can read the running/hub state without pulling the whole tour
// catalog into the main dashboard chunk.
export const activeTour = ref(null);
export const activeStepIndex = ref(0);
export const isHubOpen = ref(false);
export const isWelcomeOpen = ref(false);
export const finishedTourId = ref(null);

// `expandedItem` is local state inside `Sidebar.vue` and is only provided to
// the sidebar's own subtree, so the engine cannot reach it. It watches this ref
// instead: a step declaring `before: { expandSidebarGroup: 'Settings' }` writes
// the group name here and the sidebar opens it. The engine clears it on
// teardown, which leaves whatever the user had open untouched — the sidebar
// never writes its stored preference from this path.
export const requestedSidebarGroup = ref(null);

// localStorage is not reactive; this mirror keeps the hub's "Resume" label and
// the engine's start index in sync with what we last wrote. Seeded eagerly:
// filling it lazily would write to the ref from inside the `tours` computed,
// which self-invalidates the getter. LocalStorage.get swallows its own errors.
export const stepProgress = ref(
  LocalStorage.get(LOCAL_STORAGE_KEYS.TUTORIAL_PROGRESS) || {}
);

export const isRunning = computed(() => Boolean(activeTour.value));

export const openHub = () => {
  isHubOpen.value = true;
};

export const closeHub = () => {
  isHubOpen.value = false;
};

/**
 * The slice of the tutorials state that costs nothing to import: no tour
 * modules, no driver.js, no i18n copy.
 */
export function useTutorialsUI() {
  return { isRunning, isHubOpen, openHub, closeHub, requestedSidebarGroup };
}
