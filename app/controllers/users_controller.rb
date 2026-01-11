class UsersController < ApplicationController
  def create
    user = User.find_or_create_by(name: user_params[:name]) do |u|
      u.avatar_url = user_params[:avatar_url]
    end

    if user.persisted?
      user.mark_online!
      session[:user_id] = user.id
      
      # Broadcast that a new user has joined
      ActionCable.server.broadcast("presence", {
        type: "user_joined",
        user: {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          online: true
        }
      })
      
      redirect_to messages_path, notice: "Welcome, #{user.name}!"
    else
      redirect_to root_path, alert: user.errors.full_messages.join(", ")
    end
  end

  def update_status
    user = User.find_by(id: session[:user_id])
    return head :unauthorized unless user

    if params[:status] == "online"
      user.mark_online!
    else
      user.mark_offline!
    end

    # Broadcast the status change
    ActionCable.server.broadcast("presence", {
      type: "status_change",
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        online: user.online
      }
    })

    head :ok
  end

  private

  def user_params
    params.require(:user).permit(:name, :avatar_url)
  end
end
