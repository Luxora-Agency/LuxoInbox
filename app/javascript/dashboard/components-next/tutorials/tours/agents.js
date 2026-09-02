import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'agents',
  category: 'team',
  icon: 'i-lucide-user-plus',
  order: 510,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.AGENT_MANAGEMENT,
  // Verbatim from the `agent_list` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'agent_list' },
  pageRoutes: ['agent_list'],
  keywords: ['agentes', 'usuarios', 'invitar', 'agents', 'invite', 'roles'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'AGENTS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-agents"]',
      i18nKey: 'AGENTS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'agent_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'AGENTS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="agents-add"]',
      i18nKey: 'AGENTS.ADD',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'AGENTS.ROLES',
    },
    {
      target: null,
      i18nKey: 'AGENTS.INVITATION',
    },
    {
      target: null,
      i18nKey: 'AGENTS.MANAGE',
    },
    {
      target: null,
      i18nKey: 'AGENTS.FINISH',
    },
  ],
};
