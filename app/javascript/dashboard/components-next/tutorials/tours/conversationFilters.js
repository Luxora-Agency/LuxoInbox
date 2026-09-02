// The advanced filter panel closes itself on any outside click — including the
// tour's own "Next", which reaches `@vueuse/core`'s window-capture listener
// before driver.js can stop it. Probing the panel makes the toggle idempotent.
const FILTER_TOGGLE = '#toggleConversationFilterButton';
const FILTER_PANEL = '[data-tour="conversation-filter-panel"]';

export default {
  id: 'conversation-filters',
  category: 'conversations',
  icon: 'i-lucide-filter',
  order: 230,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `home` route meta.
  permissions: [
    'administrator',
    'agent',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
  ],
  estimatedMinutes: 4,
  route: { name: 'home' },
  pageRoutes: ['home'],
  keywords: [
    'filtros',
    'filtrar',
    'ordenar',
    'estado',
    'sin asignar',
    'carpeta',
    'filters',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="conversation-tabs"]',
      i18nKey: 'CONVERSATION_FILTERS.STATUS',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-assignee-tabs"]',
      i18nKey: 'CONVERSATION_FILTERS.ASSIGNEE',
      side: 'bottom',
      align: 'start',
    },
    {
      target: '[data-tour="conversation-basic-filter"]',
      i18nKey: 'CONVERSATION_FILTERS.SORT',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '#toggleConversationFilterButton',
      i18nKey: 'CONVERSATION_FILTERS.ADVANCED',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="conversation-filter-panel"]',
      i18nKey: 'CONVERSATION_FILTERS.PANEL',
      side: 'bottom',
      align: 'start',
      before: { click: FILTER_TOGGLE, probe: FILTER_PANEL },
      after: { click: FILTER_TOGGLE, probe: FILTER_PANEL },
    },
    {
      // Both controls live in the header only while a filter is applied, so
      // they are dropped on a clean list and taught the next time around.
      target: '[data-tour="chatlist-save-filter"]',
      i18nKey: 'CONVERSATION_FILTERS.SAVE',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="chatlist-reset-filters"]',
      i18nKey: 'CONVERSATION_FILTERS.RESET',
      side: 'bottom',
      align: 'end',
    },
    {
      target: '[data-tour="sidebar-conversation"]',
      i18nKey: 'CONVERSATION_FILTERS.FOLDERS',
      side: 'right',
      align: 'start',
      before: { expandSidebarGroup: 'Conversation' },
    },
    {
      target: null,
      i18nKey: 'CONVERSATION_FILTERS.FINISH',
    },
  ],
};
