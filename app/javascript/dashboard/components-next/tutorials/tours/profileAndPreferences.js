export default {
  id: 'profile-and-preferences',
  category: 'start',
  icon: 'i-lucide-user-pen',
  order: 130,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `profile_settings_index` route meta.
  permissions: ['administrator', 'agent', 'custom_role'],
  estimatedMinutes: 4,
  route: { name: 'profile_settings_index' },
  pageRoutes: ['profile_settings_index', 'profile_settings_mfa'],
  keywords: [
    'perfil',
    'profile',
    'firma',
    'disponibilidad',
    'idioma',
    'apariencia',
    'tema',
    'mfa',
    'seguridad',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="profile-form"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.PROFILE',
      side: 'right',
      align: 'start',
      route: { name: 'profile_settings_index' },
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.INTERFACE',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.SIGNATURE',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.SEND_KEY',
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.NOTIFICATIONS',
    },
    {
      target: '[data-tour="profile-menu-availability"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.AVAILABILITY',
      side: 'right',
      align: 'end',
      before: { click: '[data-tour="sidebar-profile"]' },
      after: { click: '[data-tour="sidebar-profile"]' },
    },
    {
      target: '[data-tour="profile-menu-auto-offline"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.AUTO_OFFLINE',
      side: 'right',
      align: 'end',
      before: { click: '[data-tour="sidebar-profile"]' },
      after: { click: '[data-tour="sidebar-profile"]' },
    },
    {
      target: '[data-tour="profile-menu-appearance"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.APPEARANCE',
      side: 'right',
      align: 'end',
      before: { click: '[data-tour="sidebar-profile"]' },
      after: { click: '[data-tour="sidebar-profile"]' },
    },
    {
      // The route redirects back to the profile form when the installation has
      // MFA turned off; the step is then dropped because its anchor never
      // resolves, which is exactly the behaviour we want.
      target: '[data-tour="mfa-status"]',
      i18nKey: 'PROFILE_AND_PREFERENCES.MFA',
      side: 'bottom',
      align: 'start',
      route: { name: 'profile_settings_mfa' },
    },
    {
      target: null,
      i18nKey: 'PROFILE_AND_PREFERENCES.FINISH',
    },
  ],
};
