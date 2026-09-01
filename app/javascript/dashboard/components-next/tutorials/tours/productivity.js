import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'productivity',
  icon: 'i-lucide-zap',
  order: 7,
  audience: 'all',
  featureFlag: null,
  estimatedMinutes: 6,
  route: { name: 'canned_list' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'PRODUCTIVITY.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-canned-responses"]',
      i18nKey: 'PRODUCTIVITY.CANNED',
      side: 'right',
      align: 'start',
      route: { name: 'canned_list' },
      featureFlag: FEATURE_FLAGS.CANNED_RESPONSES,
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'PRODUCTIVITY.CANNED_PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="sidebar-settings-macros"]',
      i18nKey: 'PRODUCTIVITY.MACROS',
      side: 'right',
      align: 'start',
      route: { name: 'macros_wrapper' },
      featureFlag: FEATURE_FLAGS.MACROS,
    },
    {
      target: null,
      i18nKey: 'PRODUCTIVITY.MACROS_USE',
    },
    {
      target: '[data-tour="sidebar-settings-labels"]',
      i18nKey: 'PRODUCTIVITY.LABELS',
      side: 'right',
      align: 'start',
      route: { name: 'labels_list' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.LABELS,
    },
    {
      target: null,
      i18nKey: 'PRODUCTIVITY.LABELS_USE',
    },
    {
      target: '[data-tour="sidebar-settings-automation"]',
      i18nKey: 'PRODUCTIVITY.AUTOMATION',
      side: 'right',
      align: 'start',
      route: { name: 'automation_list' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.AUTOMATIONS,
    },
    {
      target: null,
      i18nKey: 'PRODUCTIVITY.AUTOMATION_EXAMPLE',
    },
    {
      target: '[data-tour="sidebar-settings-sla"]',
      i18nKey: 'PRODUCTIVITY.SLA',
      side: 'right',
      align: 'start',
      route: { name: 'sla_list' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.SLA,
    },
    {
      target: null,
      i18nKey: 'PRODUCTIVITY.FINISH',
    },
  ],
};
