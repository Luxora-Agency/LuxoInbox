class CreateAccountContactHidingPolicies < ActiveRecord::Migration[7.1]
  def change
    create_table :account_contact_hiding_policies do |t|
      t.references :account, null: false, index: { unique: true }, foreign_key: true
      t.boolean :enabled, null: false, default: false
      t.integer :visible_per_cycle, null: false, default: 1
      t.integer :hidden_per_cycle, null: false, default: 0
      t.bigint :inbound_contact_count, null: false, default: 0
      t.bigint :hidden_contact_count, null: false, default: 0
      t.bigint :unhidden_contact_count, null: false, default: 0
      t.timestamps
    end

    add_check_constraint :account_contact_hiding_policies,
                         'visible_per_cycle >= 0 AND hidden_per_cycle >= 0',
                         name: 'chk_achp_cycle_values_non_negative'
    add_check_constraint :account_contact_hiding_policies,
                         'visible_per_cycle + hidden_per_cycle > 0',
                         name: 'chk_achp_cycle_length_positive'
  end
end
