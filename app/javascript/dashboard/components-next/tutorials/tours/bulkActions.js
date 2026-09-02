// The condensed list — the default layout — only renders the per-card checkbox
// while the pointer is over the avatar, and the pointer sits on the tour
// popover. Every step that needs a selection synthesises that hover first, then
// clicks the checkbox; `probe` keeps both halves idempotent, so a step entered
// with the bar already open does not toggle the selection back off.
const CARD_HOVER = '[data-tour="conversation-card-thumbnail"]';
const CARD_SELECT = '[data-tour="conversation-card-select"]';
const BULK_BAR = '[data-tour="conversation-bulk-actions"]';

const selectFirstCard = {
  hover: CARD_HOVER,
  click: CARD_SELECT,
  probe: BULK_BAR,
};

const deselectFirstCard = { click: CARD_SELECT, probe: BULK_BAR };

export default {
  id: 'bulk-actions',
  category: 'conversations',
  icon: 'i-lucide-list-checks',
  order: 240,
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
    'acciones masivas',
    'seleccion multiple',
    'selección múltiple',
    'lote',
    'bulk',
    'asignar varias',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="conversation-list"]',
      i18nKey: 'BULK_ACTIONS.WHERE',
      side: 'right',
      align: 'start',
    },
    {
      target: CARD_SELECT,
      i18nKey: 'BULK_ACTIONS.SELECT',
      side: 'right',
      align: 'start',
      requiresConversation: true,
      before: { hover: CARD_HOVER },
    },
    {
      target: BULK_BAR,
      i18nKey: 'BULK_ACTIONS.BAR',
      side: 'top',
      align: 'center',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: '[data-tour="conversation-bulk-agent"]',
      i18nKey: 'BULK_ACTIONS.AGENT',
      side: 'top',
      align: 'center',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: '[data-tour="conversation-bulk-team"]',
      i18nKey: 'BULK_ACTIONS.TEAM',
      side: 'top',
      align: 'center',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: '[data-tour="conversation-bulk-label"]',
      i18nKey: 'BULK_ACTIONS.LABEL',
      side: 'top',
      align: 'center',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: '[data-tour="conversation-bulk-update"]',
      i18nKey: 'BULK_ACTIONS.STATUS',
      side: 'top',
      align: 'center',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: '[data-tour="conversation-bulk-select-all"]',
      i18nKey: 'BULK_ACTIONS.SELECT_ALL',
      side: 'top',
      align: 'start',
      requiresConversation: true,
      before: selectFirstCard,
      after: deselectFirstCard,
    },
    {
      target: null,
      i18nKey: 'BULK_ACTIONS.SCOPE',
    },
    {
      target: null,
      i18nKey: 'BULK_ACTIONS.FINISH',
    },
  ],
};
