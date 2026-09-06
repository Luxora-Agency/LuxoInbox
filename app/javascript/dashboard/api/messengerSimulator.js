/* global axios */

// Use an explicit account ID: authorization must not follow a later route change.
export const authorizeMessengerSimulator = accountId =>
  axios.get(`/api/v1/accounts/${accountId}/messenger_simulator`);

export const getConversationScreenshot = (
  accountId,
  conversationId,
  params = {}
) =>
  axios.get(
    `/api/v1/accounts/${accountId}/conversations/${conversationId}/messenger_screenshot`,
    { params }
  );
