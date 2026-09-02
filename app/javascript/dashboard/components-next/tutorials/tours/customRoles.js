import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'custom-roles',
  category: 'team',
  icon: 'i-lucide-shield-check',
  order: 530,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.CUSTOM_ROLES,
  // Verbatim from the `custom_roles_list` route meta.
  permissions: ['administrator'],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 3,
  route: { name: 'custom_roles_list' },
  pageRoutes: ['custom_roles_list'],
  keywords: ['roles', 'permisos', 'accesos', 'custom roles', 'permissions'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CUSTOM_ROLES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-custom-roles"]',
      i18nKey: 'CUSTOM_ROLES.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'custom_roles_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'CUSTOM_ROLES.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="custom-roles-add"]',
      i18nKey: 'CUSTOM_ROLES.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'CUSTOM_ROLES.PERMISSIONS',
    },
    {
      target: null,
      i18nKey: 'CUSTOM_ROLES.ASSIGN',
    },
    {
      target: null,
      i18nKey: 'CUSTOM_ROLES.FINISH',
    },
  ],
};
