class MessengerTemplate < ApplicationRecord
  DEFINITION_KEYS = %w[version business_name avatar messages].freeze
  MESSAGE_KEYS = %w[sender text time].freeze
  SENDERS = %w[incoming outgoing].freeze
  AVATARS = %w[contact none].freeze
  TITLE_LIMIT = 100
  BUSINESS_NAME_LIMIT = 60
  MESSAGES_LIMIT = 30
  MESSAGE_TEXT_LIMIT = 500
  MESSAGE_TIME_LIMIT = 30
  # Tokens are literal replacements, never Liquid or executable expressions.
  RESIDUAL_DELIMITERS = /\{\{|\}\}|\{%|%\}/

  belongs_to :account

  # The account's default script leads every list: settings, the simulator picker and the
  # conversation export chooser all read this order.
  scope :default_first, -> { order(is_default: :desc, title: :asc, id: :asc) }

  validates :title, presence: true, length: { maximum: TITLE_LIMIT }
  validate :unique_title_per_account
  validate :single_default_per_account
  validate :valid_definition

  private

  # Backed by the partial unique index on (account_id) WHERE is_default; the model check
  # turns the race the index catches into a readable error for everyone else.
  def single_default_per_account
    return unless is_default? && account_id.present?

    scope = self.class.where(account_id: account_id, is_default: true)
    scope = scope.where.not(id: id) if persisted?
    errors.add(:is_default, I18n.t('errors.messenger_template.is_default.taken')) if scope.exists?
  end

  # Model-level only: existing accounts may already hold duplicates, so no unique index backs this.
  def unique_title_per_account
    return if title.blank? || account_id.blank?

    scope = self.class.where(account_id: account_id).where('LOWER(title) = ?', title.downcase)
    scope = scope.where.not(id: id) if persisted?
    errors.add(:title, I18n.t('errors.messenger_template.title.taken')) if scope.exists?
  end

  def valid_definition
    return add_definition_error('invalid') unless definition_shape_valid?

    add_definition_error('invalid_avatar') unless AVATARS.include?(definition['avatar'])
    validate_business_name
    validate_messages
  end

  def definition_shape_valid?
    definition.is_a?(Hash) && definition.keys.sort == DEFINITION_KEYS.sort && definition['version'] == 1
  end

  def validate_business_name
    name = definition['business_name']
    return add_definition_error('business_name_blank') unless name.is_a?(String) && name.present?
    return add_definition_error('business_name_too_long', limit: BUSINESS_NAME_LIMIT) if name.length > BUSINESS_NAME_LIMIT

    validate_tokens(name)
  end

  def validate_messages
    messages = definition['messages']
    return add_definition_error('messages_missing') unless messages.is_a?(Array) && messages.any?
    return add_definition_error('messages_limit', limit: MESSAGES_LIMIT) if messages.length > MESSAGES_LIMIT

    messages.each_with_index { |message, index| validate_message(message, index + 1) }
  end

  def validate_message(message, position)
    return add_definition_error('message_invalid', position: position) unless message_shape_valid?(message)

    add_definition_error('invalid_sender', position: position) unless SENDERS.include?(message['sender'])
    validate_message_text(message['text'], position)
    validate_message_time(message['time'], position)
  end

  def message_shape_valid?(message)
    message.is_a?(Hash) && message.keys.sort == MESSAGE_KEYS.sort
  end

  def validate_message_text(text, position)
    return add_definition_error('message_blank', position: position) unless text.is_a?(String) && text.present?
    return add_definition_error('message_too_long', position: position, limit: MESSAGE_TEXT_LIMIT) if text.length > MESSAGE_TEXT_LIMIT

    validate_tokens(text)
  end

  def validate_message_time(time, position)
    return add_definition_error('invalid_time', position: position) unless time.is_a?(String) && time.length <= MESSAGE_TIME_LIMIT

    validate_tokens(time)
  end

  # One registry, one pass: unknown tokens are named, and anything still holding a
  # delimiter after the known token shapes are stripped is rejected outright.
  def validate_tokens(text)
    MessengerTemplates::Variables.extract_keys(text).each do |key|
      next if MessengerTemplates::Variables.allowed?(key)

      add_definition_error('unknown_variable', token: "{{#{key}}}")
    end
    return unless text.gsub(MessengerTemplates::Variables::KEY_PATTERN, '').match?(RESIDUAL_DELIMITERS)

    add_definition_error('expression_not_allowed')
  end

  def add_definition_error(key, **options)
    errors.add(:definition, I18n.t("errors.messenger_template.definition.#{key}", **options))
  end
end
