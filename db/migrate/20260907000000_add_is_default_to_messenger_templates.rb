class AddIsDefaultToMessengerTemplates < ActiveRecord::Migration[7.1]
  def change
    add_column :messenger_templates, :is_default, :boolean, null: false, default: false
    add_index :messenger_templates, [:account_id], unique: true, where: 'is_default',
                                                   name: 'index_messenger_templates_on_account_id_where_default'
  end
end
