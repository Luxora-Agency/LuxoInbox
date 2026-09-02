import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The scenarios route carries `metaV2`, not the base captain meta.
export default {
  id: 'luxoia-scenarios',
  category: 'ai',
  icon: 'i-lucide-list-ordered',
  order: 730,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN_V2,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 3,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_scenarios_index' },
  },
  pageRoutes: ['captain_assistants_scenarios_index'],
  keywords: [
    'scenarios',
    'escenarios',
    'instrucciones',
    'reglas',
    'situaciones',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-scenarios"]',
      i18nKey: 'LUXOIA_SCENARIOS.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-scenarios"]',
      i18nKey: 'LUXOIA_SCENARIOS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SCENARIOS.EXAMPLES',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SCENARIOS.CREATE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SCENARIOS.TOOLS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_SCENARIOS.FINISH',
    },
  ],
};
