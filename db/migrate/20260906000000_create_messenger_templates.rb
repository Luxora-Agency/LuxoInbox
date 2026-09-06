class CreateMessengerTemplates < ActiveRecord::Migration[7.1]
  def change
    create_table :messenger_templates do |t|
      t.references :account, null: false, foreign_key: true
      t.string :title, null: false, limit: 100
      t.jsonb :definition, null: false
      t.timestamps
    end
  end
end
