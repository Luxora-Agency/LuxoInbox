import { getters } from '../../notifications/getters';

describe('#getters', () => {
  describe('getFilteredNotifications', () => {
    // Notifications are scoped to what the user can access: assigned to them,
    // to one of their teams, or belonging to an inbox they are a member of.
    const assignedToUser = {
      id: 1,
      read_at: '2024-02-07T11:42:39.988Z',
      snoozed_until: null,
      primary_actor: { id: 11, inbox_id: 9, meta: { assignee: { id: 1 } } },
    };
    const assignedToUserTeam = {
      id: 2,
      read_at: null,
      snoozed_until: null,
      primary_actor: { id: 12, inbox_id: 9, meta: { team: { id: 7 } } },
    };
    const otherAgentConversation = {
      id: 3,
      read_at: '2024-02-07T11:42:39.988Z',
      snoozed_until: '2024-02-07T11:42:39.988Z',
      primary_actor: { id: 13, inbox_id: 4, meta: { assignee: { id: 2 } } },
    };

    const state = {
      records: {
        1: assignedToUser,
        2: assignedToUserTeam,
        3: otherAgentConversation,
      },
    };
    const filters = {
      type: 'read',
      status: 'snoozed',
      sortOrder: 'desc',
    };

    it('returns every notification for an administrator', () => {
      const rootGetters = {
        getCurrentUser: { id: 1, accounts: [{ id: 1, role: 'administrator' }] },
        getCurrentAccountId: 1,
      };

      expect(
        getters.getFilteredNotifications(state, {}, {}, rootGetters)(filters)
      ).toEqual([assignedToUser, assignedToUserTeam, otherAgentConversation]);
    });

    it('returns only accessible notifications for an agent', () => {
      const rootGetters = {
        getCurrentUser: { id: 1, accounts: [{ id: 1, role: 'agent' }] },
        getCurrentAccountId: 1,
        'teams/getMyTeams': [{ id: 7 }],
        'inboxes/getInboxes': [{ id: 9 }],
      };

      expect(
        getters.getFilteredNotifications(state, {}, {}, rootGetters)(filters)
      ).toEqual([assignedToUser, assignedToUserTeam]);
    });
  });

  it('getNotificationById', () => {
    const state = {
      records: {
        1: { id: 1 },
      },
    };
    expect(getters.getNotificationById(state)(1)).toEqual({ id: 1 });
    expect(getters.getNotificationById(state)(2)).toEqual({});
  });

  it('getUIFlags', () => {
    const state = {
      uiFlags: {
        isFetching: true,
      },
    };
    expect(getters.getUIFlags(state)).toEqual({
      isFetching: true,
    });
  });

  it('getNotification', () => {
    const state = {
      records: {
        1: { id: 1 },
      },
    };
    expect(getters.getNotification(state)(1)).toEqual({ id: 1 });
    expect(getters.getNotification(state)(2)).toEqual({});
  });

  it('getMeta', () => {
    const state = {
      meta: { unreadCount: 1 },
    };
    expect(getters.getMeta(state)).toEqual({ unreadCount: 1 });
  });

  it('getNotificationFilters', () => {
    const state = {
      notificationFilters: {
        page: 1,
        status: 'unread',
        type: 'all',
        sortOrder: 'desc',
      },
    };
    expect(getters.getNotificationFilters(state)).toEqual(
      state.notificationFilters
    );
  });

  describe('getHasUnreadNotifications', () => {
    it('should return true when there are unread notifications', () => {
      const state = {
        meta: { unreadCount: 5 },
      };
      expect(getters.getHasUnreadNotifications(state)).toBe(true);
    });

    it('should return false when there are no unread notifications', () => {
      const state = {
        meta: { unreadCount: 0 },
      };
      expect(getters.getHasUnreadNotifications(state)).toBe(false);
    });

    it('should return false when meta is empty', () => {
      const state = {
        meta: {},
      };
      expect(getters.getHasUnreadNotifications(state)).toBe(false);
    });
  });
});
