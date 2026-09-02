import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'reports-filters',
  category: 'reports',
  icon: 'i-lucide-sliders-horizontal',
  order: 1010,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.REPORTS,
  // Verbatim from the shared meta of every report route.
  permissions: ['administrator', 'report_manage'],
  estimatedMinutes: 4,
  route: { name: 'conversation_reports' },
  // The controls this tour teaches are the same on every report screen, so it
  // is offered from all of them.
  pageRoutes: [
    'conversation_reports',
    'account_overview_reports',
    'agent_reports_index',
    'inbox_reports_index',
    'team_reports_index',
    'label_reports_index',
    'csat_reports',
    'sla_reports',
    'bot_reports',
  ],
  keywords: [
    'informes',
    'filtros',
    'rango de fechas',
    'agrupar',
    'descargar',
    'csv',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'REPORTS_FILTERS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-reports-report-conversation"]',
      i18nKey: 'REPORTS_FILTERS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'conversation_reports' },
      before: { expandSidebarGroup: 'Reports' },
    },
    {
      target: '[data-tour="reports-header"]',
      i18nKey: 'REPORTS_FILTERS.HEADER',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="reports-filters"]',
      i18nKey: 'REPORTS_FILTERS.DATE_RANGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'REPORTS_FILTERS.GROUP_BY',
    },
    {
      target: null,
      i18nKey: 'REPORTS_FILTERS.BUSINESS_HOURS',
    },
    {
      target: '[data-tour="reports-download"]',
      i18nKey: 'REPORTS_FILTERS.DOWNLOAD',
      side: 'bottom',
      align: 'end',
    },
    // The drill-down drawer only exists after the user clicks a bar of a
    // chart, so it is explained instead of highlighted.
    {
      target: null,
      i18nKey: 'REPORTS_FILTERS.DRILLDOWN',
    },
    {
      target: null,
      i18nKey: 'REPORTS_FILTERS.FINISH',
    },
  ],
};
