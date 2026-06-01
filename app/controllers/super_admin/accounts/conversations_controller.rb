# rubocop:disable Rails/I18nLocaleTexts
class SuperAdmin::Accounts::ConversationsController < SuperAdmin::ApplicationController
  before_action :set_account
  before_action :set_conversation, only: [:show, :update]

  def index
    @conversations = @account.conversations
                             .includes(:contact, :inbox, :assignee)
                             .order(created_at: :desc)
                             .page(params[:page])
  end

  def show
    @messages = @conversation.messages.includes(:sender, :attachments).order(created_at: :asc)
    @account_users = @account.users
  end

  def update
    if assignee_invalid?
      return redirect_to(super_admin_account_conversation_path(@account, @conversation),
                         alert: 'Assignee must belong to this account')
    end

    attrs = conversation_params.to_h
    attrs[:additional_attributes] = (@conversation.additional_attributes || {}).merge('admin_locked' => true)
    @conversation.update!(attrs)
    redirect_to super_admin_account_conversation_path(@account, @conversation), notice: 'Conversation updated'
  end

  private

  def set_account
    @account = Account.find(params[:account_id])
  end

  def set_conversation
    @conversation = @account.conversations.find(params[:id])
  end

  def conversation_params
    permitted = params.require(:conversation).permit(:status, :priority, :assignee_id)
    # An enum cannot be assigned a blank string; treat blank priority as "clear it".
    permitted[:priority] = nil if permitted[:priority].blank?
    permitted
  end

  def assignee_invalid?
    assignee_id = conversation_params[:assignee_id]
    assignee_id.present? && !@account.users.exists?(assignee_id)
  end
end
# rubocop:enable Rails/I18nLocaleTexts
