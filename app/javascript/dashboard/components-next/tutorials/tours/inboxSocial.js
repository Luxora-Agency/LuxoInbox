import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-social',
  category: 'channels',
  icon: 'i-lucide-at-sign',
  order: 430,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_inbox_new' },
  pageRoutes: [
    'settings_inbox_list',
    'settings_inbox_new',
    'settings_inboxes_page_channel',
  ],
  keywords: [
    'facebook',
    'messenger',
    'instagram',
    'tiktok',
    'redes sociales',
    'social',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_SOCIAL.CONCEPT',
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOX_SOCIAL.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-facebook"]',
      i18nKey: 'INBOX_SOCIAL.FACEBOOK',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
      featureFlag: FEATURE_FLAGS.CHANNEL_FACEBOOK,
    },
    {
      target: null,
      i18nKey: 'INBOX_SOCIAL.FACEBOOK_SETUP',
      featureFlag: FEATURE_FLAGS.CHANNEL_FACEBOOK,
    },
    {
      target: '[data-tour="channel-card-instagram"]',
      i18nKey: 'INBOX_SOCIAL.INSTAGRAM',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
      featureFlag: FEATURE_FLAGS.CHANNEL_INSTAGRAM,
    },
    {
      target: '[data-tour="channel-card-tiktok"]',
      i18nKey: 'INBOX_SOCIAL.TIKTOK',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
      featureFlag: FEATURE_FLAGS.CHANNEL_TIKTOK,
    },
    {
      target: null,
      i18nKey: 'INBOX_SOCIAL.PERMISSIONS',
    },
    {
      target: null,
      i18nKey: 'INBOX_SOCIAL.REAUTHORIZE',
    },
    {
      target: null,
      i18nKey: 'INBOX_SOCIAL.FINISH',
    },
  ],
};
