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
export const restoreDefaultMessengerTemplate = accountId =>
  axios.post(`${url(accountId)}/restore_default`);
// The browser sets the multipart boundary itself, so the content type is left alone.
export const extractMessengerTemplate = (accountId, file) => {
  const formData = new FormData();
  formData.append('screenshot', file);
  return axios.post(`${url(accountId)}/extract`, formData);
};
