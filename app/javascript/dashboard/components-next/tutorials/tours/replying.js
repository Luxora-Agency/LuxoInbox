import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'replying',
  category: 'conversations',
  icon: 'i-lucide-reply',
  order: 210,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `home` route meta.
  permissions: [
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 5,
  route: { name: 'home' },
  // Every composer anchor lives inside an open conversation.
  conversationScoped: true,
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="composer"]',
      i18nKey: 'REPLYING.COMPOSER',
      requiresConversation: true,
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="composer-mode"]',
      i18nKey: 'REPLYING.MODE',
      requiresConversation: true,
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'REPLYING.PRIVATE_NOTE',
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'REPLYING.EDITOR',
      requiresConversation: true,
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'REPLYING.SHORTCUTS',
      requiresConversation: true,
      side: 'top',
      align: 'end',
    },
    {
      target: '[data-tour="composer-actions"]',
      i18nKey: 'REPLYING.ATTACHMENTS',
      requiresConversation: true,
      side: 'top',
      align: 'start',
    },
    {
      target: '[data-tour="composer-send"]',
      i18nKey: 'REPLYING.SEND',
      requiresConversation: true,
      side: 'top',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-resolve"]',
      i18nKey: 'REPLYING.RESOLVE',
      requiresConversation: true,
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="sidebar-settings-canned-responses"]',
      i18nKey: 'REPLYING.CANNED',
      side: 'right',
      align: 'start',
      route: { name: 'canned_list' },
      featureFlag: FEATURE_FLAGS.CANNED_RESPONSES,
    },
    {
      target: null,
      i18nKey: 'REPLYING.FINISH',
    },
  ],
};
