export default {
  id: 'accounts',
  category: 'start',
  icon: 'i-lucide-building-2',
  order: 150,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `home` route meta.
  permissions: [
    'administrator',
    'agent',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 3,
  route: { name: 'home' },
  pageRoutes: ['home'],
  keywords: [
    'cuenta',
    'cuentas',
    'account',
    'cambiar de cuenta',
    'multicuenta',
    'espacio de trabajo',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '#sidebar-account-switcher',
      i18nKey: 'ACCOUNTS.CURRENT',
      side: 'right',
      align: 'start',
    },
    {
      // The account list only renders when the user belongs to more than one
      // account, so `[id^="account-"]` resolves to the first row of the open
      // dropdown or the step is dropped for single-account users.
      target: '[id^="account-"]',
      i18nKey: 'ACCOUNTS.SWITCH',
      side: 'right',
      align: 'start',
      before: { click: '#sidebar-account-switcher' },
      after: { click: '#sidebar-account-switcher' },
    },
    {
      target: null,
      i18nKey: 'ACCOUNTS.ISOLATION',
    },
    {
      target: null,
      i18nKey: 'ACCOUNTS.ROLES',
    },
    {
      target: '[data-tour="sidebar-profile"]',
      i18nKey: 'ACCOUNTS.SHARED_PROFILE',
      side: 'right',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'ACCOUNTS.FINISH',
    },
  ],
};
