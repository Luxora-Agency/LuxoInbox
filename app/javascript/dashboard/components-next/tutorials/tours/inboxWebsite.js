import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-website',
  category: 'channels',
  icon: 'i-lucide-globe',
  order: 410,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 5,
  route: { name: 'settings_inbox_new' },
  // The channel form is deliberately absent: starting the tour navigates away,
  // and a half-filled channel form is not recoverable.
  pageRoutes: ['settings_inbox_list', 'settings_inbox_new'],
  keywords: [
    'widget',
    'chat en vivo',
    'sitio web',
    'website',
    'live chat',
    'script',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_WEBSITE.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-inboxes"]',
      i18nKey: 'INBOX_WEBSITE.NAVIGATION',
      side: 'right',
      align: 'start',
      route: { name: 'settings_inbox_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOX_WEBSITE.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-website"]',
      i18nKey: 'INBOX_WEBSITE.CARD',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
      featureFlag: FEATURE_FLAGS.CHANNEL_WEBSITE,
    },
    {
      target: '[data-tour="channel-website-form"]',
      i18nKey: 'INBOX_WEBSITE.FORM',
      side: 'right',
      align: 'start',
      route: {
        name: 'settings_inboxes_page_channel',
        params: { sub_page: 'website' },
      },
      featureFlag: FEATURE_FLAGS.CHANNEL_WEBSITE,
    },
    {
      target: null,
      i18nKey: 'INBOX_WEBSITE.GREETING',
    },
    {
      target: null,
      i18nKey: 'INBOX_WEBSITE.AGENTS',
    },
    {
      target: null,
      i18nKey: 'INBOX_WEBSITE.SCRIPT',
    },
    {
      target: null,
      i18nKey: 'INBOX_WEBSITE.FINISH',
    },
  ],
};
