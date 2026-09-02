import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'help-center',
  category: 'help-center',
  icon: 'i-lucide-library-big',
  order: 900,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.HELP_CENTER,
  estimatedMinutes: 4,
  route: {
    name: 'portals_index',
    params: { navigationPath: 'portals_articles_index' },
  },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'HELP_CENTER.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-portals"]',
      i18nKey: 'HELP_CENTER.NAVIGATION',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="helpcenter-page"]',
      i18nKey: 'HELP_CENTER.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'HELP_CENTER.PORTAL',
    },
    {
      target: '[data-tour="sidebar-portals-articles"]',
      i18nKey: 'HELP_CENTER.ARTICLES',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_articles_index' },
      },
    },
    {
      target: '[data-tour="sidebar-portals-categories"]',
      i18nKey: 'HELP_CENTER.CATEGORIES',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_categories_index' },
      },
    },
    {
      target: '[data-tour="sidebar-portals-locales"]',
      i18nKey: 'HELP_CENTER.LOCALES',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_locales_index' },
      },
    },
    {
      target: null,
      i18nKey: 'HELP_CENTER.PUBLISH',
    },
    {
      target: '[data-tour="helpcenter-page"]',
      i18nKey: 'HELP_CENTER.DOMAIN',
      side: 'top',
      align: 'center',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_settings_index' },
      },
    },
    {
      target: null,
      i18nKey: 'HELP_CENTER.FINISH',
    },
  ],
};
