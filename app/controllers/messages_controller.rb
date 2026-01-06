class MessagesController < ApplicationController
  # GET /messages
  # Query params:
  #   - channel: string (optional) - channel name (default: "general")
  #   - cursor: integer (optional) - cursor for pagination (timestamp)
  #   - limit: integer (optional) - number of messages per page (default: 20)
  def index
    @channel = params[:channel] || "general"

    # Handle JSON API requests
    if request.format.json?
      respond_to_json
    else
      # Handle HTML view requests
      render :index
    end
  end

  private

  def respond_to_json
    channel = params[:channel] || "general"
    cursor = params[:cursor]
    limit = [params[:limit]&.to_i || 20, 100].min # Max 100 messages per request

    logger.info "=== Messages API Request ==="
    logger.info "Channel: #{channel}"
    logger.info "Cursor: #{cursor || 'nil (first page)'}"
    logger.info "Limit: #{limit}"

    # Build query with cursor-based pagination
    messages_query = Message.where(channel: channel).ordered

    # Apply cursor if provided (load messages older than cursor)
    if cursor.present?
      messages_query = messages_query.before_cursor(cursor)
      logger.info "Filtering messages before cursor timestamp: #{Time.at(cursor.to_i)}"
    end

    # Fetch messages
    messages = messages_query.limit(limit + 1) # Fetch one extra to check if there are more

    # Determine if there are more messages
    has_more = messages.count > limit
    messages = messages.take(limit) if has_more

    # Reverse messages for display (oldest first)
    messages = messages.reverse

    # Get the cursor for the next page (oldest message's timestamp)
    # This is the first message after reverse (oldest in the batch)
    # We'll use this to load even older messages when scrolling up
    next_cursor = messages.first&.cursor if has_more

    logger.info "=== Messages API Response ==="
    logger.info "Messages returned: #{messages.count}"
    logger.info "Has more: #{has_more}"
    logger.info "Next cursor: #{next_cursor || 'nil (no more pages)'}"
    logger.info "Message IDs: #{messages.map(&:id).join(', ')}"

    render json: {
      messages: messages.map { |msg|
        {
          id: msg.id,
          author: msg.author,
          content: msg.content,
          created_at: msg.created_at.iso8601,
          cursor: msg.cursor
        }
      },
      pagination: {
        has_more: has_more,
        next_cursor: next_cursor,
        count: messages.count
      }
    }
  end
end
