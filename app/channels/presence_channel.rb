class PresenceChannel < ApplicationCable::Channel
  def subscribed
    stream_from "presence"
    
    # Mark user as online when they subscribe
    user_id = connection.current_user_id
    user = User.find_by(id: user_id) if user_id
    
    if user
      user.mark_online!
      broadcast_user_status(user, "online")
      
      # Send current user list to the newly connected user
      send_current_users(user)
    else
      # Log if user not found (for debugging)
      Rails.logger.warn "PresenceChannel: User not found for user_id: #{user_id}"
    end
  end
  
  def heartbeat
    # Keep user online with periodic heartbeat
    user = User.find_by(id: connection.current_user_id)
    if user
      user.update(last_seen_at: Time.current)
    end
  end

  def unsubscribed
    # Mark user as offline when they unsubscribe
    user = User.find_by(id: connection.current_user_id)
    if user
      user.mark_offline!
      broadcast_user_status(user, "offline")
    end
  end

  private

  def broadcast_user_status(user, status)
    ActionCable.server.broadcast("presence", {
      type: "status_change",
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        online: status == "online"
      }
    })
  end
  
  def send_current_users(current_user)
    # Send list of all online users to the newly connected user
    online_users = User.online.where.not(id: current_user.id)
    online_users.each do |user|
      transmit({
        type: "user_joined",
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          online: true
        }
      })
    end
  end
end
