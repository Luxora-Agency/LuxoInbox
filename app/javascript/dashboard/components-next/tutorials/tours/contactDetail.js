import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'contact-detail',
  category: 'contacts',
  icon: 'i-lucide-id-card',
  order: 320,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.CRM,
  // Verbatim from the meta shared by every contacts route.
  permissions: ['administrator', 'agent', 'contact_manage'],
  estimatedMinutes: 4,
  route: { name: 'contacts_dashboard_index' },
  // The detail page only exists for a concrete id, so the engine opens the
  // first contact of the account; the anchored steps drop out when there is
  // none and the narrative ones still teach the screen.
  contactScoped: true,
  pageRoutes: ['contacts_dashboard_index', 'contacts_edit'],
  keywords: [
    'ficha',
    'perfil',
    'atributos',
    'historial',
    'notas',
    'combinar',
    'contact',
    'profile',
    'merge',
    'notes',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-contacts-all-contacts"]',
      i18nKey: 'CONTACT_DETAIL.FROM_LIST',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Contacts' },
    },
    {
      target: '[data-tour="contact-detail"]',
      i18nKey: 'CONTACT_DETAIL.PROFILE',
      requiresContact: true,
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.EDIT',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.TABS',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.ATTRIBUTES',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.HISTORY',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.NOTES_MEDIA',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.MERGE',
    },
    {
      target: null,
      i18nKey: 'CONTACT_DETAIL.FINISH',
    },
  ],
};
