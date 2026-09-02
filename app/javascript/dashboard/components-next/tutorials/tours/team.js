import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'team',
  category: 'team',
  icon: 'i-lucide-users',
  order: 500,
  audience: 'admin',
  featureFlag: null,
  estimatedMinutes: 5,
  route: { name: 'agent_list' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'TEAM.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-agents"]',
      i18nKey: 'TEAM.AGENTS',
      side: 'right',
      align: 'start',
      route: { name: 'agent_list' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'TEAM.INVITE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'TEAM.ROLES',
    },
    {
      target: '[data-tour="sidebar-settings-custom-roles"]',
      i18nKey: 'TEAM.CUSTOM_ROLES',
      side: 'right',
      align: 'start',
      route: { name: 'custom_roles_list' },
      featureFlag: FEATURE_FLAGS.CUSTOM_ROLES,
    },
    {
      target: '[data-tour="sidebar-settings-teams"]',
      i18nKey: 'TEAM.TEAMS',
      side: 'right',
      align: 'start',
      route: { name: 'settings_teams_list' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'TEAM.TEAMS_PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'TEAM.ROUTING',
    },
    {
      target: '[data-tour="sidebar-profile"]',
      i18nKey: 'TEAM.AVAILABILITY',
      side: 'right',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'TEAM.FINISH',
    },
  ],
};
