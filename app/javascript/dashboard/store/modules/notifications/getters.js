import { sortComparator } from './helpers';
import camelcaseKeys from 'camelcase-keys';
import { getUserRole } from 'dashboard/helper/permissionsHelper';

/**
 * Filter notifications based on user role, conversation assignment, team and inbox membership
 * Administrators see all notifications, agents see notifications for:
 * - Conversations assigned to them
 * - Conversations in their teams
 * - Conversations in their inboxes
 */
const filterByAssignment = (notifications, rootGetters) => {
  const currentUser = rootGetters.getCurrentUser;
  const currentAccountId = rootGetters.getCurrentAccountId;
  const userRole = getUserRole(currentUser, currentAccountId);

  // Administrators can see all notifications
  if (userRole === 'administrator') {
    return notifications;
  }

  // Get user's team IDs
  const myTeams = rootGetters['teams/getMyTeams'] || [];
  const userTeamIds = myTeams.map(team => team.id);

  // Get user's inbox IDs
  const allInboxes = rootGetters['inboxes/getInboxes'] || [];
  const userInboxIds = allInboxes.map(inbox => inbox.id);

  // Filter notifications for agents based on assignment, team, or inbox access
  return notifications.filter(notification => {
    const primaryActor =
      notification.primary_actor || notification.primaryActor;
    if (!primaryActor) return false;

    // Check if assigned to user
    const assignee = primaryActor.meta?.assignee;
    const isAssignedToUser = assignee?.id === currentUser.id;

    // Check if user has team access
    const conversationTeamId = primaryActor.meta?.team?.id;
    const hasTeamAccess =
      conversationTeamId && userTeamIds.includes(conversationTeamId);

    // Check if user has inbox access
    const conversationInboxId = primaryActor.inbox_id || primaryActor.inboxId;
    const hasInboxAccess =
      conversationInboxId && userInboxIds.includes(conversationInboxId);

    return isAssignedToUser || hasTeamAccess || hasInboxAccess;
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
