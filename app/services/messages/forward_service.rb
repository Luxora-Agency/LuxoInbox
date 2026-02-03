class Messages::ForwardService
  attr_reader :message, :target_conversation_ids, :user, :account

  def initialize(message:, target_conversation_ids:, user:)
    @message = message
    @target_conversation_ids = target_conversation_ids
    @user = user
    @account = message.account
  end

  def perform
    target_conversations.filter_map do |conversation|
      create_forwarded_message(conversation)
    end
  end

  private

  def target_conversations
    @account.conversations.where(id: @target_conversation_ids)
  end

  def create_forwarded_message(conversation)
    new_message = conversation.messages.create!(
      account_id: @account.id,
      inbox_id: conversation.inbox_id,
      message_type: :outgoing,
      content: @message.content,
      content_type: @message.content_type,
      sender: @user,
      content_attributes: forwarded_attributes
    )
    duplicate_attachments(new_message)
    new_message
  end

  def forwarded_attributes
    {
      forwarded: true,
      forwarded_from: {
        message_id: @message.id,
        conversation_id: @message.conversation_id,
        sender_name: @message.sender&.name
      }
    }
  end

  def duplicate_attachments(new_message)
    @message.attachments.each do |attachment|
      next unless attachment.file.attached?

      new_attachment = new_message.attachments.build(
        account_id: @account.id,
        file_type: attachment.file_type,
        extension: attachment.extension
      )
      attachment.file.blob.open do |blob_file|
        new_attachment.file.attach(
          io: blob_file,
          filename: attachment.file.filename.to_s,
          content_type: attachment.file.content_type
        )
      end
      new_attachment.save!
    end
  end
end
