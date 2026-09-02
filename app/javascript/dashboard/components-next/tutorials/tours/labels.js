import { FEATURE_FLAGS } from 'dashboard/featureFlags';

export default {
  id: 'labels',
  category: 'productivity',
  icon: 'i-lucide-tag',
  order: 620,
  audience: 'admin',
  featureFlag: FEATURE_FLAGS.LABELS,
  // Verbatim from the `labels_list` route meta.
  permissions: ['administrator'],
  estimatedMinutes: 3,
  route: { name: 'labels_list' },
  pageRoutes: ['labels_list'],
  keywords: ['etiquetas', 'labels', 'clasificar', 'color', 'categorias'],
  mobileSafe: false,
  steps: [
    {
      target: null,
      i18nKey: 'LABELS.CONCEPT',
    },
    {
      target: '[data-tour="sidebar-settings-labels"]',
      i18nKey: 'LABELS.WHERE',
      side: 'right',
      align: 'start',
      route: { name: 'labels_list' },
      before: { expandSidebarGroup: 'Settings' },
    },
    {
      target: '[data-tour="settings-header"]',
      i18nKey: 'LABELS.PAGE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="labels-add"]',
      i18nKey: 'LABELS.CREATE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: null,
      i18nKey: 'LABELS.NAMING',
    },
    {
      target: '[data-tour="sidebar-conversation"]',
      i18nKey: 'LABELS.IN_SIDEBAR',
      side: 'right',
      align: 'start',
    },
    {
      target: null,
      i18nKey: 'LABELS.USES',
    },
    {
      target: null,
      i18nKey: 'LABELS.FINISH',
    },
  ],
};
