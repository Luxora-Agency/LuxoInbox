import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import Editor from '../Editor.vue';
import MessengerSimulatorEditor from 'dashboard/components-next/messengerSimulator/MessengerSimulatorEditor.vue';
import MessengerVariableSuggestions from 'dashboard/components-next/messengerSimulator/MessengerVariableSuggestions.vue';

const dispatch = vi.fn();
const push = vi.fn();
const alert = vi.fn();
const records = ref([]);
const routeParams = ref({});
const uiFlags = ref({
  isCreating: false,
  isUpdating: false,
  isExtracting: false,
});

vi.mock('dashboard/composables/store', () => ({
  useStore: () => ({ dispatch, getters: {} }),
  useMapGetter: key =>
    computed(() => {
      if (key === 'messengerTemplates/getTemplates') return records.value;
      if (key === 'messengerTemplates/getTemplate')
        return id => records.value.find(record => record.id === Number(id));
      return uiFlags.value;
    }),
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
  useRoute: () => ({ params: routeParams.value }),
  useRouter: () => ({ push }),
  onBeforeRouteLeave: () => {},
}));

const extracted = {
  definition: {
    version: 1,
    business_name: 'Clínica Luxora',
    avatar: 'contact',
    messages: [
      { sender: 'outgoing', text: 'Hola Dana, tu cita es el 14/03.', time: '' },
    ],
  },
  suggestions: [
    {
      kind: 'dynamic',
      key: 'contact.first_name',
      original_text: 'Dana',
      label: 'Nombre',
      reason: 'Cambia por cliente',
    },
  ],
};

const simulatorDraft = ref(null);

const SettingsLayoutStub = {
  name: 'SettingsLayout',
  props: ['isLoading'],
  template:
    '<div><slot name="header" /><slot name="body" v-if="!isLoading" /></div>',
};
const BaseSettingsHeaderStub = {
  name: 'BaseSettingsHeader',
  template: '<div><slot name="actions" /></div>',
};
// The simulator is covered by its own specs; here it only has to report the definition
// it was mounted with, so the remount after an extraction is observable.
const SimulatorStub = {
  name: 'MessengerSimulatorEditor',
  props: ['initialDefinition'],
  template: '<div class="simulator" />',
  setup(props, { expose }) {
    // `simulatorDraft` stands in for an admin editing the script inside the simulator.
    const current = () => simulatorDraft.value ?? props.initialDefinition;
    expose({
      getSnapshot: () => JSON.stringify(current()),
      getDefinition: () => current(),
      getValidationErrors: () => [],
    });
  },
};

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountEditor = (realSimulator = false) =>
  mount(Editor, {
    global: {
      stubs: {
        SettingsLayout: SettingsLayoutStub,
        BaseSettingsHeader: BaseSettingsHeaderStub,
        MessengerSimulatorEditor: realSimulator ? false : SimulatorStub,
        MessengerScreenshotRenderer: true,
        MessengerSimulatorPreview: true,
        CaretAnchoredPicker: { template: '<div><slot name="filters" /></div>' },
        Dialog: true,
        RouterLink: RouterLinkStub,
      },
    },
  });

const uploadScreenshot = async (wrapper, file) => {
  const input = wrapper.find('#messenger-ai-screenshot');
  Object.defineProperty(input.element, 'files', {
    value: [file],
    writable: true,
  });
  await input.trigger('change');
  await flushPromises();
};

const png = () => new File(['x'], 'shot.png', { type: 'image/png' });

beforeEach(() => {
  routeParams.value = {};
  simulatorDraft.value = null;
  records.value = [];
  uiFlags.value = { isCreating: false, isUpdating: false, isExtracting: false };
  dispatch.mockResolvedValue(extracted);
});

it('loads the extracted script, names the template and lists the suggestions', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(wrapper, png());

  expect(dispatch).toHaveBeenCalledWith('messengerTemplates/extract', {
    accountId: 1,
    file: expect.any(File),
  });
  expect(wrapper.find('#messenger-template-title').element.value).toBe(
    'Clínica Luxora'
  );
  expect(
    wrapper.findComponent(SimulatorStub).props('initialDefinition')
  ).toEqual(extracted.definition);
  expect(wrapper.findComponent(MessengerVariableSuggestions).exists()).toBe(
    true
  );
  expect(alert).toHaveBeenCalledWith('MESSENGER_TEMPLATES.AI.SUCCESS');
  wrapper.unmount();
});

it('remounts the simulator with the tokens once suggestions are applied', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(wrapper, png());
  await wrapper
    .findAll('button')
    .find(
      button => button.text() === 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY'
    )
    .trigger('click');
  await flushPromises();

  expect(
    wrapper.findComponent(SimulatorStub).props('initialDefinition').messages[0]
      .text
  ).toBe('Hola {{contact.first_name}}, tu cita es el 14/03.');
  expect(wrapper.findComponent(MessengerVariableSuggestions).exists()).toBe(
    false
  );
  wrapper.unmount();
});

it('points to the OpenAI integration when LuxoIA has no key', async () => {
  dispatch.mockRejectedValue({
    response: {
      status: 422,
      data: { message: 'LuxoIA no está configurada.', code: 'not_configured' },
    },
  });
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(wrapper, png());

  const error = wrapper.find('[role="alert"]');
  expect(error.text()).toContain('MESSENGER_TEMPLATES.AI.NOT_CONFIGURED');
  expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
    name: 'settings_applications_integration',
    params: { integration_id: 'openai' },
  });
  wrapper.unmount();
});

it('rejects an oversized or wrongly typed file before calling the server', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(
    wrapper,
    new File(['x'], 'notes.pdf', { type: 'application/pdf' })
  );
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'MESSENGER_TEMPLATES.AI.WRONG_TYPE'
  );

  const heavy = png();
  Object.defineProperty(heavy, 'size', { value: 6 * 1024 * 1024 });
  await uploadScreenshot(wrapper, heavy);
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'MESSENGER_TEMPLATES.AI.TOO_LARGE'
  );

  expect(dispatch).not.toHaveBeenCalled();
  wrapper.unmount();
});

it('rewrites the draft the admin is looking at, not the extracted payload', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(wrapper, png());
  simulatorDraft.value = {
    ...extracted.definition,
    messages: [
      { sender: 'outgoing', text: 'Hola Dana, nos vemos el 15/03.', time: '' },
    ],
  };
  await flushPromises();
  await wrapper
    .findAll('button')
    .find(
      button => button.text() === 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY'
    )
    .trigger('click');
  await flushPromises();

  expect(
    wrapper.findComponent(SimulatorStub).props('initialDefinition').messages[0]
      .text
  ).toBe('Hola {{contact.first_name}}, nos vemos el 15/03.');
  wrapper.unmount();
});

it('keeps the current business name when the screenshot shows no header', async () => {
  dispatch.mockResolvedValue({
    ...extracted,
    definition: { ...extracted.definition, business_name: '' },
  });
  const wrapper = mountEditor();
  await flushPromises();
  await uploadScreenshot(wrapper, png());

  expect(
    wrapper.findComponent(SimulatorStub).props('initialDefinition')
      .business_name
  ).toBe('MESSENGER_SIMULATOR.EXAMPLE_OUTGOING_NAME');
  expect(wrapper.find('#messenger-template-title').element.value).toBe(
    'MESSENGER_TEMPLATES.AI.TITLE_FALLBACK'
  );
  wrapper.unmount();
});

it.each([false, true])(
  'retains a time variable after saving and reopening with message committed: %s',
  async commitMessage => {
    routeParams.value = { templateId: '7' };
    records.value = [
      { id: 7, title: 'Synthetic template', definition: extracted.definition },
    ];
    dispatch.mockImplementation(async (action, { template }) => {
      records.value = [{ id: 7, ...JSON.parse(JSON.stringify(template)) }];
    });
    const wrapper = mountEditor(true);
    await flushPromises();
    await wrapper
      .find('button[aria-label="MESSENGER_SIMULATOR.EDIT_MESSAGE"]')
      .trigger('click');
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'MESSENGER_SIMULATOR.TIMESTAMP')
      .trigger('click');
    await wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.TIME_BUTTON'
      )
      .trigger('click');
    await wrapper.find('#messenger-manual-variable').setValue('time');
    await wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.MANUAL.ADD'
      )
      .trigger('click');
    if (commitMessage) {
      await wrapper
        .findAll('button')
        .find(button => button.text() === 'MESSENGER_SIMULATOR.SAVE_MESSAGE')
        .trigger('click');
    }
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'MESSENGER_TEMPLATES.EDITOR.SAVE')
      .trigger('click');
    await flushPromises();
    expect(dispatch).toHaveBeenCalledWith(
      'messengerTemplates/update',
      expect.objectContaining({
        id: 7,
        template: expect.objectContaining({
          definition: expect.objectContaining({
            messages: [expect.objectContaining({ time: '{{manual.time}}' })],
          }),
        }),
      })
    );
    wrapper.unmount();
    const reopened = mountEditor(true);
    await flushPromises();
    await reopened
      .find('button[aria-label="MESSENGER_SIMULATOR.EDIT_MESSAGE"]')
      .trigger('click');
    expect(reopened.find('input#simulator-time').element.value).toBe(
      '{{manual.time}}'
    );
    reopened.unmount();
  }
);

it.each(['existing', 'new'])(
  'keeps an unassigned timestamp until the author chooses a %s message',
  async target => {
    routeParams.value = { templateId: '7' };
    records.value = [
      { id: 7, title: 'Synthetic template', definition: extracted.definition },
    ];
    dispatch.mockImplementation(async (action, { template }) => {
      records.value = [{ id: 7, ...JSON.parse(JSON.stringify(template)) }];
    });
    const wrapper = mountEditor(true);
    await flushPromises();
    const simulator = wrapper.findComponent(MessengerSimulatorEditor);
    const baseline = simulator.vm.getSnapshot();
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'MESSENGER_SIMULATOR.TIMESTAMP')
      .trigger('click');
    await wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.TIME_BUTTON'
      )
      .trigger('click');
    await wrapper.find('#messenger-manual-variable').setValue('time');
    await wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.MANUAL.ADD'
      )
      .trigger('click');
    expect(wrapper.find('input#simulator-time').element.value).toBe(
      '{{manual.time}}'
    );
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'MESSENGER_TEMPLATES.EDITOR.SAVE')
      .trigger('click');
    await flushPromises();
    expect(dispatch).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain(
      'MESSENGER_SIMULATOR.TIME_REQUIRES_MESSAGE'
    );
    expect(simulator.vm.getSnapshot()).not.toBe(baseline);
    expect(wrapper.find('input#simulator-time').element.value).toBe(
      '{{manual.time}}'
    );
    if (target === 'existing') {
      await wrapper
        .find('button[aria-label="MESSENGER_SIMULATOR.EDIT_MESSAGE"]')
        .trigger('click');
    } else {
      await wrapper
        .find('#simulator-composer')
        .setValue('Synthetic new message');
    }
    expect(wrapper.find('input#simulator-time').element.value).toBe(
      '{{manual.time}}'
    );
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'MESSENGER_TEMPLATES.EDITOR.SAVE')
      .trigger('click');
    await flushPromises();
    expect(records.value[0].definition.messages.at(-1).time).toBe(
      '{{manual.time}}'
    );
    expect(records.value[0].definition.avatar).toBe('contact');
    wrapper.unmount();
    const reopened = mountEditor(true);
    await flushPromises();
    await reopened
      .findAll('button[aria-label="MESSENGER_SIMULATOR.EDIT_MESSAGE"]')
      .at(-1)
      .trigger('click');
    expect(reopened.find('input#simulator-time').element.value).toBe(
      '{{manual.time}}'
    );
    reopened.unmount();
  }
);

it('keeps each assigned timestamp when switching away from an empty edited message', async () => {
  routeParams.value = { templateId: '7' };
  const messages = [
    { sender: 'incoming', text: 'Synthetic first message', time: '9:00' },
    { sender: 'outgoing', text: 'Synthetic second message', time: '10:00' },
  ];
  records.value = [
    {
      id: 7,
      title: 'Synthetic template',
      definition: { ...extracted.definition, messages },
    },
  ];
  const wrapper = mountEditor(true);
  await flushPromises();
  const rows = wrapper.findAll(
    'button[aria-label="MESSENGER_SIMULATOR.EDIT_MESSAGE"]'
  );
  await rows[0].trigger('click');
  await wrapper.find('#simulator-composer').setValue('');
  expect(
    wrapper.findComponent(MessengerSimulatorEditor).vm.getDefinition()
  ).toBeNull();
  await rows[1].trigger('click');
  expect(wrapper.find('input#simulator-time').element.value).toBe('10:00');
  await wrapper
    .findAll('button')
    .find(button => button.text() === 'MESSENGER_TEMPLATES.EDITOR.SAVE')
    .trigger('click');
  await flushPromises();
  expect(dispatch).toHaveBeenCalledWith(
    'messengerTemplates/update',
    expect.objectContaining({
      template: expect.objectContaining({
        definition: expect.objectContaining({ messages }),
      }),
    })
  );
  wrapper.unmount();
});
