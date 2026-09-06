class MessengerScreenshot::MessagePresenter
  def initialize(message)
    @message = message
  end

  def as_json
    {
      id: @message.id,
      direction: @message.incoming? ? 'incoming' : 'outgoing',
      text: message_text,
      created_at: @message.created_at.iso8601(6),
      status: @message.status,
      content_type: @message.content_type,
      message_type: @message.message_type,
      attachments: @message.attachments.map { |attachment| { type: attachment.file_type } }
    }
  end

  private

  def message_text
    return @message.content.to_s unless @message.incoming_email?

    email = @message.content_attributes['email'] || {}
    plain_text = email.dig('text_content', 'full')
    return plain_text if plain_text.present?

    html = email.dig('html_content', 'full').presence || @message.content.to_s
    html = html.gsub(/<br\s*\/?\s*>|<\/(?:p|div|li)>/i, "\n")
    CGI.unescapeHTML(ActionController::Base.helpers.strip_tags(html))
  end
end
