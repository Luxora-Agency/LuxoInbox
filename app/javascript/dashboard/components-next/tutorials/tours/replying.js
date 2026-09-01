import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'replying',
  icon: 'i-lucide-reply',
  order: 3,
  audience: 'all',
  featureFlag: null,
  estimatedMinutes: 5,
  route: { name: 'home' },
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="composer"]',
      i18nKey: 'REPLYING.COMPOSER',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="composer-mode"]',
      i18nKey: 'REPLYING.MODE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'REPLYING.PRIVATE_NOTE',
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'REPLYING.EDITOR',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="composer-editor"]',
      i18nKey: 'REPLYING.SHORTCUTS',
      side: 'top',
      align: 'end',
    },
    {
      target: '[data-tour="composer-actions"]',
      i18nKey: 'REPLYING.ATTACHMENTS',
      side: 'top',
      align: 'start',
    },
    {
      target: '[data-tour="composer-send"]',
      i18nKey: 'REPLYING.SEND',
      side: 'top',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-resolve"]',
      i18nKey: 'REPLYING.RESOLVE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="sidebar-settings-canned-responses"]',
      i18nKey: 'REPLYING.CANNED',
      side: 'right',
      align: 'start',
      route: { name: 'canned_list' },
      featureFlag: FEATURE_FLAGS.CANNED_RESPONSES,
    },
    {
      target: null,
      i18nKey: 'REPLYING.FINISH',
    },
  ],
};
