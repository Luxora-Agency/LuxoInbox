export default {
  id: 'whatsapp-templates',
  category: 'channels',
  icon: 'i-lucide-file-text',
  order: 480,
  audience: 'admin',
  // The templates route declares no feature flag, only the administrator gate.
  featureFlag: null,
  permissions: ['administrator'],
  estimatedMinutes: 3,
  route: { name: 'settings_templates' },
  pageRoutes: ['settings_templates'],
  keywords: ['plantillas', 'whatsapp', 'templates', 'meta', 'hsm', 'mensajes'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-templates"]',
      i18nKey: 'WHATSAPP_TEMPLATES.NAVIGATION',
      side: 'right',
      align: 'start',
      route: { name: 'settings_templates' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="templates-list"]',
      i18nKey: 'WHATSAPP_TEMPLATES.LIST',
      side: 'top',
      align: 'center',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.SEARCH',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.STATUS',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.PREVIEW',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.MANAGE',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.USE',
    },
    {
      target: null,
      i18nKey: 'WHATSAPP_TEMPLATES.FINISH',
    },
  ],
};
