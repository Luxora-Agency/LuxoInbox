# Renumbered from upstream's 20260811000001: that version is already recorded in this fork's
# databases by 20260811000001_create_account_contact_hiding_policies, so keeping the upstream
# timestamp would make Rails treat this backfill as already run and skip it.
class BackfillMissingAiAssigneeTypes < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def up
    # Reconcile AgentBot assignments changed while the discriminator release was rolling out.
    # rubocop:disable Rails/SkipsModelValidations
    Conversation.in_batches(of: 100_000, use_ranges: true) do |conversation_range|
      conversation_range.where(ai_assignee_type: nil).where.not(assignee_agent_bot_id: nil).in_batches(of: 1000) do |conversations|
        conversations.update_all(ai_assignee_type: 'AgentBot')
      end

      conversation_range.where(ai_assignee_type: 'AgentBot', assignee_agent_bot_id: nil).in_batches(of: 1000) do |conversations|
        conversations.update_all(ai_assignee_type: nil)
      end
    end
    # rubocop:enable Rails/SkipsModelValidations
  end
end
