export default {
  id: 'conversations',
  category: 'conversations',
  icon: 'i-lucide-messages-square',
  order: 200,
  audience: 'all',
  featureFlag: null,
  estimatedMinutes: 5,
  route: { name: 'home' },
  // The card, header and contact panel only exist with a chat open, so the
  // engine starts this tour on a real conversation when the account has one.
  conversationScoped: true,
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="conversation-list"]',
      i18nKey: 'CONVERSATIONS.LIST',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-tabs"]',
      i18nKey: 'CONVERSATIONS.TABS',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-card"]',
      i18nKey: 'CONVERSATIONS.CARD',
      requiresConversation: true,
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-header"]',
      i18nKey: 'CONVERSATIONS.HEADER',
      requiresConversation: true,
      side: 'bottom',
      align: 'center',
    },
    {
      target: '[data-tour="conversation-resolve"]',
      i18nKey: 'CONVERSATIONS.RESOLVE',
      requiresConversation: true,
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-more-actions"]',
      i18nKey: 'CONVERSATIONS.MORE_ACTIONS',
      requiresConversation: true,
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-sidebar"]',
      i18nKey: 'CONVERSATIONS.SIDEPANEL',
      requiresConversation: true,
      side: 'left',
      align: 'start',
    },
    {
      target: '[data-tour="sidepanel-switch"]',
      i18nKey: 'CONVERSATIONS.SIDEPANEL_SWITCH',
      requiresConversation: true,
      side: 'left',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'CONVERSATIONS.LABELS',
    },
    {
      target: '[data-tour="sidebar-conversation"]',
      i18nKey: 'CONVERSATIONS.VIEWS',
      side: 'right',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'CONVERSATIONS.FINISH',
    },
  ],
};
