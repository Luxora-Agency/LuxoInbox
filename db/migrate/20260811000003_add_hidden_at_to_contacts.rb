class AddHiddenAtToContacts < ActiveRecord::Migration[7.1]
  def change
    add_column :contacts, :hidden_at, :datetime, null: true
  end
end
