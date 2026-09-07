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
// The resolver is owned by templateDefinition.js and covered by its own spec.
vi.mock('../templateDefinition', () => ({
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
  directives: { 'on-clickaway': {} },
};

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

it('hides the template entry until the account has templates', async () => {
  const wrapper = mountButton();
  await clickTrigger(wrapper);

  expect(mocks.dispatch).toHaveBeenCalledWith('messengerTemplates/get');
  expect(wrapper.text()).not.toContain(
    'MESSENGER_TEMPLATES.CONVERSATION_EXPORT.FROM_TEMPLATE'
  );
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
    agent: expect.objectContaining({
      name: 'Ana Lopez',
      first_name: 'Ana',
      last_name: 'Lopez',
      email: 'ana@luxora.test',
    }),
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
      agent: expect.objectContaining({
        name: 'Bruno Díaz',
        first_name: 'Bruno',
        last_name: 'Díaz',
        email: 'bruno@luxora.test',
      }),
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
