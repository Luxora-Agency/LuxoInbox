import { mount, flushPromises } from '@vue/test-utils';
import { computed, ref } from 'vue';
import Picker from '../MessengerTemplatePicker.vue';

const dispatch = vi.fn();
const isAdmin = ref(true);
const records = ref([]);
const uiFlags = ref({ isFetching: false });

vi.mock('dashboard/composables/store', () => ({
  useStore: () => ({ dispatch }),
  useMapGetter: key =>
    computed(() =>
      key === 'messengerTemplates/getTemplates' ? records.value : uiFlags.value
    ),
}));

vi.mock('dashboard/composables/useAdmin', () => ({
  useAdmin: () => ({ isAdmin: computed(() => isAdmin.value) }),
}));

const definition = {
  version: 1,
  business_name: 'Support',
  avatar: 'none',
  messages: [{ sender: 'outgoing', text: 'Hi {{contact.name}}', time: '' }],
};
const record = { id: 9, title: 'Welcome', definition };

const global = { stubs: { RouterLink: { template: '<a><slot /></a>' } } };

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
  uiFlags.value = { isFetching: false };
  isAdmin.value = true;
});

it('lists saved templates and emits the selected record', async () => {
  const wrapper = mount(Picker, { props: { accountId: 1 }, global });
  await flushPromises();
  expect(dispatch).toHaveBeenCalledWith('messengerTemplates/get', 1);
  expect(wrapper.findAll('option').map(option => option.text())).toEqual([
    'MESSENGER_TEMPLATES.SIMULATOR.MANUAL',
    'Welcome',
  ]);
  await wrapper.find('select').setValue('9');
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE');
  expect(wrapper.emitted('load')).toEqual([[record]]);
  wrapper.unmount();
});

it('emits a manual simulation when nothing is selected', async () => {
  const wrapper = mount(Picker, { props: { accountId: 1 }, global });
  await flushPromises();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE');
  expect(wrapper.emitted('load')).toEqual([[null]]);
  wrapper.unmount();
});

it('confirms before replacing an unsaved draft', async () => {
  const wrapper = mount(Picker, {
    props: { accountId: 1, dirty: true },
    global,
  });
  await flushPromises();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SIMULATOR.LOAD_TEMPLATE');
  expect(wrapper.emitted('load')).toBeUndefined();
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.SIMULATOR.DISCARD_DRAFT');
  expect(wrapper.emitted('load')).toEqual([[null]]);
  wrapper.unmount();
});

it('offers the management link to administrators only', async () => {
  const wrapper = mount(Picker, { props: { accountId: 1 }, global });
  await flushPromises();
  expect(wrapper.text()).toContain('MESSENGER_TEMPLATES.SIMULATOR.MANAGE');
  isAdmin.value = false;
  await flushPromises();
  expect(wrapper.text()).not.toContain('MESSENGER_TEMPLATES.SIMULATOR.MANAGE');
  wrapper.unmount();
});

it('surfaces the server reason when the library cannot be listed', async () => {
  dispatch.mockRejectedValue({
    response: { data: { message: 'Templates are unavailable' } },
  });
  const wrapper = mount(Picker, { props: { accountId: 1 }, global });
  await flushPromises();
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'Templates are unavailable'
  );
  wrapper.unmount();
});

it('lists the account default first with its badge', async () => {
  const seeded = { id: 3, title: 'Ana', definition, is_default: true };
  records.value = [seeded, record];
  const wrapper = mount(Picker, { props: { accountId: 1 }, global });
  await flushPromises();
  expect(wrapper.findAll('option').map(option => option.text())).toEqual([
    'MESSENGER_TEMPLATES.SIMULATOR.MANUAL',
    'Ana \u00b7 MESSENGER_TEMPLATES.DEFAULT.BADGE',
    'Welcome',
  ]);
  wrapper.unmount();
});
