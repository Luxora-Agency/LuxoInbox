# Reads a Messenger screenshot and returns a v1 template definition plus variable suggestions.
# It rides the Captain engine (Llm::FeatureRouter -> ruby_llm) so model routing, credentials,
# instrumentation and error shapes stay identical to every other LLM call in the product.
class MessengerTemplates::ScreenshotExtractionService < Captain::BaseTaskService
  FEATURE = 'messenger_template_extraction'.freeze
  RESPONSE_SCHEMA = MessengerTemplates::ScreenshotExtractionSchema
  SUGGESTION_LABEL_LIMIT = 60
  SUGGESTION_REASON_LIMIT = 200

  # `image` is the raw file body; `content_type` only names the attachment, ruby_llm reads the
  # real MIME type from the bytes.
  pattr_initialize [:account!, :image!, :content_type!]

  def perform
    response = make_api_call(feature: FEATURE, messages: messages, schema: RESPONSE_SCHEMA)
    # The request carries the screenshot, so only the two fields the caller needs travel back.
    return { error: response[:error], error_code: response[:error_code] } if response[:error]

    build_result(response)
  end

  private

  # ruby_llm keeps the raw string when the structured answer does not parse, and a model that
  # refuses or truncates returns no bubble at all. Both leave nothing to load, so they travel
  # back as a failure instead of a definition that would silently wipe the draft in the editor.
  def build_result(response)
    payload = response[:message].is_a?(Hash) ? response[:message].deep_symbolize_keys : {}
    definition = build_definition(payload)
    return { error: 'screenshot extraction returned no message', error_code: 502 } if definition['messages'].empty?

    { definition: definition, suggestions: build_suggestions(payload[:variables], definition), usage: response[:usage] }
  end

  def messages
    [
      { role: 'system', content: system_prompt },
      { role: 'user', content: user_content }
    ]
  end

  # `Chat#ask` forwards a RubyLLM::Content untouched, and the OpenAI provider renders a
  # non-URL attachment as `data:<mime>;base64,…`. That is the whole reason the base service
  # needs no change: an image reaches the model as the content of the last user message.
  def user_content
    RubyLLM::Content
      .new('Rebuild this Messenger conversation as a template and suggest the variables it should use.')
      .add_attachment(StringIO.new(image), filename: "screenshot.#{content_type.to_s.split('/').last}")
  end

  def system_prompt
    <<~PROMPT
      You reconstruct a Facebook Messenger conversation from a screenshot so it can be replayed as a template.

      Read the bubbles top to bottom and return them in that order.
      Bubbles on the left, in grey, are `incoming`: the customer wrote them.
      Bubbles on the right, in blue, are `outgoing`: the business wrote them.
      Copy every text verbatim, including emojis, punctuation, casing and line breaks. Never invent, merge,
      summarize or translate a message, and never add one that is not visible. Return at most 30 messages.
      A date or time separator printed between bubbles belongs in the `time` of the message right below it;
      every other message has `time` null. `business_name` is the name in the conversation header when it is
      visible, otherwise the name shown on the outgoing side, otherwise an empty string.

      Then suggest the values that should become variables.
      Use `dynamic` for a value the platform already knows about the customer or the agent, and pick its key
      from this list, which is the only one accepted:
      #{dynamic_key_reference}
      Use `manual` for a value that changes between conversations but is not customer or agent data — dates,
      times, prices, product names, appointment slots — with `key` set to manual.<slug>, where the slug is
      lowercase ASCII, digits and underscores only (up to 40 characters), and `label` a short Spanish name.
      `original_text` must be the exact substring as it appears in a message text or in the business name,
      never a paraphrase. `reason` is one short Spanish sentence.
      A phone number, an email or the customer's name always becomes a `dynamic` suggestion (contact.phone,
      contact.email, contact.first_name); dates, times, prices, product names and appointment slots always
      become `manual` suggestions. A manual `key` is the literal prefix `manual.` followed by the slug, for
      example manual.fecha_cita, never manual_fecha_cita. Return an empty list only when nothing varies
      between customers.
    PROMPT
  end

  def dynamic_key_reference
    <<~KEYS.strip
      - contact.name, contact.first_name, contact.last_name: the customer's full, given and family name
      - contact.email, contact.phone, contact.phone_number: the customer's email and phone number
      - contact.identifier: the customer's id in the business systems
      - contact.country_code, contact.city: where the customer is
      - contact.company_name: the company the customer belongs to
      - agent.name, agent.first_name, agent.last_name, agent.email: the support agent answering the conversation
    KEYS
  end

  def build_definition(payload)
    {
      'version' => 1,
      'business_name' => clamp(payload[:business_name], MessengerTemplate::BUSINESS_NAME_LIMIT),
      'avatar' => 'contact',
      'messages' => build_messages(payload[:messages])
    }
  end

  def build_messages(messages)
    Array(messages).filter_map { |message| build_message(message) }.first(MessengerTemplate::MESSAGES_LIMIT)
  end

  def build_message(message)
    return unless message.is_a?(Hash)

    sender = message[:sender].to_s
    text = clamp(message[:text], MessengerTemplate::MESSAGE_TEXT_LIMIT)
    return unless MessengerTemplate::SENDERS.include?(sender) && text.present?

    { 'sender' => sender, 'text' => text, 'time' => clamp(message[:time], MessengerTemplate::MESSAGE_TIME_LIMIT) }
  end

  # A suggestion is only useful if the dashboard can act on it: the token must be one the model
  # accepts and the text it replaces must still be in the definition after the clamping above.
  def build_suggestions(variables, definition)
    haystack = definition['messages'].pluck('text') << definition['business_name']
    Array(variables).filter_map { |variable| build_suggestion(variable, haystack) }
                    .uniq { |suggestion| [suggestion[:key], suggestion[:original_text]] }
  end

  def build_suggestion(variable, haystack)
    return unless variable.is_a?(Hash)

    key = normalize_key(variable[:key], variable[:kind])
    original_text = variable[:original_text].to_s
    return unless MessengerTemplates::Variables.allowed?(key)
    return if original_text.blank? || haystack.none? { |text| text.include?(original_text) }

    { kind: kind_for(key), key: key, original_text: original_text,
      label: clamp(variable[:label], SUGGESTION_LABEL_LIMIT), reason: clamp(variable[:reason], SUGGESTION_REASON_LIMIT) }
  end

  # The model sometimes writes `manual_fecha`, `manual.Fecha` or a bare slug for a manual value; the
  # registry only accepts `manual.<slug>`, so the prefix and slug are repaired before the key is checked.
  def normalize_key(raw_key, kind)
    key = raw_key.to_s.strip
    return key if MessengerTemplates::Variables.allowed?(key) || !(kind.to_s == 'manual' || key.match?(/\Amanual/i))

    slug = I18n.transliterate(key.sub(/\Amanual[._\s-]*/i, '')).downcase.gsub(/[^a-z0-9_]+/, '_').gsub(/\A_+|_+\z/, '')
    slug.present? ? "#{MessengerTemplates::Variables::MANUAL_PREFIX}#{slug.first(40)}" : key
  end

  # The prefix decides the kind: a mislabelled `kind` would preselect the wrong rows in the dashboard.
  def kind_for(key)
    key.start_with?(MessengerTemplates::Variables::MANUAL_PREFIX) ? 'manual' : 'dynamic'
  end

  def clamp(value, limit)
    value.to_s.strip.first(limit)
  end

  def event_name
    FEATURE
  end

  # Production accounts hold their own OpenAI key in an Integrations::Hook; the installation key
  # is the fallback.
  def use_account_openai_hook?
    true
  end

  # The library, not Captain, is the feature being used here.
  def captain_tasks_enabled?
    account.feature_enabled?('messenger_simulator')
  end

  # Building a template is an editor action, not a Captain response: it neither blocks on nor
  # decrements the captain_responses quota.
  def counts_toward_usage?
    false
  end

  def build_follow_up_context?
    false
  end
end
