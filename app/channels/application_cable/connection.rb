module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user_id

    def connect
      # Get user_id from session cookie
      # Try multiple ways to access the session
      session_key = Rails.application.config.session_options[:key] || "_system_design_session"
      session_data = cookies.encrypted[session_key]
      
      if session_data
        self.current_user_id = session_data["user_id"] || session_data[:user_id]
      end
      
      # Allow connection even without user_id initially
      # The presence channel will handle user lookup
    end
  end
end
