import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'teams',
  category: 'team',
  icon: 'i-lucide-users-round',
  order: 520,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.TEAM_MANAGEMENT,
  // Verbatim from the `settings_teams_list` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_teams_list' },
  pageRoutes: ['settings_teams_list'],
  keywords: ['equipos', 'grupos', 'teams', 'ventas', 'soporte'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'TEAMS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-teams"]',
      i18nKey: 'TEAMS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'settings_teams_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'TEAMS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="teams-add"]',
      i18nKey: 'TEAMS.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'TEAMS.WIZARD',
    },
    {
      target: null,
      i18nKey: 'TEAMS.AUTO_ASSIGN',
    },
    {
      target: '[data-tour="sidebar-conversation"]',
      i18nKey: 'TEAMS.IN_SIDEBAR',
      side: 'right',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'TEAMS.FINISH',
    },
  ],
};
