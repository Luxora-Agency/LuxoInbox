<script setup>
import { h, ref, computed, onMounted, watch } from 'vue';
import { provideSidebarContext, useSidebarResize } from './provider';
import { useAccount } from 'dashboard/composables/useAccount';
import { useConfig } from 'dashboard/composables/useConfig';
import { useKbd } from 'dashboard/composables/utils/useKbd';
import { useMapGetter } from 'dashboard/composables/store';
import { useTutorialsUI } from 'dashboard/composables/useTutorialsUI';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useSidebarKeyboardShortcuts } from './useSidebarKeyboardShortcuts';
import { vOnClickOutside } from '@vueuse/components';
import { FEATURE_FLAGS } from 'dashboard/featureFlags';
import { useWindowSize, useEventListener } from '@vueuse/core';
import { LOCAL_STORAGE_KEYS } from 'dashboard/constants/localStorage';
import { LocalStorage } from 'shared/helpers/localStorage';

import Button from 'dashboard/components-next/button/Button.vue';
import SidebarGroup from './SidebarGroup.vue';
import SidebarProfileMenu from './SidebarProfileMenu.vue';
import SidebarChangelogCard from './SidebarChangelogCard.vue';
import SidebarChangelogButton from './SidebarChangelogButton.vue';
import ChannelLeaf from './ChannelLeaf.vue';
import ChannelIcon from 'next/icon/ChannelIcon.vue';
import SidebarAccountSwitcher from './SidebarAccountSwitcher.vue';
import Logo from 'next/icon/Logo.vue';
import ComposeConversation from 'dashboard/components-next/NewConversation/ComposeConversation.vue';
import {
  SIDEBAR_SORT_SECTIONS,
  getSidebarSortOptions,
  resolveSidebarSort,
  sortSidebarItems,
} from 'dashboard/helper/sidebarSort';

const props = defineProps({
  isMobileSidebarOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'closeKeyShortcutModal',
  'openKeyShortcutModal',
  'showCreateAccountModal',
  'closeMobileSidebar',
]);

const { accountScopedRoute, isOnChatwootCloud } = useAccount();
const { isEnterprise } = useConfig();
const store = useStore();

// Calls run on the enterprise-only API (cloud runs enterprise); hide the entry
// on community so it doesn't lead to a dashboard/CTA the backend can't serve.
const isCallsAvailable = computed(
  () => isOnChatwootCloud.value || isEnterprise
);
const searchShortcut = useKbd([`$mod`, 'k']);
const { t } = useI18n();

const isACustomBrandedInstance = useMapGetter(
  'globalConfig/isACustomBrandedInstance'
);
const isRTL = useMapGetter('accounts/isRTL');

const { width: windowWidth } = useWindowSize();
const isMobile = computed(() => windowWidth.value < 768);

const accountId = useMapGetter('getCurrentAccountId');
const currentUserId = useMapGetter('getCurrentUserID');
const isFeatureEnabledonAccount = useMapGetter(
  'accounts/isFeatureEnabledonAccount'
);

const hasAdvancedAssignment = computed(() => {
  return isFeatureEnabledonAccount.value(
    accountId.value,
    FEATURE_FLAGS.ADVANCED_ASSIGNMENT
  );
});

const hasConversationUnreadCounts = computed(() => {
  return isFeatureEnabledonAccount.value(
    accountId.value,
    FEATURE_FLAGS.CONVERSATION_UNREAD_COUNTS
  );
});

const hasFilteredUnreadCounts = computed(() => {
  return (
    hasConversationUnreadCounts.value &&
    isFeatureEnabledonAccount.value(
      accountId.value,
      FEATURE_FLAGS.UNREAD_COUNT_FOR_FILTERS
    )
  );
});

const hasDataImport = computed(() => {
  return isFeatureEnabledonAccount.value(
    accountId.value,
    FEATURE_FLAGS.DATA_IMPORT
  );
});

const fetchConversationUnreadCounts = ([currentAccountId, isEnabled]) => {
  if (!currentAccountId) return;

  if (!isEnabled) {
    store.dispatch('conversationUnreadCounts/clear');
    return;
  }

  store.dispatch('conversationUnreadCounts/get');
};

const fetchSidebarSortPreferences = ([currentAccountId, userId]) => {
  if (!currentAccountId || !userId) return;
  store.dispatch('sidebarSortPreferences/initialize');
};

const toggleShortcutModalFn = show => {
  if (show) {
    emit('openKeyShortcutModal');
  } else {
    emit('closeKeyShortcutModal');
  }
};

useSidebarKeyboardShortcuts(toggleShortcutModalFn);

const expandedGroupKey = LOCAL_STORAGE_KEYS.SIDEBAR_EXPANDED_GROUP;

const getExpandedGroups = () => {
  const expandedGroups = LocalStorage.get(expandedGroupKey);
  return expandedGroups &&
    typeof expandedGroups === 'object' &&
    !Array.isArray(expandedGroups)
    ? expandedGroups
    : {};
};

const expandedItem = ref(null);

const setExpandedItem = name => {
  const nextItem = expandedItem.value === name ? null : name;
  expandedItem.value = nextItem;

  if (!accountId.value) return;

  const storageKey = String(accountId.value);
  if (nextItem) {
    LocalStorage.updateJsonStore(expandedGroupKey, storageKey, nextItem);
  } else {
    LocalStorage.deleteFromJsonStore(expandedGroupKey, storageKey);
  }
};

// Restore the last group the user opened. This runs before the groups mount, so
// the group holding the active route can still claim the slot afterwards — it
// writes the ref directly and leaves the stored preference untouched.
watch(
  accountId,
  currentAccountId => {
    if (!currentAccountId || expandedItem.value) return;

    expandedItem.value = getExpandedGroups()[currentAccountId] ?? null;
  },
  { immediate: true }
);

useEventListener(window, 'storage', event => {
  if (event.key !== expandedGroupKey || !accountId.value) return;

  expandedItem.value = getExpandedGroups()[accountId.value] ?? null;
});

const {
  sidebarWidth,
  isCollapsed,
  setSidebarWidth,
  saveWidth,
  snapToCollapsed,
  snapToExpanded,
  COLLAPSED_THRESHOLD,
  DEFAULT_WIDTH,
} = useSidebarResize();

// A guided tour needs the labels and the leaves on screen; the collapsed rail
// hides both. Overriding the derived state (instead of writing sidebar_width)
// keeps the user's own preference intact and restores it when the tour ends.
const { isRunning: isTourRunning, requestedSidebarGroup } = useTutorialsUI();

// A tour step can point at a leaf inside a collapsible group. `expandedItem` is
// local to this component, so the engine asks through the shared ref instead.
// Only the ref moves: the stored preference stays whatever the user chose.
watch(requestedSidebarGroup, name => {
  if (name) expandedItem.value = name;
});

// On mobile, sidebar is always expanded (flyout mode)
const isEffectivelyCollapsed = computed(
  () => !isMobile.value && isCollapsed.value && !isTourRunning.value
);

const effectiveSidebarWidth = computed(() =>
  isTourRunning.value && isCollapsed.value ? DEFAULT_WIDTH : sidebarWidth.value
);

// Resize handle logic
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

provideSidebarContext({
  expandedItem,
  setExpandedItem,
  isCollapsed: isEffectivelyCollapsed,
  sidebarWidth,
  isResizing,
});

// Get clientX from mouse or touch event
const getClientX = event =>
  event.touches ? event.touches[0].clientX : event.clientX;

const onResizeStart = event => {
  isResizing.value = true;
  startX.value = getClientX(event);
  startWidth.value = sidebarWidth.value;
  Object.assign(document.body.style, {
    cursor: 'col-resize',
    userSelect: 'none',
  });
  // Prevent default to avoid scrolling on touch
  event.preventDefault();
};

const onResizeMove = event => {
  if (!isResizing.value) return;

  const delta = isRTL.value
    ? startX.value - getClientX(event)
    : getClientX(event) - startX.value;
  setSidebarWidth(startWidth.value + delta);
};

const onResizeEnd = () => {
  if (!isResizing.value) return;

  isResizing.value = false;
  Object.assign(document.body.style, { cursor: '', userSelect: '' });

  // Snap to collapsed state if below threshold
  if (sidebarWidth.value < COLLAPSED_THRESHOLD) {
    snapToCollapsed();
  } else {
    saveWidth();
  }
};

const toggleCollapse = () => {
  if (isCollapsed.value) snapToExpanded();
  else snapToCollapsed();
};

const railPlacement = computed(() => (isRTL.value ? 'left' : 'right'));

const collapseTooltip = computed(() => ({
  content: isEffectivelyCollapsed.value
    ? t('SIDEBAR.EXPAND')
    : t('SIDEBAR.COLLAPSE'),
  placement: railPlacement.value,
}));

const searchTooltip = computed(() => ({
  content: t('COMBOBOX.SEARCH_PLACEHOLDER'),
  placement: railPlacement.value,
}));

const composeTooltip = computed(() => ({
  content: t('NEW_CONVERSATION.TITLE'),
  placement: railPlacement.value,
}));

// Support both mouse and touch events
useEventListener(document, 'mousemove', onResizeMove);
useEventListener(document, 'mouseup', onResizeEnd);
useEventListener(document, 'touchmove', onResizeMove, { passive: false });
useEventListener(document, 'touchend', onResizeEnd);

const inboxes = useMapGetter('inboxes/getInboxes');
const labels = useMapGetter('labels/getLabelsOnSidebar');
const allUnreadCount = useMapGetter(
  'conversationUnreadCounts/getAllUnreadCount'
);
const getInboxUnreadCount = useMapGetter(
  'conversationUnreadCounts/getInboxUnreadCount'
);
const getLabelUnreadCount = useMapGetter(
  'conversationUnreadCounts/getLabelUnreadCount'
);
const getTeamUnreadCount = useMapGetter(
  'conversationUnreadCounts/getTeamUnreadCount'
);
const mentionsUnreadCount = useMapGetter(
  'conversationUnreadCounts/getMentionsUnreadCount'
);
const participatingUnreadCount = useMapGetter(
  'conversationUnreadCounts/getParticipatingUnreadCount'
);
const unattendedUnreadCount = useMapGetter(
  'conversationUnreadCounts/getUnattendedUnreadCount'
);
const getFolderUnreadCount = useMapGetter(
  'conversationUnreadCounts/getFolderUnreadCount'
);
// The rail collapses the Channels subtree into one icon, so the group carries
// the reauthorization warning that would otherwise only live on the inbox leaf.
const hasReauthorizationAlert = computed(() =>
  inboxes.value.some(inbox => inbox.reauthorization_required)
);
const teams = useMapGetter('teams/getMyTeams');
const contactCustomViews = useMapGetter('customViews/getContactCustomViews');
const conversationCustomViews = useMapGetter(
  'customViews/getConversationCustomViews'
);
const getSidebarSectionSort = useMapGetter(
  'sidebarSortPreferences/getSectionSort'
);

onMounted(() => {
  store.dispatch('labels/get');
  store.dispatch('inboxes/get');
  store.dispatch('notifications/unReadCount');
  store.dispatch('teams/get');
  store.dispatch('attributes/get');
  store.dispatch('customViews/get', 'conversation');
  store.dispatch('customViews/get', 'contact');
});

watch([accountId, hasConversationUnreadCounts], fetchConversationUnreadCounts, {
  immediate: true,
});

watch([accountId, currentUserId], fetchSidebarSortPreferences, {
  immediate: true,
});

const hasUnreadCountsForSection = section => {
  if (section === SIDEBAR_SORT_SECTIONS.FOLDERS) {
    return hasFilteredUnreadCounts.value;
  }

  return hasConversationUnreadCounts.value;
};

const getSortOptionsForSection = section =>
  getSidebarSortOptions(section, {
    hasUnreadCounts: hasUnreadCountsForSection(section),
  });

const getSortForSection = section =>
  resolveSidebarSort(section, getSidebarSectionSort.value(section), {
    hasUnreadCounts: hasUnreadCountsForSection(section),
  });

const updateSortPreference = (section, sortBy) => {
  store.dispatch('sidebarSortPreferences/setSectionSort', {
    section,
    sortBy,
  });
};

const buildSortConfig = section => ({
  sortOptions: getSortOptionsForSection(section),
  activeSort: getSortForSection(section),
  onSortChange: sortBy => updateSortPreference(section, sortBy),
});

const sortedFolders = computed(() =>
  sortSidebarItems(conversationCustomViews.value, {
    sortBy: getSortForSection(SIDEBAR_SORT_SECTIONS.FOLDERS),
    labelKey: view => view.name,
    unreadCountKey: view => getFolderUnreadCount.value(view.id),
  })
);

const sortedTeams = computed(() =>
  sortSidebarItems(teams.value, {
    sortBy: getSortForSection(SIDEBAR_SORT_SECTIONS.TEAMS),
    labelKey: team => team.name,
    unreadCountKey: team => getTeamUnreadCount.value(team.id),
  })
);

const sortedInboxes = computed(() =>
  sortSidebarItems(inboxes.value, {
    sortBy: getSortForSection(SIDEBAR_SORT_SECTIONS.CHANNELS),
    labelKey: inbox => inbox.name,
    unreadCountKey: inbox => getInboxUnreadCount.value(inbox.id),
  })
);

const sortedLabels = computed(() =>
  sortSidebarItems(labels.value, {
    sortBy: getSortForSection(SIDEBAR_SORT_SECTIONS.LABELS),
    labelKey: label => label.title,
    unreadCountKey: label => getLabelUnreadCount.value(label.id),
  })
);

const closeMobileSidebar = () => {
  if (!props.isMobileSidebarOpen) return;
  emit('closeMobileSidebar');
};

const newReportRoutes = () => [
  {
    name: 'Reports Agent',
    label: t('SIDEBAR.REPORTS_AGENT'),
    to: accountScopedRoute('agent_reports_index'),
    activeOn: ['agent_reports_show'],
  },
  {
    name: 'Reports Label',
    label: t('SIDEBAR.REPORTS_LABEL'),
    to: accountScopedRoute('label_reports_index'),
  },
  {
    name: 'Reports Inbox',
    label: t('SIDEBAR.REPORTS_INBOX'),
    to: accountScopedRoute('inbox_reports_index'),
    activeOn: ['inbox_reports_show'],
  },
  {
    name: 'Reports Team',
    label: t('SIDEBAR.REPORTS_TEAM'),
    to: accountScopedRoute('team_reports_index'),
    activeOn: ['team_reports_show'],
  },
];

const reportRoutes = computed(() => newReportRoutes());

const menuItems = computed(() => {
  return [
    {
      name: 'Inbox',
      label: t('SIDEBAR.INBOX'),
      icon: 'i-lucide-inbox',
      to: accountScopedRoute('inbox_view'),
      activeOn: ['inbox_view', 'inbox_view_conversation'],
      getterKeys: {
        count: 'notifications/getUnreadCount',
      },
    },
    {
      name: 'Conversation',
      label: t('SIDEBAR.CONVERSATIONS'),
      icon: 'i-lucide-message-circle',
      getterKeys: {
        count: 'conversationUnreadCounts/getAllUnreadCount',
      },
      hasAlert: hasReauthorizationAlert.value,
      children: [
        {
          name: 'All',
          label: t('SIDEBAR.ALL_CONVERSATIONS'),
          icon: 'i-lucide-inbox',
          badgeCount: allUnreadCount.value,
          activeOn: ['inbox_conversation'],
          to: accountScopedRoute('home'),
        },
        {
          name: 'Mentions',
          label: t('SIDEBAR.MENTIONED_CONVERSATIONS'),
          icon: 'i-lucide-at-sign',
          badgeCount: hasFilteredUnreadCounts.value
            ? mentionsUnreadCount.value
            : 0,
          activeOn: ['conversation_through_mentions'],
          to: accountScopedRoute('conversation_mentions'),
        },
        {
          name: 'Participating',
          label: t('SIDEBAR.PARTICIPATING_CONVERSATIONS'),
          icon: 'i-lucide-user-round-check',
          badgeCount: hasFilteredUnreadCounts.value
            ? participatingUnreadCount.value
            : 0,
          activeOn: ['conversation_through_participating'],
          to: accountScopedRoute('conversation_participating'),
        },
        {
          name: 'Unattended',
          activeOn: ['conversation_through_unattended'],
          label: t('SIDEBAR.UNATTENDED_CONVERSATIONS'),
          icon: 'i-lucide-clock-alert',
          badgeCount: hasFilteredUnreadCounts.value
            ? unattendedUnreadCount.value
            : 0,
          to: accountScopedRoute('conversation_unattended'),
        },
        {
          name: 'Folders',
          label: t('SIDEBAR.CUSTOM_VIEWS_FOLDER'),
          icon: 'i-lucide-folder',
          activeOn: ['conversations_through_folders'],
          ...buildSortConfig(SIDEBAR_SORT_SECTIONS.FOLDERS),
          collapsible: true,
          showTreeLine: true,
          children: sortedFolders.value.map(view => ({
            name: `${view.name}-${view.id}`,
            label: view.name,
            badgeCount: hasFilteredUnreadCounts.value
              ? getFolderUnreadCount.value(view.id)
              : 0,
            to: accountScopedRoute('folder_conversations', { id: view.id }),
          })),
        },
        {
          name: 'Teams',
          label: t('SIDEBAR.TEAMS'),
          icon: 'i-lucide-users',
          activeOn: ['conversations_through_team'],
          ...buildSortConfig(SIDEBAR_SORT_SECTIONS.TEAMS),
          collapsible: true,
          showTreeLine: true,
          children: sortedTeams.value.map(team => ({
            name: `${team.name}-${team.id}`,
            label: team.name,
            badgeCount: getTeamUnreadCount.value(team.id),
            to: accountScopedRoute('team_conversations', { teamId: team.id }),
          })),
        },
        {
          name: 'Channels',
          label: t('SIDEBAR.CHANNELS'),
          icon: 'i-lucide-mailbox',
          activeOn: ['conversation_through_inbox'],
          ...buildSortConfig(SIDEBAR_SORT_SECTIONS.CHANNELS),
          collapsible: true,
          showTreeLine: true,
          children: sortedInboxes.value.map(inbox => ({
            name: `${inbox.name}-${inbox.id}`,
            label: inbox.name,
            badgeCount: getInboxUnreadCount.value(inbox.id),
            icon: h(ChannelIcon, { inbox, class: 'size-[16px]' }),
            to: accountScopedRoute('inbox_dashboard', { inbox_id: inbox.id }),
            component: leafProps =>
              h(ChannelLeaf, {
                label: leafProps.label,
                active: leafProps.active,
                inbox,
                badgeCount: leafProps.badgeCount,
              }),
          })),
        },
        {
          name: 'Labels',
          label: t('SIDEBAR.LABELS'),
          icon: 'i-lucide-tag',
          activeOn: ['conversations_through_label'],
          ...buildSortConfig(SIDEBAR_SORT_SECTIONS.LABELS),
          collapsible: true,
          showTreeLine: true,
          children: sortedLabels.value.map(label => ({
            name: `${label.title}-${label.id}`,
            label: label.title,
            badgeCount: getLabelUnreadCount.value(label.id),
            icon: h('span', {
              // `!size` because the leaf renderers pass a `size-4` class down
              // onto the icon slot, and `size-4` outranks `size-2.5` in the
              // generated stylesheet.
              class: '!size-2.5 rounded-full ring-1 ring-inset ring-n-weak',
              style: { backgroundColor: label.color },
            }),
            to: accountScopedRoute('label_conversations', {
              label: label.title,
            }),
          })),
        },
      ],
    },
    {
      name: 'LuxoIA',
      icon: 'i-woot-captain',
      label: t('SIDEBAR.CAPTAIN'),
      activeOn: ['captain_assistants_create_index'],
      children: [
        {
          name: 'Overview',
          label: t('SIDEBAR.CAPTAIN_OVERVIEW'),
          activeOn: ['captain_assistants_overview_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_overview_index',
          }),
        },
        {
          name: 'FAQs',
          label: t('SIDEBAR.CAPTAIN_RESPONSES'),
          activeOn: [
            'captain_assistants_responses_index',
            'captain_assistants_faq_suggestions',
          ],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_responses_index',
          }),
        },
        {
          name: 'Documents',
          label: t('SIDEBAR.CAPTAIN_DOCUMENTS'),
          activeOn: ['captain_assistants_documents_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_documents_index',
          }),
        },
        {
          name: 'Scenarios',
          label: t('SIDEBAR.CAPTAIN_SCENARIOS'),
          activeOn: ['captain_assistants_scenarios_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_scenarios_index',
          }),
        },
        {
          name: 'Playground',
          label: t('SIDEBAR.CAPTAIN_PLAYGROUND'),
          activeOn: ['captain_assistants_playground_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_playground_index',
          }),
        },
        {
          name: 'Inboxes',
          label: t('SIDEBAR.CAPTAIN_INBOXES'),
          activeOn: ['captain_assistants_inboxes_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_inboxes_index',
          }),
        },
        {
          name: 'Tools',
          label: t('SIDEBAR.CAPTAIN_TOOLS'),
          activeOn: ['captain_tools_index'],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_tools_index',
          }),
        },
        {
          name: 'Settings',
          label: t('SIDEBAR.CAPTAIN_SETTINGS'),
          activeOn: [
            'captain_assistants_settings_index',
            'captain_assistants_settings_system_index',
            'captain_assistants_settings_audience_index',
            'captain_assistants_settings_schedule_index',
            'captain_assistants_guidelines_index',
            'captain_assistants_guardrails_index',
          ],
          to: accountScopedRoute('captain_assistants_index', {
            navigationPath: 'captain_assistants_settings_index',
          }),
        },
      ],
    },
    ...(isCallsAvailable.value
      ? [
          {
            name: 'Calls',
            label: t('SIDEBAR.CALLS'),
            icon: 'i-lucide-phone',
            to: accountScopedRoute('calls_dashboard_index'),
            activeOn: ['calls_dashboard_index'],
          },
        ]
      : []),
    {
      name: 'Contacts',
      label: t('SIDEBAR.CONTACTS'),
      icon: 'i-lucide-contact',
      children: [
        {
          name: 'All Contacts',
          label: t('SIDEBAR.ALL_CONTACTS'),
          to: accountScopedRoute(
            'contacts_dashboard_index',
            {},
            { page: 1, search: undefined }
          ),
          activeOn: ['contacts_dashboard_index', 'contacts_edit'],
        },
        {
          name: 'Active',
          label: t('SIDEBAR.ACTIVE'),
          to: accountScopedRoute('contacts_dashboard_active'),
          activeOn: ['contacts_dashboard_active'],
        },
        {
          name: 'Segments',
          icon: 'i-lucide-group',
          label: t('SIDEBAR.CUSTOM_VIEWS_SEGMENTS'),
          collapsible: true,
          showTreeLine: true,
          children: contactCustomViews.value.map(view => ({
            name: `${view.name}-${view.id}`,
            label: view.name,
            to: accountScopedRoute(
              'contacts_dashboard_segments_index',
              { segmentId: view.id },
              { page: 1 }
            ),
            activeOn: [
              'contacts_dashboard_segments_index',
              'contacts_edit_segment',
            ],
          })),
        },
        {
          name: 'Tagged With',
          icon: 'i-lucide-tag',
          label: t('SIDEBAR.TAGGED_WITH'),
          collapsible: true,
          showTreeLine: true,
          children: labels.value.map(label => ({
            name: `${label.title}-${label.id}`,
            label: label.title,
            icon: h('span', {
              class: '!size-2.5 rounded-full ring-1 ring-inset ring-n-weak',
              style: { backgroundColor: label.color },
            }),
            to: accountScopedRoute(
              'contacts_dashboard_labels_index',
              { label: label.title },
              { page: 1, search: undefined }
            ),
            activeOn: [
              'contacts_dashboard_labels_index',
              'contacts_edit_label',
            ],
          })),
        },
      ],
    },
    {
      name: 'Companies',
      label: t('SIDEBAR.COMPANIES'),
      icon: 'i-lucide-building-2',
      to: accountScopedRoute(
        'companies_dashboard_index',
        {},
        { page: 1, search: undefined }
      ),
      activeOn: ['companies_dashboard_index', 'companies_dashboard_show'],
    },
    {
      name: 'Reports',
      label: t('SIDEBAR.REPORTS'),
      icon: 'i-lucide-chart-spline',
      children: [
        {
          name: 'Report Overview',
          label: t('SIDEBAR.REPORTS_OVERVIEW'),
          to: accountScopedRoute('account_overview_reports'),
        },
        {
          name: 'Report Conversation',
          label: t('SIDEBAR.REPORTS_CONVERSATION'),
          to: accountScopedRoute('conversation_reports'),
        },
        ...reportRoutes.value,
        {
          name: 'Reports CSAT',
          label: t('SIDEBAR.CSAT'),
          to: accountScopedRoute('csat_reports'),
        },
        {
          name: 'Reports SLA',
          label: t('SIDEBAR.REPORTS_SLA'),
          to: accountScopedRoute('sla_reports'),
        },
        {
          name: 'Reports Bot',
          label: t('SIDEBAR.REPORTS_BOT'),
          to: accountScopedRoute('bot_reports'),
        },
      ],
    },
    {
      name: 'Campaigns',
      label: t('SIDEBAR.CAMPAIGNS'),
      icon: 'i-lucide-megaphone',
      children: [
        {
          name: 'Live chat',
          label: t('SIDEBAR.LIVE_CHAT'),
          to: accountScopedRoute('campaigns_livechat_index'),
        },
        {
          name: 'SMS',
          label: t('SIDEBAR.SMS'),
          to: accountScopedRoute('campaigns_sms_index'),
        },
        {
          name: 'WhatsApp',
          label: t('SIDEBAR.WHATSAPP'),
          to: accountScopedRoute('campaigns_whatsapp_index'),
        },
      ],
    },
    {
      name: 'Portals',
      label: t('SIDEBAR.HELP_CENTER.TITLE'),
      icon: 'i-lucide-library-big',
      children: [
        {
          name: 'Articles',
          label: t('SIDEBAR.HELP_CENTER.ARTICLES'),
          activeOn: [
            'portals_articles_index',
            'portals_articles_new',
            'portals_articles_edit',
          ],
          to: accountScopedRoute('portals_index', {
            navigationPath: 'portals_articles_index',
          }),
        },
        {
          name: 'Categories',
          label: t('SIDEBAR.HELP_CENTER.CATEGORIES'),
          activeOn: [
            'portals_categories_index',
            'portals_categories_articles_index',
            'portals_categories_articles_edit',
          ],
          to: accountScopedRoute('portals_index', {
            navigationPath: 'portals_categories_index',
          }),
        },
        {
          name: 'Locales',
          label: t('SIDEBAR.HELP_CENTER.LOCALES'),
          activeOn: ['portals_locales_index'],
          to: accountScopedRoute('portals_index', {
            navigationPath: 'portals_locales_index',
          }),
        },
        {
          name: 'Settings',
          label: t('SIDEBAR.HELP_CENTER.SETTINGS'),
          activeOn: ['portals_settings_index'],
          to: accountScopedRoute('portals_index', {
            navigationPath: 'portals_settings_index',
          }),
        },
      ],
    },
    {
      name: 'Settings',
      label: t('SIDEBAR.SETTINGS'),
      icon: 'i-lucide-bolt',
      children: [
        {
          name: 'Settings Section Workspace',
          label: t('SIDEBAR.SECTIONS.WORKSPACE'),
          section: true,
        },
        {
          name: 'Settings Account Settings',
          label: t('SIDEBAR.ACCOUNT_SETTINGS'),
          icon: 'i-lucide-briefcase',
          to: accountScopedRoute('general_settings_index'),
        },
        {
          name: 'Settings Agents',
          label: t('SIDEBAR.AGENTS'),
          icon: 'i-lucide-square-user',
          to: accountScopedRoute('agent_list'),
        },
        {
          name: 'Settings Teams',
          label: t('SIDEBAR.TEAMS'),
          icon: 'i-lucide-users',
          activeOn: [
            'settings_teams_list',
            'settings_teams_new',
            'settings_teams_finish',
            'settings_teams_add_agents',
            'settings_teams_show',
            'settings_teams_edit',
            'settings_teams_edit_members',
            'settings_teams_edit_finish',
          ],
          to: accountScopedRoute('settings_teams_list'),
        },
        {
          name: 'Settings Inboxes',
          label: t('SIDEBAR.INBOXES'),
          icon: 'i-lucide-inbox',
          activeOn: [
            'settings_inbox_list',
            'settings_inbox_show',
            'settings_inbox_new',
            'settings_inbox_finish',
            'settings_inboxes_page_channel',
            'settings_inboxes_add_agents',
          ],
          to: accountScopedRoute('settings_inbox_list'),
        },
        {
          name: 'Settings Labels',
          label: t('SIDEBAR.LABELS'),
          icon: 'i-lucide-tags',
          to: accountScopedRoute('labels_list'),
        },
        {
          name: 'Settings Custom Roles',
          label: t('SIDEBAR.CUSTOM_ROLES'),
          icon: 'i-lucide-shield-plus',
          to: accountScopedRoute('custom_roles_list'),
        },
        {
          name: 'Settings Section Productivity',
          label: t('SIDEBAR.SECTIONS.PRODUCTIVITY'),
          section: true,
        },
        {
          name: 'Settings Macros',
          label: t('SIDEBAR.MACROS'),
          icon: 'i-lucide-toy-brick',
          to: accountScopedRoute('macros_wrapper'),
        },
        {
          name: 'Settings Canned Responses',
          label: t('SIDEBAR.CANNED_RESPONSES'),
          icon: 'i-lucide-message-square-quote',
          to: accountScopedRoute('canned_list'),
        },
        {
          name: 'Settings Templates',
          label: t('SIDEBAR.WHATSAPP_TEMPLATES'),
          icon: 'i-lucide-layout-template',
          to: accountScopedRoute('settings_templates'),
        },
        {
          name: 'Settings Automation',
          label: t('SIDEBAR.AUTOMATION'),
          icon: 'i-lucide-repeat',
          to: accountScopedRoute('automation_list'),
        },
        {
          name: 'Conversation Workflow',
          label: t('SIDEBAR.CONVERSATION_WORKFLOW'),
          icon: 'i-lucide-workflow',
          to: accountScopedRoute('conversation_workflow_index'),
        },
        ...(hasAdvancedAssignment.value
          ? [
              {
                name: 'Settings Agent Assignment',
                label: t('SIDEBAR.AGENT_ASSIGNMENT'),
                icon: 'i-lucide-user-cog',
                activeOn: [
                  'assignment_policy_index',
                  'agent_assignment_policy_index',
                  'agent_assignment_policy_create',
                  'agent_assignment_policy_edit',
                  'agent_capacity_policy_index',
                  'agent_capacity_policy_create',
                  'agent_capacity_policy_edit',
                ],
                to: accountScopedRoute('assignment_policy_index'),
              },
            ]
          : []),
        {
          name: 'Settings Sla',
          label: t('SIDEBAR.SLA'),
          icon: 'i-lucide-clock-alert',
          to: accountScopedRoute('sla_list'),
        },
        {
          name: 'Settings Section AI',
          label: t('SIDEBAR.SECTIONS.AI'),
          section: true,
        },
        // {
        //   name: 'Settings Captain',
        //   label: t('SIDEBAR.CAPTAIN_AI'),
        //   icon: 'i-woot-captain',
        //   to: accountScopedRoute('captain_settings_index'),
        // },
        {
          name: 'Settings Agent Bots',
          label: t('SIDEBAR.AGENT_BOTS'),
          icon: 'i-lucide-bot',
          to: accountScopedRoute('agent_bots'),
        },
        {
          name: 'Settings Section Data',
          label: t('SIDEBAR.SECTIONS.DATA'),
          section: true,
        },
        {
          name: 'Settings Custom Attributes',
          label: t('SIDEBAR.CUSTOM_ATTRIBUTES'),
          icon: 'i-lucide-code',
          to: accountScopedRoute('attributes_list'),
        },
        {
          name: 'Settings Integrations',
          label: t('SIDEBAR.INTEGRATIONS'),
          icon: 'i-lucide-blocks',
          to: accountScopedRoute('settings_applications'),
        },
        ...(hasDataImport.value
          ? [
              {
                name: 'Settings Data',
                label: t('SIDEBAR.DATA'),
                icon: 'i-lucide-database',
                to: accountScopedRoute('settings_data_imports'),
              },
            ]
          : []),
        {
          name: 'Settings Audit Logs',
          label: t('SIDEBAR.AUDIT_LOGS'),
          icon: 'i-lucide-briefcase',
          to: accountScopedRoute('auditlogs_list'),
        },
        {
          name: 'Settings Section Account',
          label: t('SIDEBAR.SECTIONS.ACCOUNT'),
          section: true,
        },
        {
          name: 'Settings Security',
          label: t('SIDEBAR.SECURITY'),
          icon: 'i-lucide-shield',
          to: accountScopedRoute('security_settings_index'),
        },
        {
          name: 'Settings Billing',
          label: t('SIDEBAR.BILLING'),
          icon: 'i-lucide-credit-card',
          to: accountScopedRoute('billing_settings_index'),
        },
      ],
    },
  ];
});
</script>

<template>
  <aside
    v-on-click-outside="[
      closeMobileSidebar,
      {
        ignore: [
          '#mobile-sidebar-launcher',
          '[data-popover-content]',
          '[data-popover-backdrop]',
        ],
      },
    ]"
    class="bg-gradient-to-b from-n-background via-n-background to-n-alpha-1 flex flex-col text-sm pb-0.5 fixed top-0 ltr:left-0 rtl:right-0 h-full z-40 w-[200px] md:w-auto md:relative md:flex-shrink-0 md:ltr:translate-x-0 md:rtl:translate-x-0 ltr:border-r rtl:border-l border-n-weak/50"
    :class="[
      {
        'shadow-xl md:shadow-none': isMobileSidebarOpen,
        'ltr:-translate-x-full rtl:translate-x-full': !isMobileSidebarOpen,
        'transition-transform duration-200 ease-out md:transition-[width] motion-reduce:transition-none':
          !isResizing,
      },
    ]"
    :style="isMobile ? undefined : { width: `${effectiveSidebarWidth}px` }"
  >
    <!-- Scrim behind the mobile drawer, teleported so the drawer's own
    transform never becomes its containing block -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-200 ease-out motion-reduce:transition-none"
        leave-to-class="opacity-0"
      >
        <div
          v-if="isMobile && isMobileSidebarOpen"
          class="fixed inset-0 z-30 bg-black/40 backdrop-blur-[2px]"
          @click="closeMobileSidebar"
        />
      </Transition>
    </Teleport>
    <section
      class="grid"
      :class="isEffectivelyCollapsed ? 'mt-3 mb-6 gap-4' : 'mt-1 mb-4 gap-2'"
    >
      <div
        class="flex gap-2 items-center min-w-0"
        :class="{
          'flex-col justify-center px-1': isEffectivelyCollapsed,
          'px-2': !isEffectivelyCollapsed,
        }"
      >
        <template v-if="isEffectivelyCollapsed">
          <SidebarAccountSwitcher
            is-collapsed
            @show-create-account-modal="emit('showCreateAccountModal')"
          />
        </template>
        <template v-else>
          <div class="grid flex-shrink-0 place-content-center size-6">
            <Logo class="size-4" />
          </div>
          <div class="flex-shrink-0 w-px h-3 bg-n-strong" />
          <SidebarAccountSwitcher
            class="flex-grow -mx-1 min-w-0"
            @show-create-account-modal="emit('showCreateAccountModal')"
          />
        </template>
        <button
          v-tooltip="collapseTooltip"
          type="button"
          data-tour="sidebar-collapse-toggle"
          class="hidden flex-shrink-0 place-content-center rounded-lg transition-colors duration-150 ease-out motion-reduce:transition-none md:grid size-8 text-n-slate-10 hover:bg-n-alpha-2 hover:text-n-slate-12"
          :aria-label="collapseTooltip.content"
          @click="toggleCollapse"
        >
          <span
            class="size-4 rtl:-scale-x-100"
            :class="
              isEffectivelyCollapsed
                ? 'i-lucide-panel-left-open'
                : 'i-lucide-panel-left-close'
            "
          />
        </button>
      </div>
      <div
        class="flex gap-2"
        :class="isEffectivelyCollapsed ? 'flex-col items-center' : 'px-2'"
      >
        <RouterLink
          v-if="!isEffectivelyCollapsed"
          data-tour="sidebar-search"
          :to="{ name: 'search' }"
          class="flex gap-2 items-center px-3 py-1.5 w-full h-8 rounded-xl outline outline-1 outline-n-weak/70 bg-n-alpha-1 hover:bg-n-alpha-2 hover:outline-n-brand/30 focus:outline-n-brand/50 transition-all duration-150 ease-out group"
        >
          <span
            class="flex-shrink-0 i-lucide-search size-4 text-n-slate-10 group-hover:text-n-blue-11 transition-colors"
          />
          <span
            class="flex-grow text-start text-n-slate-10 group-hover:text-n-slate-11 transition-colors"
          >
            {{ t('COMBOBOX.SEARCH_PLACEHOLDER') }}
          </span>
          <span
            class="flex-shrink-0 px-1 font-mono text-[10px] tracking-wide rounded border pointer-events-none select-none border-n-weak bg-n-alpha-1 text-n-slate-11"
          >
            {{ searchShortcut }}
          </span>
        </RouterLink>
        <RouterLink
          v-else
          v-tooltip="searchTooltip"
          data-tour="sidebar-search"
          :to="{ name: 'search' }"
          :aria-label="t('COMBOBOX.SEARCH_PLACEHOLDER')"
          class="flex items-center justify-center size-8 rounded-xl outline outline-1 outline-n-weak/70 bg-n-alpha-1 transition-all duration-150 ease-out hover:bg-n-alpha-2 hover:outline-n-brand/30 dark:hover:bg-n-slate-9/30 group"
        >
          <span
            class="i-lucide-search size-4 text-n-slate-11 group-hover:text-n-blue-11 transition-colors"
          />
        </RouterLink>
        <ComposeConversation align="start">
          <template #trigger="{ isOpen }">
            <Button
              v-tooltip="composeTooltip"
              data-tour="sidebar-compose"
              icon="i-lucide-pen-line"
              color="slate"
              size="sm"
              class="dark:hover:!bg-n-slate-9/30"
              :class="[
                isEffectivelyCollapsed
                  ? '!size-8 !outline-n-weak !text-n-slate-11'
                  : '!h-7 !outline-n-weak !text-n-slate-11',
                { '!bg-n-alpha-2 dark:!bg-n-slate-9/30': isOpen },
              ]"
            />
          </template>
        </ComposeConversation>
      </div>
    </section>
    <nav
      class="grid overflow-y-scroll flex-grow gap-2 pb-5 no-scrollbar min-w-0"
      :class="isEffectivelyCollapsed ? 'px-1' : 'px-2'"
    >
      <ul
        class="flex flex-col gap-1 m-0 list-none min-w-0"
        :class="{ 'items-center': isEffectivelyCollapsed }"
      >
        <SidebarGroup
          v-for="item in menuItems"
          :key="item.name"
          v-bind="item"
        />
      </ul>
    </nav>
    <section
      class="flex relative flex-col flex-shrink-0 gap-1 justify-between items-center"
    >
      <div
        class="pointer-events-none absolute inset-x-0 -top-[1.938rem] h-8 bg-gradient-to-t from-n-background to-transparent"
      />
      <SidebarChangelogCard
        v-if="
          isOnChatwootCloud &&
          !isACustomBrandedInstance &&
          !isEffectivelyCollapsed
        "
      />
      <SidebarChangelogButton
        v-if="
          isOnChatwootCloud &&
          !isACustomBrandedInstance &&
          isEffectivelyCollapsed
        "
      />
      <div
        class="p-1.5 flex-shrink-0 flex w-full z-50 gap-2 items-center border-t border-n-weak/50 bg-gradient-to-t from-n-alpha-1 to-transparent"
        :class="isEffectivelyCollapsed ? 'justify-center' : 'justify-between'"
      >
        <SidebarProfileMenu
          :is-collapsed="isEffectivelyCollapsed"
          @open-key-shortcut-modal="emit('openKeyShortcutModal')"
        />
      </div>
    </section>
    <!-- Resize Handle (desktop only) -->
    <div
      class="hidden md:block absolute top-0 h-full w-1.5 cursor-col-resize z-40 ltr:right-0 rtl:left-0 group"
      @mousedown="onResizeStart"
      @touchstart="onResizeStart"
      @dblclick="toggleCollapse"
    >
      <div
        class="absolute top-0 h-full w-0.5 ltr:right-0 rtl:left-0 bg-transparent group-hover:bg-gradient-to-b group-hover:from-n-blue-7 group-hover:via-n-blue-9 group-hover:to-n-blue-10 transition-all duration-200 rounded-full"
        :class="{
          'bg-gradient-to-b from-n-blue-7 via-n-blue-9 to-n-blue-10':
            isResizing,
        }"
      />
    </div>
  </aside>
</template>
