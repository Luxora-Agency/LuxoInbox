<script setup>
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { useStore, useMapGetter } from 'dashboard/composables/store';
import { useAlert, useTrack } from 'dashboard/composables';
import { useUISettings } from 'dashboard/composables/useUISettings';
import wootConstants from 'dashboard/constants/globals';
import { INBOX_EVENTS } from 'dashboard/helper/AnalyticsHelper/events';

import InboxCard from 'dashboard/components-next/Inbox/InboxCard.vue';
import InboxListHeader from './components/InboxListHeader.vue';
import IntersectionObserver from 'dashboard/components/IntersectionObserver.vue';
import CmdBarConversationSnooze from 'dashboard/routes/dashboard/commands/CmdBarConversationSnooze.vue';
import Spinner from 'dashboard/components-next/spinner/Spinner.vue';

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const store = useStore();
const { uiSettings } = useUISettings();

const notificationList = ref(null);
const page = ref(1);
const status = ref('');
const type = ref('');
const sortOrder = ref(wootConstants.INBOX_SORT_BY.NEWEST);
const isInboxContextMenuOpen = ref(false);
const commandbarItems = [
  { icon: 'i-lucide-list-filter', label: 'Filtrar' },
  { icon: 'i-lucide-users', label: 'Asignar' },
  { icon: 'i-lucide-arrow-down-up', label: 'Ordenar: Recientes' },
];

const commandbarSearch = {
  icon: 'i-lucide-search',
  label: 'Buscar conversaciones, contactos, mensajes...',
  shortcut: '⌘K',
};

const commandbarPrimary = {
  icon: 'i-lucide-send',
  label: 'Nuevo mensaje',
};

const infiniteLoaderOptions = computed(() => ({
  root: notificationList.value,
  rootMargin: '100px 0px 100px 0px',
}));

const meta = useMapGetter('notifications/getMeta');
const uiFlags = useMapGetter('notifications/getUIFlags');
const records = useMapGetter('notifications/getFilteredNotificationsV4');
const inboxById = useMapGetter('inboxes/getInboxById');

const currentConversationId = computed(() => Number(route.params.id));

const inboxFilters = computed(() => ({
  page: page.value,
  status: status.value,
  type: type.value,
  sortOrder: sortOrder.value,
}));

const notifications = computed(() => {
  return records.value(inboxFilters.value);
});

const showEndOfList = computed(() => {
  return uiFlags.value.isAllNotificationsLoaded && !uiFlags.value.isFetching;
});

const showEmptyState = computed(() => {
  return !uiFlags.value.isFetching && !notifications.value.length;
});

const stateInbox = inboxId => {
  return inboxById.value(inboxId);
};

const fetchNotifications = () => {
  page.value = 1;
  store.dispatch('notifications/clear');
  const filter = inboxFilters.value;
  store.dispatch('notifications/index', filter);
};

const scrollActiveIntoView = () => {
  const activeEl = notificationList.value?.querySelector('.inbox-card.active');
  activeEl?.scrollIntoView({ block: 'center', behavior: 'smooth' });
};

const redirectToInbox = () => {
  if (route.name === 'inbox_view') return;
  router.replace({ name: 'inbox_view' });
};

const loadMoreNotifications = () => {
  if (uiFlags.value.isAllNotificationsLoaded) return;

  page.value += 1;
  store.dispatch('notifications/index', {
    page: page.value,
    status: status.value,
    type: type.value,
    sortOrder: sortOrder.value,
  });
};

const markNotificationAsRead = async notificationItem => {
  useTrack(INBOX_EVENTS.MARK_NOTIFICATION_AS_READ);

  const { id, primaryActorId, primaryActorType } = notificationItem;
  try {
    await store.dispatch('notifications/read', {
      id,
      primaryActorId,
      primaryActorType,
      unreadCount: meta.value.unreadCount,
    });

    useAlert(t('INBOX.ALERTS.MARK_AS_READ'));
    store.dispatch('notifications/unReadCount');
  } catch {
    // error
  }
};

const markNotificationAsUnRead = async notificationItem => {
  useTrack(INBOX_EVENTS.MARK_NOTIFICATION_AS_UNREAD);
  redirectToInbox();

  const { id } = notificationItem;

  try {
    await store.dispatch('notifications/unread', { id });
    useAlert(t('INBOX.ALERTS.MARK_AS_UNREAD'));
    store.dispatch('notifications/unReadCount');
  } catch {
    // error
  }
};

const deleteNotification = async notificationItem => {
  useTrack(INBOX_EVENTS.DELETE_NOTIFICATION);
  redirectToInbox();

  try {
    await store.dispatch('notifications/delete', {
      notification: notificationItem,
      unread_count: meta.value.unreadCount,
      count: meta.value.count,
    });

    useAlert(t('INBOX.ALERTS.DELETE'));
  } catch {
    // error
  }
};

const onFilterChange = option => {
  const { STATUS, TYPE, SORT_ORDER } = wootConstants.INBOX_FILTER_TYPE;
  if (option.type === STATUS) {
    status.value = option.selected ? option.key : '';
  }
  if (option.type === TYPE) {
    type.value = option.selected ? option.key : '';
  }
  if (option.type === SORT_ORDER) {
    sortOrder.value = option.key;
  }
  fetchNotifications();
};

const setSavedFilter = () => {
  const { inbox_filter_by: filterBy = {} } = uiSettings.value;
  const { status: savedStatus, type: savedType, sort_by: sortBy } = filterBy;
  status.value = savedStatus;
  type.value = savedType;
  sortOrder.value = sortBy || wootConstants.INBOX_SORT_BY.NEWEST;
  store.dispatch('notifications/setNotificationFilters', inboxFilters.value);
};

const openConversation = async notificationItem => {
  const {
    id,
    primaryActorId,
    primaryActorType,
    primaryActor: { inboxId, id: conversationId },
    notificationType,
  } = notificationItem;

  if (route.params.id === String(conversationId)) return;

  useTrack(INBOX_EVENTS.OPEN_CONVERSATION_VIA_INBOX, {
    notificationType,
  });

  try {
    await store.dispatch('notifications/read', {
      id,
      primaryActorId,
      primaryActorType,
      unreadCount: meta.value.unreadCount,
    });

    // to update the unread count in the store realtime
    store.dispatch('notifications/unReadCount');

    router.push({
      name: 'inbox_view_conversation',
      params: { inboxId, type: 'conversation', id: conversationId },
    });
  } catch {
    // error
  }
};

watch(
  inboxFilters,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      store.dispatch('notifications/updateNotificationFilters', newVal);
    }
  },
  { deep: true }
);

watch(currentConversationId, () => {
  nextTick(scrollActiveIntoView);
});

onMounted(() => {
  scrollActiveIntoView();
  setSavedFilter();
  fetchNotifications();
});
</script>

<template>
  <section
    class="luxo-inbox-workspace luxo-notification-workspace relative flex w-full h-full bg-gradient-to-br from-n-background via-n-background to-n-slate-3/30"
  >
    <div
      class="luxo-inbox-list flex flex-col h-full w-full lg:min-w-[360px] lg:max-w-[360px] ltr:border-r rtl:border-l border-white/10"
      :class="!currentConversationId ? 'flex' : 'hidden xl:flex'"
    >
      <!-- Header con efecto glass -->
      <InboxListHeader
        :is-context-menu-open="isInboxContextMenuOpen"
        @filter="onFilterChange"
        @redirect="redirectToInbox"
      />

      <!-- Lista de notificaciones -->
      <div
        ref="notificationList"
        class="flex flex-col gap-2 w-full h-[calc(100%-72px)] pb-4 overflow-x-hidden px-3 overflow-y-auto"
      >
        <!-- Cards de notificaciones -->
        <div
          v-for="notificationItem in notifications"
          :key="notificationItem.id"
          class="group"
        >
          <InboxCard
            :inbox-item="notificationItem"
            :state-inbox="stateInbox(notificationItem.primaryActor?.inboxId)"
            class="inbox-card rounded-xl transition-all duration-300 ease-out bg-white/40 dark:bg-n-solid-3/40 backdrop-blur-md border border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-n-solid-3/60 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20 hover:scale-[1.02] hover:border-white/40 dark:hover:border-white/10"
            :class="
              currentConversationId === notificationItem.primaryActor?.id
                ? 'bg-white/70 dark:bg-n-solid-3/70 !border-woot-500/30 shadow-lg shadow-woot-500/10 scale-[1.02] active'
                : ''
            "
            @mark-notification-as-read="markNotificationAsRead"
            @mark-notification-as-un-read="markNotificationAsUnRead"
            @delete-notification="deleteNotification"
            @context-menu-open="isInboxContextMenuOpen = true"
            @context-menu-close="isInboxContextMenuOpen = false"
            @click="openConversation(notificationItem)"
          />
        </div>

        <!-- Loading state -->
        <div
          v-if="uiFlags.isFetching"
          class="flex flex-col items-center justify-center py-8 gap-3"
        >
          <div class="relative">
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-r from-woot-500 to-violet-500 blur-xl opacity-30 animate-pulse"
            />
            <Spinner class="text-n-brand" />
          </div>
          <span class="text-xs text-n-slate-11">
            {{ t('INBOX.LIST.LOADING') }}
          </span>
        </div>

        <!-- Estado vacío con glassmorphism -->
        <div
          v-if="showEmptyState"
          class="flex flex-col items-center justify-center py-12 px-6 mx-2 mt-4 bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-2xl"
        >
          <div
            class="flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-n-slate-3 to-n-slate-4 dark:from-n-solid-3 dark:to-n-solid-4"
          >
            <span class="i-lucide-inbox text-n-slate-10 size-8" />
          </div>
          <p class="text-sm font-medium text-n-slate-11 text-center">
            {{ t('INBOX.LIST.NO_NOTIFICATIONS') }}
          </p>
          <p class="text-xs text-n-slate-10 text-center mt-1">
            {{ t('INBOX.LIST.NOTE') }}
          </p>
        </div>

        <IntersectionObserver
          v-if="!showEndOfList && !uiFlags.isFetching"
          :options="infiniteLoaderOptions"
          @observed="loadMoreNotifications"
        />
      </div>
    </div>
    <div class="luxo-inbox-commandbar" aria-hidden="true">
      <div class="luxo-command-search">
        <span :class="commandbarSearch.icon" />
        <span>{{ commandbarSearch.label }}</span>
        <kbd>{{ commandbarSearch.shortcut }}</kbd>
      </div>
      <div
        v-for="item in commandbarItems"
        :key="item.label"
        class="luxo-command-action"
      >
        <span :class="item.icon" />
        <span>{{ item.label }}</span>
      </div>
      <div class="luxo-command-new">
        <span :class="commandbarPrimary.icon" />
        <span>{{ commandbarPrimary.label }}</span>
      </div>
    </div>
    <router-view />
    <CmdBarConversationSnooze />
  </section>
</template>
