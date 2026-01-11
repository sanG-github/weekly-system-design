class User < ApplicationRecord
  validates :name, presence: true, uniqueness: true

  scope :online, -> { where(online: true) }
  scope :offline, -> { where(online: false) }

  def mark_online!
    update!(online: true, last_seen_at: Time.current)
  end

  def mark_offline!
    update!(online: false, last_seen_at: Time.current)
  end

  def avatar
    avatar_url.presence || generate_avatar_url
  end

  private

  def generate_avatar_url
    # Generate a simple avatar URL based on name initials
    initials = name.split.map(&:first).join.upcase
    "https://ui-avatars.com/api/?name=#{CGI.escape(initials)}&background=random&size=128"
  end
end
