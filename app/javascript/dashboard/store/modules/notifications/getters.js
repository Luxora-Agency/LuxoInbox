import { sortComparator } from './helpers';
import camelcaseKeys from 'camelcase-keys';
import { getUserRole } from 'dashboard/helper/permissionsHelper';

/**
 * Filter notifications based on user role and conversation assignment
 * Administrators see all notifications, agents only see assigned conversations
 */
const filterByAssignment = (notifications, rootGetters) => {
  const currentUser = rootGetters.getCurrentUser;
  const currentAccountId = rootGetters.getCurrentAccountId;
  const userRole = getUserRole(currentUser, currentAccountId);

  // Administrators can see all notifications
  if (userRole === 'administrator') {
    return notifications;
  }

  // Agents only see notifications for conversations assigned to them
  return notifications.filter(notification => {
    const primaryActor =
      notification.primary_actor || notification.primaryActor;
    if (!primaryActor) return false;

    const assignee = primaryActor.meta?.assignee;
    return assignee?.id === currentUser.id;
  });
};

export const getters = {
  getNotifications($state) {
    return Object.values($state.records).sort((n1, n2) => n2.id - n1.id);
  },
  getFilteredNotifications:
    ($state, _getters, _rootState, rootGetters) => filters => {
      const sortOrder = filters.sortOrder === 'desc' ? 'newest' : 'oldest';
      const allNotifications = Object.values($state.records);
      const filteredNotifications = filterByAssignment(
        allNotifications,
        rootGetters
      );
      const sortedNotifications = filteredNotifications.sort((n1, n2) =>
        sortComparator(n1, n2, sortOrder)
      );
      return sortedNotifications;
    },
  getFilteredNotificationsV4:
    ($state, _getters, _rootState, rootGetters) => filters => {
      const sortOrder = filters.sortOrder === 'desc' ? 'newest' : 'oldest';
      const allNotifications = Object.values($state.records);
      const filteredNotifications = filterByAssignment(
        allNotifications,
        rootGetters
      );
      const sortedNotifications = filteredNotifications.sort((n1, n2) =>
        sortComparator(n1, n2, sortOrder)
      );
      return camelcaseKeys(sortedNotifications, { deep: true });
    },
  getNotificationById: $state => id => {
    return $state.records[id] || {};
  },
  getUIFlags($state) {
    return $state.uiFlags;
  },
  getNotification: $state => id => {
    const notification = $state.records[id];
    return notification || {};
  },
  getMeta: $state => {
    return $state.meta;
  },
  getNotificationFilters($state) {
    return $state.notificationFilters;
  },
  getHasUnreadNotifications: $state => {
    return $state.meta.unreadCount > 0;
  },
  getUnreadCount: $state => {
    return $state.meta.unreadCount;
  },
};
