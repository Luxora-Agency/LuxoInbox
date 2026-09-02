import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'sla',
  category: 'productivity',
  icon: 'i-lucide-timer',
  order: 660,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.SLA,
  // Verbatim from the `sla_list` route meta.
  permissions: ['administrator'],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 4,
  route: { name: 'sla_list' },
  pageRoutes: ['sla_list'],
  keywords: ['sla', 'tiempos', 'respuesta', 'resolucion', 'acuerdos'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'SLA.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-sla"]',
      i18nKey: 'SLA.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'sla_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'SLA.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="sla-add"]',
      i18nKey: 'SLA.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'SLA.THRESHOLDS',
    },
    {
      target: null,
      i18nKey: 'SLA.BUSINESS_HOURS',
    },
    {
      target: null,
      i18nKey: 'SLA.APPLY',
    },
    {
      target: null,
      i18nKey: 'SLA.TRACK',
    },
    {
      target: null,
      i18nKey: 'SLA.FINISH',
    },
  ],
};
