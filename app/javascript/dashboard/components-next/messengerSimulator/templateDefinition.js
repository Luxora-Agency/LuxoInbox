// Mirrors the server contract in `app/models/messenger_template.rb`: a scope segment
// (`contact`, `agent`) followed by one or more dotted segments, tolerating inner spaces.
// Built fresh on every call so a shared `lastIndex` can never leak between callers.
const VARIABLE_SOURCE =
  '\\{\\{\\s*([a-z_]+(?:\\.[\\p{L}\\p{N}_.\\-]+)+)\\s*\\}\\}';

export const templateVariablePattern = () => new RegExp(VARIABLE_SOURCE, 'gu');

// `contact.custom_attribute.<key>` reads from the `custom_attribute` bag of the scope.
export const CUSTOM_ATTRIBUTE_SEGMENT = 'custom_attribute';

// i18n keys of the placeholder value shown for a custom attribute, by
// `attribute_display_type`. Static keys carry their sample from the server catalog.
export const CUSTOM_ATTRIBUTE_SAMPLE_KEYS = {
  text: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.TEXT',
  number: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.NUMBER',
  currency: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.CURRENCY',
  date: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.DATE',
  list: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.LIST',
  checkbox: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.CHECKBOX',
  link: 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.LINK',
};

const SAMPLE_FALLBACK_KEY = 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.FALLBACK';

const GROUP_ORDER = ['contact', CUSTOM_ATTRIBUTE_SEGMENT, 'agent'];

const groupWeight = group => {
  const index = GROUP_ORDER.indexOf(group);
  return index === -1 ? GROUP_ORDER.length : index;
};

const toText = value =>
  value === null || value === undefined ? '' : `${value}`;

// Unknown scopes, unknown fields and missing values all resolve to an empty string.
const readVariable = (key, context) => {
  const [scope, ...path] = key.split('.');
  const source = context?.[scope];
  if (!source || !path.length) return '';
  if (path[0] === CUSTOM_ATTRIBUTE_SEGMENT) {
    return toText(source[CUSTOM_ATTRIBUTE_SEGMENT]?.[path.slice(1).join('.')]);
  }
  if (path.length > 1) return '';
  const [field] = path;
  // `phone` and `phone_number` are aliases so stored templates keep resolving.
  if (field === 'phone' || field === 'phone_number') {
    return toText(source.phone ?? source.phone_number);
  }
  return toText(source[field]);
};

/**
 * Resolves a stored definition against a context.
 *
 * @param {Object} definition v1 definition `{version, business_name, avatar, messages}`.
 * @param {Object} context `{ contact: {…fields, custom_attribute}, agent: {…fields} }`.
 * @returns {Object} the renderer input `{participants, messages}`.
 */
// Literal, single-pass replacement: resolved values are never scanned again.
export const resolveMessengerTemplate = (definition, context) => {
  const pattern = templateVariablePattern();
  const replace = text =>
    text.replace(pattern, (_, key) => readVariable(key, context));
  const contact = context?.contact || {};
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

/**
 * Mirror of the server rejection rule: reports every `{{…}}` token whose key is not
 * in the catalog, using the exact text the author typed.
 *
 * @param {string} text text to scan.
 * @param {string[]} allowedKeys keys the catalog exposes.
 * @returns {string[]} unique unknown tokens, in the order they appear.
 */
export const validateTemplateVariables = (text, allowedKeys) => {
  const allowed = new Set(allowedKeys);
  return Array.from(`${text}`.matchAll(templateVariablePattern()))
    .filter(match => !allowed.has(match[1]))
    .map(match => match[0])
    .filter((token, index, tokens) => tokens.indexOf(token) === index);
};

/**
 * Merges the server catalog with the account's contact attribute definitions.
 * The static keys stay server-owned so the allowlist is never duplicated here.
 *
 * @param {Array} serverCatalog `[{key, label_key, group, sample}]`.
 * @param {Array} customAttributeDefinitions `attributes/getAttributes` records.
 * @param {Function} translate resolves the i18n key of a custom attribute sample.
 * @returns {Array} `[{key, group, labelKey, label, description, sample}]`.
 */
export const buildVariableCatalog = (
  serverCatalog,
  customAttributeDefinitions,
  translate = key => key
) => {
  const standard = (serverCatalog || []).map(entry => ({
    key: entry.key,
    group: entry.group || entry.key.split('.')[0],
    labelKey: entry.label_key || '',
    label: '',
    description: '',
    sample: entry.sample || '',
  }));
  const custom = (customAttributeDefinitions || [])
    .filter(attribute => attribute.attribute_model === 'contact_attribute')
    .map(attribute => ({
      key: `contact.${CUSTOM_ATTRIBUTE_SEGMENT}.${attribute.attribute_key}`,
      group: CUSTOM_ATTRIBUTE_SEGMENT,
      labelKey: '',
      label: attribute.attribute_display_name || attribute.attribute_key,
      description: attribute.attribute_description || '',
      sample: translate(
        CUSTOM_ATTRIBUTE_SAMPLE_KEYS[attribute.attribute_display_type] ||
          SAMPLE_FALLBACK_KEY
      ),
    }));
  return [...standard, ...custom].sort(
    (left, right) => groupWeight(left.group) - groupWeight(right.group)
  );
};

/**
 * Sample `contact` scope for the authoring preview, custom attributes included.
 *
 * @param {Array} catalog output of `buildVariableCatalog`.
 * @returns {Object} `{…fields, custom_attribute}` of placeholder values.
 */
export const buildSampleContact = catalog => {
  const contact = { [CUSTOM_ATTRIBUTE_SEGMENT]: {} };
  (catalog || []).forEach(({ key, sample }) => {
    const [scope, ...path] = key.split('.');
    if (scope !== 'contact' || !path.length) return;
    if (path[0] === CUSTOM_ATTRIBUTE_SEGMENT) {
      contact[CUSTOM_ATTRIBUTE_SEGMENT][path.slice(1).join('.')] = sample;
    } else if (path.length === 1) {
      contact[path[0]] = sample;
    }
  });
  return contact;
};

/**
 * `agent` scope for a dashboard user. Names are split but never re-cased: the export
 * shows the agent's own display name.
 *
 * @param {Object} user `getCurrentUser` (or the assignee) record.
 * @returns {Object} `{name, first_name, last_name, email}`.
 */
export const buildAgentContext = user => {
  const names = `${user?.name || ''}`.split(/\s+/).filter(Boolean);
  return {
    name: names.join(' '),
    first_name: names[0] || '',
    last_name: names.length > 1 ? names[names.length - 1] : '',
    email: user?.email || '',
  };
};
