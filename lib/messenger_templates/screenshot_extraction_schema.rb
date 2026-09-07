# Structured output contract for MessengerTemplates::ScreenshotExtractionService.
# `messages` mirrors the v1 template definition one to one so the service only has to clamp
# it to the model limits; `variables` is advisory, the dashboard decides what to apply.
class MessengerTemplates::ScreenshotExtractionSchema < RubyLLM::Schema
  BUSINESS_NAME_DESCRIPTION = 'Name shown in the conversation header. Fall back to the name of the business sending the ' \
                              'outgoing bubbles, and to an empty string when neither is legible.'.freeze
  MESSAGES_DESCRIPTION = 'Every bubble in the screenshot, in reading order, at most 30.'.freeze
  SENDER_DESCRIPTION = 'incoming for the customer (left side, grey bubble), outgoing for the business (right side, blue bubble).'.freeze
  TEXT_DESCRIPTION = 'Bubble text copied verbatim: same wording, punctuation, emojis and line breaks.'.freeze
  TIME_DESCRIPTION = 'Date or time separator printed above this bubble, copied verbatim. Null when no separator precedes it.'.freeze
  VARIABLES_DESCRIPTION = 'Values worth turning into template variables. Empty when the conversation has none.'.freeze
  KIND_DESCRIPTION = 'dynamic for contact or agent data the platform already knows, manual for anything the agent types per export.'.freeze
  KEY_DESCRIPTION = 'One of the allowed dynamic keys, or manual.<snake_case_slug> for a manual value.'.freeze
  ORIGINAL_TEXT_DESCRIPTION = 'Exact substring to replace, as it appears in a message text or in the business name.'.freeze
  LABEL_DESCRIPTION = 'Short Spanish label for the value, e.g. "Fecha de la cita".'.freeze
  REASON_DESCRIPTION = 'One short Spanish sentence explaining why this value changes between conversations.'.freeze

  string :business_name, description: BUSINESS_NAME_DESCRIPTION, max_length: 60

  array :messages, description: MESSAGES_DESCRIPTION do
    object do
      string :sender, description: SENDER_DESCRIPTION, enum: %w[incoming outgoing]
      string :text, description: TEXT_DESCRIPTION, max_length: 500
      optional :time, description: TIME_DESCRIPTION do
        string max_length: 30
      end
    end
  end

  array :variables, description: VARIABLES_DESCRIPTION do
    object do
      string :kind, description: KIND_DESCRIPTION, enum: %w[dynamic manual]
      string :key, description: KEY_DESCRIPTION
      string :original_text, description: ORIGINAL_TEXT_DESCRIPTION, max_length: 500
      string :label, description: LABEL_DESCRIPTION, max_length: 60
      string :reason, description: REASON_DESCRIPTION, max_length: 200
    end
  end
end
