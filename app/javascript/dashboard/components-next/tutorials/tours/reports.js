import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'reports',
  category: 'reports',
  icon: 'i-lucide-chart-spline',
  order: 1000,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.REPORTS,
  // Mirrors the meta of every report route: without these the router
  // redirects the user away and the sidebar hides the group entirely.
  permissions: ['administrator', 'report_manage'],
  estimatedMinutes: 4,
  route: { name: 'account_overview_reports' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'REPORTS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-reports"]',
      i18nKey: 'REPORTS.NAVIGATION',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="sidebar-reports-report-overview"]',
      i18nKey: 'REPORTS.OVERVIEW',
      side: 'right',
      align: 'start',
      route: { name: 'account_overview_reports' },
    },
    {
      target: '[data-tour="reports-page"]',
      i18nKey: 'REPORTS.LIVE',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="sidebar-reports-report-conversation"]',
      i18nKey: 'REPORTS.CONVERSATIONS',
      side: 'right',
      align: 'start',
      route: { name: 'conversation_reports' },
    },
    {
      target: '[data-tour="sidebar-reports-agent"]',
      i18nKey: 'REPORTS.AGENTS',
      side: 'right',
      align: 'start',
      route: { name: 'agent_reports_index' },
    },
    {
      target: '[data-tour="sidebar-reports-csat"]',
      i18nKey: 'REPORTS.CSAT',
      side: 'right',
      align: 'start',
      route: { name: 'csat_reports' },
    },
    {
      target: '[data-tour="sidebar-reports-sla"]',
      i18nKey: 'REPORTS.SLA',
      side: 'right',
      align: 'start',
      route: { name: 'sla_reports' },
      featureFlag: FEATURE_FLAGS.SLA,
    },
    {
      target: null,
      i18nKey: 'REPORTS.EXPORT',
    },
    {
      target: null,
      i18nKey: 'REPORTS.FINISH',
    },
  ],
};
