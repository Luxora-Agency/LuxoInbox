import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'contacts-bulk-import',
  category: 'contacts',
  icon: 'i-lucide-upload',
  order: 330,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CRM,
  // Verbatim from the meta shared by every contacts route.
  permissions: ['administrator', 'agent', 'contact_manage'],
  estimatedMinutes: 4,
  route: { name: 'contacts_dashboard_index' },
  pageRoutes: ['contacts_dashboard_index', 'settings_data_imports'],
  keywords: [
    'importar',
    'csv',
    'masivo',
    'lote',
    'migracion',
    'import',
    'bulk',
    'intercom',
    'freshdesk',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'CONTACTS_BULK_IMPORT.WHY',
    },
    {
      // The row checkbox is only mounted while its avatar is hovered, and the
      // overlay swallows real pointer events, so the list itself is the anchor
      // and the copy explains where the checkbox comes from.
      target: '[data-tour="contacts-page"]',
      i18nKey: 'CONTACTS_BULK_IMPORT.SELECT',
      side: 'top',
      align: 'center',
    },
    {
      // Same reason: the bar only exists while something is selected, which
      // cannot be arranged from behind the tour overlay.
      target: null,
      i18nKey: 'CONTACTS_BULK_IMPORT.BULK_BAR',
    },
    {
      target: null,
      i18nKey: 'CONTACTS_BULK_IMPORT.LABELS',
    },
    {
      target: null,
      i18nKey: 'CONTACTS_BULK_IMPORT.CSV',
    },
    {
      target: '[data-tour="data-import-list"]',
      i18nKey: 'CONTACTS_BULK_IMPORT.DATA_PAGE',
      side: 'top',
      align: 'center',
      route: { name: 'settings_data_imports' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.DATA_IMPORT,
      permissions: ['administrator'],
    },
    {
      target: '[data-tour="data-import-add"]',
      i18nKey: 'CONTACTS_BULK_IMPORT.DATA_NEW',
      side: 'bottom',
      align: 'end',
      route: { name: 'settings_data_imports' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.DATA_IMPORT,
      permissions: ['administrator'],
    },
    {
      target: null,
      i18nKey: 'CONTACTS_BULK_IMPORT.FINISH',
    },
  ],
};
