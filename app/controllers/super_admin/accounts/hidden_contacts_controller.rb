# rubocop:disable Rails/I18nLocaleTexts
class SuperAdmin::Accounts::HiddenContactsController < SuperAdmin::ApplicationController
  before_action :set_account

  def index
    @contacts = @account.contacts
                        .hidden_from_account
                        .includes(conversations: [:inbox])
                        .order(created_at: :desc)
                        .page(params[:page])
  end

  def unhide
    contact = @account.contacts.hidden_from_account.find(params[:id])
    ::ContactHiding::UnhideService.new(contact: contact).perform
    redirect_to super_admin_account_hidden_contacts_path(@account),
                notice: "Contact ##{contact.id} is now visible to the account"
  end

  private

  def set_account
    @account = Account.find(params[:account_id])
  end
end
# rubocop:enable Rails/I18nLocaleTexts
