import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'macros',
  category: 'productivity',
  icon: 'i-lucide-workflow',
  order: 640,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.MACROS,
  // Verbatim from the `macros_wrapper` / `macros_new` route meta:
  // [...ROLES, ...CONVERSATION_PERMISSIONS].
  permissions: [
    'agent',
    'administrator',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 5,
  route: { name: 'macros_wrapper' },
  pageRoutes: ['macros_wrapper', 'macros_new', 'macros_edit'],
  keywords: ['macros', 'acciones', 'flujo', 'automatizar', 'macro'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'MACROS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-macros"]',
      i18nKey: 'MACROS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'macros_wrapper' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'MACROS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="macro-editor"]',
      i18nKey: 'MACROS.EDITOR',
      side: 'top',
      align: 'center',
      route: { name: 'macros_new' },
    },
    {
      target: null,
      i18nKey: 'MACROS.ACTIONS',
    },
    {
      target: null,
      i18nKey: 'MACROS.ORDER',
    },
    {
      target: null,
      i18nKey: 'MACROS.VISIBILITY',
    },
    {
      target: null,
      i18nKey: 'MACROS.RUN',
    },
    {
      target: null,
      i18nKey: 'MACROS.FINISH',
      // Back to the list so the tour does not strand the user inside an
      // unsaved macro draft.
      route: { name: 'macros_wrapper' },
    },
  ],
};
