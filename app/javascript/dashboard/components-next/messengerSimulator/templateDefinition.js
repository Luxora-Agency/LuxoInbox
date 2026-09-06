export const TEMPLATE_VARIABLES = ['name', 'phone'];

// Literal, single-pass replacement: contact values are never evaluated again.
export const resolveMessengerTemplate = (definition, contact) => {
  const replace = text =>
    text.replace(
      /\{\{contact\.(name|phone)\}\}/g,
      (_, field) => contact[field] || ''
    );
  return {
    participants: {
      incoming: {
        name: contact.name || '',
        avatar:
          definition.avatar === 'contact' ? contact.avatar_data || '' : '',
      },
      outgoing: { name: replace(definition.business_name), avatar: '' },
    },
    messages: definition.messages.map((message, index) => ({
      ...message,
      id: index + 1,
      text: replace(message.text),
      time: replace(message.time),
    })),
  };
};
