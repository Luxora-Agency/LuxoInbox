class BackfillAccountPlanNameToEnterprise < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  # LuxoInbox fork: Enterprise::Account#captain_document_sync_interval reads
  # custom_attributes['plan_name'] to pick a sync cadence, and a blank plan_name
  # leaves the account without one, so backfill blank plan_name to 'Enterprise'.
  # Existing values are left untouched.
  # rubocop:disable Rails/SkipsModelValidations
  def up
    Account.where("custom_attributes->>'plan_name' IS NULL OR custom_attributes->>'plan_name' = ''").find_each do |account|
      account.update_column(:custom_attributes, account.custom_attributes.merge('plan_name' => 'Enterprise'))
    end
  end
  # rubocop:enable Rails/SkipsModelValidations

  def down
    # No-op: backfilled plan_name values are indistinguishable from ones set by hand.
  end
end
