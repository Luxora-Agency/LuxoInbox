export default {
  id: 'conversations',
  icon: 'i-lucide-messages-square',
  order: 2,
  audience: 'all',
  featureFlag: null,
  estimatedMinutes: 5,
  route: { name: 'home' },
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
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-header"]',
      i18nKey: 'CONVERSATIONS.HEADER',
      side: 'bottom',
      align: 'center',
    },
    {
      target: '[data-tour="conversation-resolve"]',
      i18nKey: 'CONVERSATIONS.RESOLVE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-more-actions"]',
      i18nKey: 'CONVERSATIONS.MORE_ACTIONS',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-sidebar"]',
      i18nKey: 'CONVERSATIONS.SIDEPANEL',
      side: 'left',
      align: 'start',
    },
    {
      target: '[data-tour="sidepanel-switch"]',
      i18nKey: 'CONVERSATIONS.SIDEPANEL_SWITCH',
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
