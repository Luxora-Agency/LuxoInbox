import { actions, mutations } from '../../messengerTemplates';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  extract: vi.fn(),
}));

vi.mock('dashboard/api/messengerTemplates', () => ({
  listMessengerTemplates: api.list,
  listMessengerTemplateVariables: vi.fn(),
  saveMessengerTemplate: api.save,
  deleteMessengerTemplate: vi.fn(),
  restoreDefaultMessengerTemplate: api.restore,
  extractMessengerTemplate: api.extract,
}));

const first = { id: 4, title: 'A first script' };
const last = { id: 7, title: 'Zulu script' };
const seeded = { id: 9, title: 'Default script', is_default: true };

const titles = state => state.records.map(record => record.title);
const newState = () => ({ records: [], variables: [], uiFlags: {} });

it('lists the account default first, then by title and id', () => {
  const state = newState();
  mutations.SET_MESSENGER_TEMPLATES(state, [last, first, seeded]);
  expect(titles(state)).toEqual([
    'Default script',
    'A first script',
    'Zulu script',
  ]);
});

it('keeps the default first when a record is upserted', () => {
  const state = newState();
  mutations.SET_MESSENGER_TEMPLATES(state, [seeded, last]);
  mutations.UPSERT_MESSENGER_TEMPLATE(state, first);
  expect(titles(state)).toEqual([
    'Default script',
    'A first script',
    'Zulu script',
  ]);
  mutations.UPSERT_MESSENGER_TEMPLATE(state, {
    ...seeded,
    title: 'Renamed default',
  });
  expect(titles(state)[0]).toBe('Renamed default');
  expect(state.records).toHaveLength(3);
});

it('restores the default and merges the row back into the list', async () => {
  api.restore.mockResolvedValue({ data: seeded });
  const commit = vi.fn();
  const restored = await actions.restoreDefault(
    { commit, rootGetters: { getCurrentAccountId: 3 } },
    undefined
  );
  expect(api.restore).toHaveBeenCalledWith(3);
  expect(restored).toEqual(seeded);
  expect(commit).toHaveBeenCalledWith('UPSERT_MESSENGER_TEMPLATE', seeded);
  expect(commit).toHaveBeenLastCalledWith('SET_MESSENGER_TEMPLATE_UI_FLAG', {
    isRestoring: false,
  });
});

it('clears the restoring flag when the request fails', async () => {
  api.restore.mockRejectedValue(new Error('nope'));
  const commit = vi.fn();
  await expect(
    actions.restoreDefault({ commit, rootGetters: {} }, 5)
  ).rejects.toThrow('nope');
  expect(commit).toHaveBeenLastCalledWith('SET_MESSENGER_TEMPLATE_UI_FLAG', {
    isRestoring: false,
  });
});

it('returns the extracted draft without touching the stored library', async () => {
  const payload = {
    definition: {
      version: 1,
      business_name: 'Luxora',
      avatar: 'contact',
      messages: [],
    },
    suggestions: [{ kind: 'dynamic', key: 'contact.name' }],
  };
  api.extract.mockResolvedValue({ data: payload });
  const commit = vi.fn();
  const file = new File(['x'], 'shot.png', { type: 'image/png' });

  const result = await actions.extract(
    { commit, rootGetters: { getCurrentAccountId: 3 } },
    { file }
  );

  expect(api.extract).toHaveBeenCalledWith(3, file);
  expect(result).toEqual(payload);
  expect(commit.mock.calls).toEqual([
    ['SET_MESSENGER_TEMPLATE_UI_FLAG', { isExtracting: true }],
    ['SET_MESSENGER_TEMPLATE_UI_FLAG', { isExtracting: false }],
  ]);
});

it('clears the extracting flag and rethrows when the extraction fails', async () => {
  const error = { response: { status: 502 } };
  api.extract.mockRejectedValue(error);
  const commit = vi.fn();

  await expect(
    actions.extract(
      { commit, rootGetters: { getCurrentAccountId: 3 } },
      { accountId: 5, file: null }
    )
  ).rejects.toBe(error);
  expect(api.extract).toHaveBeenCalledWith(5, null);
  expect(commit).toHaveBeenLastCalledWith('SET_MESSENGER_TEMPLATE_UI_FLAG', {
    isExtracting: false,
  });
});
