import { mount } from '@vue/test-utils';
import Preview from '../MessengerSimulatorPreview.vue';

// The exported PNG is this markup rasterised as-is: every class here is geometry
// or colour that Messenger screenshots depend on. Snapshots guard that contract.
const AVATAR = 'data:image/png;base64,iVBORw0KGgo=';
const participants = {
  incoming: { name: 'Alex Morgan', avatar: '' },
  outgoing: { name: 'Jamie Lee', avatar: '' },
};
const messages = [
  {
    id: 1,
    sender: 'incoming',
    text: 'Hi, is the order ready?',
    time: 'MON 09:41',
  },
  { id: 2, sender: 'outgoing', text: 'Yes Alex, it ships today.', time: '' },
];

const mountPreview = props =>
  mount(Preview, { props: { participants, messages, ...props } });

it('renders the Messenger conversation with the exported geometry', () => {
  const wrapper = mountPreview();

  expect(wrapper.html()).toMatchSnapshot();
  wrapper.unmount();
});

it('renders the contact photo instead of the placeholder avatar', () => {
  const wrapper = mountPreview({
    participants: {
      ...participants,
      incoming: { name: 'Alex Morgan', avatar: AVATAR },
    },
  });

  expect(wrapper.html()).toMatchSnapshot();
  expect(wrapper.findAll('img')).toHaveLength(2);
  wrapper.unmount();
});

it('renders the empty script placeholder', () => {
  const wrapper = mountPreview({ messages: [] });

  expect(wrapper.html()).toMatchSnapshot();
  wrapper.unmount();
});

it('keeps the fixed capture width and the Messenger palette', () => {
  const wrapper = mountPreview();
  const html = wrapper.html();

  expect(wrapper.element.className).toContain('w-[299px]');
  expect(html).toContain('bg-white');
  ['#f1f2f6', '#050505', '#65676b', '#e5e6eb', '#8a8d91', '#0084ff'].forEach(
    color => expect(html).toContain(color)
  );
  wrapper.unmount();
});
