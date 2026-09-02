import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'audit-logs',
  category: 'account',
  icon: 'i-lucide-scroll-text',
  order: 1130,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.AUDIT_LOGS,
  // Verbatim from the `auditlogs_list` route meta.
  permissions: ['administrator'],
  installationTypes: ['cloud', 'enterprise'],
  estimatedMinutes: 3,
  route: { name: 'auditlogs_list' },
  pageRoutes: ['auditlogs_list'],
  keywords: [
    'auditoria',
    'registros',
    'historial',
    'seguridad',
    'trazabilidad',
    'audit logs',
    'activity',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'AUDIT_LOGS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-audit-logs"]',
      i18nKey: 'AUDIT_LOGS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'auditlogs_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'AUDIT_LOGS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'AUDIT_LOGS.ENTRIES',
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'AUDIT_LOGS.FILTERS',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'AUDIT_LOGS.IP',
    },
    {
      target: null,
      i18nKey: 'AUDIT_LOGS.USES',
    },
    {
      target: null,
      i18nKey: 'AUDIT_LOGS.FINISH',
    },
  ],
};
