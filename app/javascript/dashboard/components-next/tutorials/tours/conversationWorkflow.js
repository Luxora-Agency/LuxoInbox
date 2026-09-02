import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'conversation-workflow',
  category: 'productivity',
  icon: 'i-lucide-list-checks',
  order: 670,
  audience: 'admin',
  // The `conversation_workflow_index` route declares no feature flag: the page
  // itself is always reachable and each block inside it is gated on its own.
  featureFlag: null,
  // Verbatim from the `conversation_workflow_index` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 3,
  route: { name: 'conversation_workflow_index' },
  pageRoutes: ['conversation_workflow_index'],
  keywords: [
    'flujo',
    'resolucion automatica',
    'atributos obligatorios',
    'workflow',
    'auto resolve',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-conversation-workflow"]',
      i18nKey: 'CONVERSATION_WORKFLOW.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'conversation_workflow_index' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'CONVERSATION_WORKFLOW.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.AUTO_RESOLVE',
      featureFlag: FEATURE_FLAGS.AUTO_RESOLVE_CONVERSATIONS,
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.AUTO_RESOLVE_OPTIONS',
      featureFlag: FEATURE_FLAGS.AUTO_RESOLVE_CONVERSATIONS,
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.REQUIRED_ATTRIBUTES',
      featureFlag: FEATURE_FLAGS.CONVERSATION_REQUIRED_ATTRIBUTES,
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.REQUIRED_FLOW',
      featureFlag: FEATURE_FLAGS.CONVERSATION_REQUIRED_ATTRIBUTES,
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_WORKFLOW.FINISH',
    },
  ],
};
