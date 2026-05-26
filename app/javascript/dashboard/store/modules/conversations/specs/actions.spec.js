import { describe, it, expect, vi, beforeEach } from 'vitest';
import actions from '../actions';
import types from '../../../mutation-types';
import ConversationApi from '../../../../api/inbox/conversation';
import { MESSAGE_TYPE } from 'shared/constants/messages';

vi.mock('../../../../api/inbox/conversation', () => ({
  default: {
    show: vi.fn(),
  },
}));

vi.mock('../../../../api/inbox/message', () => ({
  default: {},
}));

vi.mock('@sentry/vue', () => ({
  default: {},
  setContext: vi.fn(),
  captureException: vi.fn(),
}));

describe('#conversation actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('#addMessage', () => {
    it('loads the conversation when a realtime message arrives before the conversation is in the store', async () => {
      const conversation = {
        id: 42,
        messages: [],
        meta: { sender: { id: 7 } },
      };
      const message = {
        id: 99,
        conversation_id: 42,
        message_type: MESSAGE_TYPE.INCOMING,
      };
      const commit = vi.fn();
      const getters = { getConversationById: vi.fn(() => undefined) };
      const rootGetters = { getCurrentUserID: 1 };

      ConversationApi.show.mockResolvedValue({ data: conversation });

      await actions.addMessage({ commit, getters, rootGetters }, message);

      expect(getters.getConversationById).toHaveBeenCalledWith(42);
      expect(ConversationApi.show).toHaveBeenCalledWith(42);
      expect(commit).toHaveBeenCalledWith(
        types.UPDATE_CONVERSATION,
        conversation
      );
      expect(commit).toHaveBeenCalledWith(
        `contacts/${types.SET_CONTACT_ITEM}`,
        conversation.meta.sender
      );
      expect(commit).toHaveBeenCalledWith(types.ADD_MESSAGE, message);
      expect(commit).toHaveBeenCalledWith(types.SET_CONVERSATION_CAN_REPLY, {
        conversationId: 42,
        canReply: true,
      });
      expect(commit).toHaveBeenCalledWith(
        types.ADD_CONVERSATION_ATTACHMENTS,
        message
      );
    });
  });
});
