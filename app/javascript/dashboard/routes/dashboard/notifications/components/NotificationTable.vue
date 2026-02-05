<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from 'dashboard/composables/store';
import Avatar from 'next/avatar/Avatar.vue';
import Spinner from 'shared/components/Spinner.vue';
import Button from 'dashboard/components-next/button/Button.vue';
import { dynamicTime } from 'shared/helpers/timeHelper';

const props = defineProps({
  notifications: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  isUpdating: {
    type: Boolean,
    default: false,
  },
  onClickNotification: {
    type: Function,
    default: () => {},
  },
  onMarkAllDoneClick: {
    type: Function,
    default: () => {},
  },
});

const { t } = useI18n();
const store = useStore();

const notificationMetadata = computed(
  () => store.getters['notifications/getMeta']
);

const showEmptyResult = computed(
  () => !props.isLoading && props.notifications.length === 0
);

const getNotificationIcon = type => {
  const icons = {
    conversation_creation: 'i-lucide-message-square-plus',
    conversation_assignment: 'i-lucide-user-check',
    assigned_conversation_new_message: 'i-lucide-message-circle',
    conversation_mention: 'i-lucide-at-sign',
    participating_conversation_new_message: 'i-lucide-messages-square',
    sla_missed_first_response: 'i-lucide-clock-alert',
    sla_missed_next_response: 'i-lucide-clock-alert',
    sla_missed_resolution: 'i-lucide-clock-alert',
  };
  return icons[type] || 'i-lucide-bell';
};

const getNotificationColor = type => {
  const colors = {
    conversation_creation: 'text-green-500 bg-green-500/10',
    conversation_assignment: 'text-violet-500 bg-violet-500/10',
    assigned_conversation_new_message: 'text-blue-500 bg-blue-500/10',
    conversation_mention: 'text-yellow-500 bg-yellow-500/10',
    participating_conversation_new_message: 'text-woot-500 bg-woot-500/10',
    sla_missed_first_response: 'text-red-500 bg-red-500/10',
    sla_missed_next_response: 'text-red-500 bg-red-500/10',
    sla_missed_resolution: 'text-red-500 bg-red-500/10',
  };
  return colors[type] || 'text-n-slate-11 bg-n-slate-3';
};
</script>

<template>
  <section class="flex-1 overflow-hidden p-6">
    <!-- Header con efecto glass -->
    <div
      class="flex items-center justify-between gap-4 mb-6 p-4 rounded-2xl bg-white/60 dark:bg-n-solid-3/60 backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg shadow-black/5 dark:shadow-black/20"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-woot-500 to-violet-500 shadow-lg shadow-woot-500/25"
        >
          <span class="i-lucide-bell-ring text-white size-5" />
        </div>
        <div>
          <h1 class="text-lg font-semibold text-n-slate-12">
            {{ t('NOTIFICATIONS_PAGE.HEADER') }}
          </h1>
          <p class="text-xs text-n-slate-11">
            {{ t('NOTIFICATIONS_PAGE.LIST.SUBTITLE') }}
          </p>
        </div>
      </div>
      <Button
        v-if="notificationMetadata.unreadCount"
        :label="t('NOTIFICATIONS_PAGE.MARK_ALL_DONE')"
        :is-loading="isUpdating"
        icon="i-lucide-check-check"
        color="slate"
        variant="ghost"
        size="sm"
        @click="onMarkAllDoneClick"
      />
    </div>

    <!-- Lista de notificaciones -->
    <div class="space-y-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-2">
      <template v-if="!isLoading">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="group relative p-4 rounded-2xl cursor-pointer bg-white/40 dark:bg-n-solid-3/40 backdrop-blur-lg border border-white/30 dark:border-white/5 shadow-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-black/30 hover:bg-white/70 dark:hover:bg-n-solid-3/70 hover:border-white/50 dark:hover:border-white/10 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 ease-out"
          :class="{
            'ring-2 ring-woot-500/30 bg-white/60 dark:bg-n-solid-3/60':
              !notification.read_at,
          }"
          @click="() => onClickNotification(notification)"
        >
          <!-- Indicador de no leído -->
          <div
            v-if="!notification.read_at"
            class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-gradient-to-r from-woot-500 to-violet-500 shadow-lg shadow-woot-500/50 animate-pulse"
          />

          <div class="flex items-start gap-4">
            <!-- Icono de tipo -->
            <div
              class="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-transform duration-300 group-hover:scale-110"
              :class="getNotificationColor(notification.notification_type)"
            >
              <span
                :class="getNotificationIcon(notification.notification_type)"
                class="size-5"
              />
            </div>

            <!-- Contenido -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="text-sm font-semibold text-n-slate-12 bg-n-slate-3 dark:bg-n-solid-2 px-2 py-0.5 rounded-md"
                >
                  #{{
                    notification.primary_actor
                      ? notification.primary_actor.id
                      : t('NOTIFICATIONS_PAGE.DELETE_TITLE')
                  }}
                </span>
                <span
                  class="text-xs font-medium px-2 py-0.5 rounded-full bg-n-slate-3/80 dark:bg-n-solid-2/80 text-n-slate-11"
                >
                  {{
                    t(
                      `NOTIFICATIONS_PAGE.TYPE_LABEL.${notification.notification_type}`
                    )
                  }}
                </span>
              </div>

              <p
                class="text-sm text-n-slate-12 line-clamp-2 mb-2 group-hover:text-n-slate-12 transition-colors"
                :class="{ 'font-medium': !notification.read_at }"
              >
                {{ notification.push_message_title }}
              </p>

              <div class="flex items-center gap-3">
                <!-- Avatar del asignado -->
                <div
                  v-if="notification.primary_actor?.meta?.assignee"
                  class="flex items-center gap-2"
                >
                  <Avatar
                    :src="notification.primary_actor.meta.assignee.thumbnail"
                    :size="20"
                    :name="notification.primary_actor.meta.assignee.name"
                    rounded-full
                  />
                  <span class="text-xs text-n-slate-11">
                    {{ notification.primary_actor.meta.assignee.name }}
                  </span>
                </div>

                <!-- Tiempo -->
                <div class="flex items-center gap-1.5 text-xs text-n-slate-10">
                  <span class="i-lucide-clock size-3.5" />
                  <span>{{ dynamicTime(notification.last_activity_at) }}</span>
                </div>
              </div>
            </div>

            <!-- Flecha de acción -->
            <div
              class="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-n-slate-3/50 dark:bg-n-solid-2/50 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300"
            >
              <span class="i-lucide-arrow-right text-n-slate-11 size-4" />
            </div>
          </div>
        </div>
      </template>

      <!-- Estado vacío -->
      <div
        v-if="showEmptyResult"
        class="flex flex-col items-center justify-center py-20 px-8 bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl"
      >
        <div
          class="flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-n-slate-3 to-n-slate-4 dark:from-n-solid-3 dark:to-n-solid-4"
        >
          <span class="i-lucide-bell-off text-n-slate-10 size-10" />
        </div>
        <h3 class="text-lg font-semibold text-n-slate-12 mb-2">
          {{ t('NOTIFICATIONS_PAGE.LIST.404') }}
        </h3>
        <p class="text-sm text-n-slate-11 text-center max-w-sm">
          {{ t('NOTIFICATIONS_PAGE.LIST.SUBTITLE') }}
        </p>
      </div>

      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="flex flex-col items-center justify-center py-20 gap-4 bg-white/30 dark:bg-n-solid-3/30 backdrop-blur-xl border border-white/20 dark:border-white/5 rounded-3xl"
      >
        <div class="relative">
          <div
            class="absolute inset-0 rounded-full bg-gradient-to-r from-woot-500 to-violet-500 blur-xl opacity-30 animate-pulse"
          />
          <Spinner size="large" />
        </div>
        <span class="text-sm text-n-slate-11">
          {{ t('NOTIFICATIONS_PAGE.LIST.LOADING_MESSAGE') }}
        </span>
      </div>
    </div>
  </section>
</template>
