class Contacts::PermissionFilterService
  attr_reader :contacts, :user, :account

  def initialize(contacts, user, account)
    @contacts = contacts
    @user = user
    @account = account
  end

  def perform
    return contacts if user_role == 'administrator'

    accessible_contacts
  end

  private

  def accessible_contacts
    # Agents can see contacts that:
    # 1. Are assigned to them, OR
    # 2. Have conversations in inboxes they have access to
    user_inbox_ids = user.inboxes.where(account_id: account.id).pluck(:id)

    contacts.where(
      'contacts.assignee_id = :user_id OR contacts.id IN (
        SELECT DISTINCT contact_id FROM conversations
        WHERE conversations.inbox_id IN (:inbox_ids)
        AND conversations.account_id = :account_id
      )',
      user_id: user.id,
      inbox_ids: user_inbox_ids.presence || [0],
      account_id: account.id
    )
  end

  def account_user
    AccountUser.find_by(account_id: account.id, user_id: user.id)
  end

  def user_role
    account_user&.role
  end
end
