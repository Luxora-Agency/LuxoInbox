import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'assignment',
  icon: 'i-lucide-user-cog',
  order: 11,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.ASSIGNMENT_V2,
  estimatedMinutes: 4,
  route: { name: 'assignment_policy_index' },
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'ASSIGNMENT.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-agent-assignment"]',
      i18nKey: 'ASSIGNMENT.NAVIGATION',
      side: 'right',
      align: 'start',
      route: { name: 'assignment_policy_index' },
      featureFlag: FEATURE_FLAGS.ADVANCED_ASSIGNMENT,
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'ASSIGNMENT.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'ASSIGNMENT.POLICY',
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'ASSIGNMENT.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'ASSIGNMENT.ORDER',
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'ASSIGNMENT.CAPACITY',
      side: 'bottom',
      align: 'start',
      route: { name: 'agent_capacity_policy_index' },
      featureFlag: FEATURE_FLAGS.ADVANCED_ASSIGNMENT,
    },
    {
      target: null,
      i18nKey: 'ASSIGNMENT.INBOXES',
    },
    {
      target: '[data-tour="sidebar-profile"]',
      i18nKey: 'ASSIGNMENT.AVAILABILITY',
      side: 'right',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'ASSIGNMENT.FINISH',
    },
  ],
};
