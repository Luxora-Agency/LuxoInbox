import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-messaging',
  category: 'channels',
  icon: 'i-lucide-send',
  order: 450,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_inbox_new' },
  // The channel form is deliberately absent: starting the tour navigates away,
  // and a half-filled channel form is not recoverable.
  pageRoutes: ['settings_inbox_list', 'settings_inbox_new'],
  keywords: [
    'sms',
    'twilio',
    'bandwidth',
    'telegram',
    'line',
    'api',
    'webhook',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_MESSAGING.CONCEPT',
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOX_MESSAGING.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-sms"]',
      i18nKey: 'INBOX_MESSAGING.SMS',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOX_MESSAGING.SMS_PROVIDERS',
    },
    {
      target: '[data-tour="channel-card-telegram"]',
      i18nKey: 'INBOX_MESSAGING.TELEGRAM',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-line"]',
      i18nKey: 'INBOX_MESSAGING.LINE',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-api"]',
      i18nKey: 'INBOX_MESSAGING.API',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOX_MESSAGING.CALLBACKS',
    },
    {
      target: null,
      i18nKey: 'INBOX_MESSAGING.FINISH',
    },
  ],
};
