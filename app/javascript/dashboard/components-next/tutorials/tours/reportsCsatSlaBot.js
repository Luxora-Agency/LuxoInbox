import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'reports-csat-sla-bot',
  category: 'reports',
  icon: 'i-lucide-gauge',
  order: 1040,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.REPORTS,
  // Verbatim from the shared meta of every report route.
  permissions: ['administrator', 'report_manage'],
  estimatedMinutes: 4,
  route: { name: 'csat_reports' },
  pageRoutes: ['csat_reports', 'sla_reports', 'bot_reports'],
  keywords: [
    'informes',
    'csat',
    'satisfaccion',
    'encuesta',
    'sla',
    'bot',
    'calidad',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'REPORTS_CSAT_SLA_BOT.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-reports-csat"]',
      i18nKey: 'REPORTS_CSAT_SLA_BOT.CSAT',
      side: 'right',
      align: 'start',
      route: { name: 'csat_reports' },
      before: { expandSidebarGroup: 'Reports' },
    },
    {
      target: '[data-tour="reports-page"]',
      i18nKey: 'REPORTS_CSAT_SLA_BOT.CSAT_METRICS',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'REPORTS_CSAT_SLA_BOT.CSAT_TABLE',
    },
    {
      target: '[data-tour="sidebar-reports-sla"]',
      i18nKey: 'REPORTS_CSAT_SLA_BOT.SLA',
      side: 'right',
      align: 'start',
      route: { name: 'sla_reports' },
      featureFlag: FEATURE_FLAGS.SLA,
    },
    {
      target: null,
      i18nKey: 'REPORTS_CSAT_SLA_BOT.SLA_METRICS',
      featureFlag: FEATURE_FLAGS.SLA,
    },
    {
      target: '[data-tour="sidebar-reports-bot"]',
      i18nKey: 'REPORTS_CSAT_SLA_BOT.BOT',
      side: 'right',
      align: 'start',
      route: { name: 'bot_reports' },
    },
    {
      target: null,
      i18nKey: 'REPORTS_CSAT_SLA_BOT.BOT_METRICS',
    },
    {
      target: null,
      i18nKey: 'REPORTS_CSAT_SLA_BOT.FINISH',
    },
  ],
};
