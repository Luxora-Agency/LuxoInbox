class ContactHiding::UnhideService
  pattr_initialize [:contact!]

  # Callbacks are bypassed on purpose: Contact#dispatch_update_event would broadcast
  # previous_changes containing hidden: [true, false], leaking the flag to the account.
  # rubocop:disable Rails/SkipsModelValidations
  def perform
    ActiveRecord::Base.transaction do
      @conversation_ids = contact.conversations.hidden_from_account.pluck(:id)
      Conversation.where(id: @conversation_ids).update_all(hidden: false, updated_at: Time.current)
      contact.update_columns(hidden: false, hidden_at: nil, updated_at: Time.current)
      increment_unhidden_counter
    end
    reindex_messages
  end

  private

  def increment_unhidden_counter
    AccountContactHidingPolicy
      .where(account_id: contact.account_id)
      .update_all('unhidden_contact_count = unhidden_contact_count + 1, updated_at = NOW()')
  end
  # rubocop:enable Rails/SkipsModelValidations

  # Message#should_index? refuses hidden conversations, so the unhidden history
  # stays unsearchable until it is reindexed.
  def reindex_messages
    return if @conversation_ids.blank?
    return unless ChatwootApp.advanced_search_allowed?

    Message.where(conversation_id: @conversation_ids).reindex(mode: :async)
  end
end
