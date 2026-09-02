// The switcher only opens for a user who belongs to more than one account, and
// its dropdown closes on any outside click. Probing a row keeps the toggle from
// re-opening the list the tour's own "Next" already closed.
const ACCOUNT_SWITCHER = '#sidebar-account-switcher';
const ACCOUNT_ROW = '[id^="account-"]';

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
      // The switcher's trigger is inert for a single-account user, so the step
      // is dropped up front instead of waiting on a row that cannot render.
      target: ACCOUNT_ROW,
      i18nKey: 'ACCOUNTS.SWITCH',
      side: 'right',
      align: 'start',
      requiresMultipleAccounts: true,
      before: { click: ACCOUNT_SWITCHER, probe: ACCOUNT_ROW },
      after: { click: ACCOUNT_SWITCHER, probe: ACCOUNT_ROW },
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
