class Evolution::MediaProcessor
  MEDIA_MESSAGE_TYPES = %i[
    audioMessage
    imageMessage
    videoMessage
    documentMessage
    stickerMessage
    documentWithCaptionMessage
    pttMessage
  ].freeze

  FILE_TYPE_MAP = {
    imageMessage: :image,
    stickerMessage: :image,
    audioMessage: :audio,
    pttMessage: :audio,
    videoMessage: :video
  }.freeze

  DEFAULT_MIMETYPES = {
    imageMessage: 'image/jpeg',
    stickerMessage: 'image/webp',
    audioMessage: 'audio/ogg',
    pttMessage: 'audio/ogg',
    videoMessage: 'video/mp4'
  }.freeze

  EXTENSION_MAP = {
    'image/jpeg' => '.jpg',
    'image/png' => '.png',
    'image/webp' => '.webp',
    'audio/ogg' => '.ogg',
    'audio/mpeg' => '.mp3',
    'audio/mp3' => '.mp3',
    'audio/mp4' => '.m4a',
    'audio/x-m4a' => '.m4a',
    'video/mp4' => '.mp4',
    'application/pdf' => '.pdf'
  }.freeze

  pattr_initialize [:inbox!, :message_data!, :message_payload!, :params!]

  def media_message_type
    @media_message_type ||= MEDIA_MESSAGE_TYPES.find { |type| message_payload[type].present? }
  end

  def media?
    media_message_type.present?
  end

  def caption
    media_payload&.dig(:caption)
  end

  def attach_to(message)
    base64_data = fetch_base64_media
    return if base64_data.blank?

    file_io = StringIO.new(Base64.decode64(base64_data))
    file_io.set_encoding(Encoding::BINARY)

    message.attachments.create!(
      account_id: message.account_id,
      file_type: file_type,
      file: { io: file_io, filename: filename, content_type: mimetype }
    )
  rescue StandardError => e
    Rails.logger.error("Evolution: failed to attach media for message #{message.id}: #{e.message}")
    ChatwootExceptionTracker.new(e).capture_exception
  end

  private

  def media_payload
    return @media_payload if defined?(@media_payload)

    @media_payload = if media_message_type == :documentWithCaptionMessage
                       message_payload.dig(:documentWithCaptionMessage, :message, :documentMessage)
                     else
                       message_payload[media_message_type]
                     end
  end

  def fetch_base64_media
    embedded_base64 || remote_base64
  end

  def embedded_base64
    message_payload[:base64] || media_payload&.dig(:base64) || params.dig(:data, :base64)
  end

  def remote_base64
    instance_name = inbox.channel.additional_attributes&.dig('evolution_instance')
    return unless instance_name

    response = Evolution::ApiClient.new.get_base64_from_media_message(
      instance_name: instance_name,
      message: { key: message_data[:key], message: message_payload }
    )
    return unless response.is_a?(Hash)

    response['base64'] || response[:base64]
  end

  def file_type
    FILE_TYPE_MAP[media_message_type] || :file
  end

  def mimetype
    media_payload&.dig(:mimetype)&.split(';')&.first&.strip.presence ||
      DEFAULT_MIMETYPES[media_message_type] ||
      'application/octet-stream'
  end

  def filename
    media_payload&.dig(:fileName).presence ||
      "#{media_message_type}_#{message_id || SecureRandom.hex(4)}#{EXTENSION_MAP.fetch(mimetype, '')}"
  end

  def message_id
    message_data.dig(:key, :id) || message_data[:id]
  end
end
