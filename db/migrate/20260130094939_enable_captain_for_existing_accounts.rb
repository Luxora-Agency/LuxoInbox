class EnableCaptainForExistingAccounts < ActiveRecord::Migration[7.0]
  def up
    Account.find_in_batches(batch_size: 100) do |accounts|
      accounts.each do |account|
        account.enable_features!('captain_integration')
        account.enable_features!('captain_integration_v2')
      end
    end
  end

  def down
    # No-op: We don't want to disable features on rollback
  end
end
