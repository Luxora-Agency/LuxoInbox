class Evolution::IncomingMessageService
  pattr_initialize [:inbox!, :params!]

  def perform
    return unless message_data

    set_contact
    set_conversation
    create_message
  end

  private

  # Evolution sends the message envelope in `data` (key, pushName, message,
  # messageTimestamp); `data.message` is only the content payload, which the
  # rest of this service reads through #message_payload.
  def message_data
    @message_data ||= params[:data]
  end

  def message_payload
    @message_payload ||= message_data[:message] || {}
  end

  def media_processor
    @media_processor ||= Evolution::MediaProcessor.new(
      inbox: inbox,
      message_data: message_data,
      message_payload: message_payload,
      params: params
    )
  end

  def sender_info
    @sender_info ||= begin
      remote_jid = message_data[:key]&.dig(:remoteJid) || message_data[:remoteJid]
      {
        phone_number: extract_phone_number(remote_jid),
        name: message_data[:pushName] || extract_phone_number(remote_jid)
      }
    end
  end

  def extract_phone_number(jid)
    return unless jid

    jid.to_s.split('@').first&.prepend('+')
  end

  def message_content
    @message_content ||= text_content || media_processor.caption || fallback_content || ''
  end

  def text_content
    message_payload[:conversation] || message_payload.dig(:extendedTextMessage, :text)
  end

  def fallback_content
    message_data[:body] || message_data[:text]
  end

  def message_type
    return :incoming unless from_me?

    :outgoing
  end

  def from_me?
    message_data.dig(:key, :fromMe) == true
  end

  def set_contact
    @contact_inbox = ::ContactInboxWithContactBuilder.new(
      inbox: inbox,
      source_id: sender_info[:phone_number],
      contact_attributes: { name: sender_info[:name], phone_number: sender_info[:phone_number] },
      origin: from_me? ? :internal : :channel_inbound
    ).perform
    @contact = @contact_inbox.contact
  end

  def set_conversation
    @conversation = find_or_create_conversation
  end

  def find_or_create_conversation
    @contact_inbox.conversations.where(status: [:open, :pending]).last || create_new_conversation
  end

  def create_new_conversation
    inbox.conversations.create!(
      account: inbox.account,
      contact: @contact,
      contact_inbox: @contact_inbox,
      inbox: inbox,
      status: :open
    )
  end

  def create_message
    return if message_content.blank? && !media_processor.media?
    return if duplicate_message?

    message = @conversation.messages.create!(
      account: inbox.account,
      inbox: inbox,
      content: message_content.presence,
      message_type: message_type,
      sender: message_type == :incoming ? @contact : nil,
      source_id: message_id
    )

    media_processor.attach_to(message) if media_processor.media?
    message
  end

  def message_id
    message_data.dig(:key, :id) || message_data[:id]
  end

  def duplicate_message?
    return false unless message_id

    @conversation.messages.exists?(source_id: message_id)
  end
end
