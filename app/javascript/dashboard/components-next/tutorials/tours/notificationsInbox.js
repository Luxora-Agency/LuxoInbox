export default {
  id: 'notifications-inbox',
  category: 'start',
  icon: 'i-lucide-bell',
  order: 140,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `inbox_view` route meta.
  permissions: [
    'agent',
    'administrator',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 3,
  route: { name: 'inbox_view' },
  pageRoutes: ['inbox_view', 'inbox_view_conversation'],
  keywords: [
    'notificaciones',
    'bandeja de entrada',
    'menciones',
    'avisos',
    'notifications',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-inbox"]',
      i18nKey: 'NOTIFICATIONS_INBOX.ENTRY',
      side: 'right',
      align: 'start',
      route: { name: 'inbox_view' },
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.WHAT_ARRIVES',
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.READING',
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.DISPLAY',
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.ACTIONS',
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.SNOOZE',
    },
    {
      target: '[data-tour="sidebar-conversation"]',
      i18nKey: 'NOTIFICATIONS_INBOX.DIFFERENCE',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Conversation' },
    },
    {
      target: null,
      i18nKey: 'NOTIFICATIONS_INBOX.FINISH',
    },
  ],
};
