import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'luxoia-inboxes',
  category: 'ai',
  icon: 'i-lucide-plug',
  order: 750,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  permissions: ['administrator', 'agent'],
  installationTypes: ['cloud', 'enterprise', 'community'],
  estimatedMinutes: 3,
  route: {
    name: 'captain_assistants_index',
    params: { navigationPath: 'captain_assistants_inboxes_index' },
  },
  pageRoutes: ['captain_assistants_inboxes_index'],
  keywords: [
    'entradas',
    'bandeja de entrada',
    'inbox',
    'conectar',
    'canales',
    'activar',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-luxoia-inboxes"]',
      i18nKey: 'LUXOIA_INBOXES.NAV',
      before: { expandSidebarGroup: 'LuxoIA' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="captain-inboxes"]',
      i18nKey: 'LUXOIA_INBOXES.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_INBOXES.CONNECT',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_INBOXES.HANDOFF',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_INBOXES.DISCONNECT',
    },
    {
      target: null,
      i18nKey: 'LUXOIA_INBOXES.FINISH',
    },
  ],
};
