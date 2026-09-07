import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import Index from '../Index.vue';

const dispatch = vi.fn();
const push = vi.fn();
const alert = vi.fn();
const records = ref([]);
const uiFlags = ref({
  isFetching: false,
  isCreating: false,
  isDeleting: false,
  isRestoring: false,
});

vi.mock('dashboard/composables/store', () => ({
  useStore: () => ({ dispatch }),
  useMapGetter: key =>
    computed(() =>
      key === 'messengerTemplates/getTemplates' ? records.value : uiFlags.value
    ),
}));

vi.mock('dashboard/composables/useAccount', () => ({
  useAccount: () => ({
    accountId: computed(() => 1),
    accountScopedRoute: (name, params) => ({ name, params }),
  }),
}));

vi.mock('dashboard/composables', () => ({
  useAlert: (...args) => alert(...args),
}));

vi.mock('vue-router', async importOriginal => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}));

const definition = {
  version: 1,
  business_name: 'Support',
  avatar: 'none',
  messages: [
    { sender: 'outgoing', text: 'Hi {{contact.name}}', time: '' },
    { sender: 'incoming', text: 'Hello', time: '' },
  ],
};
const record = {
  id: 9,
  title: 'Welcome',
  definition,
  updated_at: '2026-09-06T10:00:00.000Z',
};

const SettingsLayoutStub = {
  name: 'SettingsLayout',
  props: ['isLoading'],
  template:
    '<div><slot name="header" /><slot name="body" v-if="!isLoading" /></div>',
};
const BaseSettingsHeaderStub = {
  name: 'BaseSettingsHeader',
  template: '<div><slot name="count" /><slot name="actions" /></div>',
};

const mountIndex = () =>
  mount(Index, {
    global: {
      stubs: {
        SettingsLayout: SettingsLayoutStub,
        BaseSettingsHeader: BaseSettingsHeaderStub,
      },
    },
  });

const clickLabel = async (wrapper, label) => {
  await wrapper
    .findAll('button')
    .find(button => button.text() === label)
    .trigger('click');
  await flushPromises();
};

beforeEach(() => {
  dispatch.mockResolvedValue([record]);
  records.value = [record];
  uiFlags.value = {
    isFetching: false,
    isCreating: false,
    isDeleting: false,
    isRestoring: false,
  };
});

it('loads the account library and renders one row per template', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  expect(dispatch).toHaveBeenCalledWith('messengerTemplates/get', 1);
  const cells = wrapper.findAll('tbody td').map(cell => cell.text());
  expect(cells[0]).toBe('Welcome');
  expect(cells[1]).toBe('MESSENGER_TEMPLATES.SETTINGS.MESSAGE_COUNT');
  wrapper.unmount();
});

it('offers a creation entry point in the header and in the empty state', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SETTINGS.NEW');
  expect(push).toHaveBeenCalledWith({
    name: 'messenger_templates_new',
    params: undefined,
  });
  records.value = [];
  await flushPromises();
  expect(wrapper.text()).toContain('MESSENGER_TEMPLATES.SETTINGS.EMPTY.TITLE');
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SETTINGS.EMPTY.ACTION');
  expect(push).toHaveBeenCalledTimes(2);
  wrapper.unmount();
});

it('duplicates a template with a suffixed title', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  await wrapper
    .find('[aria-label="MESSENGER_TEMPLATES.SETTINGS.DUPLICATE"]')
    .trigger('click');
  await flushPromises();
  expect(dispatch).toHaveBeenLastCalledWith('messengerTemplates/create', {
    accountId: 1,
    template: {
      title: 'MESSENGER_TEMPLATES.SETTINGS.DUPLICATE_TITLE',
      definition,
    },
  });
  wrapper.unmount();
});

it('deletes a template only after the confirmation step', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SETTINGS.DELETE');
  expect(dispatch).not.toHaveBeenCalledWith(
    'messengerTemplates/delete',
    expect.anything()
  );
  await clickLabel(
    wrapper,
    'MESSENGER_TEMPLATES.SETTINGS.DELETE_CONFIRM.CONFIRM'
  );
  expect(dispatch).toHaveBeenLastCalledWith('messengerTemplates/delete', {
    accountId: 1,
    id: 9,
  });
  wrapper.unmount();
});

it('shows the server reason when a delete is rejected', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  dispatch.mockRejectedValue({
    response: { data: { message: 'Template is in use' } },
  });
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SETTINGS.DELETE');
  await clickLabel(
    wrapper,
    'MESSENGER_TEMPLATES.SETTINGS.DELETE_CONFIRM.CONFIRM'
  );
  expect(wrapper.find('[role="alert"]').text()).toBe('Template is in use');
  wrapper.unmount();
});

it('pins the account default first and marks it with a badge', async () => {
  const seeded = { ...record, id: 3, title: 'Ana', is_default: true };
  records.value = [seeded, record];
  const wrapper = mountIndex();
  await flushPromises();
  const rows = wrapper.findAll('tbody tr');
  expect(rows[0].text()).toContain('Ana');
  expect(rows[0].text()).toContain('MESSENGER_TEMPLATES.DEFAULT.BADGE');
  expect(rows[1].text()).not.toContain('MESSENGER_TEMPLATES.DEFAULT.BADGE');
  wrapper.unmount();
});

it('restores the default template only after the confirmation step', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.DEFAULT.RESTORE');
  expect(dispatch).not.toHaveBeenCalledWith(
    'messengerTemplates/restoreDefault',
    expect.anything()
  );
  expect(wrapper.text()).toContain('MESSENGER_TEMPLATES.DEFAULT.RESTORE_HINT');
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.DEFAULT.RESTORE_CONFIRM');
  expect(dispatch).toHaveBeenLastCalledWith(
    'messengerTemplates/restoreDefault',
    1
  );
  expect(alert).toHaveBeenCalledWith('MESSENGER_TEMPLATES.DEFAULT.RESTORED');
  wrapper.unmount();
});

it('shows the server reason when the restore is rejected', async () => {
  const wrapper = mountIndex();
  await flushPromises();
  dispatch.mockRejectedValue({
    response: { data: { message: 'Restore is unavailable' } },
  });
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.DEFAULT.RESTORE');
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.DEFAULT.RESTORE_CONFIRM');
  expect(wrapper.find('[role="alert"]').text()).toBe('Restore is unavailable');
  wrapper.unmount();
});
