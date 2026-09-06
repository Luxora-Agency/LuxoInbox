class MessengerTemplate < ApplicationRecord
  DEFINITION_KEYS = %w[version business_name avatar messages].freeze
  MESSAGE_KEYS = %w[sender text time].freeze
  SENDERS = %w[incoming outgoing].freeze
  VARIABLE_PATTERN = /\{\{contact\.(?:name|phone)\}\}/

  belongs_to :account

  validates :title, presence: true, length: { maximum: 100 }
  validate :valid_definition

  private

  def valid_definition
    valid = definition.is_a?(Hash) && definition.keys.sort == DEFINITION_KEYS.sort &&
            definition['version'] == 1 && %w[contact none].include?(definition['avatar']) &&
            valid_text?(definition['business_name'], 60) && valid_messages?
    errors.add(:definition, 'must be a valid Messenger template') unless valid
  end

  def valid_messages?
    messages = definition['messages']
    messages.is_a?(Array) && messages.length.between?(1, 30) && messages.all? { |message| valid_message?(message) }
  end

  def valid_message?(message)
    message.is_a?(Hash) && message.keys.sort == MESSAGE_KEYS.sort &&
      SENDERS.include?(message['sender']) &&
      valid_text?(message['text'], 500) && valid_text?(message['time'], 30, allow_blank: true)
  end

  def valid_text?(value, limit, allow_blank: false)
    return false unless value.is_a?(String) && value.length <= limit
    return false if !allow_blank && value.blank?

    # Tokens are literal replacements, never Liquid or executable expressions.
    !value.gsub(VARIABLE_PATTERN, '').match?(/\{\{|\}\}|\{%|%\}/)
  end
end
