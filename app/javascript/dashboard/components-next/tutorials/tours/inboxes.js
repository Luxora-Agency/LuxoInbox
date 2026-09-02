import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'inboxes',
  category: 'channels',
  icon: 'i-lucide-inbox',
  order: 400,
  audience: 'admin',
  // Verbatim from the `settings_inbox_list` route meta.
  permissions: ['administrator'],
  featureFlag: FEATURE_FLAGS.INBOX_MANAGEMENT,
  estimatedMinutes: 5,
  route: { name: 'settings_inbox_list' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'INBOXES.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-inboxes"]',
      i18nKey: 'INBOXES.NAVIGATION',
      side: 'right',
      align: 'start',
      route: { name: 'settings_inbox_list' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'INBOXES.LIST',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="inbox-channels"]',
      i18nKey: 'INBOXES.CHANNELS',
      side: 'top',
      align: 'center',
      route: { name: 'settings_inbox_new' },
    },
    {
      target: null,
      i18nKey: 'INBOXES.WEBSITE',
    },
    {
      target: null,
      i18nKey: 'INBOXES.MESSAGING',
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'INBOXES.MEMBERS',
      side: 'bottom',
      align: 'start',
      route: { name: 'settings_inbox_list' },
    },
    {
      target: null,
      i18nKey: 'INBOXES.CONFIGURATION',
    },
    {
      target: '[data-tour="sidebar-settings-automation"]',
      i18nKey: 'INBOXES.AUTOMATION',
      side: 'right',
      align: 'start',
      route: { name: 'automation_list' },
      featureFlag: FEATURE_FLAGS.AUTOMATIONS,
    },
    {
      target: null,
      i18nKey: 'INBOXES.FINISH',
    },
  ],
};
