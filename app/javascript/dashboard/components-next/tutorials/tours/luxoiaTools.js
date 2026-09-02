import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The tools route carries `metaCustomTools`: its own flag and no community
// installations.
export default {
  id: 'luxoia-tools',
  category: 'ai',
  icon: 'i-lucide-wrench',
  order: 770,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN_CUSTOM_TOOLS,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 4,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_tools_index' },
  },
  pageRoutes: ['captain_tools_index'],
  keywords: [
    'tools',
    'herramientas',
    'api',
    'endpoint',
    'integracion',
    'webhook',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-tools"]',
      i18nKey: 'LUXOIA_TOOLS.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-tools"]',
      i18nKey: 'LUXOIA_TOOLS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_TOOLS.CREATE',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_TOOLS.AUTH',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_TOOLS.SCENARIOS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_TOOLS.LIMIT',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_TOOLS.FINISH',
    },
  ],
};
