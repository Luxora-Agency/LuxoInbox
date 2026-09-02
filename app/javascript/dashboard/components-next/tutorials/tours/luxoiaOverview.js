import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// Every LuxoIA page hangs off `:assistantId`, which the engine cannot know.
// `captain_assistants_index` is the shell that resolves the last active
// assistant and replaces itself with the real page, so it is the only
// deterministic way in — `navigationPath` says where to land.
export default {
  id: 'luxoia-overview',
  category: 'ai',
  icon: 'i-lucide-sparkles',
  order: 700,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  // Verbatim from `captain.routes.js` `meta`.
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 4,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_overview_index' },
  },
  pageRoutes: ['captain_assistants_overview_index'],
  keywords: ['luxoia', 'captain', 'ia', 'ai', 'asistente', 'assistant', 'bot'],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia"]',
      i18nKey: 'LUXOIA_OVERVIEW.SIDEBAR',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="sidebar-luxoia-overview"]',
      i18nKey: 'LUXOIA_OVERVIEW.SECTIONS',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-overview"]',
      i18nKey: 'LUXOIA_OVERVIEW.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_OVERVIEW.METRICS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_OVERVIEW.KNOWLEDGE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_OVERVIEW.SWITCHER',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_OVERVIEW.CREATE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_OVERVIEW.FINISH',
    },
  ],
};
