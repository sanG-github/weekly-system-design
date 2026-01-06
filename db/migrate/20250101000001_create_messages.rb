class CreateMessages < ActiveRecord::Migration[8.1]
  def change
    create_table :messages do |t|
      t.string :channel, null: false
      t.string :author, null: false
      t.text :content, null: false
      t.timestamps null: false
    end

    add_index :messages, [:channel, :created_at]
    add_index :messages, :created_at
  end
end
