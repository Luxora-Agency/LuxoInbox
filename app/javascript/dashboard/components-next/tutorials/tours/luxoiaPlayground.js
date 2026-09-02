import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'luxoia-playground',
  category: 'ai',
  icon: 'i-lucide-flask-conical',
  order: 740,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 3,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_playground_index' },
  },
  pageRoutes: ['captain_assistants_playground_index'],
  keywords: ['playground', 'probar', 'pruebas', 'test', 'zona de pruebas'],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-playground"]',
      i18nKey: 'LUXOIA_PLAYGROUND.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-playground"]',
      i18nKey: 'LUXOIA_PLAYGROUND.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_PLAYGROUND.WHAT_TO_ASK',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_PLAYGROUND.FIX',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_PLAYGROUND.CREDITS',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_PLAYGROUND.FINISH',
    },
  ],
};
