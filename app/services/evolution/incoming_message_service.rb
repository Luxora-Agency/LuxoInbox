class Evolution::IncomingMessageService
  pattr_initialize [:inbox!, :params!]

  def perform
    return unless message_data

    set_contact
    set_conversation
    create_message
  end

  private

  def message_data
    @message_data ||= params.dig(:data, :message) || params[:data]
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

    # Remove @s.whatsapp.net or @g.us suffix
    jid.to_s.split('@').first&.prepend('+')
  end

  def message_content
    @message_content ||= if message_data[:message]
                           extract_message_content(message_data[:message])
                         else
                           message_data[:body] || message_data[:text] || ''
                         end
  end

  def extract_message_content(message)
    message[:conversation] ||
      message.dig(:extendedTextMessage, :text) ||
      message.dig(:imageMessage, :caption) ||
      message.dig(:videoMessage, :caption) ||
      message.dig(:documentMessage, :caption) ||
      '[Media message]'
  end

  def message_type
    return :incoming unless from_me?

    :outgoing
  end

  def from_me?
    message_data.dig(:key, :fromMe) == true
  end

  def set_contact
    contact = inbox.contact_inboxes.find_by(source_id: sender_info[:phone_number])&.contact
    @contact = contact || create_contact
  end

  def create_contact
    contact = inbox.account.contacts.create!(
      name: sender_info[:name],
      phone_number: sender_info[:phone_number],
      account: inbox.account
    )

    inbox.contact_inboxes.create!(
      contact: contact,
      source_id: sender_info[:phone_number]
    )

    contact
  end

  def set_conversation
    @conversation = find_or_create_conversation
  end

  def find_or_create_conversation
    contact_inbox = inbox.contact_inboxes.find_by(contact: @contact)
    return create_new_conversation unless contact_inbox

    # Find existing open conversation or create new one
    conversation = contact_inbox.conversations.where(status: [:open, :pending]).last
    conversation || create_new_conversation
  end

  def create_new_conversation
    contact_inbox = inbox.contact_inboxes.find_or_create_by!(contact: @contact) do |ci|
      ci.source_id = sender_info[:phone_number]
    end

    inbox.conversations.create!(
      account: inbox.account,
      contact: @contact,
      contact_inbox: contact_inbox,
      inbox: inbox,
      status: :open
    )
  end

  def create_message
    return if message_content.blank?
    return if duplicate_message?

    message = @conversation.messages.create!(
      account: inbox.account,
      inbox: inbox,
      content: message_content,
      message_type: message_type,
      sender: message_type == :incoming ? @contact : nil,
      source_id: message_id
    )

    process_attachments(message) if attachments?
    message
  end

  def message_id
    message_data.dig(:key, :id) || message_data[:id]
  end

  def duplicate_message?
    return false unless message_id

    @conversation.messages.exists?(source_id: message_id)
  end

  def attachments?
    media_types = %i[imageMessage videoMessage audioMessage documentMessage]
    media_types.any? { |type| message_data[:message]&.key?(type) }
  end

  def process_attachments(message)
    # Handle media attachments in future iterations
    Rails.logger.info("Evolution: Message #{message.id} has attachments that need processing")
  end
end
