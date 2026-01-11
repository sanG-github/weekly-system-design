class MessagesController < ApplicationController
  before_action :set_current_user

  def index
    @users = User.order(:name)
    @current_user = User.find_by(id: session[:user_id])
  end

  private

  def set_current_user
    @current_user = User.find_by(id: session[:user_id])
    redirect_to root_path unless @current_user
  end
end
