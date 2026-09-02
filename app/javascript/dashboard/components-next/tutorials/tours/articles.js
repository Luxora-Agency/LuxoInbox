import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'articles',
  category: 'help-center',
  icon: 'i-lucide-file-text',
  order: 920,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.HELP_CENTER,
  // Verbatim from the `portals_articles_index` route meta.
  permissions: ['administrator', 'agent', 'knowledge_base_manage'],
  estimatedMinutes: 5,
  route: {
    name: 'portals_index',
    params: { navigationPath: 'portals_articles_index' },
  },
  pageRoutes: [
    'portals_articles_index',
    'portals_categories_articles_index',
    'portals_articles_new',
    'portals_articles_edit',
  ],
  keywords: [
    'articulo',
    'articulos',
    'redactar',
    'publicar',
    'borrador',
    'traducir',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'ARTICLES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-portals-articles"]',
      i18nKey: 'ARTICLES.WHERE',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_articles_index' },
      },
      before: { expandSidebarGroup: 'Portals' },
    },
    {
      target: '[data-tour="helpcenter-page"]',
      i18nKey: 'ARTICLES.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'ARTICLES.TABS',
    },
    // Only resolves once the portal has at least one article; on an empty
    // portal the engine drops this step and the tour keeps its counter honest.
    {
      target: '[data-tour="article-card"]',
      i18nKey: 'ARTICLES.CARD',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'ARTICLES.NEW',
    },
    // The editor route needs a portal slug, a locale and an article slug in
    // the URL, so it is explained instead of navigated to.
    {
      target: null,
      i18nKey: 'ARTICLES.EDITOR',
    },
    {
      target: null,
      i18nKey: 'ARTICLES.PUBLISH',
    },
    {
      target: null,
      i18nKey: 'ARTICLES.TRANSLATE',
    },
    {
      target: null,
      i18nKey: 'ARTICLES.FINISH',
    },
  ],
};
