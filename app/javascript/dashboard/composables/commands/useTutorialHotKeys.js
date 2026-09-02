import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { useTutorials } from 'dashboard/composables/useTutorials';
import { ICON_TUTORIAL } from 'dashboard/helper/commandbar/icons';

/**
 * The tutorial library as command-bar actions: one parent that opens into every
 * tour the user is allowed to run on this screen, plus an entry for the hub.
 * @returns {{ tutorialHotKeys: import('vue').ComputedRef<Array> }}
 */
export function useTutorialHotKeys() {
  const { t } = useI18n();

  const { tours, startTour, openHub, canRunOnThisScreen, tourI18nKey } =
    useTutorials();

  // Anchored tours need the desktop layout; offering one the engine would
  // refuse to start is a dead command.
  const runnableTours = computed(() => tours.value.filter(canRunOnThisScreen));

  const tutorialHotKeys = computed(() => {
    const section = t('TUTORIALS.COMMANDS.SECTION');

    const options = runnableTours.value.map(tour => ({
      id: `tutorial_${tour.id}`,
      title: t('TUTORIALS.COMMANDS.START_PREFIX', {
        name: t(`${tourI18nKey(tour.id)}.NAME`),
      }),
      parent: 'open_tutorials',
      section,
      icon: ICON_TUTORIAL,
      handler: () => startTour(tour.id),
    }));

    const hubOption = {
      id: 'tutorial_open_hub',
      title: t('TUTORIALS.COMMANDS.OPEN_HUB'),
      parent: 'open_tutorials',
      section,
      icon: ICON_TUTORIAL,
      handler: () => openHub(),
    };

    return [
      {
        id: 'open_tutorials',
        title: t('TUTORIALS.COMMANDS.OPEN_HUB'),
        section,
        icon: ICON_TUTORIAL,
        children: [hubOption.id, ...options.map(option => option.id)],
      },
      hubOption,
      ...options,
    ];
  });

  return { tutorialHotKeys };
}
