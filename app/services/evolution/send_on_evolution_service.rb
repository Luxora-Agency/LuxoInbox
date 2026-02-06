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

  def evolution_api_url
    channel.additional_attributes&.dig('evolution_api_url') || 'http://localhost:8080'
  end

  def api_key
    # Use configured API key or default
    ENV.fetch('EVOLUTION_API_KEY', '4GFRr4Sa57scLSatTYKKiCGbf3Tf4k7G')
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
    response = HTTParty.post(
      "#{evolution_api_url}/message/sendText/#{instance_name}",
      headers: {
        'apikey' => api_key,
        'Content-Type' => 'application/json'
      },
      body: {
        number: recipient_phone,
        text: message.content
      }.to_json
    )

    handle_response(response)
  end

  def send_media_message
    attachment = message.attachments.first
    media_type = detect_media_type(attachment)

    response = HTTParty.post(
      "#{evolution_api_url}/message/sendMedia/#{instance_name}",
      headers: {
        'apikey' => api_key,
        'Content-Type' => 'application/json'
      },
      body: {
        number: recipient_phone,
        mediatype: media_type,
        mimetype: attachment.file.content_type,
        caption: message.content.presence || '',
        media: attachment.file_url,
        fileName: attachment.file.filename.to_s
      }.to_json
    )

    handle_response(response)
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

  def handle_response(response)
    unless response.success?
      error_message = response.parsed_response['message'] || response.body
      Rails.logger.error("Evolution API error: #{error_message}")
      raise StandardError, error_message
    end

    response.parsed_response
  end
end
