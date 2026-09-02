import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'categories-and-locales',
  category: 'help-center',
  icon: 'i-lucide-folder-tree',
  order: 930,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.HELP_CENTER,
  // Verbatim from the `portals_categories_index` and `portals_locales_index`
  // route meta.
  permissions: ['administrator', 'agent', 'knowledge_base_manage'],
  estimatedMinutes: 4,
  route: {
    name: 'portals_index',
    params: { navigationPath: 'portals_categories_index' },
  },
  pageRoutes: ['portals_categories_index', 'portals_locales_index'],
  keywords: [
    'categoria',
    'categorias',
    'idioma',
    'idiomas',
    'traduccion',
    'organizar',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-portals-categories"]',
      i18nKey: 'CATEGORIES_AND_LOCALES.CATEGORIES',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_categories_index' },
      },
      before: { expandSidebarGroup: 'Portals' },
    },
    {
      target: '[data-tour="helpcenter-page"]',
      i18nKey: 'CATEGORIES_AND_LOCALES.CATEGORY_PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.NEW_CATEGORY',
    },
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.ORDER',
    },
    {
      target: '[data-tour="sidebar-portals-locales"]',
      i18nKey: 'CATEGORIES_AND_LOCALES.LOCALES',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_locales_index' },
      },
    },
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.NEW_LOCALE',
    },
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.CONTENT',
    },
    {
      target: null,
      i18nKey: 'CATEGORIES_AND_LOCALES.FINISH',
    },
  ],
};
