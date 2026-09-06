import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent } from 'vue';
import Editor from '../MessengerSimulatorEditor.vue';
import Preview from '../MessengerSimulatorPreview.vue';

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
const mountEditor = () =>
  mount(Editor, {
    props: { accountId: 1, initialDefinition: definition },
    global: {
      stubs: {
        MessengerScreenshotRenderer: Renderer,
        MessengerSimulatorPreview: true,
      },
    },
  });
const variableButton = (wrapper, variable) =>
  wrapper
    .findAll('button')
    .find(
      button =>
        button.text() === `MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_${variable}`
    );

it('inserts variables at the selection and restores the cursor without overwriting the rest', async () => {
  const wrapper = mountEditor();
  const input = wrapper.find('textarea');
  await input.setValue('Before replace after');
  input.element.setSelectionRange(7, 14);
  await variableButton(wrapper, 'NAME').trigger('click');
  await flushPromises();
  expect(input.element.value).toBe('Before {{contact.name}} after');
  expect(input.element.selectionStart).toBe(23);
  expect(wrapper.vm.getDefinition().messages[1].text).toBe(
    'Before {{contact.name}} after'
  );
  wrapper.unmount();
});

it('keeps raw definitions while the preview and download receive only sample replacements', async () => {
  download.mockResolvedValue(1);
  const wrapper = mountEditor();
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
  const input = wrapper.find('textarea');
  await input.setValue('x'.repeat(495));
  input.element.setSelectionRange(495, 495);
  await variableButton(wrapper, 'PHONE').trigger('click');
  expect(input.element.value).toHaveLength(495);
  expect(wrapper.find('[role="alert"]').text()).toBe(
    'MESSENGER_SIMULATOR.TEMPLATES.VARIABLE_LIMIT'
  );
  wrapper.unmount();
});
