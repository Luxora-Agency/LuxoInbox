import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { createStore } from 'vuex';
import * as api from 'dashboard/api/messengerTemplates';
import CaretAnchoredPicker from 'dashboard/components-next/preview-picker/CaretAnchoredPicker.vue';
import Editor from '../MessengerSimulatorEditor.vue';
import Preview from '../MessengerSimulatorPreview.vue';
import VariablePicker from '../MessengerVariablePicker.vue';

vi.mock('dashboard/api/messengerTemplates');

const download = vi.fn();
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
  messages: [{ sender: 'outgoing', text: 'Hi {{contact.name}}', time: '' }],
};
const serverVariables = [
  {
    key: 'contact.name',
    label_key: 'MESSENGER_TEMPLATES.VARIABLES.LABELS.CONTACT_NAME',
    group: 'contact',
    sample: 'Alex Morgan',
  },
  {
    key: 'contact.phone',
    label_key: 'MESSENGER_TEMPLATES.VARIABLES.LABELS.CONTACT_PHONE',
    group: 'contact',
    sample: '+1 202-555-0123',
  },
  {
    key: 'agent.name',
    label_key: 'MESSENGER_TEMPLATES.VARIABLES.LABELS.AGENT_NAME',
    group: 'agent',
    sample: 'Jamie Lee',
  },
];
const attributes = [
  {
    attribute_model: 'contact_attribute',
    attribute_key: 'plan',
    attribute_display_name: 'Plan',
    attribute_display_type: 'text',
    attribute_description: 'Subscription plan',
  },
  { attribute_model: 'conversation_attribute', attribute_key: 'priority' },
];
const store = createStore({
  getters: {
    'attributes/getAttributes': () => attributes,
    getCurrentUser: () => ({ name: 'Jamie Lee', email: 'jamie@example.com' }),
    'accounts/isRTL': () => false,
  },
});
const mountEditor = (initialDefinition = definition) =>
  mount(Editor, {
    props: { accountId: 1, initialDefinition },
    global: {
      plugins: [store],
      stubs: {
        MessengerScreenshotRenderer: Renderer,
        MessengerSimulatorPreview: true,
        CaretAnchoredPicker: true,
        PreviewPicker: true,
      },
    },
  });
const openPicker = async wrapper => {
  await wrapper
    .findAll('button')
    .find(button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.BUTTON')
    .trigger('click');
  return wrapper.findComponent(VariablePicker);
};

beforeEach(() => {
  api.listMessengerTemplateVariables.mockResolvedValue({
    data: serverVariables,
  });
});

it('inserts variables at the selection and restores the cursor without overwriting the rest', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  const input = wrapper.find('textarea');
  await input.setValue('Before replace after');
  input.element.setSelectionRange(7, 14);
  const picker = await openPicker(wrapper);
  picker.vm.$emit('insert', '{{contact.name}}');
  await flushPromises();
  expect(input.element.value).toBe('Before {{contact.name}} after');
  expect(input.element.selectionStart).toBe(23);
  expect(wrapper.findComponent(VariablePicker).exists()).toBe(false);
  expect(wrapper.vm.getDefinition().messages[1].text).toBe(
    'Before {{contact.name}} after'
  );
  wrapper.unmount();
});

it('keeps raw definitions while the preview and download receive only sample replacements', async () => {
  download.mockResolvedValue(1);
  const wrapper = mountEditor();
  await flushPromises();
  expect(wrapper.findComponent(Preview).props('messages')[0].text).toBe(
    'Hi MESSENGER_SIMULATOR.EXAMPLE_INCOMING_NAME'
  );
  await wrapper
    .findAll('button')
    .find(
      button =>
        button.text() === 'MESSENGER_SIMULATOR.TEMPLATES.DOWNLOAD_SAMPLE'
    )
    .trigger('click');
  await flushPromises();
  expect(download.mock.calls[0][0].messages[0].text).toBe(
    'Hi MESSENGER_SIMULATOR.EXAMPLE_INCOMING_NAME'
  );
  expect(wrapper.vm.getDefinition()).toEqual(definition);
  wrapper.unmount();
});

it('does not insert a token beyond the message limit', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  const input = wrapper.find('textarea');
  await input.setValue('x'.repeat(495));
  input.element.setSelectionRange(495, 495);
  const picker = await openPicker(wrapper);
  picker.vm.$emit('insert', '{{contact.phone}}');
  await flushPromises();
  expect(input.element.value).toHaveLength(495);
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_LIMIT'
  );
  wrapper.unmount();
});

it('offers the server catalog and the account contact attributes, grouped', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  const picker = await openPicker(wrapper);
  expect(picker.props('entries').map(entry => entry.key)).toEqual([
    'contact.name',
    'contact.phone',
    'contact.custom_attribute.plan',
    'agent.name',
  ]);
  expect(api.listMessengerTemplateVariables).toHaveBeenCalledWith(1);
  wrapper.unmount();
});

it('resolves sample custom attributes and the current agent in the preview', async () => {
  const wrapper = mountEditor({
    ...definition,
    messages: [
      {
        sender: 'outgoing',
        text: 'Hi {{contact.name}} · {{contact.custom_attribute.plan}} · {{ agent.first_name }}',
        time: '',
      },
    ],
  });
  await flushPromises();
  expect(wrapper.findComponent(Preview).props('messages')[0].text).toBe(
    'Hi MESSENGER_SIMULATOR.EXAMPLE_INCOMING_NAME · MESSENGER_TEMPLATES.VARIABLES.SAMPLES.TEXT · Jamie'
  );
  wrapper.unmount();
});

it('blocks saving and names the exact unknown token', async () => {
  const wrapper = mountEditor();
  await flushPromises();
  await wrapper.find('textarea').setValue('Upgrade to {{ contact.plan }}');
  expect(wrapper.vm.getValidationErrors()).toEqual(['{{ contact.plan }}']);
  expect(wrapper.vm.getDefinition()).toBeNull();
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'MESSENGER_TEMPLATES.VARIABLES.UNKNOWN'
  );
  wrapper.unmount();
});

it('reuses the catalog the store already holds instead of fetching again', async () => {
  const storeWithVariables = createStore({
    getters: {
      'attributes/getAttributes': () => attributes,
      getCurrentUser: () => ({ name: 'Jamie Lee', email: 'jamie@example.com' }),
      'accounts/isRTL': () => false,
      'messengerTemplates/getVariables': () => serverVariables,
    },
  });
  const wrapper = mount(Editor, {
    props: { accountId: 1, initialDefinition: definition },
    global: {
      plugins: [storeWithVariables],
      stubs: {
        MessengerScreenshotRenderer: Renderer,
        MessengerSimulatorPreview: true,
        CaretAnchoredPicker: true,
        PreviewPicker: true,
      },
    },
  });
  await flushPromises();
  expect(api.listMessengerTemplateVariables).not.toHaveBeenCalled();
  const picker = await openPicker(wrapper);
  expect(picker.props('entries').map(entry => entry.key)).toContain(
    'contact.custom_attribute.plan'
  );
  wrapper.unmount();
});

it('does not mirror the allowlist when the catalog request fails', async () => {
  api.listMessengerTemplateVariables.mockRejectedValue(new Error('offline'));
  const wrapper = mountEditor();
  await flushPromises();
  await wrapper.find('textarea').setValue('Upgrade to {{ contact.plan }}');
  expect(wrapper.vm.getValidationErrors()).toEqual([]);
  expect(wrapper.vm.getDefinition()).not.toBeNull();
  wrapper.unmount();
});

it('lists variables with their token, label and sample in the picker', () => {
  const wrapper = mount(VariablePicker, {
    props: {
      caretPosition: { top: 0, height: 16 },
      entries: [
        {
          key: 'contact.name',
          group: 'contact',
          labelKey: 'MESSENGER_TEMPLATES.VARIABLES.LABELS.CONTACT_NAME',
          label: '',
          description: '',
          sample: 'Alex Morgan',
        },
        {
          key: 'contact.custom_attribute.plan',
          group: 'custom_attribute',
          labelKey: '',
          label: 'Plan',
          description: 'Subscription plan',
          sample: 'Premium',
        },
      ],
    },
    global: {
      plugins: [store],
      stubs: { CaretAnchoredPicker: true, PreviewPicker: true },
    },
  });
  const items = wrapper.findComponent(CaretAnchoredPicker).props('items');
  expect(items).toEqual([
    expect.objectContaining({
      key: 'contact.name',
      token: '{{contact.name}}',
      title: 'MESSENGER_TEMPLATES.VARIABLES.LABELS.CONTACT_NAME',
      subtitle: '{{contact.name}}',
      group: 'MESSENGER_TEMPLATES.VARIABLES.GROUPS.CONTACT',
      sample: 'Alex Morgan',
    }),
    expect.objectContaining({
      key: 'contact.custom_attribute.plan',
      title: 'Plan',
      group: 'MESSENGER_TEMPLATES.VARIABLES.GROUPS.CUSTOM_ATTRIBUTES',
      sample: 'Premium',
    }),
  ]);
  wrapper.unmount();
});

// The picker renders the manual-variable row through the `filters` slot of the shared
// card, so the stub has to render slots for it to exist at all.
const SlottedPicker = {
  name: 'CaretAnchoredPicker',
  props: ['items'],
  template: '<div><slot name="filters" /></div>',
};

const mountPickerWithFilters = () =>
  mount(VariablePicker, {
    props: { caretPosition: { top: 0, height: 16 }, entries: [] },
    global: {
      plugins: [store],
      stubs: { CaretAnchoredPicker: SlottedPicker },
    },
  });

it('inserts a manual token from the name an admin types', async () => {
  const wrapper = mountPickerWithFilters();
  const field = wrapper.find('#messenger-manual-variable');
  const add = () =>
    wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.MANUAL.ADD'
      );
  expect(add().attributes('disabled')).toBeDefined();

  await field.setValue('Fecha de la Cita');
  expect(add().attributes('disabled')).toBeUndefined();
  await add().trigger('click');

  expect(wrapper.emitted('insert')).toEqual([['{{manual.fecha_de_la_cita}}']]);
  expect(field.element.value).toBe('');
  wrapper.unmount();
});

it('keeps the add button disabled and explains a name with nothing to slugify', async () => {
  const wrapper = mountPickerWithFilters();
  await wrapper.find('#messenger-manual-variable').setValue('¿?');
  expect(wrapper.find('#messenger-manual-variable-hint').text()).toBe(
    'MESSENGER_TEMPLATES.VARIABLES.MANUAL.INVALID'
  );
  expect(
    wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.VARIABLES.MANUAL.ADD'
      )
      .attributes('disabled')
  ).toBeDefined();
  expect(wrapper.emitted('insert')).toBeUndefined();
  wrapper.unmount();
});

it('inserts a manual token on enter and keeps the picker keys to itself', async () => {
  const wrapper = mountPickerWithFilters();
  const field = wrapper.find('#messenger-manual-variable');
  await field.setValue('Valor');
  await field.trigger('keydown', { key: 'Enter' });
  expect(wrapper.emitted('insert')).toEqual([['{{manual.valor}}']]);

  await field.trigger('keydown', { key: 'Escape' });
  expect(wrapper.emitted('close')).toHaveLength(1);
  wrapper.unmount();
});

it('lists manual variables last and previews them with their humanized label', async () => {
  const wrapper = mountEditor({
    ...definition,
    business_name: '{{manual.clinica}}',
    messages: [
      {
        sender: 'outgoing',
        text: 'Tu cita es el {{manual.fecha_cita}}',
        time: '',
      },
    ],
  });
  await flushPromises();
  const picker = await openPicker(wrapper);
  expect(picker.props('entries').map(entry => entry.key)).toEqual([
    'contact.name',
    'contact.phone',
    'contact.custom_attribute.plan',
    'agent.name',
    'manual.clinica',
    'manual.fecha_cita',
  ]);
  expect(wrapper.vm.getValidationErrors()).toEqual([]);
  expect(
    wrapper.findComponent(Preview).props('participants').outgoing.name
  ).toBe('MESSENGER_TEMPLATES.VARIABLES.SAMPLES.MANUAL');
  expect(wrapper.vm.getDefinition().messages[0].text).toBe(
    'Tu cita es el {{manual.fecha_cita}}'
  );
  wrapper.unmount();
});
