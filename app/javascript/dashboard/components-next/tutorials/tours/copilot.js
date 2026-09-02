import { FEATURE_FLAGS } from 'dashboard/featureFlags';

// The Copilot tab is the second button of the side-panel switch; the first one
// brings the contact panel back. The floating launcher is deliberately hidden
// on conversation routes, so the switch is the only way in from a chat.
const COPILOT_TAB = '[data-tour="sidepanel-switch"] > button:nth-child(2)';
const CONTACT_TAB = '[data-tour="sidepanel-switch"] > button:first-child';
const COPILOT_PANEL = '[data-tour="copilot-panel"]';

// Switching panels is a server-persisted profile write, so every step probes
// the panel first and only clicks when it is not already on screen.
const openCopilot = { click: COPILOT_TAB, probe: COPILOT_PANEL };

export default {
  id: 'copilot',
  category: 'conversations',
  icon: 'i-lucide-bot-message-square',
  order: 280,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CAPTAIN,
  // The Copilot column is enterprise-only (`CopilotContainer` refuses to render
  // otherwise), so a community build has nothing to show.
  installationTypes: ['cloud', 'enterprise'],
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
      target: COPILOT_PANEL,
      i18nKey: 'COPILOT.PANEL',
      side: 'left',
      align: 'start',
      requiresConversation: true,
      before: openCopilot,
    },
    {
      target: COPILOT_PANEL,
      i18nKey: 'COPILOT.ASK',
      side: 'left',
      align: 'center',
      requiresConversation: true,
      before: openCopilot,
    },
    {
      target: COPILOT_PANEL,
      i18nKey: 'COPILOT.SOURCES',
      side: 'left',
      align: 'end',
      requiresConversation: true,
      before: openCopilot,
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'COPILOT.INSERT',
      side: 'top',
      align: 'start',
      requiresConversation: true,
      before: openCopilot,
      after: { click: CONTACT_TAB, probe: COPILOT_PANEL },
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
