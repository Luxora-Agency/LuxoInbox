import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'integrations',
  category: 'account',
  icon: 'i-lucide-blocks',
  order: 1110,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.INTEGRATIONS,
  // Verbatim from the `settings_applications` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_applications' },
  pageRoutes: [
    'settings_applications',
    'settings_integrations_webhook',
    'settings_integrations_dashboard_apps',
    'settings_applications_integration',
  ],
  keywords: [
    'integraciones',
    'aplicaciones',
    'webhook',
    'webhooks',
    'slack',
    'shopify',
    'linear',
    'notion',
    'dialogflow',
    'integrations',
    'apps',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INTEGRATIONS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-integrations"]',
      i18nKey: 'INTEGRATIONS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'settings_applications' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="integrations-grid"]',
      i18nKey: 'INTEGRATIONS.CATALOG',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'INTEGRATIONS.CONFIGURE',
    },
    {
      target: '[data-tour="webhooks-add"]',
      i18nKey: 'INTEGRATIONS.WEBHOOKS',
      side: 'bottom',
      align: 'end',
      route: { name: 'settings_integrations_webhook' },
    },
    {
      // Kept on the webhook page so the explanation still lands when the
      // "Añadir nuevo webhook" button is hidden behind the cloud paywall.
      target: null,
      i18nKey: 'INTEGRATIONS.WEBHOOK_EVENTS',
      route: { name: 'settings_integrations_webhook' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'INTEGRATIONS.DASHBOARD_APPS',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_integrations_dashboard_apps' },
    },
    {
      target: null,
      i18nKey: 'INTEGRATIONS.FINISH',
    },
  ],
};
