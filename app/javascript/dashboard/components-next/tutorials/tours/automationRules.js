import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'automation-rules',
  category: 'productivity',
  icon: 'i-lucide-git-branch',
  order: 650,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.AUTOMATIONS,
  // Verbatim from the `automation_list` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 5,
  route: { name: 'automation_list' },
  pageRoutes: ['automation_list'],
  keywords: ['automatizacion', 'reglas', 'automation', 'condiciones', 'evento'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-automation"]',
      i18nKey: 'AUTOMATION_RULES.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'automation_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'AUTOMATION_RULES.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="automation-add"]',
      i18nKey: 'AUTOMATION_RULES.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.EVENT',
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.CONDITIONS',
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.ACTIONS',
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.DELAYED',
      featureFlag: FEATURE_FLAGS.DELAYED_AUTOMATIONS,
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.MANAGE',
    },
    {
      target: null,
      i18nKey: 'AUTOMATION_RULES.FINISH',
    },
  ],
};
