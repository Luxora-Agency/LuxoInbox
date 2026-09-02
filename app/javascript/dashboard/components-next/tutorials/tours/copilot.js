import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The Copilot tab is the second button of the side-panel switch; the first one
// brings the contact panel back. The floating launcher is deliberately hidden
// on conversation routes, so the switch is the only way in from a chat.
const COPILOT_TAB = '[data-tour="sidepanel-switch"] > button:last-child';
const CONTACT_TAB = '[data-tour="sidepanel-switch"] > button:first-child';

export default {
  id: 'copilot',
  category: 'conversations',
  icon: 'i-lucide-bot-message-square',
  order: 280,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  // Verbatim from the `home` / `inbox_conversation` route meta.
  permissions: [
    'administrator',
    'agent',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 3,
  route: { name: 'home' },
  pageRoutes: ['home', 'inbox_conversation'],
  keywords: [
    'copilot',
    'luxoia',
    'ia',
    'asistente',
    'borrador',
    'resumen',
    'captain',
  ],
  conversationScoped: true,
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidepanel-switch"]',
      i18nKey: 'COPILOT.WHERE',
      side: 'left',
      align: 'start',
      requiresConversation: true,
    },
    {
      target: '[data-tour="copilot-panel"]',
      i18nKey: 'COPILOT.PANEL',
      side: 'left',
      align: 'start',
      requiresConversation: true,
      before: { click: COPILOT_TAB },
    },
    {
      target: '[data-tour="copilot-panel"]',
      i18nKey: 'COPILOT.ASK',
      side: 'left',
      align: 'center',
      requiresConversation: true,
      before: { click: COPILOT_TAB },
    },
    {
      target: '[data-tour="copilot-panel"]',
      i18nKey: 'COPILOT.SOURCES',
      side: 'left',
      align: 'end',
      requiresConversation: true,
      before: { click: COPILOT_TAB },
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'COPILOT.INSERT',
      side: 'top',
      align: 'start',
      requiresConversation: true,
      before: { click: COPILOT_TAB },
      after: { click: CONTACT_TAB },
    },
    {
      // The launcher hides itself on conversation routes, so this step has to
      // step back out to the list to show it.
      target: '[data-tour="copilot-launcher"]',
      i18nKey: 'COPILOT.LAUNCHER',
      side: 'left',
      align: 'end',
      route: { name: 'home' },
    },
    {
      target: null,
      i18nKey: 'COPILOT.FINISH',
    },
  ],
};
