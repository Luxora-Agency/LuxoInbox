import { resolveMessengerTemplate } from '../templateDefinition';

const definition = {
  version: 1,
  business_name: 'Support for {{contact.name}}',
  avatar: 'contact',
  messages: [
    {
      sender: 'outgoing',
      text: 'Hello {{contact.name}}: {{contact.phone}}',
      time: '{{contact.phone}}',
    },
  ],
};

it('resolves literal text and typed avatar without changing the script', () => {
  const original = JSON.stringify(definition);
  const result = resolveMessengerTemplate(definition, {
    name: 'Taylor',
    phone: '+12025550123',
    avatar_data: 'data:image/png;base64,abc',
  });
  expect(result.participants.incoming.avatar).toBe('data:image/png;base64,abc');
  expect(result.participants.outgoing.name).toBe('Support for Taylor');
  expect(result.messages[0]).toMatchObject({
    text: 'Hello Taylor: +12025550123',
    time: '+12025550123',
  });
  expect(JSON.stringify(definition)).toBe(original);
});

it('does not recursively interpret contact values or use an opted-out photo', () => {
  const result = resolveMessengerTemplate(
    { ...definition, avatar: 'none' },
    { name: '{{contact.phone}}', phone: 'literal', avatar_data: 'photo' }
  );
  expect(result.messages[0].text).toBe('Hello {{contact.phone}}: literal');
  expect(result.participants.incoming.avatar).toBe('');
});
