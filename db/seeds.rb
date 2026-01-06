# This file should ensure the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).
#
# Example:
#
#   ["Action", "Comedy", "Drama", "Horror"].each do |genre_name|
#     MovieGenre.find_or_create_by!(name: genre_name)
#   end

# Clear existing messages
Message.destroy_all

# Sample authors
authors = [ "Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Liam" ]

# Channel-specific message templates
channel_messages = {
  "general" => [
    "Hey everyone! How's it going?",
    "Welcome to the team!",
    "Does anyone know when the next team meeting is?",
    "Great work everyone on the latest release!",
    "I have a quick question about the project timeline.",
    "Let's schedule a meeting to discuss the roadmap.",
    "Thanks for all the hard work this week!",
    "What's the status on the quarterly goals?",
    "I'll send out the meeting notes shortly.",
    "Can someone help me understand the new process?",
    "The new office space looks amazing!",
    "Happy Friday everyone!",
    "I've updated the team calendar with the new dates.",
    "Let me know if you need any assistance.",
    "The company all-hands is next week.",
    "I'll follow up on that tomorrow.",
    "Does anyone have the link to the shared drive?",
    "Great job on the presentation today!",
    "I'll be out of office next week.",
    "The new policy document is now available."
  ],
  "random" => [
    "Anyone up for lunch?",
    "Did you see that new movie? It was amazing!",
    "What's everyone having for lunch?",
    "I just discovered this great new coffee shop.",
    "Weekend plans anyone?",
    "Has anyone tried that new restaurant downtown?",
    "I'm looking for book recommendations.",
    "The weather is beautiful today!",
    "Anyone want to grab drinks after work?",
    "I just finished a great podcast series.",
    "What's everyone's favorite pizza place?",
    "I'm planning a weekend trip, any suggestions?",
    "Has anyone been to that new art exhibit?",
    "I need a good workout playlist, any recommendations?",
    "The new season of that show is out!",
    "Anyone want to join me for a run this weekend?",
    "I just tried a new recipe, it turned out great!",
    "What's everyone's go-to comfort food?",
    "I'm looking for a good hiking trail nearby.",
    "Anyone up for a game night?"
  ],
  "engineering" => [
    "Just finished the latest feature. What do you think?",
    "Can someone review my PR?",
    "I found a bug in the latest release.",
    "The performance improvements are working well.",
    "I've updated the documentation.",
    "The tests are passing now.",
    "We should refactor this code.",
    "The API is working as expected.",
    "I'm seeing some memory leaks in the new code.",
    "The database migration is ready for review.",
    "I've optimized the query, it's 3x faster now.",
    "The new caching layer is deployed.",
    "Can we discuss the architecture for the new feature?",
    "I've fixed the authentication issue.",
    "The CI/CD pipeline is now working correctly.",
    "I need help debugging this issue.",
    "The new endpoint is ready for testing.",
    "I've updated the error handling logic.",
    "The code review comments have been addressed.",
    "The deployment was successful!"
  ],
  "design" => [
    "The new design looks amazing!",
    "I've updated the color palette based on feedback.",
    "Can we review the latest mockups?",
    "The user flow is much clearer now.",
    "I've created some new icon variations.",
    "The typography changes are ready for review.",
    "I need feedback on the new layout.",
    "The design system documentation is updated.",
    "I've refined the animation timing.",
    "The new component library is ready.",
    "Can we discuss the accessibility improvements?",
    "I've created some alternative design options.",
    "The user testing feedback has been incorporated.",
    "I need help with the responsive breakpoints.",
    "The new branding guidelines are finalized.",
    "I've updated the style guide.",
    "The prototype is ready for review.",
    "I've improved the visual hierarchy.",
    "The new illustrations are complete.",
    "Can we schedule a design review meeting?"
  ]
}

# Generate messages for different channels
channels = [ "general", "random", "engineering", "design" ]

channels.each do |channel|
  # Generate 250 messages per channel with varying timestamps
  # Messages are created with timestamps going back in time
  base_time = Time.current
  templates = channel_messages[channel]

  250.times do |i|
    # Create messages with timestamps going back in time
    # Most recent messages first (will be loaded last)
    created_at = base_time - (250 - i).hours - rand(0..59).minutes

    Message.create!(
      channel: channel,
      author: authors.sample,
      content: templates.sample,
      created_at: created_at
    )
  end
end

puts "Created #{Message.count} messages across #{channels.count} channels"
puts "Channels: #{channels.join(', ')}"
puts "Messages per channel: 250"
puts "Total messages: #{Message.count}"
