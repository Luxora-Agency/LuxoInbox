import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'data-import',
  category: 'account',
  icon: 'i-lucide-database',
  order: 1120,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.DATA_IMPORT,
  // Verbatim from the `settings_data_imports` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 4,
  route: { name: 'settings_data_imports' },
  pageRoutes: ['settings_data_imports', 'settings_data_import_show'],
  keywords: [
    'datos',
    'importar',
    'importacion',
    'migracion',
    'intercom',
    'freshdesk',
    'exportar',
    'data',
    'import',
    'migration',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'DATA_IMPORT.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-data"]',
      i18nKey: 'DATA_IMPORT.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'settings_data_imports' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'DATA_IMPORT.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="data-import-add"]',
      i18nKey: 'DATA_IMPORT.NEW',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'DATA_IMPORT.SOURCES',
    },
    {
      target: '[data-tour="data-import-list"]',
      i18nKey: 'DATA_IMPORT.LIST',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'DATA_IMPORT.PROGRESS',
    },
    {
      target: null,
      i18nKey: 'DATA_IMPORT.DETAIL',
    },
    {
      target: null,
      i18nKey: 'DATA_IMPORT.FINISH',
    },
  ],
};
