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

const templateContextUrl = (accountId, conversationId) =>
  `/api/v1/accounts/${accountId}/conversations/${conversationId}/messenger_template_context`;

// Real contact values for a template export: never cached, always re-read.
export const getMessengerTemplateContext = (
  accountId,
  conversationId,
  { template_id: templateId }
) =>
  axios.get(templateContextUrl(accountId, conversationId), {
    params: { template_id: templateId },
  });

// Revalidation only: 204 when the contact still matches, 409 when it changed.
export const authorizeMessengerTemplateContext = (
  accountId,
  conversationId,
  { template_id: templateId, context_token: contextToken }
) =>
  axios.get(templateContextUrl(accountId, conversationId), {
    params: {
      template_id: templateId,
      authorize_only: true,
      context_token: contextToken,
    },
  });
