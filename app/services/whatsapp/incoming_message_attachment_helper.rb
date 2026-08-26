# Builds the attachments of an incoming WhatsApp message from the webhook payload.
# Extracted from Whatsapp::IncomingMessageBaseService to keep that class focused on the
# message/contact/conversation pipeline. Relies on @message, @inbox and the payload readers
# (messages_data, message_type, file_content_type, download_attachment_file) of the includer.
module Whatsapp::IncomingMessageAttachmentHelper
  def attach_files
    return if %w[text button interactive location contacts].include?(message_type)

    attachment_payload = messages_data.first[message_type.to_sym]
    @message.content ||= attachment_payload[:caption]

    attachment_file = download_attachment_file(attachment_payload)
    return if attachment_file.blank?

    @message.attachments.new(
      account_id: @message.account_id,
      file_type: file_content_type(message_type),
      file: {
        io: attachment_file,
        filename: attachment_file.original_filename,
        content_type: attachment_file.content_type
      }
    )
  end

  def attach_location
    location = messages_data.first['location']
    location_name = (location['name'] ? "#{location['name']}, #{location['address']}" : '').first(255)
    @message.attachments.new(
      account_id: @message.account_id,
      file_type: file_content_type(message_type),
      coordinates_lat: location['latitude'],
      coordinates_long: location['longitude'],
      fallback_title: location_name,
      external_url: location['url']
    )
  end

  def attach_contact(contact)
    phones = contact[:phones]
    phones = [{ phone: 'Phone number is not available' }] if phones.blank?

    name_info = contact['name'] || {}
    contact_meta = {
      firstName: name_info['first_name'],
      lastName: name_info['last_name']
    }.compact

    phones.each do |phone|
      @message.attachments.new(
        account_id: @message.account_id,
        file_type: file_content_type(message_type),
        fallback_title: phone[:phone].to_s,
        meta: contact_meta
      )
    end
  end
end
