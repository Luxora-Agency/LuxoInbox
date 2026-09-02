import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { INSTALLATION_TYPES } from 'dashboard/constants/installationTypes';

export default {
  id: 'companies',
  category: 'contacts',
  icon: 'i-lucide-building-2',
  order: 340,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.COMPANIES,
  // Verbatim from the meta shared by both companies routes.
  permissions: ['administrator', 'agent'],
  installationTypes: [INSTALLATION_TYPES.CLOUD, INSTALLATION_TYPES.ENTERPRISE],
  estimatedMinutes: 3,
  route: { name: 'companies_dashboard_index' },
  pageRoutes: ['companies_dashboard_index', 'companies_dashboard_show'],
  keywords: [
    'empresas',
    'cuentas',
    'organizaciones',
    'companies',
    'accounts',
    'b2b',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'COMPANIES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-companies"]',
      i18nKey: 'COMPANIES.NAVIGATION',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="companies-page"]',
      i18nKey: 'COMPANIES.LIST',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.SEARCH_SORT',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.CREATE',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.DETAIL',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.CONTACTS',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.HISTORY_NOTES',
    },
    {
      target: null,
      i18nKey: 'COMPANIES.FINISH',
    },
  ],
};
