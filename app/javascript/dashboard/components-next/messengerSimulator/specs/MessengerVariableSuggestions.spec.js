import { mount } from '@vue/test-utils';
import MessengerVariableSuggestions from '../MessengerVariableSuggestions.vue';

const definition = {
  version: 1,
  business_name: 'Clínica Luxora',
  avatar: 'contact',
  messages: [
    {
      sender: 'outgoing',
      text: 'Hola Dana, tu cita es el 14/03.',
      time: '',
    },
  ],
};

const suggestions = [
  {
    kind: 'dynamic',
    key: 'contact.first_name',
    original_text: 'Dana',
    label: 'Nombre del contacto',
    reason: 'Cambia con cada cliente',
  },
  {
    kind: 'manual',
    key: 'manual.fecha_cita',
    original_text: '14/03',
    label: 'Fecha de la cita',
    reason: 'La escribe el agente',
  },
];

const mountSuggestions = (rows = suggestions) =>
  mount(MessengerVariableSuggestions, {
    props: { suggestions: rows, definition },
  });

const clickLabel = (wrapper, label) =>
  wrapper
    .findAll('button')
    .find(button => button.text() === label)
    .trigger('click');

it('preselects dynamic keys and leaves manual ones opt-in', () => {
  const wrapper = mountSuggestions();
  const boxes = wrapper.findAll('input[type="checkbox"]');
  expect(boxes.map(box => box.element.checked)).toEqual([true, false]);
  expect(wrapper.text()).toContain('Nombre del contacto');
  expect(wrapper.text()).toContain('{{manual.fecha_cita}}');
  wrapper.unmount();
});

it('replaces only the selected values and keeps the definition keys', async () => {
  const wrapper = mountSuggestions();
  await wrapper.findAll('input[type="checkbox"]')[1].setValue(true);
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY');

  const [applied] = wrapper.emitted('apply')[0];
  expect(Object.keys(applied)).toEqual([
    'version',
    'business_name',
    'avatar',
    'messages',
  ]);
  expect(applied.messages[0].text).toBe(
    'Hola {{contact.first_name}}, tu cita es el {{manual.fecha_cita}}.'
  );
  wrapper.unmount();
});

it('leaves an unchecked suggestion out of the applied definition', async () => {
  const wrapper = mountSuggestions();
  await wrapper.findAll('input[type="checkbox"]')[0].setValue(false);
  await wrapper.findAll('input[type="checkbox"]')[1].setValue(true);
  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY');

  expect(wrapper.emitted('apply')[0][0].messages[0].text).toBe(
    'Hola Dana, tu cita es el {{manual.fecha_cita}}.'
  );
  wrapper.unmount();
});

it('disables applying when nothing is selected and reports a skip', async () => {
  const wrapper = mountSuggestions();
  await wrapper.findAll('input[type="checkbox"]')[0].setValue(false);
  expect(
    wrapper
      .findAll('button')
      .find(
        button => button.text() === 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.APPLY'
      )
      .attributes('disabled')
  ).toBeDefined();

  await clickLabel(wrapper, 'MESSENGER_TEMPLATES.AI.SUGGESTIONS.SKIP');
  expect(wrapper.emitted('skip')).toHaveLength(1);
  expect(wrapper.emitted('apply')).toBeUndefined();
  wrapper.unmount();
});

it('says so when the extraction found nothing worth a variable', () => {
  const wrapper = mountSuggestions([]);
  expect(wrapper.text()).toContain('MESSENGER_TEMPLATES.AI.SUGGESTIONS.EMPTY');
  expect(wrapper.findAll('button').map(button => button.text())).toEqual([
    'MESSENGER_TEMPLATES.AI.SUGGESTIONS.SKIP',
  ]);
  wrapper.unmount();
});
