class Evolution::SendOnEvolutionService
  pattr_initialize [:message!]

  def perform
    return unless evolution_channel?
    return unless message.outgoing?

    send_message
  rescue StandardError => e
    Rails.logger.error("Evolution send message error: #{e.message}")
    message.update!(status: :failed)
    ChatwootExceptionTracker.new(e).capture_exception
  end

  private

  def channel
    @channel ||= message.conversation.inbox.channel
  end

  def evolution_channel?
    channel.is_a?(Channel::Api) &&
      channel.additional_attributes&.dig('provider') == 'evolution'
  end

  def instance_name
    channel.additional_attributes&.dig('evolution_instance')
  end

  def api_client
    @api_client ||= Evolution::ApiClient.new
  end

  def recipient_phone
    contact = message.conversation.contact
    contact.phone_number&.gsub(/[^\d]/, '')
  end

  def send_message
    return unless instance_name && recipient_phone

    if message.attachments.any?
      send_media_message
    else
      send_text_message
    end

    message.update!(status: :sent)
  end

  def send_text_message
    api_client.send_text(
      instance_name: instance_name,
      number: recipient_phone,
      text: message.content
    )
  end

  def send_media_message
    attachment = message.attachments.first

    api_client.send_media(
      instance_name: instance_name,
      number: recipient_phone,
      media_type: detect_media_type(attachment),
      media_url: attachment.file_url,
      caption: message.content.presence || '',
      filename: attachment.file.filename.to_s
    )
  end

  def detect_media_type(attachment)
    content_type = attachment.file.content_type.to_s

    case content_type
    when %r{^image/}
      'image'
    when %r{^video/}
      'video'
    when %r{^audio/}
      'audio'
    else
      'document'
    end
  end
end
