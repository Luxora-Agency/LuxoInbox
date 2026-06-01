# rubocop:disable Rails/I18nLocaleTexts
class SuperAdmin::Accounts::Conversations::MessagesController < SuperAdmin::ApplicationController
  before_action :set_account
  before_action :set_conversation
  before_action :set_message, only: [:update, :destroy]

  def create
    @conversation.messages.create!(new_message_attributes)
    lock_conversation!
    redirect_to conversation_show_path, notice: 'Message added'
  rescue ActiveRecord::RecordInvalid => e
    redirect_to conversation_show_path, alert: e.message
  end

  def update
    @message.update!(content: message_params[:content], content_type: :text)
    lock_conversation!
    redirect_to conversation_show_path, notice: 'Message updated'
  end

  def destroy
    ActiveRecord::Base.transaction do
      @message.update!(content: I18n.t('conversations.messages.deleted'), content_type: :text,
                       content_attributes: { deleted: true })
      @message.attachments.destroy_all
    end
    lock_conversation!
    redirect_to conversation_show_path, notice: 'Message deleted'
  end

  private

  def set_account
    @account = Account.find(params[:account_id])
  end

  def set_conversation
    @conversation = @account.conversations.find(params[:conversation_id])
  end

  def set_message
    @message = @conversation.messages.find(params[:id])
  end

  def message_params
    params.require(:message).permit(:content, :message_type, :sender_id)
  end

  # Builds an incoming or outgoing message that broadcasts live (MESSAGE_CREATED) but
  # never reaches the external channel:
  # - incoming never triggers send_reply
  # - outgoing carries a synthetic source_id so Base::SendOnChannelService treats it as
  #   originated-from-channel and skips delivery
  def new_message_attributes
    outgoing = message_params[:message_type] == 'outgoing'
    {
      account_id: @account.id,
      inbox_id: @conversation.inbox_id,
      message_type: outgoing ? :outgoing : :incoming,
      content: message_params[:content],
      content_type: :text,
      private: false,
      sender: message_sender(outgoing),
      source_id: outgoing ? "super_admin_#{SecureRandom.uuid}" : nil
    }
  end

  def message_sender(outgoing)
    return @conversation.contact unless outgoing

    sender_id = message_params[:sender_id]
    sender_id.present? ? @account.users.find_by(id: sender_id) : nil
  end

  # Freeze the conversation so the WhatsApp incoming service stops appending
  # further client messages (handled in Whatsapp::IncomingMessageBaseService).
  def lock_conversation!
    return if @conversation.additional_attributes&.dig('admin_locked')

    @conversation.update!(additional_attributes: (@conversation.additional_attributes || {}).merge('admin_locked' => true))
  end

  def conversation_show_path
    super_admin_account_conversation_path(@account, @conversation)
  end
end
# rubocop:enable Rails/I18nLocaleTexts
