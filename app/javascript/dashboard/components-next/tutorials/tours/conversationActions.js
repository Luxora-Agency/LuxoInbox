import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The resolve chevron toggles its menu, and the menu's own click-away listener
// is on `document` in the bubble phase, which driver.js stops. So the menu
// survives the tour's "Next" and the probe closes it exactly once.
const RESOLVE_MORE = '[data-tour="conversation-resolve-more"]';
const RESOLVE_MENU = '[data-tour="conversation-resolve-menu"]';

export default {
  id: 'conversation-actions',
  category: 'conversations',
  icon: 'i-lucide-circle-check-big',
  order: 250,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `home` / `inbox_conversation` route meta.
  permissions: [
    'administrator',
    'agent',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 4,
  route: { name: 'home' },
  pageRoutes: ['home', 'inbox_conversation'],
  keywords: [
    'resolver',
    'posponer',
    'pendiente',
    'silenciar',
    'transcripcion',
    'transcripción',
    'sla',
    'llamada',
  ],
  // The header controls only exist with a chat open, so the engine starts the
  // tour on a real conversation when the account has one.
  conversationScoped: true,
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="conversation-header"]',
      i18nKey: 'CONVERSATION_ACTIONS.HEADER',
      side: 'bottom',
      align: 'center',
      requiresConversation: true,
    },
    {
      target: '[data-tour="conversation-resolve"]',
      i18nKey: 'CONVERSATION_ACTIONS.RESOLVE',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
    },
    {
      target: '[data-tour="conversation-resolve-more"]',
      i18nKey: 'CONVERSATION_ACTIONS.MORE',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
    },
    {
      target: '[data-tour="conversation-resolve-snooze"]',
      i18nKey: 'CONVERSATION_ACTIONS.SNOOZE',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
      before: { click: RESOLVE_MORE, probe: RESOLVE_MENU },
      after: { click: RESOLVE_MORE, probe: RESOLVE_MENU },
    },
    {
      target: '[data-tour="conversation-resolve-pending"]',
      i18nKey: 'CONVERSATION_ACTIONS.PENDING',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
      before: { click: RESOLVE_MORE, probe: RESOLVE_MENU },
      after: { click: RESOLVE_MORE, probe: RESOLVE_MENU },
    },
    {
      target: '[data-tour="conversation-more-actions"]',
      i18nKey: 'CONVERSATION_ACTIONS.OTHER',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
    },
    {
      target: '[data-tour="conversation-sla"]',
      i18nKey: 'CONVERSATION_ACTIONS.SLA',
      side: 'bottom',
      align: 'center',
      requiresConversation: true,
      featureFlag: FEATURE_FLAGS.SLA,
      installationTypes: ['cloud', 'enterprise'],
    },
    {
      target: '[data-tour="conversation-call"]',
      i18nKey: 'CONVERSATION_ACTIONS.CALL',
      side: 'bottom',
      align: 'end',
      requiresConversation: true,
      featureFlag: FEATURE_FLAGS.CHANNEL_VOICE,
    },
    {
      target: '[data-tour="contact-panel-actions"]',
      i18nKey: 'CONVERSATION_ACTIONS.ASSIGN',
      side: 'left',
      align: 'start',
      requiresConversation: true,
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_ACTIONS.FINISH',
    },
  ],
};
