/* global axios */
const url = accountId => `/api/v1/accounts/${accountId}/messenger_templates`;
export const listMessengerTemplates = accountId => axios.get(url(accountId));
export const listMessengerTemplateVariables = accountId =>
  axios.get(`${url(accountId)}/variables`);
export const saveMessengerTemplate = (accountId, id, template) =>
  id
    ? axios.patch(`${url(accountId)}/${id}`, { messenger_template: template })
    : axios.post(url(accountId), { messenger_template: template });
export const deleteMessengerTemplate = (accountId, id) =>
  axios.delete(`${url(accountId)}/${id}`);
