export default {
  id: 'billing',
  category: 'account',
  icon: 'i-lucide-credit-card',
  order: 1150,
  audience: 'admin',
  featureFlag: null,
  // Verbatim from the `billing_settings_index` route meta.
  permissions: ['administrator'],
  installationTypes: ['cloud'],
  estimatedMinutes: 3,
  route: { name: 'billing_settings_index' },
  pageRoutes: ['billing_settings_index'],
  keywords: [
    'facturacion',
    'plan',
    'suscripcion',
    'asientos',
    'creditos',
    'factura',
    'billing',
    'subscription',
    'invoice',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'BILLING.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-billing"]',
      i18nKey: 'BILLING.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'billing_settings_index' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'BILLING.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'BILLING.CURRENT_PLAN',
    },
    {
      target: null,
      i18nKey: 'BILLING.PORTAL',
    },
    {
      target: null,
      i18nKey: 'BILLING.CREDITS',
    },
    {
      target: null,
      i18nKey: 'BILLING.SUPPORT',
    },
    {
      target: null,
      i18nKey: 'BILLING.FINISH',
    },
  ],
};
