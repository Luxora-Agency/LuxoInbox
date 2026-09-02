import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'reports-conversations-agents',
  category: 'reports',
  icon: 'i-lucide-trending-up',
  order: 1020,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.REPORTS,
  // Verbatim from the shared meta of every report route.
  permissions: ['administrator', 'report_manage'],
  estimatedMinutes: 4,
  route: { name: 'conversation_reports' },
  pageRoutes: [
    'conversation_reports',
    'agent_reports_index',
    'agent_reports_show',
  ],
  keywords: [
    'informes',
    'conversaciones',
    'agentes',
    'tiempo de respuesta',
    'resolucion',
    'productividad',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-reports-report-conversation"]',
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.CONVERSATIONS',
      side: 'right',
      align: 'start',
      route: { name: 'conversation_reports' },
      before: { expandSidebarGroup: 'Reports' },
    },
    {
      target: '[data-tour="reports-page"]',
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.CHARTS',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.METRICS',
    },
    {
      target: '[data-tour="sidebar-reports-agent"]',
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.AGENTS',
      side: 'right',
      align: 'start',
      route: { name: 'agent_reports_index' },
    },
    {
      target: '[data-tour="reports-header"]',
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.TABLE',
      side: 'bottom',
      align: 'start',
    },
    // The per-agent screen needs an agent id in the URL, so it is explained
    // instead of navigated to.
    {
      target: null,
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.DETAIL',
    },
    // `reports-download` sits on the conversation report's own button, not on
    // the agent summary, so the export is explained rather than highlighted.
    {
      target: null,
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.DOWNLOAD',
    },
    {
      target: null,
      i18nKey: 'REPORTS_CONVERSATIONS_AGENTS.FINISH',
    },
  ],
};
