import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-email',
  category: 'channels',
  icon: 'i-lucide-mail',
  order: 440,
  audience: 'admin',
  // The whole tour is about the email channel, so it hides where the channel
  // itself is unavailable instead of leaving an empty shelf behind.
  featureFlag: FEATURE_FLAGS.CHANNEL_EMAIL,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_inbox_new' },
  // The channel form is deliberately absent: starting the tour navigates away,
  // and a half-filled channel form is not recoverable.
  pageRoutes: ['settings_inbox_list', 'settings_inbox_new'],
  keywords: [
    'correo',
    'email',
    'gmail',
    'outlook',
    'microsoft',
    'imap',
    'smtp',
    'reenvio',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-inboxes"]',
      i18nKey: 'INBOX_EMAIL.NAVIGATION',
      side: 'right',
      align: 'start',
      route: { name: 'settings_inbox_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOX_EMAIL.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-email"]',
      i18nKey: 'INBOX_EMAIL.CARD',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.PROVIDERS',
    },
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.OAUTH',
    },
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.OTHER_PROVIDERS',
    },
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.FORWARDING',
    },
    {
      target: null,
      i18nKey: 'INBOX_EMAIL.FINISH',
    },
  ],
};
