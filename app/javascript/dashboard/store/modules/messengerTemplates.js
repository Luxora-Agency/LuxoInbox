import {
  listMessengerTemplates,
  listMessengerTemplateVariables,
  saveMessengerTemplate,
  deleteMessengerTemplate,
  restoreDefaultMessengerTemplate,
} from 'dashboard/api/messengerTemplates';

// Mirrors the server ordering (`ORDER BY is_default DESC, title, id`) so a record
// created or renamed locally lands where the API would have returned it, and the
// account default always leads the list.
const byDefaultThenTitle = (a, b) =>
  Number(Boolean(b.is_default)) - Number(Boolean(a.is_default)) ||
  String(a.title).localeCompare(String(b.title)) ||
  a.id - b.id;

const SET_UI_FLAG = 'SET_MESSENGER_TEMPLATE_UI_FLAG';
const SET_RECORDS = 'SET_MESSENGER_TEMPLATES';
const UPSERT_RECORD = 'UPSERT_MESSENGER_TEMPLATE';
const REMOVE_RECORD = 'REMOVE_MESSENGER_TEMPLATE';
const SET_VARIABLES = 'SET_MESSENGER_TEMPLATE_VARIABLES';

export const state = {
  records: [],
  variables: [],
  uiFlags: {
    isFetching: false,
    isFetchingVariables: false,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
    isRestoring: false,
  },
};

export const getters = {
  getTemplates(_state) {
    return _state.records;
  },
  getVariables(_state) {
    return _state.variables;
  },
  getUIFlags(_state) {
    return _state.uiFlags;
  },
  getTemplate(_state) {
    return id =>
      _state.records.find(record => record.id === Number(id)) ?? null;
  },
  getDefaultTemplate(_state) {
    return _state.records.find(record => record.is_default) ?? null;
  },
};

// Callers outside an account-scoped page may omit the account id, so it falls
// back to the account the dashboard is currently on.
const resolveAccountId = (rootGetters, accountId) =>
  accountId ?? rootGetters.getCurrentAccountId;

// Every action rethrows the original axios error so callers keep access to
// `error.response.data.message` and `.attributes` for field-level reporting.
export const actions = {
  get: async function get({ commit, rootGetters }, accountId) {
    commit(SET_UI_FLAG, { isFetching: true });
    try {
      const { data } = await listMessengerTemplates(
        resolveAccountId(rootGetters, accountId)
      );
      commit(SET_RECORDS, data);
      return data;
    } finally {
      commit(SET_UI_FLAG, { isFetching: false });
    }
  },

  create: async function create(
    { commit, rootGetters },
    { accountId, template }
  ) {
    commit(SET_UI_FLAG, { isCreating: true });
    try {
      const { data } = await saveMessengerTemplate(
        resolveAccountId(rootGetters, accountId),
        null,
        template
      );
      commit(UPSERT_RECORD, data);
      return data;
    } finally {
      commit(SET_UI_FLAG, { isCreating: false });
    }
  },

  update: async function update(
    { commit, rootGetters },
    { accountId, id, template }
  ) {
    commit(SET_UI_FLAG, { isUpdating: true });
    try {
      const { data } = await saveMessengerTemplate(
        resolveAccountId(rootGetters, accountId),
        id,
        template
      );
      commit(UPSERT_RECORD, data);
      return data;
    } finally {
      commit(SET_UI_FLAG, { isUpdating: false });
    }
  },

  delete: async function deleteTemplate(
    { commit, rootGetters },
    { accountId, id }
  ) {
    commit(SET_UI_FLAG, { isDeleting: true });
    try {
      await deleteMessengerTemplate(
        resolveAccountId(rootGetters, accountId),
        id
      );
      commit(REMOVE_RECORD, id);
      return id;
    } finally {
      commit(SET_UI_FLAG, { isDeleting: false });
    }
  },

  restoreDefault: async function restoreDefault(
    { commit, rootGetters },
    accountId
  ) {
    commit(SET_UI_FLAG, { isRestoring: true });
    try {
      const { data } = await restoreDefaultMessengerTemplate(
        resolveAccountId(rootGetters, accountId)
      );
      commit(UPSERT_RECORD, data);
      return data;
    } finally {
      commit(SET_UI_FLAG, { isRestoring: false });
    }
  },

  getVariables: async function getVariables(
    { commit, rootGetters },
    accountId
  ) {
    commit(SET_UI_FLAG, { isFetchingVariables: true });
    try {
      const { data } = await listMessengerTemplateVariables(
        resolveAccountId(rootGetters, accountId)
      );
      commit(SET_VARIABLES, data);
      return data;
    } finally {
      commit(SET_UI_FLAG, { isFetchingVariables: false });
    }
  },
};

export const mutations = {
  [SET_UI_FLAG](_state, data) {
    _state.uiFlags = {
      ..._state.uiFlags,
      ...data,
    };
  },

  [SET_RECORDS](_state, data) {
    _state.records = [...data].sort(byDefaultThenTitle);
  },

  [UPSERT_RECORD](_state, data) {
    _state.records = [
      ..._state.records.filter(record => record.id !== data.id),
      data,
    ].sort(byDefaultThenTitle);
  },

  [REMOVE_RECORD](_state, id) {
    _state.records = _state.records.filter(record => record.id !== id);
  },

  [SET_VARIABLES](_state, data) {
    _state.variables = data;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
