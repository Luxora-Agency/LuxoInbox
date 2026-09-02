import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'reports-labels-inboxes-teams',
  category: 'reports',
  icon: 'i-lucide-layers',
  order: 1030,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.REPORTS,
  // Verbatim from the shared meta of every report route.
  permissions: ['administrator', 'report_manage'],
  estimatedMinutes: 4,
  route: { name: 'label_reports_index' },
  pageRoutes: [
    'label_reports_index',
    'label_reports_show',
    'inbox_reports_index',
    'inbox_reports_show',
    'team_reports_index',
    'team_reports_show',
  ],
  keywords: [
    'informes',
    'etiquetas',
    'bandeja de entrada',
    'canales',
    'equipos',
    'comparar',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-reports-label"]',
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.LABELS',
      side: 'right',
      align: 'start',
      route: { name: 'label_reports_index' },
      before: { expandSidebarGroup: 'Reports' },
    },
    {
      target: '[data-tour="reports-header"]',
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.LABELS_USE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="sidebar-reports-inbox"]',
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.INBOXES',
      side: 'right',
      align: 'start',
      route: { name: 'inbox_reports_index' },
    },
    {
      target: null,
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.INBOXES_USE',
    },
    {
      target: '[data-tour="sidebar-reports-team"]',
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.TEAMS',
      side: 'right',
      align: 'start',
      route: { name: 'team_reports_index' },
    },
    {
      target: null,
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.TEAMS_USE',
    },
    // Every one of the three tables opens a per-record screen whose URL needs
    // an id, so the drill-down is explained instead of navigated to.
    {
      target: null,
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.DETAIL',
    },
    {
      target: null,
      i18nKey: 'REPORTS_LABELS_INBOXES_TEAMS.FINISH',
    },
  ],
};
