import { sortComparator } from './helpers';
import camelcaseKeys from 'camelcase-keys';
import { getUserRole } from 'dashboard/helper/permissionsHelper';

/**
 * Filter notifications based on user role and conversation assignment
 * Administrators see all notifications, agents see notifications for:
 * - Conversations assigned directly to them
 * - Conversations assigned to their teams
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

  // Filter notifications for agents based on direct assignment or team assignment
  return notifications.filter(notification => {
    const primaryActor =
      notification.primary_actor || notification.primaryActor;
    if (!primaryActor) return false;

    // Check if assigned directly to user
    const assignee = primaryActor.meta?.assignee;
    const isAssignedToUser = assignee?.id === currentUser.id;

    // Check if conversation is assigned to a team the user belongs to
    const conversationTeamId = primaryActor.meta?.team?.id;
    const isAssignedToUserTeam =
      conversationTeamId && userTeamIds.includes(conversationTeamId);

    return isAssignedToUser || isAssignedToUserTeam;
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
