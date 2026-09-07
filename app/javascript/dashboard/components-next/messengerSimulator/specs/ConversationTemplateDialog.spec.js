import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import * as api from 'dashboard/api/messengerTemplates';
import Dialog from '../ConversationTemplateDialog.vue';
import Preview from '../MessengerSimulatorPreview.vue';

vi.mock('dashboard/api/messengerTemplates');
const download = vi.fn();
const Modal = {
  setup(_, { expose, emit }) {
    expose({ open() {}, close: () => emit('close') });
  },
  template: '<div><slot /></div>',
};
const Renderer = defineComponent({
  setup(_, { expose }) {
    expose({ download });
    return () => null;
  },
});
const definition = {
  version: 1,
  business_name: 'Support',
  avatar: 'none',
  messages: [
    {
      sender: 'outgoing',
      text: 'Hello {{contact.name}} {{contact.phone}}',
      time: '',
    },
  ],
};
const context = {
  template: { id: 9, definition },
  contact: { name: 'Taylor', phone: null },
  context_token: 'snapshot',
};
const mountDialog = (isCurrent = () => true) =>
  mount(Dialog, {
    props: { accountId: 1, conversationId: 2, isCurrent },
    global: {
      stubs: {
        Dialog: Modal,
        MessengerScreenshotRenderer: Renderer,
        MessengerSimulatorPreview: true,
      },
    },
  });
beforeEach(() => {
  api.listMessengerTemplates.mockResolvedValue({
    data: [{ id: 9, title: 'Welcome' }],
  });
  api.getMessengerTemplateContext.mockResolvedValue({ data: context });
  download.mockResolvedValue(1);
});

it('requests only missing used fields and exports resolved scripts without saving edits', async () => {
  const wrapper = mountDialog();
  await flushPromises();
  await wrapper.find('select').setValue('9');
  await flushPromises();
  const required = wrapper.find('input');
  expect(wrapper.findAll('label')[1].text()).toBe(
    'MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_PHONE'
  );
  await required.setValue('+12025550123');
  wrapper.findComponent(Modal).vm.$emit('confirm');
  await flushPromises();
  const options = download.mock.calls[0][0];
  expect(options.messages[0].text).toBe('Hello Taylor +12025550123');
  await options.authorize();
  expect(api.getMessengerTemplateContext).toHaveBeenLastCalledWith(1, 2, {
    template_id: 9,
    context_token: 'snapshot',
    authorize_only: true,
  });
  expect(api.saveMessengerTemplate).not.toHaveBeenCalled();
  expect(context.contact.phone).toBeNull();
  wrapper.unmount();
});

it('cancels in-flight rendering when account, conversation or feature validity changes', async () => {
  let valid = true;
  let finish;
  download.mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve;
      })
  );
  api.getMessengerTemplateContext.mockResolvedValue({
    data: { ...context, contact: { name: 'Taylor', phone: '123' } },
  });
  const wrapper = mountDialog(() => valid);
  await flushPromises();
  await wrapper.find('select').setValue('9');
  await flushPromises();
  wrapper.findComponent(Modal).vm.$emit('confirm');
  valid = false;
  expect(download.mock.calls[0][0].isCurrent()).toBe(false);
  finish(1);
  await flushPromises();
  expect(wrapper.emitted('close')).toBeUndefined();
  wrapper.unmount();
});

it.each([409, 401, 403, 404])(
  'handles context failure %s without delivering a file',
  async status => {
    download.mockRejectedValue({ response: { status } });
    const wrapper = mountDialog();
    await flushPromises();
    await wrapper.find('select').setValue('9');
    await flushPromises();
    await wrapper.find('input').setValue('123');
    wrapper.findComponent(Modal).vm.$emit('confirm');
    await flushPromises();
    expect(wrapper.find('[role="alert"]').text()).toContain(
      status === 409 ? 'TEMPLATES.STALE' : 'TEMPLATES.CONTEXT_ERROR'
    );
    expect(wrapper.findComponent(Preview).exists()).toBe(status === 409);
    expect(wrapper.find('input').exists()).toBe(status === 409);
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  }
);
