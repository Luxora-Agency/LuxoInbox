import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-whatsapp',
  category: 'channels',
  icon: 'i-lucide-message-circle',
  order: 420,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 5,
  route: { name: 'settings_inbox_new' },
  pageRoutes: [
    'settings_inbox_list',
    'settings_inbox_new',
    'settings_inboxes_page_channel',
  ],
  keywords: [
    'whatsapp',
    'meta',
    'twilio',
    'qr',
    'evolution',
    'cloud api',
    '360dialog',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.CONCEPT',
    },
    {
      target: '[data-tour="channel-card-whatsapp"]',
      i18nKey: 'INBOX_WHATSAPP.CARD',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-whatsapp-providers"]',
      i18nKey: 'INBOX_WHATSAPP.PROVIDERS',
      side: 'top',
      align: 'center',
      route: {
        name: 'settings_inboxes_page_channel',
        params: { sub_page: 'whatsapp' },
      },
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.CLOUD',
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.EMBEDDED',
      featureFlag: FEATURE_FLAGS.WHATSAPP_EMBEDDED_SIGNUP_FLOW,
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.TWILIO',
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.EVOLUTION',
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.MIGRATION',
      featureFlag: FEATURE_FLAGS.WHATSAPP_MANUAL_TRANSFER,
    },
    {
      target: null,
      i18nKey: 'INBOX_WHATSAPP.FINISH',
    },
  ],
};
