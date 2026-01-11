class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :name, null: false
      t.string :avatar_url
      t.boolean :online, default: false, null: false
      t.datetime :last_seen_at

      t.timestamps
    end

    add_index :users, :name
    add_index :users, :online
  end
end
