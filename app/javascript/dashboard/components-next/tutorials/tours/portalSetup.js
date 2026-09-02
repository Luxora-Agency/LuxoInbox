import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'portal-setup',
  category: 'help-center',
  icon: 'i-lucide-book-open-check',
  order: 910,
  audience: 'all',
  featureFlag: FEATURE_FLAGS.HELP_CENTER,
  // Verbatim from the `portals_new` route meta.
  permissions: ['administrator', 'knowledge_base_manage'],
  estimatedMinutes: 4,
  route: { name: 'portals_new' },
  pageRoutes: ['portals_new', 'portals_settings_index'],
  keywords: [
    'portal',
    'centro de ayuda',
    'base de conocimiento',
    'dominio',
    'logo',
    'slug',
  ],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'PORTAL_SETUP.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-portals"]',
      i18nKey: 'PORTAL_SETUP.WHERE',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="portal-new-form"]',
      i18nKey: 'PORTAL_SETUP.CREATE',
      side: 'top',
      align: 'center',
      route: { name: 'portals_new' },
    },
    {
      target: null,
      i18nKey: 'PORTAL_SETUP.BASICS',
    },
    {
      target: null,
      i18nKey: 'PORTAL_SETUP.CUSTOMIZATION',
    },
    // The portal switcher is a popover with no anchored trigger, so switching
    // between portals is explained rather than highlighted.
    {
      target: null,
      i18nKey: 'PORTAL_SETUP.SWITCHER',
    },
    {
      target: '[data-tour="sidebar-portals-settings"]',
      i18nKey: 'PORTAL_SETUP.SETTINGS',
      side: 'right',
      align: 'start',
      route: {
        name: 'portals_index',
        params: { navigationPath: 'portals_settings_index' },
      },
      before: { expandSidebarGroup: 'Portals' },
    },
    {
      target: '[data-tour="helpcenter-page"]',
      i18nKey: 'PORTAL_SETUP.PUBLISH',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'PORTAL_SETUP.FINISH',
    },
  ],
};
