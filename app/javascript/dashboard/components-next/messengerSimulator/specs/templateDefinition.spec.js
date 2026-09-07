import {
  applySuggestionsToDefinition,
  buildAgentContext,
  buildSampleContact,
  buildSampleManual,
  buildVariableCatalog,
  humanizeManualKey,
  manualKeysIn,
  resolveMessengerTemplate,
  slugifyManualKey,
  validateTemplateVariables,
} from '../templateDefinition';

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

const context = {
  contact: {
    name: 'Taylor',
    phone: '+12025550123',
    avatar_data: 'data:image/png;base64,abc',
  },
};

it('resolves literal text and typed avatar without changing the script', () => {
  const original = JSON.stringify(definition);
  const result = resolveMessengerTemplate(definition, context);
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
    {
      contact: {
        name: '{{contact.phone}}',
        phone: 'literal',
        avatar_data: 'photo',
      },
    }
  );
  expect(result.messages[0].text).toBe('Hello {{contact.phone}}: literal');
  expect(result.participants.incoming.avatar).toBe('');
});

it('treats phone and phone_number as aliases in both directions', () => {
  const script = {
    ...definition,
    messages: [
      {
        sender: 'outgoing',
        text: '{{contact.phone}} {{contact.phone_number}}',
        time: '',
      },
    ],
  };
  expect(
    resolveMessengerTemplate(script, {
      contact: { name: 'Taylor', phone_number: '+12025550123' },
    }).messages[0].text
  ).toBe('+12025550123 +12025550123');
  expect(
    resolveMessengerTemplate(script, {
      contact: { name: 'Taylor', phone: '+12025550199' },
    }).messages[0].text
  ).toBe('+12025550199 +12025550199');
});

it('resolves custom attributes, the agent scope and inner spaces', () => {
  const result = resolveMessengerTemplate(
    {
      ...definition,
      business_name: '{{ agent.first_name }}',
      messages: [
        {
          sender: 'outgoing',
          text: '{{contact.custom_attribute.plan}} · {{ agent.email }}',
          time: '{{contact.city}}',
        },
      ],
    },
    {
      contact: {
        name: 'Taylor',
        city: 'Bogotá',
        custom_attribute: { plan: 'Premium' },
      },
      agent: buildAgentContext({
        name: 'Jamie Lee',
        email: 'jamie@example.com',
      }),
    }
  );
  expect(result.participants.outgoing.name).toBe('Jamie');
  expect(result.messages[0].text).toBe('Premium · jamie@example.com');
  expect(result.messages[0].time).toBe('Bogotá');
});

it('resolves unknown scopes, unknown fields and missing values to an empty string', () => {
  const result = resolveMessengerTemplate(
    {
      ...definition,
      business_name: 'x',
      messages: [
        {
          sender: 'outgoing',
          text: '[{{inbox.name}}][{{contact.nickname}}][{{contact.custom_attribute.plan}}][{{agent.name}}]',
          time: '',
        },
      ],
    },
    { contact: { name: 'Taylor' } }
  );
  expect(result.messages[0].text).toBe('[][][][]');
});

it('reports unknown variables with the exact token the author typed', () => {
  const allowed = ['contact.name', 'contact.custom_attribute.plan'];
  expect(
    validateTemplateVariables(
      'Hi {{contact.name}} on {{ contact.plan }} and {{agent.name}}',
      allowed
    )
  ).toEqual(['{{ contact.plan }}', '{{agent.name}}']);
  expect(
    validateTemplateVariables(
      '{{agent.name}} {{agent.name}} {{contact.custom_attribute.plan}}',
      allowed
    )
  ).toEqual(['{{agent.name}}']);
  expect(validateTemplateVariables('Nothing to replace', allowed)).toEqual([]);
});

it('accepts any well-formed custom attribute key, like the server does', () => {
  expect(
    validateTemplateVariables(
      '{{contact.custom_attribute.plan}} {{ contact.custom_attribute.fecha-alta }}',
      ['contact.name']
    )
  ).toEqual([]);
  expect(
    validateTemplateVariables('{{contact.custom_attribute.plan}}', [])
  ).toEqual([]);
});

// `MessengerTemplates::Variables::INNER_SPACE` enumerates exactly the code points
// JavaScript's `\s` matches, so a token pasted with a non-breaking space or a BOM is
// accepted here and stripped there instead of tripping `expression_not_allowed`.
it('tolerates the same unicode spacing the server pattern tolerates', () => {
  const allowed = ['contact.name'];
  expect(
    validateTemplateVariables('{{\u00A0contact.name\u00A0}}', allowed)
  ).toEqual([]);
  expect(
    validateTemplateVariables('{{\uFEFFcontact.name\u3000}}', allowed)
  ).toEqual([]);
  expect(
    validateTemplateVariables('{{\u00A0contact.plan\u00A0}}', allowed)
  ).toEqual(['{{\u00A0contact.plan\u00A0}}']);
  expect(
    resolveMessengerTemplate(
      {
        ...definition,
        business_name: 'Luxora',
        messages: [
          {
            sender: 'outgoing',
            text: '{{\u00A0contact.name\u00A0}}',
            time: '',
          },
        ],
      },
      context
    ).messages[0].text
  ).toBe('Taylor');
});

it('merges the server catalog with contact attributes into ordered groups', () => {
  const catalog = buildVariableCatalog(
    [
      {
        key: 'agent.name',
        label_key: 'AGENT_NAME',
        group: 'agent',
        sample: 'Jamie Lee',
      },
      {
        key: 'contact.name',
        label_key: 'CONTACT_NAME',
        group: 'contact',
        sample: 'Alex Morgan',
      },
    ],
    [
      {
        attribute_model: 'contact_attribute',
        attribute_key: 'plan',
        attribute_display_name: 'Plan',
        attribute_display_type: 'text',
        attribute_description: 'Subscription plan',
      },
      {
        attribute_model: 'contact_attribute',
        attribute_key: 'renews_on',
        attribute_display_name: 'Renews on',
        attribute_display_type: 'date',
      },
      { attribute_model: 'conversation_attribute', attribute_key: 'priority' },
    ]
  );
  expect(catalog.map(entry => entry.key)).toEqual([
    'contact.name',
    'contact.custom_attribute.plan',
    'contact.custom_attribute.renews_on',
    'agent.name',
  ]);
  expect(catalog[1]).toMatchObject({
    group: 'custom_attribute',
    label: 'Plan',
    description: 'Subscription plan',
    sample: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.TEXT',
  });
  expect(catalog[2].sample).toBe('MESSENGER_TEMPLATES.VARIABLES.SAMPLES.DATE');
  expect(buildSampleContact(catalog)).toEqual({
    name: 'Alex Morgan',
    custom_attribute: {
      plan: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.TEXT',
      renews_on: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.DATE',
    },
  });
});

it('falls back to a generic sample for display types without their own key', () => {
  const [entry] = buildVariableCatalog(
    [],
    [
      {
        attribute_model: 'contact_attribute',
        attribute_key: 'usage',
        attribute_display_name: 'Usage',
        attribute_display_type: 'percent',
      },
    ],
    key => `t:${key}`
  );
  expect(entry.sample).toBe('t:MESSENGER_TEMPLATES.VARIABLES.SAMPLES.FALLBACK');
});

it('splits a name like the server presenter and never re-cases it', () => {
  expect(
    buildAgentContext({ name: 'Ana de McDonald', email: 'a@b.co' })
  ).toEqual({
    name: 'Ana de McDonald',
    first_name: 'Ana',
    last_name: 'de McDonald',
    email: 'a@b.co',
  });
  expect(buildAgentContext(undefined)).toEqual({
    name: '',
    first_name: '',
    last_name: '',
    email: '',
  });
  // Nothing but the four catalog fields is carried over from the user record.
  expect(
    Object.keys(buildAgentContext({ name: 'Ana', access_token: 'secret' }))
  ).toEqual(['name', 'first_name', 'last_name', 'email']);
});

it('resolves the manual scope from the values typed at export time', () => {
  const script = {
    version: 1,
    business_name: '{{manual.clinica}}',
    avatar: 'none',
    messages: [
      {
        sender: 'outgoing',
        text: 'Cita el {{manual.fecha_cita}} por {{ manual.valor }}',
        time: '{{manual.hora}}',
      },
    ],
  };
  const result = resolveMessengerTemplate(script, {
    contact: { name: 'Taylor' },
    manual: { clinica: 'Luxora', fecha_cita: '14/03', valor: '$120.000' },
  });
  expect(result.participants.outgoing.name).toBe('Luxora');
  expect(result.messages[0].text).toBe('Cita el 14/03 por $120.000');
  expect(result.messages[0].time).toBe('');
});

it('keeps manual slugs literal instead of aliasing phone to phone_number', () => {
  const script = {
    version: 1,
    business_name: 'Luxora',
    avatar: 'none',
    messages: [
      {
        sender: 'outgoing',
        text: '{{manual.phone}} {{manual.phone_number}}',
        time: '',
      },
    ],
  };
  expect(
    resolveMessengerTemplate(script, { manual: { phone: '900' } }).messages[0]
      .text
  ).toBe('900 ');
});

it('accepts well-formed manual keys and reports malformed ones', () => {
  expect(
    validateTemplateVariables('{{manual.fecha_cita}} {{ manual.valor2 }}', [
      'contact.name',
    ])
  ).toEqual([]);
  // A slug the server would reject (uppercase, or over 40 characters) is still a
  // well-formed token, so the mirror names it instead of letting the save 422.
  expect(
    validateTemplateVariables('{{manual.FechaCita}} {{manual.con-guion}}', [
      'contact.name',
    ])
  ).toEqual(['{{manual.FechaCita}}', '{{manual.con-guion}}']);
});

it('lists the manual slugs of a definition once, in reading order', () => {
  expect(
    manualKeysIn({
      business_name: '{{manual.clinica}}',
      messages: [
        { text: 'Hola {{manual.fecha_cita}}', time: '{{manual.clinica}}' },
        { text: '{{contact.name}} {{manual.valor}}', time: '' },
      ],
    })
  ).toEqual(['clinica', 'fecha_cita', 'valor']);
  expect(manualKeysIn({ business_name: 'Luxora', messages: [] })).toEqual([]);
});

it('humanizes a slug and slugifies a name typed with accents', () => {
  expect(humanizeManualKey('fecha_cita')).toBe('Fecha cita');
  expect(humanizeManualKey('')).toBe('');
  expect(slugifyManualKey('Fecha de la Cita')).toBe('fecha_de_la_cita');
  expect(slugifyManualKey('  Día  ')).toBe('dia');
  expect(slugifyManualKey('¡!¿?')).toBe('');
  expect(slugifyManualKey('a'.repeat(60))).toHaveLength(40);
});

it('appends manual entries last and samples them with their label', () => {
  const catalog = buildVariableCatalog(
    [{ key: 'contact.name', group: 'contact', sample: 'Alex Morgan' }],
    [],
    (key, params) => `${key}:${params.label}`,
    ['fecha_cita']
  );
  expect(catalog.map(entry => entry.key)).toEqual([
    'contact.name',
    'manual.fecha_cita',
  ]);
  expect(catalog[1]).toMatchObject({
    group: 'manual',
    label: 'Fecha cita',
    sample: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.MANUAL:Fecha cita',
  });
  expect(buildSampleManual(catalog)).toEqual({
    fecha_cita: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.MANUAL:Fecha cita',
  });
});

it('replaces every occurrence of an accepted suggestion without adding keys', () => {
  const script = {
    version: 1,
    business_name: 'Clínica Luxora',
    avatar: 'contact',
    messages: [
      {
        sender: 'outgoing',
        text: 'Hola Dana, tu cita en Clínica Luxora es el 14/03.',
        time: '14/03',
      },
    ],
  };
  const applied = applySuggestionsToDefinition(script, [
    { key: 'contact.first_name', original_text: 'Dana' },
    { key: 'manual.fecha_cita', original_text: '14/03' },
    { key: 'manual.ignored', original_text: '' },
  ]);
  expect(Object.keys(applied)).toEqual([
    'version',
    'business_name',
    'avatar',
    'messages',
  ]);
  expect(Object.keys(applied.messages[0])).toEqual(['sender', 'text', 'time']);
  expect(applied.messages[0].text).toBe(
    'Hola {{contact.first_name}}, tu cita en Clínica Luxora es el {{manual.fecha_cita}}.'
  );
  expect(applied.messages[0].time).toBe('{{manual.fecha_cita}}');
  expect(script.messages[0].text).toBe(
    'Hola Dana, tu cita en Clínica Luxora es el 14/03.'
  );
});

it('never re-scans a token it just inserted', () => {
  const script = {
    version: 1,
    business_name: 'Tu name es Ana',
    avatar: 'contact',
    messages: [{ sender: 'incoming', text: 'Tu name es Ana', time: '' }],
  };
  const applied = applySuggestionsToDefinition(script, [
    { key: 'contact.name', original_text: 'Ana' },
    { key: 'manual.name', original_text: 'name' },
  ]);
  expect(applied.messages[0].text).toBe(
    'Tu {{manual.name}} es {{contact.name}}'
  );
});

it('prefers the longest original text when two suggestions overlap', () => {
  const script = {
    version: 1,
    business_name: 'Luxora',
    avatar: 'contact',
    messages: [
      { sender: 'incoming', text: 'Hola Ana Maria, soy Ana Maria', time: '' },
    ],
  };
  const applied = applySuggestionsToDefinition(script, [
    { key: 'contact.first_name', original_text: 'Ana' },
    { key: 'contact.name', original_text: 'Ana Maria' },
  ]);
  expect(applied.messages[0].text).toBe(
    'Hola {{contact.name}}, soy {{contact.name}}'
  );
});

it('leaves an occurrence alone when its token would push the text past the limit', () => {
  const script = {
    version: 1,
    business_name: 'Luxora',
    avatar: 'contact',
    messages: [
      { sender: 'outgoing', text: `${'a'.repeat(495)} Ana`, time: '' },
    ],
  };
  const applied = applySuggestionsToDefinition(script, [
    { key: 'contact.name', original_text: 'Ana' },
  ]);
  expect(applied.messages[0].text).toBe(`${'a'.repeat(495)} Ana`);
  expect(applied.messages[0].text.length).toBeLessThanOrEqual(500);
});
