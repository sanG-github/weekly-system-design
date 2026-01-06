class Message < ApplicationRecord
  validates :channel, :author, :content, presence: true

  # Scope for cursor-based pagination
  # Returns messages older than the cursor (for loading older messages)
  scope :before_cursor, ->(cursor) {
    return all if cursor.blank?
    where("created_at < ?", Time.at(cursor.to_i))
  }

  # Returns messages newer than the cursor (for loading newer messages)
  scope :after_cursor, ->(cursor) {
    return all if cursor.blank?
    where("created_at > ?", Time.at(cursor.to_i))
  }

  # Default ordering: newest first (like Slack)
  scope :ordered, -> { order(created_at: :desc) }

  # Get cursor value for a message (timestamp as integer)
  def cursor
    created_at.to_i
  end
end
