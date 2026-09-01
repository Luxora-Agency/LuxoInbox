import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'contacts',
  icon: 'i-lucide-contact',
  order: 4,
  audience: 'all',
  featureFlag: null,
  estimatedMinutes: 4,
  route: { name: 'contacts_dashboard_index' },
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="contacts-page"]',
      i18nKey: 'CONTACTS.OVERVIEW',
      side: 'top',
      align: 'center',
    },
    {
      target: '[data-tour="sidebar-contacts"]',
      i18nKey: 'CONTACTS.NAVIGATION',
      side: 'right',
      align: 'start',
    },
    {
      target: '[data-tour="sidebar-contacts-all-contacts"]',
      i18nKey: 'CONTACTS.ALL',
      side: 'right',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'CONTACTS.SEGMENTS',
    },
    {
      target: null,
      i18nKey: 'CONTACTS.TAGS',
    },
    {
      target: '[data-tour="contacts-create"]',
      i18nKey: 'CONTACTS.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'CONTACTS.PROFILE',
    },
    {
      target: null,
      i18nKey: 'CONTACTS.HISTORY',
    },
    {
      target: '[data-tour="sidebar-settings-custom-attributes"]',
      i18nKey: 'CONTACTS.ATTRIBUTES',
      side: 'right',
      align: 'start',
      route: { name: 'attributes_list' },
      audience: 'admin',
      featureFlag: FEATURE_FLAGS.CUSTOM_ATTRIBUTES,
    },
    {
      target: null,
      i18nKey: 'CONTACTS.FINISH',
    },
  ],
};
