import { mount, flushPromises } from '@vue/test-utils';
import * as api from 'dashboard/api/messengerTemplates';
import Library from '../MessengerTemplateLibrary.vue';
import Editor from '../MessengerSimulatorEditor.vue';

vi.mock('dashboard/api/messengerTemplates');
const definition = {
  version: 1,
  business_name: 'Support',
  avatar: 'none',
  messages: [{ sender: 'outgoing', text: 'Hi {{contact.name}}', time: '' }],
};
const record = { id: 9, title: 'Welcome', definition };
const global = {
  stubs: { MessengerScreenshotRenderer: true, MessengerSimulatorPreview: true },
};
const click = async (wrapper, key) => {
  await wrapper
    .findAll('button')
    .find(button => button.text() === `MESSENGER_SIMULATOR.TEMPLATES.${key}`)
    .trigger('click');
  await flushPromises();
};
beforeEach(() => {
  api.listMessengerTemplates.mockResolvedValue({ data: [record] });
  api.saveMessengerTemplate.mockResolvedValue({ data: record });
  api.deleteMessengerTemplate.mockResolvedValue({});
});

it('opens, saves and duplicates scripts without storing sample participants', async () => {
  const wrapper = mount(Library, { props: { accountId: 1 }, global });
  await flushPromises();
  await wrapper.find('select').setValue('9');
  await click(wrapper, 'OPEN');
  await click(wrapper, 'SAVE');
  expect(api.saveMessengerTemplate).toHaveBeenCalledWith(1, 9, {
    title: 'Welcome',
    definition,
  });
  await click(wrapper, 'DUPLICATE');
  expect(api.saveMessengerTemplate).toHaveBeenLastCalledWith(1, null, {
    title: 'Welcome',
    definition,
  });
  expect(wrapper.findComponent(Editor).vm.getDefinition()).not.toHaveProperty(
    'participants'
  );
  wrapper.unmount();
});

it('requires confirmation before deleting and retains drafts after request failures', async () => {
  const wrapper = mount(Library, { props: { accountId: 1 }, global });
  await flushPromises();
  await wrapper.find('select').setValue('9');
  await click(wrapper, 'OPEN');
  api.saveMessengerTemplate.mockRejectedValue({ response: { status: 422 } });
  await click(wrapper, 'SAVE');
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  expect(wrapper.findComponent(Editor).vm.getDefinition()).toEqual(definition);
  await click(wrapper, 'DELETE');
  expect(api.deleteMessengerTemplate).not.toHaveBeenCalled();
  await click(wrapper, 'CONFIRM_DELETE');
  expect(api.deleteMessengerTemplate).toHaveBeenCalledWith(1, 9);
  wrapper.unmount();
});

it('confirms discarding drafts even when the library request fails', async () => {
  api.listMessengerTemplates.mockRejectedValue(new Error('offline'));
  const wrapper = mount(Library, { props: { accountId: 1 }, global });
  await flushPromises();
  await wrapper.find('textarea').setValue('Keep this draft');
  await wrapper.find('select').setValue('new');
  await click(wrapper, 'OPEN');
  expect(wrapper.find('textarea').element.value).toBe('Keep this draft');
  await click(wrapper, 'DISCARD');
  expect(wrapper.find('textarea').element.value).toBe('');
  wrapper.unmount();
});
