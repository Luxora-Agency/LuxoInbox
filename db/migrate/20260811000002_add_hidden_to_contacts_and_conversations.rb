class AddHiddenToContactsAndConversations < ActiveRecord::Migration[7.1]
  def change
    add_column :contacts, :hidden, :boolean, null: false, default: false
    add_column :conversations, :hidden, :boolean, null: false, default: false

    add_index :contacts, [:account_id, :id],
              where: 'hidden', name: 'index_contacts_on_account_id_where_hidden'
    add_index :conversations, [:account_id, :id],
              where: 'hidden', name: 'index_conversations_on_account_id_where_hidden'
  end
end
