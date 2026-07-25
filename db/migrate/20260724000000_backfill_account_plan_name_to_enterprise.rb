class BackfillAccountPlanNameToEnterprise < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  # LuxoInbox fork: Enterprise::Account#sync_assignment_features and
  # #captain_document_sync_interval read custom_attributes['plan_name']. A blank
  # plan_name lets advanced_assignment get clobbered on super-admin save, so
  # backfill blank plan_name to 'Enterprise'. Existing values are left untouched.
  def up
    Account.where("custom_attributes->>'plan_name' IS NULL OR custom_attributes->>'plan_name' = ''").find_each do |account|
      account.update_column(:custom_attributes, account.custom_attributes.merge('plan_name' => 'Enterprise'))
    end
  end

  def down
    # No-op: backfilled plan_name values are indistinguishable from ones set by hand.
  end
end
