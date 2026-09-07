import { flushPromises, mount } from '@vue/test-utils';
import * as api from 'dashboard/api/messengerSimulator';
import ConversationScreenshotButton from '../ConversationScreenshotButton.vue';

const mocks = vi.hoisted(() => ({
  state: {
    featureEnabled: true,
    templates: [],
    currentUser: { id: 3, name: 'ana lopez', email: 'ana@luxora.test' },
    selectedChat: { id: 7, meta: { assignee: null } },
  },
  dispatch: vi.fn(),
  rendererDownload: vi.fn(),
  useAlert: vi.fn(),
  loadConversationScreenshot: vi.fn(),
  resolveMessengerTemplate: vi.fn(),
}));

vi.mock('dashboard/api/messengerSimulator');
vi.mock('../conversationScreenshot', () => ({
  loadConversationScreenshot: mocks.loadConversationScreenshot,
}));
// The resolver is owned by templateDefinition.js and covered by its own spec; the rest
// of the module stays real so the agent context is built the way the editor builds it.
vi.mock('../templateDefinition', async importOriginal => ({
  ...(await importOriginal()),
  resolveMessengerTemplate: mocks.resolveMessengerTemplate,
}));
vi.mock('dashboard/composables', () => ({ useAlert: mocks.useAlert }));
vi.mock('dashboard/composables/useAccount', async () => {
  const { computed } = await vi.importActual('vue');
  return { useAccount: () => ({ accountId: computed(() => 1) }) };
});
vi.mock('dashboard/composables/store', async () => {
  const { computed } = await vi.importActual('vue');
  const readers = {
    'accounts/isFeatureEnabledonAccount': () => () =>
      mocks.state.featureEnabled,
    'messengerTemplates/getTemplates': () => mocks.state.templates,
    getCurrentUser: () => mocks.state.currentUser,
    getSelectedChat: () => mocks.state.selectedChat,
  };
  return {
    useMapGetter: key => computed(() => readers[key] && readers[key]()),
    useStore: () => ({ dispatch: mocks.dispatch }),
  };
});

const definition = {
  version: 1,
  business_name: 'Luxora',
  avatar: 'none',
  messages: [
    {
      sender: 'outgoing',
      text: 'Hi {{contact.name}}, {{agent.first_name}} here.',
      time: '',
    },
  ],
};
const template = { id: 9, title: 'Welcome', definition };
const contact = {
  name: 'Dana Ruiz',
  first_name: 'Dana',
  last_name: 'Ruiz',
  phone: '+1 202-555-0123',
  avatar_data: '',
};
const history = {
  participants: {
    incoming: { name: 'Dana Ruiz', avatar: '' },
    outgoing: { name: 'You', avatar: '' },
  },
  messages: [{ id: 1, sender: 'incoming', text: 'Hello', time: '10:00' }],
};
const resolved = {
  participants: {
    incoming: { name: 'Dana Ruiz', avatar: '' },
    outgoing: { name: 'Luxora', avatar: '' },
  },
  messages: [
    { id: 1, sender: 'outgoing', text: 'Hi Dana Ruiz, Ana here.', time: '' },
  ],
};

const RendererStub = {
  name: 'MessengerScreenshotRenderer',
  template: '<div />',
  setup(_props, { expose }) {
    expose({ download: mocks.rendererDownload });
  },
};
const global = {
  stubs: { MessengerScreenshotRenderer: RendererStub },
};

// jsdom ships `<dialog>` without the modal methods the shared Dialog opens through.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

const mountButton = () =>
  mount(ConversationScreenshotButton, {
    props: { conversationId: 7 },
    global,
  });

const clickTrigger = async wrapper => {
  await wrapper.find('button[aria-haspopup="menu"]').trigger('click');
  await flushPromises();
};

const clickItem = async (wrapper, label) => {
  await wrapper
    .findAll('button')
    .find(button => button.text() === label)
    .trigger('click');
  await flushPromises();
};

beforeEach(() => {
  mocks.state.featureEnabled = true;
  mocks.state.templates = [];
  mocks.state.currentUser = {
    id: 3,
    name: 'ana lopez',
    email: 'ana@luxora.test',
  };
  mocks.state.selectedChat = { id: 7, meta: { assignee: null } };
  mocks.dispatch.mockResolvedValue(undefined);
  mocks.rendererDownload.mockResolvedValue(1);
  mocks.loadConversationScreenshot.mockResolvedValue(history);
  mocks.resolveMessengerTemplate.mockReturnValue(resolved);
  api.getConversationScreenshot.mockResolvedValue({ data: {} });
  api.getMessengerTemplateContext.mockResolvedValue({
    data: { template, contact, context_token: 'a'.repeat(64) },
  });
  api.authorizeMessengerTemplateContext.mockResolvedValue({ status: 204 });
});

it('exports the real history through the unchanged renderer path', async () => {
  mocks.state.templates = [template];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.REAL_HISTORY'
  );

  expect(mocks.loadConversationScreenshot).toHaveBeenCalledWith(
    expect.objectContaining({ accountId: 1, conversationId: 7 })
  );
  const options = mocks.rendererDownload.mock.calls[0][0];
  expect(options.filename).toBe('messenger-conversation-1-7');
  expect(options.messages).toEqual(history.messages);
  await options.authorize();
  expect(api.getConversationScreenshot).toHaveBeenCalledWith(1, 7, {
    authorize_only: true,
  });
  expect(api.getMessengerTemplateContext).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('keeps the one-click history export when the account has no templates', async () => {
  const wrapper = mountButton();
  await clickTrigger(wrapper);

  expect(mocks.dispatch).toHaveBeenCalledWith('messengerTemplates/get');
  expect(wrapper.text()).not.toContain(
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.REAL_HISTORY'
  );
  expect(mocks.loadConversationScreenshot).toHaveBeenCalledWith(
    expect.objectContaining({ accountId: 1, conversationId: 7 })
  );
  wrapper.unmount();
});

it('marks the account default in the menu without truncating it into the title', async () => {
  const seeded = {
    id: 3,
    title: 'A very long default script title',
    is_default: true,
  };
  mocks.state.templates = [seeded, template];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );

  const badges = wrapper.findAll('span.bg-orbis-navy');
  expect(badges).toHaveLength(1);
  expect(badges[0].text()).toBe('MESSENGER_TEMPLATES.DEFAULT.BADGE');
  expect(wrapper.text()).toContain('A very long default script title');
  wrapper.unmount();
});

it('discards the template search when the menu returns to the actions', async () => {
  mocks.state.templates = [template];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await wrapper.find('input[type="search"]').setValue('zzz');
  await clickItem(wrapper, 'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.BACK');

  expect(wrapper.text()).toContain(
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.REAL_HISTORY'
  );
  wrapper.unmount();
});

it('closes the menu on escape once the view swap moved focus out', async () => {
  mocks.state.templates = [template];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  expect(wrapper.text()).toContain('Welcome');

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await flushPromises();

  expect(wrapper.text()).not.toContain('Welcome');
  wrapper.unmount();
});

it('keeps the menu open for a press inside and closes it from outside', async () => {
  mocks.state.templates = [template];
  const wrapper = mount(ConversationScreenshotButton, {
    props: { conversationId: 7 },
    global,
    attachTo: document.body,
  });
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  expect(wrapper.text()).toContain('Welcome');

  wrapper
    .find('input')
    .element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await flushPromises();
  expect(wrapper.text()).toContain('Welcome');

  document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  await flushPromises();
  expect(wrapper.text()).not.toContain('Welcome');
  wrapper.unmount();
});

it('resolves a template with the real contact and re-authorizes with the token', async () => {
  mocks.state.templates = [template];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Welcome');

  expect(api.getMessengerTemplateContext).toHaveBeenCalledWith(1, 7, {
    template_id: 9,
  });
  expect(mocks.resolveMessengerTemplate).toHaveBeenCalledWith(definition, {
    contact,
    agent: {
      name: 'ana lopez',
      first_name: 'ana',
      last_name: 'lopez',
      email: 'ana@luxora.test',
    },
    manual: {},
  });
  const options = mocks.rendererDownload.mock.calls[0][0];
  expect(options.filename).toBe('messenger-template-1-7');
  expect(options.messages).toEqual(resolved.messages);
  expect(options.participants).toEqual(resolved.participants);
  await options.authorize();
  expect(api.authorizeMessengerTemplateContext).toHaveBeenCalledWith(1, 7, {
    template_id: 9,
    context_token: 'a'.repeat(64),
  });
  wrapper.unmount();
});

it('prefers the conversation assignee over the current user', async () => {
  mocks.state.templates = [template];
  mocks.state.selectedChat = {
    id: 7,
    meta: {
      assignee: { id: 8, name: 'bruno díaz', email: 'bruno@luxora.test' },
    },
  };
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Welcome');

  expect(mocks.resolveMessengerTemplate).toHaveBeenCalledWith(
    definition,
    expect.objectContaining({
      agent: {
        name: 'bruno díaz',
        first_name: 'bruno',
        last_name: 'díaz',
        email: 'bruno@luxora.test',
      },
    })
  );
  wrapper.unmount();
});

it('reports a changed contact when revalidation conflicts', async () => {
  mocks.state.templates = [template];
  mocks.rendererDownload.mockRejectedValue({ response: { status: 409 } });
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Welcome');

  expect(mocks.useAlert).toHaveBeenLastCalledWith(
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.CONTACT_CHANGED'
  );
  wrapper.unmount();
});

const manualDefinition = {
  version: 1,
  business_name: 'Luxora',
  avatar: 'none',
  messages: [
    {
      sender: 'outgoing',
      text: 'Tu cita es el {{manual.fecha_cita}}',
      time: '',
    },
  ],
};
const manualTemplate = { id: 11, title: 'Cita', definition: manualDefinition };

const clickDocumentLabel = async label => {
  Array.from(document.querySelectorAll('button'))
    .find(element => element.textContent.trim() === label)
    .click();
  await flushPromises();
};

it('asks for the manual values before exporting a template that uses them', async () => {
  mocks.state.templates = [manualTemplate];
  api.getMessengerTemplateContext.mockResolvedValue({
    data: {
      template: manualTemplate,
      contact,
      context_token: 'b'.repeat(64),
    },
  });
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Cita');

  expect(api.getMessengerTemplateContext).not.toHaveBeenCalled();
  const field = document.querySelector('#messenger-manual-value-fecha_cita');
  expect(document.querySelector('label').textContent.trim()).toBe('Fecha cita');
  field.value = '14 de marzo';
  field.dispatchEvent(new Event('input'));
  await flushPromises();
  await clickDocumentLabel('MESSENGER_TEMPLATES.MANUAL_MODAL.CONTINUE');

  expect(mocks.resolveMessengerTemplate).toHaveBeenCalledWith(
    manualDefinition,
    expect.objectContaining({ manual: { fecha_cita: '14 de marzo' } })
  );
  expect(mocks.rendererDownload).toHaveBeenCalledTimes(1);
  wrapper.unmount();
});

it('exports nothing when the manual values are dismissed', async () => {
  mocks.state.templates = [manualTemplate];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Cita');
  await clickDocumentLabel('MESSENGER_TEMPLATES.MANUAL_MODAL.CANCEL');

  expect(api.getMessengerTemplateContext).not.toHaveBeenCalled();
  expect(mocks.rendererDownload).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('drops the pending manual export when the conversation changes', async () => {
  mocks.state.templates = [manualTemplate];
  const wrapper = mountButton();
  await clickTrigger(wrapper);
  await clickItem(
    wrapper,
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
  await clickItem(wrapper, 'Cita');
  expect(document.querySelector('dialog').open).toBe(true);

  await wrapper.setProps({ conversationId: 12 });
  await flushPromises();

  expect(document.querySelector('dialog').open).toBe(false);
  expect(mocks.rendererDownload).not.toHaveBeenCalled();
  wrapper.unmount();
});
