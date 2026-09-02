// The call button lives in the conversation header, so the tour opens on a
// real conversation when the account has one and walks to the calls dashboard
// from there. With no conversations the first step is pruned and the tour
// starts on `route` instead.
export default {
  id: 'calls',
  category: 'calls',
  icon: 'i-lucide-phone',
  order: 1200,
  audience: 'all',
  // `calls/routes.js` declares no feature flag: the voice channel is checked
  // inside the page.
  featureFlag: null,
  permissions: [
    'agent',
    'administrator',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 3,
  route: { name: 'calls_dashboard_index' },
  pageRoutes: ['calls_dashboard_index'],
  conversationScoped: true,
  keywords: ['llamadas', 'calls', 'voz', 'voice', 'telefono', 'perdidas'],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="conversation-call"]',
      i18nKey: 'CALLS.CALL_BUTTON',
      requiresConversation: true,
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'CALLS.WIDGET',
    },
    {
      target: '[data-tour="sidebar-calls"]',
      i18nKey: 'CALLS.DASHBOARD',
      route: { name: 'calls_dashboard_index' },
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="calls-page"]',
      i18nKey: 'CALLS.PAGE',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CALLS.FILTERS',
    },
    {
      target: null,
      i18nKey: 'CALLS.ASSIGNEE',
    },
    {
      target: null,
      i18nKey: 'CALLS.SETUP',
    },
    {
      target: null,
      i18nKey: 'CALLS.FINISH',
    },
  ],
};
