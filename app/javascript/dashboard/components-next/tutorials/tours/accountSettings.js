export default {
  id: 'account-settings',
  category: 'account',
  icon: 'i-lucide-briefcase',
  order: 1100,
  audience: 'admin',
  featureFlag: null,
  // Verbatim from the `general_settings_index` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 3,
  route: { name: 'general_settings_index' },
  pageRoutes: ['general_settings_index'],
  keywords: [
    'cuenta',
    'ajustes generales',
    'nombre de cuenta',
    'idioma',
    'id de cuenta',
    'account settings',
    'locale',
    'account id',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'ACCOUNT_SETTINGS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-account-settings"]',
      i18nKey: 'ACCOUNT_SETTINGS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'general_settings_index' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'ACCOUNT_SETTINGS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="account-settings-name"]',
      i18nKey: 'ACCOUNT_SETTINGS.NAME',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="account-settings-locale"]',
      i18nKey: 'ACCOUNT_SETTINGS.LOCALE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'ACCOUNT_SETTINGS.SAVE',
    },
    {
      target: null,
      i18nKey: 'ACCOUNT_SETTINGS.ACCOUNT_ID',
    },
    {
      target: null,
      i18nKey: 'ACCOUNT_SETTINGS.FINISH',
    },
  ],
};
