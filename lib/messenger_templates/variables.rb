# Single source of truth for the tokens a Messenger template may contain.
# The model validates against it and the dashboard reads the same list through
# GET /api/v1/accounts/:account_id/messenger_templates/variables, so the allowlist
# never drifts between client and server. Custom attribute keys are validated by
# shape only: no database lookup happens during record validation.
module MessengerTemplates::Variables
  CONTACT_PREFIX = 'contact.'.freeze
  AGENT_PREFIX = 'agent.'.freeze
  CUSTOM_ATTRIBUTE_PREFIX = 'contact.custom_attribute.'.freeze
  # Dashboard i18n paths each catalog entry is rendered with: `t(entry.label_key)` and
  # `t(entry.sample_key)`, so labels and placeholder values follow the dashboard locale.
  LABEL_KEY_PREFIX = 'MESSENGER_TEMPLATES.VARIABLES.LABELS.'.freeze
  SAMPLE_KEY_PREFIX = 'MESSENGER_TEMPLATES.VARIABLES.SAMPLES.'.freeze

  STANDARD_CONTACT_KEYS = %w[name first_name last_name email phone phone_number identifier country_code city company_name].freeze
  AGENT_KEYS = %w[name first_name last_name email].freeze

  # Mirrors CustomAttributeDefinition#attribute_key so every attribute an account defines is usable.
  CUSTOM_ATTRIBUTE_KEY_FORMAT = /\A[\p{L}\p{N}_.\-]+\z/
  # Generic capture of `{{ namespace.path }}`, tolerating inner spaces. Whether the captured
  # key is usable is decided by `allowed?`, never by the pattern itself.
  # Exactly the code points JavaScript's `\s` matches, so a token pasted with a
  # non-breaking space or a BOM reads the same here as in the dashboard mirror.
  # `\p{Space}` would also take U+0085, which JavaScript does not.
  INNER_SPACE = /[\t\n\v\f\r \u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*/
  KEY_PATTERN = /\{\{#{INNER_SPACE.source}([a-z_]+(?:\.[\p{L}\p{N}_.\-]+)+)#{INNER_SPACE.source}\}\}/

  SAMPLES = {
    'contact.name' => 'Alex Morgan',
    'contact.first_name' => 'Alex',
    'contact.last_name' => 'Morgan',
    'contact.email' => 'alex.morgan@example.com',
    'contact.phone' => '+1 202-555-0123',
    'contact.phone_number' => '+1 202-555-0123',
    'contact.identifier' => 'CU-10482',
    'contact.country_code' => 'US',
    'contact.city' => 'Austin',
    'contact.company_name' => 'Acme Inc.',
    'agent.name' => 'Jordan Lee',
    'agent.first_name' => 'Jordan',
    'agent.last_name' => 'Lee',
    'agent.email' => 'jordan.lee@example.com'
  }.freeze

  module_function

  # Every `{{ … }}` token that is shaped like a variable, allowed or not.
  def extract_keys(text)
    text.to_s.scan(KEY_PATTERN).flatten
  end

  def allowed?(key)
    key = key.to_s
    return custom_attribute_key?(key.delete_prefix(CUSTOM_ATTRIBUTE_PREFIX)) if key.start_with?(CUSTOM_ATTRIBUTE_PREFIX)
    return STANDARD_CONTACT_KEYS.include?(key.delete_prefix(CONTACT_PREFIX)) if key.start_with?(CONTACT_PREFIX)
    return AGENT_KEYS.include?(key.delete_prefix(AGENT_PREFIX)) if key.start_with?(AGENT_PREFIX)

    false
  end

  def custom_attribute_key?(key)
    key.present? && key.match?(CUSTOM_ATTRIBUTE_KEY_FORMAT)
  end

  # Static half of the picker. Custom attributes are merged client side from the
  # account's own attribute definitions, so they stay out of this payload.
  def catalog
    STANDARD_CONTACT_KEYS.map { |key| entry("#{CONTACT_PREFIX}#{key}", 'contact') } +
      AGENT_KEYS.map { |key| entry("#{AGENT_PREFIX}#{key}", 'agent') }
  end

  def entry(key, group)
    suffix = key.tr('.', '_').upcase
    { key: key, label_key: "#{LABEL_KEY_PREFIX}#{suffix}", sample_key: "#{SAMPLE_KEY_PREFIX}#{suffix}",
      group: group, sample: SAMPLES[key].to_s }
  end
end
