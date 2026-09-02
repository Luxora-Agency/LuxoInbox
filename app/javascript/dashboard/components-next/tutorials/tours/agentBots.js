import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'agent-bots',
  category: 'team',
  icon: 'i-lucide-bot',
  order: 540,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.AGENT_BOTS,
  // Verbatim from the `agent_bots` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'agent_bots' },
  pageRoutes: ['agent_bots'],
  keywords: ['bots', 'webhook', 'automatico', 'bot', 'integracion'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'AGENT_BOTS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-agent-bots"]',
      i18nKey: 'AGENT_BOTS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'agent_bots' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'AGENT_BOTS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="agent-bots-add"]',
      i18nKey: 'AGENT_BOTS.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'AGENT_BOTS.WEBHOOK',
    },
    {
      target: '[data-tour="sidebar-settings-inboxes"]',
      i18nKey: 'AGENT_BOTS.CONNECT',
      side: 'right',
      align: 'start',
      featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
      permissions: ['administrator'],
    },
    {
      target: null,
      i18nKey: 'AGENT_BOTS.HANDOFF',
    },
    {
      target: null,
      i18nKey: 'AGENT_BOTS.FINISH',
    },
  ],
};
