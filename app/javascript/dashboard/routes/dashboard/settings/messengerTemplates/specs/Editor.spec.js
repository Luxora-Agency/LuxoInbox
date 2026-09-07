import { flushPromises, mount } from '@vue/test-utils';
import { computed, ref } from 'vue';
import Editor from '../Editor.vue';
import MessengerVariableSuggestions from 'dashboard/components-next/messengerSimulator/MessengerVariableSuggestions.vue';

const dispatch = vi.fn();
const push = vi.fn();
const alert = vi.fn();
const records = ref([]);
const uiFlags = ref({
  isCreating: false,
  isUpdating: false,
  isExtracting: false,
});

vi.mock('dashboard/composables/store', () => ({
  useStore: () => ({ dispatch }),
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
  useRoute: () => ({ params: {} }),
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
    expose({
      getSnapshot: () => JSON.stringify(props.initialDefinition),
      getDefinition: () => props.initialDefinition,
      getValidationErrors: () => [],
    });
  },
};

const RouterLinkStub = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a><slot /></a>',
};

const mountEditor = () =>
  mount(Editor, {
    global: {
      stubs: {
        SettingsLayout: SettingsLayoutStub,
        BaseSettingsHeader: BaseSettingsHeaderStub,
        MessengerSimulatorEditor: SimulatorStub,
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
  expect(error.text()).toContain('LuxoIA no está configurada.');
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
