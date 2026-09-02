import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inbox-settings',
  category: 'channels',
  icon: 'i-lucide-sliders-horizontal',
  order: 470,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  // Verbatim from the meta of every inbox settings route.
  permissions: ['administrator'],
  estimatedMinutes: 5,
  route: { name: 'settings_inbox_list' },
  // The tabs only exist for a concrete inbox, so the engine opens the first
  // one of the account; tabs a channel does not offer drop out on their own.
  inboxScoped: true,
  pageRoutes: ['settings_inbox_list', 'settings_inbox_show'],
  keywords: [
    'ajustes',
    'colaboradores',
    'horarios',
    'csat',
    'satisfaccion',
    'bot',
    'settings',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOX_SETTINGS.CONCEPT',
    },
    {
      // The tab click lives on the anchor inside the item, and it only rewrites
      // the URL with `replaceState`, so it never aborts the tour.
      target: '[data-tour="inbox-tab-inbox-settings"]',
      i18nKey: 'INBOX_SETTINGS.GENERAL',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-inbox-settings"] a' },
    },
    {
      target: '[data-tour="inbox-tab-collaborators"]',
      i18nKey: 'INBOX_SETTINGS.COLLABORATORS',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-collaborators"] a' },
    },
    {
      target: '[data-tour="inbox-tab-business-hours"]',
      i18nKey: 'INBOX_SETTINGS.BUSINESS_HOURS',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-business-hours"] a' },
    },
    {
      target: '[data-tour="inbox-tab-csat"]',
      i18nKey: 'INBOX_SETTINGS.CSAT',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-csat"] a' },
    },
    {
      target: '[data-tour="inbox-tab-pre-chat-form"]',
      i18nKey: 'INBOX_SETTINGS.PRE_CHAT_FORM',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-pre-chat-form"] a' },
    },
    {
      target: '[data-tour="inbox-tab-configuration"]',
      i18nKey: 'INBOX_SETTINGS.CONFIGURATION',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-configuration"] a' },
    },
    {
      target: '[data-tour="inbox-tab-bot-configuration"]',
      i18nKey: 'INBOX_SETTINGS.BOT',
      requiresInbox: true,
      side: 'bottom',
      align: 'start',
      before: { click: '[data-tour="inbox-tab-bot-configuration"] a' },
      featureFlag: FEATURE_FLAGS.AGENT_BOTS,
    },
    {
      target: null,
      i18nKey: 'INBOX_SETTINGS.FINISH',
    },
  ],
};
