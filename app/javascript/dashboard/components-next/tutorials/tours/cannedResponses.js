import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'canned-responses',
  category: 'productivity',
  icon: 'i-lucide-message-square-text',
  order: 630,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CANNED_RESPONSES,
  // Verbatim from the `canned_list` route meta: [...ROLES,
  // ...CONVERSATION_PERMISSIONS].
  permissions: [
    'agent',
    'administrator',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 3,
  route: { name: 'canned_list' },
  pageRoutes: ['canned_list'],
  keywords: [
    'respuestas predefinidas',
    'plantillas',
    'atajos',
    'canned',
    'shortcuts',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CANNED_RESPONSES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-canned-responses"]',
      i18nKey: 'CANNED_RESPONSES.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'canned_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'CANNED_RESPONSES.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="canned-add"]',
      i18nKey: 'CANNED_RESPONSES.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'CANNED_RESPONSES.SHORT_CODE',
    },
    {
      target: null,
      i18nKey: 'CANNED_RESPONSES.USE',
    },
    {
      target: null,
      i18nKey: 'CANNED_RESPONSES.MANAGE',
    },
    {
      target: null,
      i18nKey: 'CANNED_RESPONSES.FINISH',
    },
  ],
};
