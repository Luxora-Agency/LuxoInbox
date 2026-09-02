// The profile dropdown closes on any outside click, the tour's own "Next"
// included, so the toggle is probed before it is flipped either way.
const profileMenuToggle = {
  click: '[data-tour="sidebar-profile"]',
  probe: '[data-tour="profile-menu-availability"]',
};

export default {
  id: 'search-and-commands',
  category: 'start',
  icon: 'i-lucide-search',
  order: 120,
  audience: 'all',
  featureFlag: null,
  // Verbatim from the `search` route meta.
  permissions: [
    'agent',
    'administrator',
    'conversation_manage',
    'conversation_unassigned_manage',
    'conversation_participating_manage',
    'contact_manage',
    'knowledge_base_manage',
  ],
  estimatedMinutes: 3,
  route: { name: 'search' },
  pageRoutes: ['search'],
  keywords: [
    'buscar',
    'busqueda',
    'búsqueda',
    'search',
    'comandos',
    'atajos',
    'shortcuts',
    'cmd k',
  ],
  mobileSafe: false,
  steps: [
    {
      target: '[data-tour="sidebar-search"]',
      i18nKey: 'SEARCH_AND_COMMANDS.ENTRY',
      side: 'right',
      align: 'start',
      route: { name: 'search' },
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.WHAT_IT_FINDS',
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.TABS',
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.FILTERS',
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.TIPS',
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.COMMAND_BAR',
    },
    {
      target: '[data-tour="profile-menu-keyboard-shortcuts"]',
      i18nKey: 'SEARCH_AND_COMMANDS.SHORTCUTS',
      side: 'right',
      align: 'end',
      before: profileMenuToggle,
      after: profileMenuToggle,
    },
    {
      target: null,
      i18nKey: 'SEARCH_AND_COMMANDS.FINISH',
    },
  ],
};
