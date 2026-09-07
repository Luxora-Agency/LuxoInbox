import { flushPromises, mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import MessengerManualVariablesModal from '../MessengerManualVariablesModal.vue';

const store = createStore({ getters: { 'accounts/isRTL': () => false } });

// jsdom ships `<dialog>` without the modal methods, and the shared Dialog opens through
// them. Closing here only flips the attribute: dispatching `close` would re-enter the
// component's own close handler.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close() {
    this.open = false;
  };
});

// The dialog teleports to the body, so assertions read the document instead of the
// wrapper, the way an agent sees it on screen.
const mountModal = (slugs = ['fecha_cita', 'valor']) =>
  mount(MessengerManualVariablesModal, {
    props: { slugs },
    attachTo: document.body,
    global: { plugins: [store] },
  });

const fieldFor = slug =>
  document.querySelector(`#messenger-manual-value-${slug}`);

const clickLabel = async label => {
  const button = Array.from(document.querySelectorAll('button')).find(
    element => element.textContent.trim() === label
  );
  button.click();
  await flushPromises();
};

it('labels one field per slug and reports the typed values on continue', async () => {
  const wrapper = mountModal();
  wrapper.vm.open();
  await flushPromises();

  expect(
    Array.from(document.querySelectorAll('label')).map(label =>
      label.textContent.trim()
    )
  ).toEqual(['Fecha cita', 'Valor']);

  fieldFor('fecha_cita').value = '14 de marzo';
  fieldFor('fecha_cita').dispatchEvent(new Event('input'));
  await flushPromises();
  await clickLabel('MESSENGER_TEMPLATES.MANUAL_MODAL.CONTINUE');

  expect(wrapper.emitted('confirm')).toEqual([
    [{ fecha_cita: '14 de marzo', valor: '' }],
  ]);
  expect(wrapper.emitted('cancel')).toBeUndefined();
  wrapper.unmount();
});

it('reports a cancellation only when the agent closes the dialog', async () => {
  const wrapper = mountModal(['fecha_cita']);
  wrapper.vm.open();
  await flushPromises();
  await clickLabel('MESSENGER_TEMPLATES.MANUAL_MODAL.CANCEL');

  expect(wrapper.emitted('cancel')).toHaveLength(1);
  expect(wrapper.emitted('confirm')).toBeUndefined();
  wrapper.unmount();
});

it('clears the previous answers when it is reopened', async () => {
  const wrapper = mountModal(['fecha_cita']);
  wrapper.vm.open();
  await flushPromises();
  fieldFor('fecha_cita').value = 'primera';
  fieldFor('fecha_cita').dispatchEvent(new Event('input'));
  await flushPromises();
  await clickLabel('MESSENGER_TEMPLATES.MANUAL_MODAL.CONTINUE');

  wrapper.vm.open();
  await flushPromises();
  expect(fieldFor('fecha_cita').value).toBe('');
  wrapper.unmount();
});
