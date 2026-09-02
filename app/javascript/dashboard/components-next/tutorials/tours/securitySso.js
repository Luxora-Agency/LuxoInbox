import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'security-sso',
  category: 'account',
  icon: 'i-lucide-shield',
  order: 1140,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.SAML,
  // Verbatim from the `security_settings_index` route meta.
  permissions: ['administrator'],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 4,
  route: { name: 'security_settings_index' },
  pageRoutes: ['security_settings_index'],
  keywords: [
    'seguridad',
    'sso',
    'saml',
    'inicio de sesion unico',
    'proveedor de identidad',
    'idp',
    'security',
    'single sign-on',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'SECURITY_SSO.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-security"]',
      i18nKey: 'SECURITY_SSO.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'security_settings_index' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'SECURITY_SSO.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'SECURITY_SSO.IDENTITY_PROVIDER',
    },
    {
      target: null,
      i18nKey: 'SECURITY_SSO.SERVICE_PROVIDER',
    },
    {
      target: null,
      i18nKey: 'SECURITY_SSO.ATTRIBUTES',
    },
    {
      target: null,
      i18nKey: 'SECURITY_SSO.ROLLOUT',
    },
    {
      target: null,
      i18nKey: 'SECURITY_SSO.FINISH',
    },
  ],
};
