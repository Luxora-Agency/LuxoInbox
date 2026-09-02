import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'contacts-search-segments',
  category: 'contacts',
  icon: 'i-lucide-filter',
  order: 310,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CRM,
  // Verbatim from the meta shared by every contacts route.
  permissions: ['administrator', 'agent', 'contact_manage'],
  estimatedMinutes: 4,
  route: { name: 'contacts_dashboard_index' },
  // Offered on every contacts list, including the saved ones: the segment and
  // label views are exactly what this tour explains.
  pageRoutes: [
    'contacts_dashboard_index',
    'contacts_dashboard_active',
    'contacts_dashboard_segments_index',
    'contacts_dashboard_labels_index',
  ],
  keywords: [
    'buscar',
    'busqueda',
    'filtros',
    'segmentos',
    'etiquetas',
    'search',
    'filters',
    'segments',
    'labels',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="contacts-search"]',
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.SEARCH',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="contacts-filter"]',
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.FILTER',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.CONDITIONS',
    },
    {
      // The control only exists once a filter is applied, and the tour lands on
      // a clean list every time, so anchoring it would drop the step on every
      // run. Taught without an anchor instead.
      target: null,
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.SAVE_SEGMENT',
    },
    {
      target: '[data-tour="sidebar-subgroup-segments"]',
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.SEGMENTS_LIST',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Contacts' },
    },
    {
      target: '[data-tour="sidebar-subgroup-tagged-with"]',
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.TAGGED_WITH',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Contacts' },
    },
    {
      target: '[data-tour="sidebar-contacts-active"]',
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.ACTIVE',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Contacts' },
    },
    {
      target: null,
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.DELETE_SEGMENT',
    },
    {
      target: null,
      i18nKey: 'CONTACTS_SEARCH_SEGMENTS.FINISH',
    },
  ],
};
