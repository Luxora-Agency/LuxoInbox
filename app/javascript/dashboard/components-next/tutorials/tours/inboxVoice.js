import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-voice',
  category: 'channels',
  icon: 'i-lucide-phone-call',
  order: 460,
  audience: 'admin',
  // The voice and WhatsApp-call cards only exist behind this flag, so the tour
  // follows the channel instead of the generic inbox-management gate.
  featureFlag: FEATURE_FLAGS.CHANNEL_VOICE,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_inbox_new' },
  // The channel form is deliberately absent: starting the tour navigates away,
  // and a half-filled channel form is not recoverable.
  pageRoutes: ['settings_inbox_list', 'settings_inbox_new'],
  keywords: ['voz', 'llamadas', 'twilio', 'voice', 'calls', 'telefono'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_VOICE.CONCEPT',
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOX_VOICE.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: '[data-tour="channel-card-voice"]',
      i18nKey: 'INBOX_VOICE.VOICE_CARD',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOX_VOICE.CREDENTIALS',
    },
    {
      target: null,
      i18nKey: 'INBOX_VOICE.TWILIO_URLS',
    },
    {
      target: '[data-tour="channel-card-whatsapp_call"]',
      i18nKey: 'INBOX_VOICE.WHATSAPP_CALL',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOX_VOICE.TABS',
    },
    {
      target: null,
      i18nKey: 'INBOX_VOICE.FINISH',
    },
  ],
};
